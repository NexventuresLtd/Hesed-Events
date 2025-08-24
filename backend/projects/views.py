from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer, ProjectCreateSerializer

# Create your views here.

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateSerializer
        return ProjectSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
