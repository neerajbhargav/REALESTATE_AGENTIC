import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from agent import app as agent_app

app = FastAPI(title="REALESTATE_AGENTIC API")

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

@app.websocket("/ws/analyze")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            request = json.loads(data)
            address = request.get("address", "")
            
            if not address:
                await websocket.send_text(json.dumps({"type": "error", "content": "Address is required."}))
                continue

            await websocket.send_text(json.dumps({"type": "status", "content": f"Initiating analysis for {address}..."}))
            
            inputs = {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Please run a full site assessment on {address}."}
                ]
            }

            try:
                # Stream the agent's thought process
                async for event in agent_app.astream_events(inputs, version="v2"):
                    kind = event["event"]
                    
                    if kind == "on_chat_model_stream":
                        chunk = event["data"]["chunk"]
                        if chunk.content:
                            await websocket.send_text(json.dumps({
                                "type": "content_chunk",
                                "content": chunk.content
                            }))
                    
                    elif kind == "on_tool_start":
                        tool_name = event["name"]
                        await websocket.send_text(json.dumps({
                            "type": "status",
                            "content": f"Running tool: {tool_name}..."
                        }))
                        
                    elif kind == "on_tool_end":
                        tool_name = event["name"]
                        await websocket.send_text(json.dumps({
                            "type": "status",
                            "content": f"Finished tool: {tool_name}."
                        }))

                await websocket.send_text(json.dumps({"type": "done"}))
                
            except Exception as e:
                await websocket.send_text(json.dumps({"type": "error", "content": f"Agent error: {str(e)}"}))
                
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
