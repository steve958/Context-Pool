import os

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from src.services.pipeline import RunRegistry

router = APIRouter(tags=["websocket"])

_WS_CLOSE_POLICY_VIOLATION = 1008


def _ws_key_valid(provided: str) -> bool:
    """Return True when auth is disabled or the provided key matches API_KEY."""
    configured = os.environ.get("API_KEY", "").strip()
    if not configured:
        return True  # auth disabled in local dev
    return provided == configured


@router.websocket("/ws/query/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str, api_key: str = ""):
    # SEC-02: authenticate before accepting the connection
    if not _ws_key_valid(api_key):
        await websocket.close(code=_WS_CLOSE_POLICY_VIOLATION)
        return

    await websocket.accept()
    run = RunRegistry.get(run_id)
    if not run:
        await websocket.send_json({"type": "error", "message": "Run not found"})
        await websocket.close()
        return

    # Register client so the pipeline can push events
    RunRegistry.add_client(run_id, websocket)
    try:
        # Replay any buffered events for late-joining clients
        for event in RunRegistry.get_buffered_events(run_id):
            await websocket.send_json(event)

        # Keep connection alive until terminal state or disconnect
        while True:
            run = RunRegistry.get(run_id)
            if run and run["status"] in ("complete", "failed"):
                break
            try:
                await websocket.receive_text()  # ping keepalive
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    finally:
        RunRegistry.remove_client(run_id, websocket)
        try:
            await websocket.close()
        except RuntimeError:
            pass  # already closed (client disconnected before we got here)
