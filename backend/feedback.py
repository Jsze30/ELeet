import asyncio
from typing import Dict, Any
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize the OpenAI client with API key from environment
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model="gpt-4",  # Or your preferred model
            messages=[
                {"role": "system", "content": """
                Analyze this interview transcript and provide structured feedback in the following format:
                
                ## Overall Quality
                [Brief assessment of the interview quality]
                
                ## Strengths
                - [Strength 1]
                - [Strength 2]
                ...
                
                ## Areas for Improvement
                - [Area 1]
                - [Area 2]
                ...
                
                ## Key Topics Covered
                - [Topic 1]
                - [Topic 2]
                ...
                
                ## Suggested Follow-up Questions
                - [Question 1]
                - [Question 2]
                ...
                """},
                {"role": "user", "content": f"Here's the interview transcript to analyze: {conversation}"}
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