from django.contrib import admin
from .models import MachineCategory, Machine, MaintenanceRecord, MachineIssue, MachineUsageLog


@admin.register(MachineCategory)
class MachineCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'branch', 'status', 'condition', 'location', 'is_under_warranty', 'is_service_due']
    list_filter = ['status', 'condition', 'category', 'branch']
    search_fields = ['name', 'brand', 'model_number', 'serial_number']
    date_hierarchy = 'purchase_date'
    readonly_fields = ['is_under_warranty', 'is_service_due']


@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ['machine', 'maintenance_type', 'scheduled_date', 'completed_date', 'status', 'cost']
    list_filter = ['maintenance_type', 'status', 'scheduled_date']
    search_fields = ['machine__name', 'technician_name', 'service_company']
    date_hierarchy = 'scheduled_date'


@admin.register(MachineIssue)
class MachineIssueAdmin(admin.ModelAdmin):
    list_display = ['machine', 'title', 'severity', 'status', 'reported_date', 'assigned_to', 'resolution_time']
    list_filter = ['severity', 'status', 'reported_date']
    search_fields = ['machine__name', 'title', 'description']
    date_hierarchy = 'reported_date'
    readonly_fields = ['resolution_time']


@admin.register(MachineUsageLog)
class MachineUsageLogAdmin(admin.ModelAdmin):
    list_display = ['machine', 'used_by', 'start_time', 'end_time', 'duration_minutes', 'cost']
    list_filter = ['machine', 'start_time']
    search_fields = ['machine__name', 'used_by__username']
    date_hierarchy = 'start_time'
