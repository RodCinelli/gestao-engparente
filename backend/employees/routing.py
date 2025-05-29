from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/employees/$", consumers.EmployeeConsumer.as_asgi()),
]
