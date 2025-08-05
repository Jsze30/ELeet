from dotenv import load_dotenv
import asyncio

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, tokenize, tts
from livekit.plugins import (
    openai,
    deepgram,
    noise_cancellation,
    silero,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from prompts import AGENT_INSTRUCTION, SESSION_INSTRUCTION

load_dotenv()

_active_tasks = set()
problem_context = {"text": None}

async def async_handle_text_stream(reader, participant_identity):
    info = reader.info  # metadata
    print(f"📥 Received stream: topic={info.topic}")

    if info.topic == "problem":
        text = await reader.read_all()
        print(f"Problem description received:\n{text}\n")
        problem_context["text"] = text

def handle_text_stream(reader, participant_identity):
    task = asyncio.create_task(async_handle_text_stream(reader, participant_identity))
    _active_tasks.add(task)
    task.add_done_callback(lambda t: _active_tasks.remove(t))


class Assistant(Agent):
    def __init__(self, instructions: str) -> None:
        super().__init__(instructions=instructions)


async def entrypoint(ctx: agents.JobContext):
    ctx.room.register_text_stream_handler("problem", handle_text_stream)

    openai_tts = tts.StreamAdapter(
        tts=openai.TTS(voice="alloy"),
        sentence_tokenizer=tokenize.basic.SentenceTokenizer(),
    )

    vad = silero.VAD.load()
    vad.aggressiveness = 2  


    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai_tts,
        vad=vad,
        turn_detection=MultilingualModel(),
    )
    await ctx.connect()

    print("⏳ Waiting for problem description...")
    while problem_context["text"] is None:
        await asyncio.sleep(0.1)
        
    agent_instructions = AGENT_INSTRUCTION.format(
        problem=problem_context["text"]
    )
    agent = Assistant(instructions=agent_instructions)

    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    

    await session.generate_reply(
        instructions=SESSION_INSTRUCTION,
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))