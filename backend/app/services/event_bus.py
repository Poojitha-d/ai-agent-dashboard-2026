import asyncio
import json
from typing import Set, Any


class EventBus:
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self._subscribers.discard(q)

    async def broadcast(self, event_type: str, data: Any):
        payload = json.dumps({"event": event_type, "data": data})
        for q in list(self._subscribers):
            try:
                await q.put(payload)
            except Exception:
                self._subscribers.discard(q)


event_bus = EventBus()
