from django.db import models
from django.conf import settings

class Task(models.Model):
    STATUS_CHOICES = [
        ('initial', 'Initial'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    institution = models.ForeignKey(
        'institutions.Institution',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initial')
    progress = models.PositiveIntegerField(default=0)  # 0-100
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"
    
    @property
    def assignee_name(self):
        return self.assignee.full_name if self.assignee else "Unassigned"
    
    @property
    def institution_name(self):
        return self.institution.name if self.institution else "No institution"
    
    @property
    def is_overdue(self):
        if not self.due_date:
            return False
        from django.utils import timezone
        return timezone.now() > self.due_date and self.status != 'completed'

class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comment by {self.author.full_name} on {self.task.title}"

class TaskEvidence(models.Model):
    FILE_TYPES = [
        ('image', 'Image'),
        ('document', 'Document'),
        ('link', 'Link'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='evidence')
    file_name = models.CharField(max_length=255)
    file_url = models.URLField(max_length=500, blank=True)
    file = models.FileField(upload_to='task_evidence/', blank=True)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.file_name} - {self.task.title}"
