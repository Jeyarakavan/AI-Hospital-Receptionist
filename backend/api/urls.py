"""
API URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, UserViewSet, DoctorViewSet, DoctorAvailabilityViewSet,
    PatientViewSet, AppointmentViewSet, dashboard_stats, call_logs,
    notifications, send_hospital_news
)

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'availability', DoctorAvailabilityViewSet, basename='availability')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_stats, name='dashboard'),
    path('call-logs/', call_logs, name='call-logs'),
    path('notifications/', notifications, name='notifications'),
    path('hospital-news/', send_hospital_news, name='hospital-news'),
]
