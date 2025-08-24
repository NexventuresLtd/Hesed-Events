from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task, TaskComment, TaskEvidence
from .serializers import TaskSerializer

# Create your views here.

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('project', 'assignee', 'institution').all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = self.queryset
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset
