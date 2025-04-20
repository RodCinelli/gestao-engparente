from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/financials/', consumers.FinancialConsumer.as_asgi()),
] 