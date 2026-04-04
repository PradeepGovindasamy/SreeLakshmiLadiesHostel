from django.db import models
from django.contrib.auth.models import User
from core.models import Branch
from django.utils import timezone


class MachineCategory(models.Model):
    """Categories for machines and equipment"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Machine Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Machine(models.Model):
    """Machines and equipment in the hostel"""
    
    STATUS_CHOICES = [
        ('operational', 'Operational'),
        ('under_maintenance', 'Under Maintenance'),
        ('out_of_order', 'Out of Order'),
        ('retired', 'Retired'),
    ]
    
    CONDITION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=200)
    category = models.ForeignKey(MachineCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='machines')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='machines')
    
    # Details
    brand = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True, unique=True)
    
    # Location
    location = models.CharField(max_length=200, help_text="Room/Floor/Area where machine is located")
    
    # Purchase Details
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    vendor = models.CharField(max_length=200, blank=True)
    
    # Warranty Information
    warranty_start_date = models.DateField(null=True, blank=True)
    warranty_end_date = models.DateField(null=True, blank=True)
    warranty_terms = models.TextField(blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='operational')
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    
    # Specifications
    specifications = models.TextField(blank=True, help_text="Technical specifications")
    capacity = models.CharField(max_length=100, blank=True, help_text="e.g., 7kg for washing machine")
    power_rating = models.CharField(max_length=100, blank=True, help_text="e.g., 1500W")
    
    # Maintenance
    last_service_date = models.DateField(null=True, blank=True)
    next_service_date = models.DateField(null=True, blank=True)
    service_frequency_days = models.IntegerField(default=90, help_text="Service frequency in days")
    
    # Additional Information
    photo = models.ImageField(upload_to='machines/', null=True, blank=True)
    manual_document = models.FileField(upload_to='machine_manuals/', null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['branch', 'status']),
            models.Index(fields=['category', 'status']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.branch.name}"
    
    @property
    def is_under_warranty(self):
        """Check if machine is still under warranty"""
        if self.warranty_end_date:
            return timezone.now().date() <= self.warranty_end_date
        return False
    
    @property
    def is_service_due(self):
        """Check if service is due"""
        if self.next_service_date:
            return timezone.now().date() >= self.next_service_date
        return False


class MaintenanceRecord(models.Model):
    """Record of maintenance activities"""
    
    MAINTENANCE_TYPE_CHOICES = [
        ('routine', 'Routine Maintenance'),
        ('repair', 'Repair'),
        ('inspection', 'Inspection'),
        ('emergency', 'Emergency'),
        ('installation', 'Installation'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='maintenance_records')
    maintenance_type = models.CharField(max_length=20, choices=MAINTENANCE_TYPE_CHOICES)
    
    # Scheduling
    scheduled_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    
    # Details
    description = models.TextField(help_text="Description of work to be done")
    work_done = models.TextField(blank=True, help_text="Description of work completed")
    
    # Service Provider
    technician_name = models.CharField(max_length=100, blank=True)
    service_company = models.CharField(max_length=200, blank=True)
    service_company_phone = models.CharField(max_length=15, blank=True)
    
    # Cost
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    parts_replaced = models.TextField(blank=True, help_text="List of parts replaced")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    # Documentation
    invoice_number = models.CharField(max_length=100, blank=True)
    invoice_document = models.FileField(upload_to='maintenance_invoices/', null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['machine', 'scheduled_date']),
            models.Index(fields=['status', 'scheduled_date']),
        ]
    
    def __str__(self):
        return f"{self.machine.name} - {self.get_maintenance_type_display()} - {self.scheduled_date}"


class MachineIssue(models.Model):
    """Track issues/complaints about machines"""
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='issues')
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Dates
    reported_date = models.DateTimeField(auto_now_add=True)
    resolved_date = models.DateTimeField(null=True, blank=True)
    
    # Reporter
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reported_machine_issues')
    
    # Assignment
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_machine_issues')
    
    # Resolution
    resolution = models.TextField(blank=True, help_text="How the issue was resolved")
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-reported_date']
        indexes = [
            models.Index(fields=['machine', 'status']),
            models.Index(fields=['status', 'severity']),
        ]
    
    def __str__(self):
        return f"{self.machine.name} - {self.title} ({self.status})"
    
    @property
    def resolution_time(self):
        """Calculate time taken to resolve the issue"""
        if self.resolved_date:
            return (self.resolved_date - self.reported_date).days
        return None


class MachineUsageLog(models.Model):
    """Track usage of machines (optional - for coin-operated or scheduled equipment)"""
    
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='usage_logs')
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    
    # For coin-operated machines
    cost = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['machine', 'start_time']),
        ]
    
    def __str__(self):
        return f"{self.machine.name} - {self.start_time}"
    
    def save(self, *args, **kwargs):
        # Calculate duration automatically
        if self.end_time and self.start_time:
            duration = (self.end_time - self.start_time).total_seconds() / 60
            self.duration_minutes = int(duration)
        super().save(*args, **kwargs)
