from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    total_tasks = serializers.ReadOnlyField()
    completed_tasks = serializers.ReadOnlyField()
    in_progress_tasks = serializers.ReadOnlyField()
    initial_tasks = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status', 'created_by', 'created_by_name',
            'start_date', 'end_date', 'budget', 'total_tasks', 'completed_tasks',
            'in_progress_tasks', 'initial_tasks', 'completion_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'status', 'start_date', 'end_date', 'budget'
        ]
