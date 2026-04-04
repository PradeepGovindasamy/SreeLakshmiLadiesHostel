from django.contrib import admin
from .models import Worker, WorkerAttendance, WorkerSalary, WorkerLeave


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ['name', 'worker_type', 'branch', 'status', 'salary', 'joining_date']
    list_filter = ['worker_type', 'status', 'employment_type', 'branch']
    search_fields = ['name', 'phone_number', 'email']
    date_hierarchy = 'joining_date'


@admin.register(WorkerAttendance)
class WorkerAttendanceAdmin(admin.ModelAdmin):
    list_display = ['worker', 'date', 'status', 'check_in_time', 'check_out_time']
    list_filter = ['status', 'date']
    search_fields = ['worker__name']
    date_hierarchy = 'date'


@admin.register(WorkerSalary)
class WorkerSalaryAdmin(admin.ModelAdmin):
    list_display = ['worker', 'month', 'amount', 'net_amount', 'payment_status', 'payment_date']
    list_filter = ['payment_status', 'month']
    search_fields = ['worker__name']
    date_hierarchy = 'month'


@admin.register(WorkerLeave)
class WorkerLeaveAdmin(admin.ModelAdmin):
    list_display = ['worker', 'leave_type', 'start_date', 'end_date', 'total_days', 'status']
    list_filter = ['status', 'leave_type', 'start_date']
    search_fields = ['worker__name', 'reason']
    date_hierarchy = 'start_date'
