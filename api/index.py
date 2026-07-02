from fastapi import FastAPI
from fastapi.responses import PlainTextResponse, StreamingResponse
from openai import OpenAI

app = FastAPI()

client = OpenAI()

@app.get("/api")
def idea():
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