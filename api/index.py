import os

from fastapi import Depends, FastAPI
from fastapi.responses import PlainTextResponse, StreamingResponse
from openai import OpenAI
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()

client = OpenAI()

clerk_config = ClerkConfig(
    jwks_url=os.getenv("CLERK_JWKS_URL"),
)
clerk_guard = ClerkHTTPBearer(config=clerk_config)

@app.get("/api")
def idea(credentials: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    user_id = credentials.decoded["sub"]
    # We now know which user is making the request! 
    # You could use user_id to:
    # - Track usage per user
    # - Store generated ideas in a database
    # - Apply user-specific limits or customization
    
    try:
        prompt = [{
            "role": "user",
            "content": "Generate a new business idea for a SaaS product formatted with headings, sub-headings and bullet points"
        }]
        stream = client.chat.completions.create(
            model="gpt-5-nano",
            messages=prompt,
            stream=True,
            reasoning_effort="minimal",
        )
    except Exception as e:
        return PlainTextResponse(str(e), status_code=500)

    def event_stream():
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for line in lines:
                    yield f"data: {line}\n"
                yield "\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")