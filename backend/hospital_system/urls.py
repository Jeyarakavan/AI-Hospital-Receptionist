"""
URL configuration for hospital_system project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def root_health(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'AI Hospital Receptionist backend is running',
        'api_root': '/api/',
    })

urlpatterns = [
    path('', root_health, name='root-health'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
