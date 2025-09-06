from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError


class Branch(models.Model):
    PROPERTY_TYPE_CHOICES = [
        ('ladies_hostel', 'Ladies Hostel'),
        ('mens_hostel', 'Mens Hostel'),
        ('mixed_hostel', 'Mixed Hostel'),
        ('guest_house', 'Guest House'),
        ('pg', 'Paying Guest'),
    ]
    
    name = models.CharField(max_length=100, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=50, null=True, blank=True)
    state = models.CharField(max_length=50, null=True, blank=True)
    pincode = models.CharField(max_length=10, null=True, blank=True)
    description = models.TextField(blank=True)
    
    # Contact Information
    contact_phone = models.CharField(max_length=15, blank=True)
    contact_email = models.EmailField(blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)
    
    # Property Details
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES, default='ladies_hostel')
    total_floors = models.IntegerField(default=1)
    num_rooms = models.IntegerField(null=True, blank=True)
    num_bathrooms = models.IntegerField(null=True, blank=True)
    
    # Features and Amenities
    has_parking = models.BooleanField(default=False)
    has_wifi = models.BooleanField(default=False)
    has_ac = models.BooleanField(default=False)
    has_laundry = models.BooleanField(default=False)
    has_security = models.BooleanField(default=False)
    has_mess = models.BooleanField(default=False)
    amenities = models.TextField(blank=True)
    rules_and_regulations = models.TextField(blank=True)
    nearby_facilities = models.TextField(blank=True)
    
    # Administrative
    established_date = models.DateField(null=True, blank=True)
    established_year = models.IntegerField(null=True, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Owner relationship for role-based access control
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='owned_branches',
        null=True, blank=True
    )

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Branches"

class Room(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='rooms')
    room_name = models.CharField(max_length=50, null=True, blank=True)
    sharing_type = models.IntegerField(
        choices=[
            (1, '1-Sharing'), (2, '2-Sharing'), (3, '3-Sharing'), 
            (4, '4-Sharing'), (5, '5-Sharing'), (6, '6-Sharing'), 
            (7, '7-Sharing'), (8, '8-Sharing')
        ],
        null=True, blank=True
    )
    attached_bath = models.BooleanField(default=False)
    ac_room = models.BooleanField(default=False)
    rent = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    floor_number = models.IntegerField(default=1)
    room_size_sqft = models.IntegerField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.room_name} ({self.branch.name})"
    
    @property
    def current_occupancy(self):
        """Get current number of tenants in this room who have joined"""
        return self.tenants.filter(joining_date__isnull=False, vacating_date__isnull=True).count()
    
    @property
    def is_full(self):
        """Check if room is at maximum capacity"""
        if not self.sharing_type:
            return False
        return self.current_occupancy >= self.sharing_type
    
    @property
    def status(self):
        """Calculate room status based on availability and occupancy"""
        if not self.is_available:
            return 'maintenance'
        elif self.current_occupancy == 0:
            return 'available'
        elif self.is_full:
            return 'occupied'
        else:
            return 'available'
    
    def update_availability(self):
        """Update room availability based on current occupancy"""
        # If room is at maximum capacity, it should still be marked as available
        # but the status property will show it as 'occupied'
        # Only mark as unavailable for maintenance purposes
        pass
    
    def save(self, *args, **kwargs):
        """Override save to update availability based on occupancy"""
        super().save(*args, **kwargs)
        # Update availability after saving
        self.update_availability()
    
    class Meta:
        unique_together = ['branch', 'room_name']

