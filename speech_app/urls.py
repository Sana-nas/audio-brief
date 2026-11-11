"""Root URL configuration: the admin site, plus every page of the app (see core/urls.py)."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
]
