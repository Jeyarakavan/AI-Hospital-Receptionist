from django.urls import path
from .views import CallHandlerView, TwilioVoiceWebhook, AIChatHistoryView

urlpatterns = [
    path('call/', CallHandlerView.as_view(), name='ai-call-handler'),
    path('chat-history/', AIChatHistoryView.as_view(), name='ai-chat-history'),
    path('voice/', TwilioVoiceWebhook.as_view(), name='ai-voice-handler'),
]
