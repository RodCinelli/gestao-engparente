import json
from typing import Any
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Employee


class EmployeeConsumer(AsyncWebsocketConsumer):
    channel_layer: Any  # Define tipagem para o channel_layer

    async def connect(self):
        self.room_group_name = "employees"

        # Join room group
        await self.channel_layer.group_add(  # type: ignore
            self.room_group_name, self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(  # type: ignore
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        action = text_data_json.get("action", "default")

        # Send message to room group
        await self.channel_layer.group_send(  # type: ignore
            self.room_group_name,
            {"type": "employee_message", "message": message, "action": action},
        )

    # Receive message from room group
    async def employee_message(self, event):
        message = event["message"]
        action = event.get("action", "default")

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message, "action": action}))
