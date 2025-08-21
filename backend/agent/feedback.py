import asyncio
from typing import Dict, Any
import os
from dotenv import load_dotenv
from openai import OpenAI
from functools import lru_cache

# Load environment variables
load_dotenv()

# Initialize the OpenAI client with API key from environment
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def _require_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise RuntimeError(f"Missing required env var: {name}")
    return v

@lru_cache
def get_openai_client() -> OpenAI:
    # Secrets are injected at RUNTIME in LiveKit Cloud
    return OpenAI(api_key=_require_env("OPENAI_API_KEY"))

async def analyze_transcript(transcript_data: Dict[Any, Any]):
    """
    Analyze interview transcript using OpenAI
    
    Args:
        transcript_data: The complete session history from transcript JSON
    """
    print("🔍 Analyzing transcript with OpenAI...")
    
    # Extract conversation turns from the items array in the transcript data
    conversation = []
    for item in transcript_data.get("items", []):
        if item.get("type") == "message":
            # Extract the content which is a list and join it
            content = "".join(item.get("content", []))
            conversation.append({
                "role": item.get("role", ""),
                "content": content
            })
    
    # Send to OpenAI for analysis
    try:
        client = get_openai_client()
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model="gpt-4",  # Or your preferred model
            messages=[
                {
                    "role": "system",
                    "content": """
            You are an expert technical interviewer.

            Analyze the following interview transcript and generate clear, structured feedback. The goal is to help the candidate improve in future interviews.

            Use this exact format and criteria:

            ## Overall Quality (Score out of 10)
            [Concise summary of overall performance — include a numeric score (e.g., 7/10) with justification.]

            ## Strengths
            List a couple specific strengths observed in the interview. Focus on clarity, reasoning, communication, and technical accuracy.

            - [Specific strength #1 with a concrete example or reasoning]
            - [Specific strength #2]
            - ...

            ## Areas for Improvement
            List a couple focused areas for improvement. Avoid vague or repetitive comments. Only include what's necessary for meaningful growth. Keep it straight and to the point.

            - [Targeted improvement #1 with rationale]
            - [Targeted improvement #2 with rationale]
            - ...

            ## Key Topics Covered
            List the most Leetcode patterns used and type of problem solved, e.g., "Array, String, Dynamic Programming, Graphs, Trees".

            - [Topic 1]
            - [Topic 2]
            - ...
            """
                },
                {
                    "role": "user",
                    "content": f"Here's the interview transcript to analyze: {conversation}"
                }
            ]
        )
        
        # Process the feedback
        feedback = response.choices[0].message.content
        print("\n==== INTERVIEW FEEDBACK ====")
        print(feedback)
        print("===========================\n")
        
        return feedback
        
    except Exception as e:
        print(f"❌ Error analyzing transcript: {e}")
        return None