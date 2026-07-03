import os
import json
import logging
from datetime import date

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set")

if not CLERK_JWKS_URL:
    raise RuntimeError("CLERK_JWKS_URL is not set")

app = FastAPI()
client = OpenAI(api_key=OPENAI_API_KEY)

clerk_config = ClerkConfig(jwks_url=CLERK_JWKS_URL)
clerk_guard = ClerkHTTPBearer(config=clerk_config)

class Visit(BaseModel):
    patient_name: str = Field(min_length=1, max_length=100)
    date_of_visit: date
    notes: str = Field(min_length=1, max_length=10000)

system_prompt = """
You are assisting a doctor by summarizing clinical visit notes.

Return exactly three sections with these headings:
### Summary of visit for the doctor's records
### Next steps for the doctor
### Draft of email to patient in patient-friendly language

Do not invent diagnoses, medications, test results, or follow-up steps that are not present in the notes.
If information is missing, say that it is not specified.
"""

def user_prompt_for(visit: Visit) -> str:
    return f"""
    Patient: {visit.patient_name}
    Date of visit: {visit.date_of_visit}
    Notes: {visit.notes}
    """

@app.post("/api")
def consultation_summary(
    visit: Visit, 
    credentials: HTTPAuthorizationCredentials = Depends(clerk_guard),
    ):

    user_id = credentials.decoded["sub"]

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # TODO:
    # - Check user permissions
    # - Apply per-user rate limits
    # - Avoid logging patient notes
    # - Store audit event if required

    try:
        prompt = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt_for(visit)
            }
        ]
        stream = client.chat.completions.create(
            model="gpt-5-nano",
            messages=prompt,
            stream=True,
            reasoning_effort="minimal",
        )
    except Exception:
        logger.exception("Failed to generate summary for user_id=%s", user_id)
        raise HTTPException(status_code=500, detail="Failed to generate summary")

    def event_stream():
        try:
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield f"data: {json.dumps(delta)}\n\n"
            yield "event: done\ndata: [DONE]\n\n"
        except Exception:
            logger.exception("OpenAI streaming failed for user_id=%s", user_id)
            yield "event: error\ndata: Streaming failed\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")