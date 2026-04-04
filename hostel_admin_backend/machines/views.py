from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import MachineCategory, Machine, MaintenanceRecord, MachineIssue, MachineUsageLog
from .serializers import (
    MachineCategorySerializer, MachineSerializer, MaintenanceRecordSerializer,
    MachineIssueSerializer, MachineUsageLogSerializer
)


class MachineCategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing machine categories
    """
    queryset = MachineCategory.objects.all()
    serializer_class = MachineCategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['name']


class MachineViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing machines and equipment
    """
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'category', 'status', 'condition']
    search_fields = ['name', 'brand', 'model_number', 'serial_number', 'location']
    ordering_fields = ['name', 'purchase_date', 'next_service_date', 'created_at']
    ordering = ['-created_at']


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing maintenance records
    """
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['machine', 'maintenance_type', 'status', 'scheduled_date']
    ordering_fields = ['scheduled_date', 'completed_date', 'created_at']
    ordering = ['-scheduled_date']


class MachineIssueViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing machine issues
    """
    queryset = MachineIssue.objects.all()
    serializer_class = MachineIssueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['machine', 'status', 'severity', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['reported_date', 'severity']
    ordering = ['-reported_date']


class MachineUsageLogViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking machine usage
    """
    queryset = MachineUsageLog.objects.all()
    serializer_class = MachineUsageLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['machine', 'used_by', 'start_time']
    ordering_fields = ['start_time', 'created_at']
    ordering = ['-start_time']
