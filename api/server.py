import os
import json
import logging
from pathlib import Path
from datetime import date

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI

# ---------------------------------------------------------------------------
# DEPLOYMENT NOTE (Lambda) — decide before deploying, left to you:
#   1. Lambda invokes handler(event, context); FastAPI is an ASGI app. You need
#      an adapter (e.g. Mangum: `handler = Mangum(app)` + add mangum to
#      requirements.txt), OR Lambda Web Adapter, OR a container on Fargate/App Runner.
#   2. STREAMING: this endpoint uses SSE (StreamingResponse). Lambda behind API
#      Gateway BUFFERS the full response — it will NOT stream token-by-token.
#      Real streaming needs a Lambda Function URL with RESPONSE_STREAM invoke
#      mode (Mangum does not support response streaming), Lambda Web Adapter,
#      or a container. This choice drives how the handler is wired.
#   3. Static serving below assumes a local ./static dir; on Lambda you'd
#      normally serve the frontend from S3/CloudFront instead.
# ---------------------------------------------------------------------------

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set")

if not CLERK_JWKS_URL:
    raise RuntimeError("CLERK_JWKS_URL is not set")

app = FastAPI()
client = OpenAI(api_key=OPENAI_API_KEY)

# NOTE: allow_origins=["*"] together with allow_credentials=True is rejected by
# browsers and by Starlette. Auth here is a Bearer token in a header (not a
# cookie), so credentials aren't needed. Replace "*" with your real frontend
# origin(s) before production, especially for a PHI app.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

clerk_config = ClerkConfig(jwks_url=CLERK_JWKS_URL)
clerk_guard = ClerkHTTPBearer(config=clerk_config)

class Visit(BaseModel):
    patient_name: str = Field(min_length=1, max_length=100)
    date_of_visit: date
    notes: str = Field(min_length=1, max_length=10000)

system_prompt = """
You are provided with notes written by a doctor from a patient's visit.
Your job is to summarize the visit for the doctor and provide an email.
Reply with exactly three sections with the headings:
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

@app.post("/api/consultation")
def consultation(
    visit: Visit,
    credentials: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = credentials.decoded["sub"]
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        stream = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt_for(visit)
                }
            ],
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

@app.get("/health")
async def health():
    return {"status": "ok"}

static_path = Path("static")

if static_path.exists():
    # Serve Next.js hashed asset folders directly (JS, CSS, chunks, images).
    app.mount(
        "/_next",
        StaticFiles(directory=static_path / "_next"),
        name="_next",
    )

    # Catch-all that resolves a request path to the right file produced by a
    # Next.js static export (`output: "export"`). MUST stay the LAST route so
    # it does not shadow /api/consultation or /health above.
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # 1. Exact static file (favicon.ico, svgs, etc.)
        candidate = static_path / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)

        # 2. Static-export page: "/" -> index.html, "/product" -> product.html
        if not full_path:
            html_candidate = static_path / "index.html"
        else:
            html_candidate = static_path / f"{full_path}.html"
        if html_candidate.is_file():
            return FileResponse(html_candidate)

        # 3. Directory index: "/foo" -> foo/index.html
        index_candidate = static_path / full_path / "index.html"
        if index_candidate.is_file():
            return FileResponse(index_candidate)

        # 4. Fall back to the exported 404 page.
        not_found = static_path / "404.html"
        if not_found.is_file():
            return FileResponse(not_found, status_code=404)
        return HTMLResponse("Not Found", status_code=404)
