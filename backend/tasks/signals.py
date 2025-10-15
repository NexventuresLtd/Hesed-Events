from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Task, TaskComment
from .emails import send_task_assignment_email, send_task_status_change_email, send_task_comment_email


@receiver(pre_save, sender=Task)
def track_task_changes(sender, instance, **kwargs):
    """Track changes to task for email notifications"""
    if instance.pk:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            instance._old_assignee = old_instance.assignee
            instance._old_status = old_instance.status
        except Task.DoesNotExist:
            pass


@receiver(post_save, sender=Task)
def task_post_save(sender, instance, created, **kwargs):
    """Send email notifications when task is created or updated"""
    if created:
        # New task created - send assignment email if there's an assignee
        if instance.assignee:
            send_task_assignment_email(instance, instance.assignee)
    else:
        # Task updated - check for changes
        # Check if assignee changed
        if hasattr(instance, '_old_assignee'):
            if instance._old_assignee != instance.assignee and instance.assignee:
                send_task_assignment_email(instance, instance.assignee)
        
        # Check if status changed
        if hasattr(instance, '_old_status'):
            if instance._old_status != instance.status:
                send_task_status_change_email(instance, instance._old_status, instance.status)


@receiver(post_save, sender=TaskComment)
def task_comment_post_save(sender, instance, created, **kwargs):
    """Send email notification when a comment is added to a task"""
    if created:
        send_task_comment_email(instance)
