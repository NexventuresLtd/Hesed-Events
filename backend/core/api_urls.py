from django.urls import path, include
from rest_framework.routers import DefaultRouter
from projects.views import ProjectViewSet
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
    path('', include(router.urls)),
]
