"""Channels websocket routing for API app."""

from django.urls import re_path

from .consumers import LiveCallConsumer


websocket_urlpatterns = [
    re_path(r"^ws/calls/$", LiveCallConsumer.as_asgi()),
]
