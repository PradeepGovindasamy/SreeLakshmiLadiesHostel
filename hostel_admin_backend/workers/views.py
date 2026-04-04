from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Worker, WorkerAttendance, WorkerSalary, WorkerLeave
from .serializers import (
    WorkerSerializer, WorkerAttendanceSerializer,
    WorkerSalarySerializer, WorkerLeaveSerializer
)


class WorkerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing workers
    """
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'worker_type', 'status', 'employment_type']
    search_fields = ['name', 'phone_number', 'email']
    ordering_fields = ['name', 'joining_date', 'created_at']
    ordering = ['-created_at']


class WorkerAttendanceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing worker attendance
    """
    queryset = WorkerAttendance.objects.all()
    serializer_class = WorkerAttendanceSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['worker', 'date', 'status']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']


class WorkerSalaryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing worker salaries
    """
    queryset = WorkerSalary.objects.all()
    serializer_class = WorkerSalarySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['worker', 'month', 'payment_status']
    ordering_fields = ['month', 'created_at']
    ordering = ['-month']


class WorkerLeaveViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing worker leave requests
    """
    queryset = WorkerLeave.objects.all()
    serializer_class = WorkerLeaveSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['worker', 'status', 'leave_type']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
