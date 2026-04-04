from rest_framework import serializers
from .models import Worker, WorkerAttendance, WorkerSalary, WorkerLeave


class WorkerSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    worker_type_display = serializers.CharField(source='get_worker_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Worker
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class WorkerAttendanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = WorkerAttendance
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class WorkerSalarySerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)
    status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = WorkerSalary
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'net_amount']


class WorkerLeaveSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_days = serializers.ReadOnlyField()
    
    class Meta:
        model = WorkerLeave
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'approval_date']
