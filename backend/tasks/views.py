from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task, TaskComment, TaskEvidence
from .serializers import TaskSerializer, TaskCommentSerializer, TaskEvidenceSerializer

# Create your views here.

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('project', 'assignee', 'institution').prefetch_related('comments', 'evidence').all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = self.queryset
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Get or create comments for a task"""
        task = self.get_object()
        
        if request.method == 'GET':
            comments = task.comments.all()
            serializer = TaskCommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = TaskCommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(task=task, author=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'post'])
    def evidence(self, request, pk=None):
        """Get or create evidence for a task"""
        task = self.get_object()
        
        if request.method == 'GET':
            evidence = task.evidence.all()
            serializer = TaskEvidenceSerializer(evidence, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = TaskEvidenceSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(task=task, uploaded_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
