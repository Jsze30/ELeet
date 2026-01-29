import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

RUBRIC = {
    "problem_comprehension": {
        "dimension": "Problem Comprehension & Clarification",
        "description": "How quickly and thoroughly the candidate frames the problem, elicits constraints, restates examples",
        "levels": {
            4: "Surfaces all constraints and edge-cases unprompted; proposes follow-up examples revealing hidden complexity",
            3: "Clarifies key inputs and outputs and at least one edge-case; asks logical questions",
            2: "Needs multiple prompts to articulate basic constraints; misses obvious edge-cases",
            1: "Starts coding without confirming understanding; significant misinterpretation persists"
        }
    },
    "algorithmic_approach": {
        "dimension": "Algorithmic Approach & Trade-offs",
        "description": "Quality of the high-level solution, evidence of CS fundamentals, exploration of alternatives",
        "levels": {
            4: "Identifies optimal asymptotic solution and at least one plausible alternative; reasons clearly about trade-offs in time, space, and simplicity",
            3: "Arrives at an asymptotically optimal or near-optimal solution with coherent reasoning",
            2: "Produces a workable but non-optimal approach; trade-off discussion is superficial or incorrect",
            1: "Cannot articulate a complete approach; relies on brute force without justification"
        }
    },
    "coding_implementation": {
        "dimension": "Coding Implementation",
        "description": "Code correctness, readability, idiomatic style, use of data structures and APIs",
        "levels": {
            4: "Produces nearly bug-free code on first pass; uses clear names, modular helpers, idiomatic constructs; layout is crisp and legible",
            3: "Correct solution after a few minor fixes; names, spacing, and structure are mostly clear",
            2: "Compiles only after heavy interviewer support; repetitive, unclear, or non-idiomatic style",
            1: "Does not complete core logic; syntax and structural mistakes dominate"
        }
    },
    "testing_debugging": {
        "dimension": "Testing & Debugging",
        "description": "Rigor of self-testing, ability to locate and fix issues methodically",
        "levels": {
            4: "Designs thorough unit-style tests (happy path and edge-cases); self-identifies and fixes bugs without prompting",
            3: "Tests main path and one edge-case; finds and fixes most errors with light hints",
            2: "Minimal tests; relies on interviewer to surface bugs; fixes are ad-hoc",
            1: "No tests; cannot locate failures even with guidance"
        }
    },
    "complexity_analysis": {
        "dimension": "Complexity Analysis",
        "description": "Ability to analyze and articulate Big-O for time and space",
        "levels": {
            4: "Quickly derives and explains precise complexity, including dominating terms and memory overhead",
            3: "Provides correct Big-O for time and space with brief explanation",
            2: "Gives partially correct or hand-wavy analysis; omits space or mis-states key terms",
            1: "Unable to analyze complexity or did not attempt analysis"
        }
    },
    "communication_collaboration": {
        "dimension": "Communication & Collaboration",
        "description": "Clarity of thought, structured narration, receptiveness to feedback",
        "levels": {
            4: "Thinks aloud in a clean, logical story; diagrams data flow; checks alignment with interviewer",
            3: "Explains assumptions and next steps; adapts gracefully to hints",
            2: "Disorganized narration, or defensive responses",
            1: "Communication breakdown; interviewer cannot follow reasoning"
        }
    },
    "execution_time_management": {
        "dimension": "Execution & Time Management",
        "description": "Ability to pace through phases (understand, design, code, test) within 35–40 minutes",
        "levels": {
            4: "Finishes complete cycle with headroom; priorities are explicit",
            3: "Completes critical path; minor scope is trimmed or rushed",
            2: "Significant sections incomplete or rushed; loses track of time",
            1: "Stuck in early phase; no runnable solution by end"
        }
    },
    "technical_foundations": {
        "dimension": "Technical Foundations & Fluency",
        "description": "Breadth of CS concepts shown organically (data structures, recursion, concurrency, language features)",
        "levels": {
            4: "Demonstrates depth beyond role level; introduces advanced but relevant concepts correctly",
            3: "Employs appropriate APIs and data structures for the task; correct terminology",
            2: "Misuses or confuses fundamental concepts; needs coaching to select structures",
            1: "Fundamental gaps that block solution"
        }
    }
}


def _build_rubric_prompt():
    """Build a detailed rubric prompt for the LLM"""
    rubric_text = ""
    for key, dimension in RUBRIC.items():
        rubric_text += f"\n### {dimension['dimension']}\n"
        rubric_text += f"**Description**: {dimension['description']}\n"
        for level, description in sorted(dimension['levels'].items(), reverse=True):
            rubric_text += f"- **Level {level}**: {description}\n"
    return rubric_text


