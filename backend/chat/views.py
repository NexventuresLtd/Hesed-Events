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
        
        if chat_type == 'group':
            # For group messages, return all group messages
            queryset = ChatMessage.objects.filter(chat_type='group')
        elif chat_type == 'private' and recipient_id:
            # For private messages, return messages between current user and specified recipient
            queryset = ChatMessage.objects.filter(
                models.Q(sender=user, recipient_id=recipient_id) | 
                models.Q(sender_id=recipient_id, recipient=user),
                chat_type='private'
            )
        else:
            # Default: all messages where user is sender or recipient
            queryset = ChatMessage.objects.filter(
                models.Q(sender=user) | models.Q(recipient=user)
            )
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset.order_by('-timestamp')
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
