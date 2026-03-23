import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_system.settings')

from django.core.asgi import get_asgi_application

# Django MUST be initialised before any app-level imports
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.middleware import BaseMiddleware  # noqa: E402
from channels.db import database_sync_to_async  # noqa: E402
from django.contrib.auth.models import AnonymousUser  # noqa: E402
from rest_framework_simplejwt.tokens import AccessToken  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402

from api.routing import websocket_urlpatterns  # noqa: E402

User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):
    """Authenticate WebSocket connections via ?token=<jwt> query param."""

    async def __call__(self, scope, receive, send):
        from urllib.parse import parse_qs

        query_string = scope.get('query_string', b'').decode('utf-8')
        params = parse_qs(query_string)
        token_list = params.get('token', [])
        scope['user'] = AnonymousUser()

        if token_list:
            try:
                access_token = AccessToken(token_list[0])
                uid = access_token['user_id']
                scope['user'] = await database_sync_to_async(User.objects.get)(id=uid)
            except Exception:
                pass

        return await super().__call__(scope, receive, send)


application = ProtocolTypeRouter(
    {
        'http': django_asgi_app,
        'websocket': JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        ),
    }
)
