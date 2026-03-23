"""
API URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet,
    UserViewSet,
    DoctorViewSet,
    DoctorAvailabilityViewSet,
    PatientViewSet,
    AppointmentViewSet,
    ChatMessageViewSet,
    AmbulanceViewSet,
    dashboard_stats,
    call_logs,
    notifications,
    staff_list,
    send_hospital_news,
    site_settings_public,
    site_settings_get,
    site_settings_update,
    hospital_news_list,
    hospital_news_create,
    hospital_news_delete,
    send_message_to_user,
    chat_user_search,
)
from .twilio_views import (
    twilio_incoming_call,
    twilio_gather,
    twilio_status_callback,
    live_calls_snapshot,
    simulate_incoming_call,
    transfer_call,
)
from .call_ai_views import (
    call_ai_intake,
    call_ai_requests_list,
    call_ai_vocabulary,
)

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'availability', DoctorAvailabilityViewSet, basename='availability')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'chat-messages', ChatMessageViewSet, basename='chat-message')
router.register(r'ambulance', AmbulanceViewSet, basename='ambulance')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_stats, name='dashboard'),
    path('call-logs/', call_logs, name='call-logs'),
    path('notifications/', notifications, name='notifications'),
    path('staff/', staff_list, name='staff-list'),
    path('hospital-news/', send_hospital_news, name='hospital-news-broadcast'),
    path('hospital-news/list/', hospital_news_list, name='hospital-news-list'),
    path('hospital-news/create/', hospital_news_create, name='hospital-news-create'),
    path('hospital-news/<uuid:pk>/delete/', hospital_news_delete, name='hospital-news-delete'),
    path('site-settings/', site_settings_get, name='site-settings-get'),
    path('site-settings/public/', site_settings_public, name='site-settings-public'),
    path('site-settings/update/', site_settings_update, name='site-settings-update'),
    path('send-message/', send_message_to_user, name='send-message'),
    path('chat-users/', chat_user_search, name='chat-users'),
    path('twilio/voice/', twilio_incoming_call, name='twilio-voice'),
    path('twilio/gather/', twilio_gather, name='twilio-gather'),
    path('twilio/status/', twilio_status_callback, name='twilio-status'),
    path('twilio/simulate/', simulate_incoming_call, name='twilio-simulate'),
    path('live-calls/', live_calls_snapshot, name='live-calls-snapshot'),
    path('calls/<str:call_sid>/transfer/', transfer_call, name='transfer-call'),
    path('call-ai/vocabulary/', call_ai_vocabulary, name='call-ai-vocabulary'),
    path('call-ai/intake/', call_ai_intake, name='call-ai-intake'),
    path('call-ai/requests/', call_ai_requests_list, name='call-ai-requests'),
]