def _calculate_overall_score(dimension_scores: dict) -> float:
    """Calculate average score out of 4 from all dimensions"""
    if not dimension_scores:
        return 0.0
    
    scores = [value.get("score", 0) for value in dimension_scores.values()]
    if not scores:
        return 0.0
    
    average = sum(scores) / len(scores)
    return round(average, 2)


async def analyze_transcript(transcript_data: dict) -> dict:
    """
    Analyze interview transcript using OpenAI.
    
    Args:
        transcript_data: Interview transcript data from session.history.to_dict()
    
    Returns:
        dict with score (out of 4), rubric_scores, feedback, and decision
    """
    
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    rubric_prompt = _build_rubric_prompt()
    
    analysis_prompt = f"""You are an expert technical interview evaluator. Analyze the following interview transcript STRICTLY based on what the candidate actually said and did.

    **CRITICAL INSTRUCTIONS:**
    1. Only score based on explicit evidence from the transcript
    2. If a candidate did NOT attempt or discuss something, score them 1 for that dimension
    3. Every score MUST be justified with exact quotes or clear transcript references
    4. Do NOT assume or infer competency - only evaluate what is explicitly demonstrated
    5. If complexity analysis was not discussed, score complexity_analysis as 1, not higher
    6. If no testing/debugging was discussed, score testing_debugging as 1
    7. Be conservative - when in doubt, score lower and cite why

    {rubric_prompt}

    ## Scoring Guide:
    - Average of 3.25+ with no dimension below 3: **Strong Hire**
    - Average of 2.8-3.2: **Weak Hire** (requires panel discussion)
    - Any dimension scored 1 OR average below 2.8: **No-Hire**

    ## Interview Transcript:
    {json.dumps(transcript_data, indent=2)}

    Please respond in the following JSON format:
    {{
        "dimension_scores": {{
            "problem_comprehension": {{"score": <1-4>, "feedback": "<explanation with specific evidence from transcript>", "evidence": "<exact quote or transcript reference>"}},
            "algorithmic_approach": {{"score": <1-4>, "feedback": "<explanation with specific evidence from transcript>", "evidence": "<exact quote or transcript reference>"}},
            "coding_implementation": {{"score": <1-4>, "feedback": "<explanation with specific evidence from transcript>", "evidence": "<exact quote or transcript reference or code snippet>"}},
            "testing_debugging": {{"score": <1-4>, "feedback": "<explanation with specific evidence from transcript>", "evidence": "<exact quote or transcript reference. If no testing discussed, state 'No testing or debugging discussed in transcript'>"}},
            "complexity_analysis": {{"score": <1-4>, "feedback": "<explanation with specific evidence from transcript>", "evidence": "<exact quote showing time/space complexity analysis. If not discussed, state 'Candidate did not analyze complexity'>"}},
            "communication_collaboration": {{"score": <1-4>, "feedback": "<explanation with specific evidence from transcript>", "evidence": "<exact quote or transcript reference showing communication style>"}},
            "execution_time_management": {{"score": <1-4>, "feedback": "<explanation with specific evidence from transcript>", "evidence": "<timestamp or phase progression reference>"}},
            "technical_foundations": {{"score": <1-4>, "feedback": "<explanation with specific evidence from transcript>", "evidence": "<exact quote showing technical concept usage or misconception>"}}
        }},
        "rubric_feedback": "<overall summary of how scores were determined based on explicit transcript evidence>",
        "recommendation": "<Strong Hire|Weak Hire|No-Hire>",
        "justification": "<brief explanation referencing average score and any dimension scores of 1>"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a strict technical interviewer evaluator. You ONLY score based on explicit evidence in the transcript. If something was not discussed or demonstrated, score it 1. Every score must have clear evidence. Do not hallucinate or infer competency. Always respond with valid JSON."
                },
                {
                    "role": "user",
                    "content": analysis_prompt
                }
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Calculate overall score as average of dimension scores
        overall_score = _calculate_overall_score(result.get("dimension_scores", {}))
        result["overall_score"] = overall_score
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"Error parsing OpenAI response: {e}")
        return {
            "error": "Failed to parse feedback response",
            "details": str(e)
        }
    except Exception as e:
        print(f"Error analyzing transcript: {e}")
        return {
            "error": "Failed to analyze transcript",
            "details": str(e)
        }