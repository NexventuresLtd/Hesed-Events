from rest_framework import serializers
from .models import Task, TaskComment, TaskEvidence

class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'content', 'author', 'author_name', 'author_role', 'created_at']
        read_only_fields = ['id', 'created_at']

class TaskEvidenceSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    
    class Meta:
        model = TaskEvidence
        fields = [
            'id', 'file_name', 'file_url', 'file', 'file_type', 
            'description', 'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at']

class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.ReadOnlyField()
    institution_name = serializers.ReadOnlyField()
    project_title = serializers.CharField(source='project.title', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    comments = TaskCommentSerializer(many=True, read_only=True)
    evidence = TaskEvidenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_title', 'title', 'description', 
            'assignee', 'assignee_name', 'institution', 'institution_name',
            'status', 'progress', 'due_date', 'is_overdue', 'comments', 
            'evidence', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
