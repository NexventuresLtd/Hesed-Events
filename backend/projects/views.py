from django.shortcuts import render
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from .models import Project
from .serializers import ProjectSerializer, ProjectCreateSerializer
from tasks.models import Task

# Create your views here.

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateSerializer
        return ProjectSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_summary(request):
    """Get daily summary of activities"""
    # Get date from query params or use today
    date_str = request.query_params.get('date', None)
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        target_date = timezone.now().date()
    
    # Get start and end of day
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    # Tasks created today
    tasks_created = Task.objects.filter(
        created_at__range=(start_of_day, end_of_day)
    ).select_related('project', 'assignee')
    
    # Tasks completed today
    tasks_completed = Task.objects.filter(
        status='completed',
        updated_at__range=(start_of_day, end_of_day)
    ).select_related('project', 'assignee')
    
    # Tasks updated today
    tasks_updated = Task.objects.filter(
        updated_at__range=(start_of_day, end_of_day)
    ).exclude(status='completed').select_related('project', 'assignee')
    
    # Projects created today
    projects_created = Project.objects.filter(
        created_at__range=(start_of_day, end_of_day)
    )
    
    # Overdue tasks
    overdue_tasks = Task.objects.filter(
        due_date__lt=timezone.now(),
        status__in=['initial', 'in_progress']
    ).select_related('project', 'assignee')
    
    summary_data = {
        'date': target_date.strftime('%Y-%m-%d'),
        'tasks_created': {
            'count': tasks_created.count(),
            'items': [
                {
                    'id': task.id,
                    'title': task.title,
                    'project': task.project.title,
                    'assignee': task.assignee.full_name if task.assignee else 'Unassigned',
                    'status': task.status
                }
                for task in tasks_created[:10]
            ]
        },
        'tasks_completed': {
            'count': tasks_completed.count(),
            'items': [
                {
                    'id': task.id,
                    'title': task.title,
                    'project': task.project.title,
                    'assignee': task.assignee.full_name if task.assignee else 'Unassigned',
                    'completed_at': task.updated_at.strftime('%Y-%m-%d %H:%M')
                }
                for task in tasks_completed[:10]
            ]
        },
        'tasks_updated': {
            'count': tasks_updated.count(),
            'items': [
                {
                    'id': task.id,
                    'title': task.title,
                    'project': task.project.title,
                    'assignee': task.assignee.full_name if task.assignee else 'Unassigned',
                    'status': task.status,
                    'progress': task.progress
                }
                for task in tasks_updated[:10]
            ]
        },
        'projects_created': {
            'count': projects_created.count(),
            'items': [
                {
                    'id': proj.id,
                    'title': proj.title,
                    'status': proj.status,
                    'created_by': proj.created_by.full_name
                }
                for proj in projects_created
            ]
        },
        'overdue_tasks': {
            'count': overdue_tasks.count(),
            'items': [
                {
                    'id': task.id,
                    'title': task.title,
                    'project': task.project.title,
                    'assignee': task.assignee.full_name if task.assignee else 'Unassigned',
                    'due_date': task.due_date.strftime('%Y-%m-%d') if task.due_date else None
                }
                for task in overdue_tasks[:10]
            ]
        }
    }
    
    return Response(summary_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Generate and download a comprehensive report"""
    report_type = request.query_params.get('type', 'summary')
    
    # Get all necessary data
    projects = Project.objects.all()
    tasks = Task.objects.select_related('project', 'assignee', 'institution').all()
    
    # Generate CSV report
    import csv
    from io import StringIO
    
    output = StringIO()
    writer = csv.writer(output)
    
    if report_type == 'summary':
        # Summary report
        writer.writerow(['Hesed Events Management System - Summary Report'])
        writer.writerow(['Generated on:', timezone.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow([])
        
        writer.writerow(['Project Statistics'])
        writer.writerow(['Total Projects', projects.count()])
        writer.writerow(['Active Projects', projects.filter(status='active').count()])
        writer.writerow(['Completed Projects', projects.filter(status='completed').count()])
        writer.writerow([])
        
        writer.writerow(['Task Statistics'])
        writer.writerow(['Total Tasks', tasks.count()])
        writer.writerow(['Completed Tasks', tasks.filter(status='completed').count()])
        writer.writerow(['In Progress Tasks', tasks.filter(status='in_progress').count()])
        writer.writerow(['Not Started Tasks', tasks.filter(status='initial').count()])
        writer.writerow(['Overdue Tasks', tasks.filter(due_date__lt=timezone.now(), status__in=['initial', 'in_progress']).count()])
        writer.writerow([])
        
    elif report_type == 'tasks':
        # Detailed tasks report
        writer.writerow(['Task ID', 'Title', 'Project', 'Assignee', 'Institution', 'Status', 'Progress', 'Due Date', 'Created', 'Updated'])
        for task in tasks:
            writer.writerow([
                task.id,
                task.title,
                task.project.title,
                task.assignee.full_name if task.assignee else 'Unassigned',
                task.institution.name if task.institution else 'N/A',
                task.get_status_display(),
                f"{task.progress}%",
                task.due_date.strftime('%Y-%m-%d') if task.due_date else 'No deadline',
                task.created_at.strftime('%Y-%m-%d'),
                task.updated_at.strftime('%Y-%m-%d')
            ])
    
    elif report_type == 'projects':
        # Detailed projects report
        writer.writerow(['Project ID', 'Title', 'Status', 'Created By', 'Start Date', 'End Date', 'Total Tasks', 'Completed', 'In Progress', 'Completion %'])
        for project in projects:
            writer.writerow([
                project.id,
                project.title,
                project.get_status_display(),
                project.created_by.full_name,
                project.start_date.strftime('%Y-%m-%d') if project.start_date else 'N/A',
                project.end_date.strftime('%Y-%m-%d') if project.end_date else 'N/A',
                project.total_tasks,
                project.completed_tasks,
                project.in_progress_tasks,
                f"{project.completion_percentage}%"
            ])
    
    # Create response
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="hesed_events_report_{report_type}_{timezone.now().strftime("%Y%m%d")}.csv"'
    
    return response
