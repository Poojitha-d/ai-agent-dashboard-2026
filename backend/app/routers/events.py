import asyncio
from fastapi import APIRouter
from starlette.responses import StreamingResponse
from app.services.event_bus import event_bus

router = APIRouter(prefix="/usage", tags=["realtime"])


@router.get("/events")
async def sse_events():
    """Server-Sent Events endpoint streaming live usage updates to clients."""
    async def event_generator():
        q = event_bus.subscribe()
        try:
            # Send initial keepalive/connected event
            yield f"event: ping\ndata: {{\"status\": \"connected\"}}\n\n"
            while True:
                try:
                    # Wait for next event with a 15-second timeout for keepalive
                    data = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"event: usage\ndata: {data}\n\n"
                except asyncio.TimeoutError:
                    yield "event: ping\ndata: {\"status\": \"keepalive\"}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            event_bus.unsubscribe(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
