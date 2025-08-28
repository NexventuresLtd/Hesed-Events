from rest_framework import serializers
from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField()
    sender_role = serializers.ReadOnlyField()
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'sender', 'sender_name', 'sender_role', 'recipient', 
            'recipient_name', 'content', 'chat_type', 'timestamp', 'is_read'
        ]
        read_only_fields = ['id', 'sender', 'timestamp']
        