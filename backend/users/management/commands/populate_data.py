from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from institutions.models import Institution
from projects.models import Project
from tasks.models import Task, TaskComment, TaskEvidence
from chat.models import ChatMessage
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create users
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_superuser': True,
                'is_staff': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
        
        # Create institutions
        main_campus = Institution.objects.create(
            name='Main Campus',
            description='Primary institution',
            address='123 Main St',
            phone='555-0001',
            email='main@example.com'
        )
        
        north_branch = Institution.objects.create(
            name='North Branch',
            description='Northern branch office',
            address='456 North Ave',
            phone='555-0002',
            email='north@example.com'
        )
        
        # Create supervisors
        jane_supervisor, created = User.objects.get_or_create(
            username='jane',
            defaults={
                'email': 'jane@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'role': 'supervisor',
                'institution': main_campus
            }
        )
        if created:
            jane_supervisor.set_password('password123')
            jane_supervisor.save()
        
        bob_supervisor, created = User.objects.get_or_create(
            username='bob',
            defaults={
                'email': 'bob@example.com',
                'first_name': 'Bob',
                'last_name': 'Wilson',
                'role': 'supervisor',
                'institution': north_branch
            }
        )
        if created:
            bob_supervisor.set_password('password123')
            bob_supervisor.save()
        
        # Update institutions with supervisors
        main_campus.supervisor = jane_supervisor
        main_campus.save()
        
        north_branch.supervisor = bob_supervisor
        north_branch.save()
        
        # Create employees
        tom_employee, created = User.objects.get_or_create(
            username='tom',
            defaults={
                'email': 'tom@example.com',
                'first_name': 'Tom',
                'last_name': 'Green',
                'role': 'employee',
                'institution': main_campus
            }
        )
        if created:
            tom_employee.set_password('password123')
            tom_employee.save()
        
        sarah_employee, created = User.objects.get_or_create(
            username='sarah',
            defaults={
                'email': 'sarah@example.com',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'employee',
                'institution': north_branch
            }
        )
        if created:
            sarah_employee.set_password('password123')
            sarah_employee.save()
        
        # Create projects
        project1 = Project.objects.create(
            title='Community Outreach Program',
            description='Establishing community centers in underserved areas',
            created_by=admin_user,
            status='active',
            start_date=timezone.now().date()
        )
        
        # Create tasks
        task1 = Task.objects.create(
            project=project1,
            title='Site Assessment',
            description='Evaluate potential locations for community centers',
            assignee=tom_employee,
            institution=main_campus,
            status='completed',
            progress=100,
            due_date=timezone.now() + timedelta(days=30)
        )
        
        task2 = Task.objects.create(
            project=project1,
            title='Permit Applications',
            description='Submit necessary permits and documentation',
            assignee=sarah_employee,
            institution=north_branch,
            status='in_progress',
            progress=65,
            due_date=timezone.now() + timedelta(days=45)
        )
        
        # Create comments
        TaskComment.objects.create(
            task=task1,
            author=tom_employee,
            content='Site assessment completed. Found 3 viable locations.'
        )
        
        TaskComment.objects.create(
            task=task2,
            author=sarah_employee,
            content='Permits submitted to city planning office. Waiting for approval.'
        )
        
        # Create evidence
        TaskEvidence.objects.create(
            task=task1,
            file_name='site_assessment_report.pdf',
            file_type='document',
            description='Detailed site assessment report',
            uploaded_by=tom_employee
        )
        
        # Create chat messages
        ChatMessage.objects.create(
            sender=admin_user,
            content='Welcome everyone to the Hesed Events platform!',
            chat_type='group'
        )
        
        ChatMessage.objects.create(
            sender=jane_supervisor,
            recipient=tom_employee,
            content='Great work on the site assessment!',
            chat_type='private'
        )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data')
        )
