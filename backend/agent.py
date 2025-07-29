from dotenv import load_dotenv

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


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=AGENT_INSTRUCTION)


async def entrypoint(ctx: agents.JobContext):
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

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    await ctx.connect()

    await session.generate_reply(
        instructions=SESSION_INSTRUCTION,
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))