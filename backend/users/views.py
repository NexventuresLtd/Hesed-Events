from django.shortcuts import render
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSerializer, UserCreateSerializer
from django.db.models import Count, Q
from projects.models import Project
from tasks.models import Task
from institutions.models import Institution

# Create your views here.

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user data to the response
        data['user'] = UserSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return UserCreateSerializer
        return UserSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats_view(request):
    """Get dashboard statistics for the current user"""
    user = request.user
    
    # Get counts based on user role
    if user.role == 'admin':
        total_projects = Project.objects.count()
        total_tasks = Task.objects.count()
        institutions_count = Institution.objects.count()
        completed_tasks = Task.objects.filter(status='completed').count()
        in_progress_tasks = Task.objects.filter(status='in_progress').count()
    elif user.role in ['supervisor', 'employee']:
        # Filter by user's created projects and tasks assigned to user
        user_created_projects = Project.objects.filter(created_by=user)
        user_assigned_tasks = Task.objects.filter(assignee=user)
        user_projects_from_tasks = Project.objects.filter(tasks__assignee=user).distinct()
        
        # Combine projects created by user and projects with tasks assigned to user
        user_projects = user_created_projects.union(user_projects_from_tasks)
        total_projects = user_projects.count()
        
        # Get all tasks assigned to user or in projects created by user
        user_tasks = Task.objects.filter(
            Q(assignee=user) | Q(project__created_by=user)
        ).distinct()
        total_tasks = user_tasks.count()
        completed_tasks = user_tasks.filter(status='completed').count()
        in_progress_tasks = user_tasks.filter(status='in_progress').count()
        
        institutions_count = Institution.objects.filter(supervisor=user).count()
    else:  # observer
        # Read-only access to limited data
        total_projects = Project.objects.count()
        total_tasks = Task.objects.count()
        completed_tasks = Task.objects.filter(status='completed').count()
        in_progress_tasks = Task.objects.filter(status='in_progress').count()
        institutions_count = 0
    
    # Calculate overdue tasks (simplified)
    overdue_tasks = 0  # Would need to implement date comparison
    
    # Active users count
    from users.models import User
    active_users = User.objects.filter(is_active=True).count()
    
    stats = {
        'totalProjects': total_projects,
        'totalTasks': total_tasks,
        'completedTasks': completed_tasks,
        'inProgressTasks': in_progress_tasks,
        'overdueTask': overdue_tasks,
        'institutionsCount': institutions_count,
        'activeUsers': active_users,
    }
    
    return Response(stats)
