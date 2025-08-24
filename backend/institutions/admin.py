from django.contrib import admin
from .models import Institution

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('name', 'supervisor', 'supervisor_name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'supervisor__username', 'supervisor__first_name', 'supervisor__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('total_tasks', 'completed_tasks', 'completion_rate', 'created_at', 'updated_at')
