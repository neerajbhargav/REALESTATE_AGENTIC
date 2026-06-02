"""Vercel Python serverless function — single entry point for /api/* routes.

Uses FastAPI mounted at /api. The main endpoint is POST /api/analyze which
streams SSE back to the frontend as the agent works.
"""
import sys
import os

# Vercel runs this file from /var/task/ but sibling modules (agent.py, rag.py,
# tools/) live in /var/task/api/. Add our own directory to sys.path so that
# `from agent import ...` and `from tools.geocoder import ...` resolve.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import json
from fastapi import FastAPI, Request, Query
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


@app.get("/api/suggest")
async def suggest_endpoint(q: str = ""):
    """Return NYC address suggestions for autocomplete."""
    if len(q.strip()) < 3:
        return {"suggestions": []}
    import httpx
    from tools.geocoder import suggest_addresses
    async with httpx.AsyncClient() as http:
        try:
            results = await suggest_addresses(http, q.strip())
            return {"suggestions": results}
        except Exception:
            return {"suggestions": []}


class ChatRequest(BaseModel):
    question: str
    context: dict
    address: str


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Answer user questions about the specific property using Claude with SSE."""
    question = req.question.strip()
    context = req.context
    address = req.address
    if not question:
        return JSONResponse({"error": "Question is required"}, status_code=400)

    from anthropic import AsyncAnthropic
    client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

    system_prompt = (
        "You are an expert commercial real estate underwriting AI agent. "
        f"Answer the user's question about the property located at {address}. "
        "Use the following property context (PLUTO data, zoning rules, comparable sales, calculated limits) to answer accurate questions. "
        "If the answer cannot be found in the context, use your broad NYC zoning knowledge to answer, but specify that it is general guidance. "
        "Keep your response concise, professional, broker-grade, and structured in clean markdown.\n\n"
        f"PROPERTY CONTEXT:\n{json.dumps(context, indent=2)}"
    )

    async def event_generator():
        try:
            # We call Claude with streaming enabled
            async with client.messages.stream(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": question}],
            ) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'type': 'chunk', 'content': text})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
