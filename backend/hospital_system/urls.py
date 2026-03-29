"""
URL configuration for hospital_system project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from django.http import HttpResponse

def home(request):
    return HttpResponse("<h2>🏥 AI Hospital Receptionist is Online</h2><p>The AI is ready to handle your calls at <b>/api/ai/voice/</b></p>")

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/ai/', include('ai_agents.api.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
