import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import app as agent_app

app = FastAPI(title="REALESTATE API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are a highly advanced commercial real estate autonomous agent.
Your goal is to evaluate NYC properties by autonomously pulling data and running calculations.
Always use your tools to pull the PLUTO data and recent sales (ACRIS) before making an assessment.

When giving your final assessment, format it beautifully with clear sections:
- Executive Summary
- Zoning & Lot Characteristics
- Development Potential (calculate BSF based on lot_area * residfar)
- Comparable Sales & Land Value
- Risk Flags

Be precise, professional, and always cite your data sources.
"""

class AnalyzeRequest(BaseModel):
    address: str

@app.post("/api/analyze")
async def analyze_endpoint(req: AnalyzeRequest):
    address = req.address
    if not address:
        return {"error": "Address is required"}

    async def event_generator():
        yield f"data: {json.dumps({'type': 'status', 'content': f'Initiating analysis for {address}...'})}\n\n"
        
        inputs = {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Please run a full site assessment on {address}."}
            ]
        }

        try:
            async for event in agent_app.astream_events(inputs, version="v2"):
                kind = event["event"]
                
                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    if chunk.content:
                        # Vercel serverless has a specific timeout, but streaming keeps it alive
                        yield f"data: {json.dumps({'type': 'content_chunk', 'content': chunk.content})}\n\n"
                
                elif kind == "on_tool_start":
                    tool_name = event["name"]
                    yield f"data: {json.dumps({'type': 'status', 'content': f'Running tool: {tool_name}...'})}\n\n"
                    
                elif kind == "on_tool_end":
                    tool_name = event["name"]
                    yield f"data: {json.dumps({'type': 'status', 'content': f'Finished tool: {tool_name}.'})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': f'Agent error: {str(e)}'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Delete old server.py if it exists
import os
try:
    os.remove('server.py')
except:
    pass
