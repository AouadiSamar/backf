#  Author Aouadi samar

import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("notifications", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("notifications", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "")

        await self.channel_layer.group_send(
            "notifications",
            {
                "type": "notification_message",
                "message": message,
            }
        )

    async def notification_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({"message": message}))
