from rest_framework import serializers
from .models import Institution

class InstitutionSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.ReadOnlyField()
    total_tasks = serializers.ReadOnlyField()
    completed_tasks = serializers.ReadOnlyField()
    completion_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Institution
        fields = [
            'id', 'name', 'description', 'supervisor', 'supervisor_name',
            'address', 'phone', 'email', 'is_active', 'total_tasks',
            'completed_tasks', 'completion_rate', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
