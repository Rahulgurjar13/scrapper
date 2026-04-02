import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..scraper.core import scrape_job_state

router = APIRouter()


@router.get("/logs")
async def get_logs():
    """Return the last 100 log entries."""
    return scrape_job_state["logs"][-100:]


async def websocket_logs(websocket: WebSocket):
    """
    WebSocket endpoint for live log streaming.
    Mounted separately in main.py at /ws/logs.
    """
    await websocket.accept()
    last_log_count = len(scrape_job_state["logs"])

    # Send all current logs on connect
    initial_logs = scrape_job_state["logs"][-100:]
    if initial_logs:
        await websocket.send_json({"type": "init", "logs": initial_logs})

    try:
        while True:
            current_log_count = len(scrape_job_state["logs"])
            if current_log_count > last_log_count:
                new_logs = scrape_job_state["logs"][last_log_count:]
                await websocket.send_json({"type": "new", "logs": new_logs})
                last_log_count = current_log_count
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
