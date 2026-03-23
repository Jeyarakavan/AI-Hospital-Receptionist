"""WebSocket consumers for live receptionist dashboard updates."""

from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from django.contrib.auth.models import AnonymousUser


LIVE_CALLS_GROUP = "live_calls"


def broadcast_call_event(event_type: str, payload: dict) -> None:
    """Broadcast live-call events to all connected admin dashboards."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        LIVE_CALLS_GROUP,
        {
            "type": "call.event",
            "event": event_type,
            "payload": payload,
        },
    )


class LiveCallConsumer(AsyncJsonWebsocketConsumer):
    """Live updates for active AI calls and transfer queue.

    Authentication is handled by JWTAuthMiddleware in asgi.py which
    populates scope["user"] before the consumer connects.
    """

    async def connect(self):
        user = self.scope.get("user")
        if user is None or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(LIVE_CALLS_GROUP, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(LIVE_CALLS_GROUP, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")
        if action == "ping":
            await self.send_json({"event": "pong"})

    async def call_event(self, event):
        await self.send_json({
            "event": event.get("event"),
            "payload": event.get("payload", {}),
        })
