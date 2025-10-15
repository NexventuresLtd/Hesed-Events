from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_task_assignment_email(task, assignee):
    """Send email notification when a task is assigned to a user"""
    subject = f'New Task Assigned: {task.title}'
    
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #97aa1a;">New Task Assigned</h2>
                <p>Hello {assignee.full_name},</p>
                <p>You have been assigned a new task:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin-top: 0;">{task.title}</h3>
                    <p><strong>Project:</strong> {task.project.title}</p>
                    <p><strong>Description:</strong> {task.description}</p>
                    <p><strong>Due Date:</strong> {task.due_date.strftime('%B %d, %Y') if task.due_date else 'No deadline'}</p>
                    <p><strong>Status:</strong> {task.get_status_display()}</p>
                </div>
                
                <p>Please log in to the platform to view more details and start working on this task.</p>
                <p><a href="{settings.SITE_URL}" style="background-color: #97aa1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task</a></p>
                
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    This is an automated message from Hesed Events Management System.
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [assignee.email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")


def send_task_status_change_email(task, old_status, new_status):
    """Send email notification when task status changes"""
    subject = f'Task Status Updated: {task.title}'
    
    status_labels = {
        'initial': 'Not Started',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    }
    
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #97aa1a;">Task Status Updated</h2>
                <p>Hello {task.assignee.full_name if task.assignee else 'Team'},</p>
                <p>The status of a task has been updated:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin-top: 0;">{task.title}</h3>
                    <p><strong>Project:</strong> {task.project.title}</p>
                    <p><strong>Status Change:</strong> 
                        <span style="color: #666;">{status_labels.get(old_status, old_status)}</span> 
                        → 
                        <span style="color: #97aa1a; font-weight: bold;">{status_labels.get(new_status, new_status)}</span>
                    </p>
                    <p><strong>Progress:</strong> {task.progress}%</p>
                </div>
                
                <p><a href="{settings.SITE_URL}" style="background-color: #97aa1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task</a></p>
                
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    This is an automated message from Hesed Events Management System.
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    if task.assignee and task.assignee.email:
        try:
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [task.assignee.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")


def send_task_comment_email(comment):
    """Send email notification when a comment is added to a task"""
    task = comment.task
    subject = f'New Comment on Task: {task.title}'
    
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #97aa1a;">New Comment on Your Task</h2>
                <p>Hello {task.assignee.full_name if task.assignee else 'Team'},</p>
                <p>A new comment has been added to a task assigned to you:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin-top: 0;">{task.title}</h3>
                    <p><strong>Project:</strong> {task.project.title}</p>
                    <p><strong>Comment by:</strong> {comment.author.full_name} ({comment.author.role})</p>
                    <div style="background-color: white; padding: 10px; border-left: 3px solid #97aa1a; margin-top: 10px;">
                        {comment.content}
                    </div>
                </div>
                
                <p><a href="{settings.SITE_URL}" style="background-color: #97aa1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task & Reply</a></p>
                
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    This is an automated message from Hesed Events Management System.
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    if task.assignee and task.assignee.email and task.assignee != comment.author:
        try:
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [task.assignee.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")
