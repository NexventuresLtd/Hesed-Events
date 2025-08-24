from django.shortcuts import render
from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ChatMessage
from .serializers import ChatMessageSerializer

# Create your views here.

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        chat_type = self.request.query_params.get('chat_type')
        project_id = self.request.query_params.get('project')
        recipient_id = self.request.query_params.get('recipient')
        
        queryset = ChatMessage.objects.filter(
            models.Q(sender=user) | models.Q(recipient=user)
        ).order_by('-timestamp')
        
        if chat_type:
            queryset = queryset.filter(chat_type=chat_type)
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        if recipient_id:
            queryset = queryset.filter(
                models.Q(sender_id=recipient_id) | models.Q(recipient_id=recipient_id)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
