from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/employees/', consumers.EmployeeConsumer.as_asgi()),
] 