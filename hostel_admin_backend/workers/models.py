from django.db import models
from django.contrib.auth.models import User
from core.models import Branch


class Worker(models.Model):
    """Model for managing hostel staff and workers"""
    
    WORKER_TYPE_CHOICES = [
        ('caretaker', 'Caretaker'),
        ('cleaning', 'Cleaning Staff'),
        ('security', 'Security Guard'),
        ('cook', 'Cook'),
        ('maintenance', 'Maintenance Staff'),
        ('manager', 'Branch Manager'),
        ('other', 'Other'),
    ]
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('resigned', 'Resigned'),
        ('terminated', 'Terminated'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField()
    date_of_birth = models.DateField(null=True, blank=True)
    
    # ID Proof
    id_proof_type = models.CharField(max_length=50)
    id_proof_number = models.CharField(max_length=50)
    
    # Employment Details
    worker_type = models.CharField(max_length=20, choices=WORKER_TYPE_CHOICES)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='workers')
    joining_date = models.DateField()
    leaving_date = models.DateField(null=True, blank=True)
    
    # Salary Information
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    salary_frequency = models.CharField(
        max_length=20, 
        choices=[('monthly', 'Monthly'), ('daily', 'Daily'), ('hourly', 'Hourly')],
        default='monthly'
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=15)
    emergency_contact_relation = models.CharField(max_length=50)
    
    # Additional Information
    photo = models.ImageField(upload_to='workers/', null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['branch', 'status']),
            models.Index(fields=['worker_type']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.get_worker_type_display()}"


class WorkerAttendance(models.Model):
    """Track daily attendance of workers"""
    
    ATTENDANCE_STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('leave', 'On Leave'),
    ]
    
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS_CHOICES)
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['worker', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['worker', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.worker.name} - {self.date} - {self.status}"


class WorkerSalary(models.Model):
    """Track salary payments to workers"""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partial', 'Partial'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('cheque', 'Cheque'),
    ]
    
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='salary_records')
    month = models.DateField(help_text="First day of the month")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['worker', 'month']
        ordering = ['-month']
        indexes = [
            models.Index(fields=['worker', 'month']),
            models.Index(fields=['payment_status']),
        ]
    
    def __str__(self):
        return f"{self.worker.name} - {self.month.strftime('%B %Y')} - ₹{self.net_amount}"
    
    def save(self, *args, **kwargs):
        # Calculate net amount automatically
        self.net_amount = self.amount - self.deductions + self.bonus
        super().save(*args, **kwargs)


class WorkerLeave(models.Model):
    """Track leave requests and approvals"""
    
    LEAVE_TYPE_CHOICES = [
        ('sick', 'Sick Leave'),
        ('casual', 'Casual Leave'),
        ('earned', 'Earned Leave'),
        ('unpaid', 'Unpaid Leave'),
        ('emergency', 'Emergency Leave'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approval_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['worker', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.worker.name} - {self.leave_type} - {self.start_date} to {self.end_date}"
    
    @property
    def total_days(self):
        """Calculate total days of leave"""
        return (self.end_date - self.start_date).days + 1
