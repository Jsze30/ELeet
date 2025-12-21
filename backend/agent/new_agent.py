import os
import asyncio
import json
from datetime import datetime
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io
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
from livekit.plugins import langchain

load_dotenv()

# Force the correct URL to override any config issues
os.environ['LIVEKIT_URL'] = 'wss://eleet-dev-yrih4rxn.livekit.cloud'

_active_tasks = set()
problem_context = {"problem_info": None, "difficulty": None, "code": None}
code_updated_event = asyncio.Event()

# ═══════════════════════════════════════════
# INTERVIEW STATE MANAGER
# ═══════════════════════════════════════════

# Handles incoming text streams from the frontend
async def async_handle_text_stream(reader, participant_identity):
    info = reader.info

    # Handles problem description from DOM
    if info.topic == "problem":
        text = await reader.read_all()
        problem_context["problem_info"] = text
        
    # Handles difficulty set at welcome page
    elif info.topic == "difficulty":
        text = await reader.read_all()
        problem_context["difficulty"] = text

    # Handles frontend requesting user code
    elif info.topic == "user_code":
        text = await reader.read_all()
        problem_context["code"] = text

# Handles incoming text streams from the frontend
def handle_text_stream(reader, participant_identity):
    task = asyncio.create_task(async_handle_text_stream(reader, participant_identity))
    _active_tasks.add(task)
    task.add_done_callback(lambda t: _active_tasks.remove(t))

class Assistant(Agent):
    def __init__(self, instructions: str, tools=None) -> None:
        super().__init__(instructions=instructions, tools=tools or [])

# Create the agent server
server = AgentServer()

@server.rtc_session()
async def my_agent(ctx: agents.JobContext):
    
    print(f"🤖 AGENT: Joining room: {ctx.room.name}")
    # Register text stream handlers
    ctx.room.register_text_stream_handler("problem", handle_text_stream)
    ctx.room.register_text_stream_handler("difficulty", handle_text_stream)
    ctx.room.register_text_stream_handler("user_code", handle_text_stream)

    # Handles end interview signal
    def handle_end_interview(reader, participant_identity):
        task = asyncio.create_task(async_handle_end_interview(reader, participant_identity))
        _active_tasks.add(task)
        task.add_done_callback(lambda t: _active_tasks.remove(t))

    # Records transcript, sends it to feedback.py to process, and then sends feedback back to frontend
    async def async_handle_end_interview(reader, participant_identity):
        transcript_data = session.history.to_dict()
        await save_transcript_to_file(transcript_data, ctx.room.name, participant_identity)
        feedback = await analyze_transcript(transcript_data)
        await ctx.room.local_participant.send_text(feedback, topic="interview_feedback")

    ctx.room.register_text_stream_handler("end_interview", handle_end_interview)
    
    # Read code tool that agent has access to to read code from the DOM
    @function_tool()
    async def read_code_tool(context: RunContext) -> str:
        """
        Request the user's current code from the frontend.
        The frontend should listen for the 'request_code' topic,
        scrape the DOM, and send it back on 'user_code'.
        """
        # Reset event before requesting new code
        code_updated_event.clear()
        
        # Sends signal to frontend to request code
        await ctx.room.local_participant.send_text(
            '{"type":"request_code"}',
            topic="request_code"
        )
        
        # Wait for the code to be received (with timeout)
        try:
            await asyncio.wait_for(code_updated_event.wait(), timeout=5.0)
            if problem_context["code"]:
                return f"Here is the user's current code:\n```\n{problem_context['code']}\n```"
            else:
                return "No code was received from the user."
        except asyncio.TimeoutError:
            return "Timeout: Failed to receive code from the user within the expected time."
    
    vad = silero.VAD.load()
    vad.aggressiveness = 2
    session = AgentSession(
        stt="deepgram/nova-3:en",
        # llm=langchain.LLMAdapter(graph=create_workflow()),
        llm="openai/gpt-4o-mini",
        tts=openai.TTS(
            model="gpt-4o-mini-tts",
            voice="alloy",
        ),    
        vad=vad,
        # turn_detection=silero.VoiceActivityClient(),
    )
    await ctx.connect()
    # Wait for problem description
    print("⏳ Waiting for problem description...")
    while problem_context["problem_info"] is None:
        await asyncio.sleep(0.1)
        
    agent_instructions = AGENT_INSTRUCTION.format(
        problem=problem_context["problem_info"], 
        difficulty=problem_context["difficulty"]
    )
    agent = Assistant(instructions="", tools=[read_code_tool])

    await session.start(
        room=ctx.room,
        agent=agent,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVC(),
            ),
        ),
    )

    # await session.generate_reply(
    #     instructions=SESSION_INSTRUCTION,
    # )
    from livekit.agents import UserInputTranscribedEvent
    async def on_user_input_transcribed(event: UserInputTranscribedEvent):
        print(f"👤 User said: {event.transcript}")
        
        # Wait 2 seconds - if auto-reply is on, agent will speak during this
        # await asyncio.sleep(2)
        
        # Now your manual reply
        await session.generate_reply(instructions="Say exactly: THIS IS MANUAL")

    @session.on("user_input_transcribed")
    def on_user_input(event: UserInputTranscribedEvent):
        asyncio.create_task(on_user_input_transcribed(event))


async def save_transcript_to_file(transcript_data, room_name, participant_identity):
    """Save transcript data to a JSON file in the transcripts folder"""
    try:
        # Create transcripts directory if it doesn't exist
        transcripts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "transcripts")
        os.makedirs(transcripts_dir, exist_ok=True)
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"interview_{room_name}_{participant_identity}_{timestamp}.json"
        filepath = os.path.join(transcripts_dir, filename)
        
        # Prepare data to save
        data_to_save = {
            "room_name": room_name,
            "participant_identity": participant_identity,
            "timestamp": datetime.now().isoformat(),
            "transcript": transcript_data,
            "problem_context": problem_context.copy()  # Include problem context for reference
        }
        
        # Save to JSON file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, indent=2, ensure_ascii=False)
        
        print(f"📝 Transcript saved to: {filepath}")
        
    except Exception as e:
        print(f"❌ Error saving transcript: {e}")

if __name__ == "__main__":
    agents.cli.run_app(server)