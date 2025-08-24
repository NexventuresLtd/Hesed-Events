from django.contrib import admin
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender_name', 'recipient', 'chat_type', 'timestamp', 'is_read')
    list_filter = ('chat_type', 'timestamp', 'is_read')
    search_fields = ('content', 'sender__username', 'recipient__username')
    ordering = ('-timestamp',)
    readonly_fields = ('sender_name', 'sender_role', 'timestamp')
