import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth import get_user_model
from .models import ChatMessage
from .serializers import ChatMessageSerializer

User = get_user_model()


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json['message']
        sender_id = text_data_json.get('sender_id')
        recipient_id = text_data_json.get('recipient_id')
        chat_type = text_data_json.get('chat_type', 'group')
        
        try:
            # Get the sender user
            sender = User.objects.get(id=sender_id) if sender_id else None
            recipient = User.objects.get(id=recipient_id) if recipient_id else None
            
            # Create the message in the database
            message = ChatMessage.objects.create(
                sender=sender,
                recipient=recipient,
                content=message_content,
                chat_type=chat_type
            )
            
            # Serialize the message
            serializer = ChatMessageSerializer(message)
            
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': serializer.data
                }
            )
        except Exception as e:
            # Send error message back to the client
            self.send(text_data=json.dumps({
                'error': str(e)
            }))

    def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))
