from django.db import models
from django.conf import settings

class Project(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects'
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def total_tasks(self):
        return self.tasks.count()
    
    @property
    def completed_tasks(self):
        return self.tasks.filter(status='completed').count()
    
    @property
    def in_progress_tasks(self):
        return self.tasks.filter(status='in_progress').count()
    
    @property
    def initial_tasks(self):
        return self.tasks.filter(status='initial').count()
    
    @property
    def completion_percentage(self):
        total = self.total_tasks
        if total == 0:
            return 0
        return round((self.completed_tasks / total) * 100)
