from django.urls import path
from .views import CallHandlerView, TwilioVoiceWebhook

urlpatterns = [
    path('call/', CallHandlerView.as_view(), name='ai-call-handler'),
    path('voice/', TwilioVoiceWebhook.as_view(), name='ai-voice-handler'),
]
