from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', views.current_user_view, name='current_user'),
    path('dashboard-stats/', views.dashboard_stats_view, name='dashboard_stats'),
]
