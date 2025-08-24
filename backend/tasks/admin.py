from django.contrib import admin
from .models import Task, TaskComment, TaskEvidence

class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 0
    readonly_fields = ('created_at',)

class TaskEvidenceInline(admin.TabularInline):
    model = TaskEvidence
    extra = 0
    readonly_fields = ('uploaded_at',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'assignee_name', 'institution_name', 'status', 'progress', 'due_date', 'updated_at')
    list_filter = ('status', 'institution', 'project', 'created_at')
    search_fields = ('title', 'description', 'assignee__username', 'project__title')
    ordering = ('-updated_at',)
    readonly_fields = ('assignee_name', 'institution_name', 'is_overdue', 'created_at', 'updated_at')
    inlines = [TaskCommentInline, TaskEvidenceInline]

@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'author', 'created_at')
    list_filter = ('created_at', 'author')
    search_fields = ('content', 'task__title', 'author__username')
    ordering = ('-created_at',)

@admin.register(TaskEvidence)
class TaskEvidenceAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'task', 'file_type', 'uploaded_by', 'uploaded_at')
    list_filter = ('file_type', 'uploaded_at')
    search_fields = ('file_name', 'description', 'task__title')
    ordering = ('-uploaded_at',)
