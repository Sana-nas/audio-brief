from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing, name='landing'),
    path('home/', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    path('transcribe/', views.transcribe, name='transcribe'),
    path('transcribe/job/<str:job_id>/', views.job_page, name='job'),
    path('transcribe/job/<str:job_id>/status/', views.job_status, name='job_status'),
    path('transcribe/job/<str:job_id>/cancel/', views.job_cancel, name='job_cancel'),
    path('download-pdf/', views.download_as_pdf, name='download_pdf'),

    path('youtube/', views.youtube, name='youtube'),
]
