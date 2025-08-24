from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'created_by', 'total_tasks', 'completion_percentage', 'created_at')
    list_filter = ('status', 'created_at', 'created_by')
    search_fields = ('title', 'description', 'created_by__username')
    ordering = ('-created_at',)
    readonly_fields = ('total_tasks', 'completed_tasks', 'in_progress_tasks', 'initial_tasks', 'completion_percentage', 'created_at', 'updated_at')
