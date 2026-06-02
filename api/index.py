"""Vercel Python serverless function — single entry point for /api/* routes.

Uses FastAPI mounted at /api. The main endpoint is POST /api/analyze which
streams SSE back to the frontend as the agent works.
"""
import json
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="REALESTATE_AGENTIC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    address: str


@app.post("/api/analyze")
async def analyze_endpoint(req: AnalyzeRequest):
    """Stream an agentic site assessment via SSE."""
    address = req.address.strip()
    if not address:
        return JSONResponse({"error": "Address is required"}, status_code=400)

    # Import here to keep cold-start fast if the endpoint isn't hit
    from agent import run_agent_stream

    async def event_generator():
        try:
            async for chunk in run_agent_stream(address):
                yield chunk
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering
        },
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
