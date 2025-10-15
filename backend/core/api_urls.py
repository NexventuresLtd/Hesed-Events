from django.urls import path, include
from rest_framework.routers import DefaultRouter
from projects.views import ProjectViewSet, daily_summary, generate_report
from institutions.views import InstitutionViewSet
from tasks.views import TaskViewSet
from users.views import UserViewSet
from chat.views import ChatMessageViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'institutions', InstitutionViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'users', UserViewSet)
router.register(r'chat/messages', ChatMessageViewSet, basename='chatmessage')

urlpatterns = [
    path('auth/', include('users.auth_urls')),
    path('daily-summary/', daily_summary, name='daily-summary'),
    path('generate-report/', generate_report, name='generate-report'),
    path('', include(router.urls)),
]