class Tenant(models.Model):
    STAY_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('monthly', 'Monthly'),
    ]
    
    ID_PROOF_CHOICES = [
        ('aadhar', 'Aadhar Card'),
        ('voter_id', 'Voter ID'),
        ('driving_license', 'Driving License'),
        ('passport', 'Passport'),
        ('pan_card', 'PAN Card'),
    ]
    
    # Link to user account for tenant login
    user = models.OneToOneField(
        User, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='tenant_profile'
    )
    
    name = models.CharField(max_length=100, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(blank=True)
    emergency_contact_name = models.CharField(max_length=100, null=True, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, null=True, blank=True)
    
    stay_type = models.CharField(max_length=10, choices=STAY_TYPE_CHOICES, null=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    vacating_date = models.DateField(null=True, blank=True)
    room = models.ForeignKey(
        Room, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='tenants'
    )
    
    # ID proof information
    id_proof_type = models.CharField(max_length=20, choices=ID_PROOF_CHOICES, null=True, blank=True)
    id_proof_number = models.CharField(max_length=50, null=True, blank=True)
    
    # Track who created this tenant record
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_tenants'
    )
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Validate room capacity before saving
        if self.room and self.room.sharing_type:
            # Count current active tenants in this room (vacating_date is null)
            current_count = Tenant.objects.filter(
                room=self.room,
                vacating_date__isnull=True
            ).exclude(pk=self.pk).count()

            max_capacity = self.room.sharing_type

            if current_count >= max_capacity:
                raise ValidationError(f"Room '{self.room.room_name}' has reached its capacity of {max_capacity} tenants.")

        # Save the tenant
        super().save(*args, **kwargs)

        # RoomOccupancy logic
        if self.vacating_date and self.vacating_date <= timezone.now().date():
            RoomOccupancy.objects.filter(tenant=self).delete()
        elif not self.vacating_date and self.room:
            occupancy, created = RoomOccupancy.objects.get_or_create(
                tenant=self,
                defaults={'room': self.room, 'start_date': self.joining_date}
            )
            if not created:
                occupancy.room = self.room
                occupancy.start_date = self.joining_date
                occupancy.end_date = None
                occupancy.save()
        
        # Update room status after tenant changes
        if self.room:
            self.room.update_availability()
    
    def delete(self, *args, **kwargs):
        """Override delete to update room status"""
        room = self.room
        super().delete(*args, **kwargs)
        # Update room status after tenant is deleted
        if room:
            room.update_availability()
    
    class Meta:
        ordering = ['-created_at']

class RoomOccupancy(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='occupancies')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='occupancies')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    monthly_rent_agreed = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    security_deposit = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='room_occupancies_created'
    )

    def __str__(self):
        return f"{self.tenant.name} - {self.room.room_name}"
    
    class Meta:
        ordering = ['-start_date']
        unique_together = ['room', 'tenant', 'start_date']


class RentPayment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('cheque', 'Cheque'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateField()
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2)
    for_month = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    collected_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='rent_payments_collected'
    )

    def __str__(self):
        return f"{self.tenant.name} - {self.for_month.strftime('%B %Y')} - ₹{self.amount_paid}"
    
    class Meta:
        ordering = ['-payment_date']
        unique_together = ['tenant', 'for_month']

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Property Owner'),
        ('warden', 'Warden'),
        ('tenant', 'Tenant'),
        ('admin', 'Admin'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='owner')
    phone_number = models.CharField(max_length=15, blank=True)
    
    # Firebase integration
    firebase_uid = models.CharField(max_length=128, blank=True, null=True, unique=True)
    phone_verified = models.BooleanField(default=False)
    
    # Business information for owners
    business_name = models.CharField(max_length=200, blank=True, null=True)
    business_license = models.CharField(max_length=100, blank=True, null=True)
    
    # Legacy branch field (will be deprecated in favor of ownership/assignment models)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
    
    class Meta:
        ordering = ['-created_at']


class WardenAssignment(models.Model):
    """Model to manage warden assignments to specific branches"""
    warden = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='warden_assignments'
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='warden_assignments'
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='warden_assignments_made'
    )
    assigned_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Permissions for this warden on this branch
    can_manage_rooms = models.BooleanField(default=True)
    can_manage_tenants = models.BooleanField(default=True)
    can_view_payments = models.BooleanField(default=True)
    can_collect_payments = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.warden.get_full_name()} -> {self.branch.name}"
    
    class Meta:
        unique_together = ['warden', 'branch']
        ordering = ['-assigned_date']


class TenantRequest(models.Model):
    """Model for tenant requests, complaints, and maintenance issues"""
    REQUEST_TYPE_CHOICES = [
        ('maintenance', 'Maintenance Request'),
        ('complaint', 'Complaint'),
        ('service', 'Service Request'),
        ('payment', 'Payment Issue'),
        ('other', 'Other'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='requests'
    )
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_requests'
    )
    
    response_notes = models.TextField(blank=True)
    resolution_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tenant.name} - {self.title}"
    
    class Meta:
        ordering = ['-created_at']


class BranchPermission(models.Model):
    """Granular permissions for users on specific branches"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='branch_permissions'
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='permissions'
    )
    
    # Permission flags
    can_view_branch = models.BooleanField(default=True)
    can_edit_branch = models.BooleanField(default=False)
    can_manage_rooms = models.BooleanField(default=False)
    can_manage_tenants = models.BooleanField(default=False)
    can_view_payments = models.BooleanField(default=False)
    can_collect_payments = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_assign_wardens = models.BooleanField(default=False)
    
    granted_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='permissions_granted'
    )
    granted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} permissions on {self.branch.name}"
    
    class Meta:
        unique_together = ['user', 'branch']
        ordering = ['-granted_at']
