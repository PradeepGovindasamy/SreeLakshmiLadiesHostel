# Proposed Enhanced Models for Role-Based Access Control

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError

class UserProfile(models.Model):
    """Enhanced user profile with comprehensive role system"""
    ROLE_CHOICES = (
        ('owner', 'Property Owner'),      # Can create/manage multiple properties
        ('warden', 'Property Warden'),    # Manages specific property for owner
        ('tenant', 'Tenant'),             # Resides in property, limited access
        ('admin', 'System Admin'),        # Full system access (optional)
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Owner-specific fields
    business_name = models.CharField(max_length=200, blank=True, null=True)  # For owners
    business_license = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
    
    class Meta:
        db_table = 'core_userprofile'


class Branch(models.Model):
    """Enhanced branch with ownership tracking"""
    name = models.CharField(max_length=100)
    address = models.TextField()
    num_rooms = models.IntegerField()
    num_bathrooms = models.IntegerField()
    
    # NEW: Ownership and management
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='owned_branches',
        help_text="Property owner who created this branch"
    )
    
    # Branch metadata
    description = models.TextField(blank=True, null=True)
    established_date = models.DateField(blank=True, null=True)
    contact_phone = models.CharField(max_length=15, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} (Owner: {self.owner.username})"
    
    class Meta:
        db_table = 'core_branch'


class WardenAssignment(models.Model):
    """NEW: Explicit warden-to-branch assignment with permissions"""
    warden = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        limit_choices_to={'userprofile__role': 'warden'},
        related_name='warden_assignments'
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='wardens')
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='warden_assignments_made',
        help_text="Owner who assigned this warden"
    )
    
    # Assignment details
    assigned_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    
    # Permissions for this warden at this branch
    can_manage_rooms = models.BooleanField(default=True)
    can_manage_tenants = models.BooleanField(default=True)
    can_view_payments = models.BooleanField(default=True)
    can_collect_payments = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'core_warden_assignment'
        unique_together = ['warden', 'branch']  # One assignment per warden per branch
    
    def __str__(self):
        return f"{self.warden.username} → {self.branch.name}"


class Room(models.Model):
    """Room model with enhanced tracking"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='rooms')
    room_name = models.CharField(max_length=50)
    sharing_type = models.IntegerField(
        choices=[(i, f'{i}-Sharing') for i in range(1, 8)]
    )
    attached_bath = models.BooleanField(default=False)
    ac_room = models.BooleanField(default=False)
    rent = models.DecimalField(max_digits=8, decimal_places=2)
    
    # NEW: Room status and metadata
    is_available = models.BooleanField(default=True)
    floor_number = models.IntegerField(blank=True, null=True)
    room_size_sqft = models.IntegerField(blank=True, null=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.room_name} ({self.branch.name})"
    
    @property
    def current_occupancy(self):
        return self.tenants.filter(vacating_date__isnull=True).count()
    
    @property
    def is_full(self):
        return self.current_occupancy >= self.sharing_type
    
    class Meta:
        db_table = 'core_room'


class Tenant(models.Model):
    """Enhanced tenant with user account linkage"""
    # Link to user account (NEW)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='tenant_profile',
        help_text="User account for tenant self-service portal"
    )
    
    # Tenant information
    name = models.CharField(max_length=100)
    address = models.TextField()
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    
    # Tenancy details
    stay_type = models.CharField(
        max_length=10, 
        choices=[('daily', 'Daily'), ('monthly', 'Monthly')]
    )
    joining_date = models.DateField()
    vacating_date = models.DateField(null=True, blank=True)
    room = models.ForeignKey(
        Room, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='tenants'
    )
    
    # Security and identification
    id_proof_type = models.CharField(
        max_length=20,
        choices=[
            ('aadhar', 'Aadhar Card'),
            ('passport', 'Passport'),
            ('driving_license', 'Driving License'),
            ('voter_id', 'Voter ID'),
        ],
        blank=True, null=True
    )
    id_proof_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_tenants',
        help_text="Warden/Owner who created this tenant record"
    )
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Validate room capacity
        if self.room and not self.vacating_date:
            current_count = Tenant.objects.filter(
                room=self.room,
                vacating_date__isnull=True
            ).exclude(pk=self.pk).count()
            
            if current_count >= self.room.sharing_type:
                raise ValidationError(
                    f"Room '{self.room.room_name}' has reached its capacity of {self.room.sharing_type} tenants."
                )
        
        super().save(*args, **kwargs)
        
        # Auto-create user account if not exists and email provided
        if not self.user and self.email:
            try:
                # Create user account for tenant portal access
                username = f"tenant_{self.pk}_{self.phone_number[-4:]}"
                user = User.objects.create_user(
                    username=username,
                    email=self.email,
                    first_name=self.name.split()[0] if self.name else '',
                    last_name=' '.join(self.name.split()[1:]) if len(self.name.split()) > 1 else ''
                )
                
                # Create tenant user profile
                UserProfile.objects.create(user=user, role='tenant')
                
                self.user = user
                super().save(update_fields=['user'])
            except Exception as e:
                # Log error but don't fail tenant creation
                pass
    
    class Meta:
        db_table = 'core_tenant'


class TenantRequest(models.Model):
    """NEW: System for tenants to submit requests/complaints"""
    REQUEST_TYPES = (
        ('maintenance', 'Maintenance Request'),
        ('complaint', 'Complaint'),
        ('payment_inquiry', 'Payment Inquiry'),
        ('room_change', 'Room Change Request'),
        ('early_checkout', 'Early Checkout'),
        ('extension', 'Stay Extension'),
        ('other', 'Other'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Status tracking
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_requests',
        help_text="Warden assigned to handle this request"
    )
    
    # Response tracking
    response_notes = models.TextField(blank=True, null=True)
    resolution_date = models.DateTimeField(blank=True, null=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'core_tenant_request'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tenant.name} - {self.title}"


class RoomOccupancy(models.Model):
    """Enhanced occupancy tracking"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='occupancies')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='occupancies')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # NEW: Occupancy details
    monthly_rent_agreed = models.DecimalField(max_digits=8, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_occupancies'
    )
    
    def __str__(self):
        return f"{self.tenant.name} - {self.room.room_name}"
    
    class Meta:
        db_table = 'core_room_occupancy'


class RentPayment(models.Model):
    """Enhanced payment tracking"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateField()
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2)
    for_month = models.DateField()
    
    # NEW: Payment details
    payment_method = models.CharField(
        max_length=20,
        choices=[
            ('cash', 'Cash'),
            ('bank_transfer', 'Bank Transfer'),
            ('upi', 'UPI'),
            ('cheque', 'Cheque'),
            ('card', 'Card'),
        ],
        default='cash'
    )
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    collected_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='collected_payments',
        help_text="Warden/Owner who collected this payment"
    )
    
    class Meta:
        db_table = 'core_rent_payment'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"{self.tenant.name} - ₹{self.amount_paid} for {self.for_month.strftime('%B %Y')}"


# NEW: Property-level permissions and access control
class BranchPermission(models.Model):
    """Granular permissions for branch access"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    
    # Permission flags
    can_view_branch = models.BooleanField(default=True)
    can_edit_branch = models.BooleanField(default=False)
    can_manage_rooms = models.BooleanField(default=False)
    can_manage_tenants = models.BooleanField(default=False)
    can_view_payments = models.BooleanField(default=False)
    can_collect_payments = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_assign_wardens = models.BooleanField(default=False)
    
    # Audit
    granted_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='granted_permissions'
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'core_branch_permission'
        unique_together = ['user', 'branch']
