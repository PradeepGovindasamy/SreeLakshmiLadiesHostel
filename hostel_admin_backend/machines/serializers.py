from rest_framework import serializers
from .models import MachineCategory, Machine, MaintenanceRecord, MachineIssue, MachineUsageLog


class MachineCategorySerializer(serializers.ModelSerializer):
    machines_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MachineCategory
        fields = '__all__'
    
    def get_machines_count(self, obj):
        return obj.machines.count()


class MachineSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    is_under_warranty = serializers.ReadOnlyField()
    is_service_due = serializers.ReadOnlyField()
    
    class Meta:
        model = Machine
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    maintenance_type_display = serializers.CharField(source='get_maintenance_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = MaintenanceRecord
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class MachineIssueSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    resolution_time = serializers.ReadOnlyField()
    
    class Meta:
        model = MachineIssue
        fields = '__all__'
        read_only_fields = ['reported_date', 'updated_at']


class MachineUsageLogSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    used_by_name = serializers.CharField(source='used_by.username', read_only=True)
    
    class Meta:
        model = MachineUsageLog
        fields = '__all__'
        read_only_fields = ['created_at', 'duration_minutes']
