"""
ASGI config for gestao_api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestao_api.settings')

# Initialize Django ASGI application early
django_asgi_app = get_asgi_application()

# Import after Django setup to avoid circular imports
from employees.routing import websocket_urlpatterns as employees_websocket_urlpatterns
from financials.routing import websocket_urlpatterns as financials_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            employees_websocket_urlpatterns + 
            financials_websocket_urlpatterns
        )
    ),
})
