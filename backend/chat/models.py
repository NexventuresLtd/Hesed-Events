from django.db import models
from django.conf import settings

class ChatMessage(models.Model):
    CHAT_TYPES = [
        ('group', 'Group Chat'),
        ('private', 'Private Chat'),
    ]
    
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='received_messages'
    )
    content = models.TextField()
    chat_type = models.CharField(max_length=10, choices=CHAT_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        if self.chat_type == 'private':
            return f"Private: {self.sender.full_name} -> {self.recipient.full_name}"
        return f"Group: {self.sender.full_name}"
    
    @property
    def sender_name(self):
        return self.sender.full_name
    
    @property
    def sender_role(self):
        return self.sender.role
