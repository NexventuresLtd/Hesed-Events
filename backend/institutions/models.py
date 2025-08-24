from django.db import models
from django.conf import settings

class Institution(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_institutions',
        limit_choices_to={'role': 'supervisor'}
    )
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    @property
    def supervisor_name(self):
        return self.supervisor.full_name if self.supervisor else "No supervisor assigned"
    
    @property
    def total_tasks(self):
        return self.tasks.count()
    
    @property
    def completed_tasks(self):
        return self.tasks.filter(status='completed').count()
    
    @property
    def completion_rate(self):
        total = self.total_tasks
        if total == 0:
            return 0
        return round((self.completed_tasks / total) * 100)
