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
from feedback import analyze_transcript
from livekit.agents import function_tool, RunContext

load_dotenv()

_active_tasks = set()
problem_context = {"problem_info": None, "difficulty": None, "code": None}

async def async_handle_text_stream(reader, participant_identity):
    info = reader.info  # metadata
    print(f"📥 Received stream: topic={info.topic}")

    if info.topic == "problem":
        text = await reader.read_all()
        print(f"Problem description received:\n{text}\n")
        problem_context["problem_info"] = text
        
    elif info.topic == "difficulty":
        text = await reader.read_all()
        print(f"Difficulty level received: {text}\n")
        problem_context["difficulty"] = text

    elif info.topic == "user_code":
        text = await reader.read_all()
        print(f"User code received:\n{text}\n")
        problem_context["code"] = text
    
    

def handle_text_stream(reader, participant_identity):
    task = asyncio.create_task(async_handle_text_stream(reader, participant_identity))
    _active_tasks.add(task)
    task.add_done_callback(lambda t: _active_tasks.remove(t))


class Assistant(Agent):
    def __init__(self, instructions: str, tools: None) -> None:
        super().__init__(instructions=instructions, tools=tools)


async def entrypoint(ctx: agents.JobContext):
    # async def process_transcript():
    #     transcript_data = session.history.to_dict()
    #     print(f"📊 Processing transcript for session {transcript_data}")
    #     await analyze_transcript(transcript_data)
    
    # ctx.add_shutdown_callback(process_transcript)
    
    ctx.room.register_text_stream_handler("problem", handle_text_stream)
    ctx.room.register_text_stream_handler("difficulty", handle_text_stream)
    ctx.room.register_text_stream_handler("user_code", handle_text_stream)

    def handle_end_interview(reader, participant_identity):
        task = asyncio.create_task(async_handle_end_interview(reader, participant_identity))
        _active_tasks.add(task)
        task.add_done_callback(lambda t: _active_tasks.remove(t))

    async def async_handle_end_interview(reader, participant_identity):
        transcript_data = session.history.to_dict()
        print(f"📊 Processing transcript for session {transcript_data}")
        feedback = await analyze_transcript(transcript_data)
        await ctx.room.local_participant.send_text(feedback, topic="interview_feedback")

    # ... inside entrypoint:
    ctx.room.register_text_stream_handler("end_interview", handle_end_interview)
    
    # Define the tool function within entrypoint where you have access to the room
    @function_tool()
    async def read_code_tool(context: RunContext) -> str:
        """
        Request the user's current code from the frontend.
        The frontend should listen for the 'request_code' topic,
        scrape the DOM, and send it back on 'user_code'.
        """
        await ctx.room.local_participant.send_text(
            '{"type":"request_code"}',
            topic="request_code"
        )
        return "Requesting the latest code from the user..."

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
    while problem_context["problem_info"] is None:
        await asyncio.sleep(0.1)
        
    agent_instructions = AGENT_INSTRUCTION.format(
        problem=problem_context["problem_info"], difficulty=problem_context["difficulty"]
    )
    agent = Assistant(instructions=agent_instructions, tools=[read_code_tool])

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