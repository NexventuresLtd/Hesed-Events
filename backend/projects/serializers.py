from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    total_tasks = serializers.ReadOnlyField()
    completed_tasks = serializers.ReadOnlyField()
    in_progress_tasks = serializers.ReadOnlyField()
    initial_tasks = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    is_sub_activity = serializers.ReadOnlyField()
    parent_project_title = serializers.CharField(source='parent_project.title', read_only=True)
    sub_activities = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status', 'created_by', 'created_by_name',
            'parent_project', 'parent_project_title', 'is_sub_activity', 'sub_activities',
            'start_date', 'end_date', 'budget', 'total_tasks', 'completed_tasks',
            'in_progress_tasks', 'initial_tasks', 'completion_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_sub_activities(self, obj):
        if obj.sub_activities.exists():
            return ProjectSerializer(obj.sub_activities.all(), many=True, context=self.context).data
        return []

class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'status', 'parent_project', 'start_date', 'end_date', 'budget'
        ]
