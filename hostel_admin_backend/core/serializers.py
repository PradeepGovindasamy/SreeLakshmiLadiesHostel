# Enhanced serializers for role-based access control
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Count, Q
from .models import (
    Branch, Room, Tenant, RoomOccupancy, RentPayment,
    UserProfile, WardenAssignment, TenantRequest, BranchPermission
)


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username']


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile with role information"""
    user = UserSerializer(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'role', 'role_display', 'phone_number',
            'business_name', 'business_license', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'role', 'created_at', 'updated_at']


class UserWithProfileSerializer(serializers.ModelSerializer):
    """Enhanced user serializer with profile information for user management"""
    profile = UserProfileSerializer(read_only=True)
    role = serializers.CharField(source='profile.role', read_only=True)
    role_display = serializers.CharField(source='profile.get_role_display', read_only=True)
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True)
    is_profile_active = serializers.BooleanField(source='profile.is_active', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'is_active', 
            'date_joined', 'last_login', 'profile', 'role', 'role_display', 
            'phone_number', 'is_profile_active'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class BranchSerializer(serializers.ModelSerializer):
    """Enhanced branch serializer with ownership and statistics"""
    owner = UserSerializer(read_only=True)
    owner_name = serializers.SerializerMethodField()
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    
    # Statistics (computed fields)
    total_rooms = serializers.SerializerMethodField()
    occupied_beds = serializers.SerializerMethodField()
    vacant_beds = serializers.SerializerMethodField()
    total_beds = serializers.SerializerMethodField()
    bed_occupancy_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = [
            # Basic Information
            'id', 'name', 'address', 'city', 'state', 'pincode', 'description',
            # Contact Information
            'contact_phone', 'contact_email', 'emergency_contact',
            # Property Details
            'property_type', 'property_type_display', 'total_floors', 'num_rooms', 'num_bathrooms',
            # Features and Amenities
            'has_parking', 'has_wifi', 'has_ac', 'has_laundry', 'has_security', 'has_mess',
            'amenities', 'rules_and_regulations', 'nearby_facilities',
            # Administrative
            'owner', 'owner_name', 'established_date', 'established_year', 
            'license_number', 'notes', 'is_active', 'created_at', 'updated_at',
            # Statistics
            'total_rooms', 'occupied_beds', 'vacant_beds', 'total_beds', 
            'bed_occupancy_rate'
        ]
        read_only_fields = [
            'id', 'owner_name', 'property_type_display', 'created_at', 'updated_at',
            'total_rooms', 'occupied_beds', 'vacant_beds', 'total_beds',
            'bed_occupancy_rate'
        ]
    
    def get_total_rooms(self, obj):
        return obj.rooms.count()
    
    def get_occupied_beds(self, obj):
        # Count total tenants across all rooms who have joining_date (active tenants)
        return obj.rooms.aggregate(
            total=Count('tenants', filter=Q(tenants__joining_date__isnull=False))
        )['total'] or 0
    
    def get_total_beds(self, obj):
        # Sum of sharing_type (capacity) across all rooms
        return sum(room.sharing_type or 0 for room in obj.rooms.all())
    
    def get_vacant_beds(self, obj):
        # Total beds minus occupied beds
        total_beds = self.get_total_beds(obj)
        occupied_beds = self.get_occupied_beds(obj)
        return total_beds - occupied_beds
    
    def get_bed_occupancy_rate(self, obj):
        total_beds = self.get_total_beds(obj)
        occupied_beds = self.get_occupied_beds(obj)
        return (occupied_beds / total_beds * 100) if total_beds > 0 else 0
    
    def get_owner_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return None


class RoomSerializer(serializers.ModelSerializer):
    """Enhanced room serializer with occupancy information"""
    branch_detail = BranchSerializer(source='branch', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    sharing_type_display = serializers.SerializerMethodField()
    current_occupancy = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    status = serializers.ReadOnlyField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'room_name', 'sharing_type', 'sharing_type_display',
            'branch', 'branch_detail', 'branch_name', 'attached_bath', 'ac_room',
            'rent', 'floor_number', 'room_size_sqft', 'is_available',
            'current_occupancy', 'is_full', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'branch_detail', 'branch_name', 'sharing_type_display',
            'current_occupancy', 'is_full', 'status', 'created_at', 'updated_at'
        ]
        # Remove write_only constraint from branch so it's included in read responses
    
    def get_sharing_type_display(self, obj):
        if obj.sharing_type:
            return f"{obj.sharing_type}-Sharing"
        return "Not specified"


class TenantSerializer(serializers.ModelSerializer):
    """Enhanced tenant serializer with room and user information"""
    user = UserSerializer(read_only=True)
    room_detail = RoomSerializer(source='room', read_only=True)
    room_display = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='room.branch.name', read_only=True)
    stay_type_display = serializers.CharField(source='get_stay_type_display', read_only=True)
    id_proof_type_display = serializers.CharField(source='get_id_proof_type_display', read_only=True)
    is_active = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'user', 'name', 'address', 'phone_number', 'email',
            'emergency_contact_name', 'emergency_contact_phone',
            'stay_type', 'stay_type_display', 'joining_date', 'vacating_date',
            'room', 'room_detail', 'room_display', 'branch_name',
            'id_proof_type', 'id_proof_type_display', 'id_proof_number',
            'is_active', 'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = [
            'id', 'user', 'room_detail', 'room_display', 'branch_name',
            'stay_type_display', 'id_proof_type_display', 'is_active',
            'created_at', 'updated_at', 'created_by_name'
        ]
        extra_kwargs = {
            'room': {'write_only': True},
            'created_by': {'write_only': True}
        }
    
    def get_room_display(self, obj):
        if obj.room and obj.room.branch:
            return f"{obj.room.room_name} - {obj.room.branch.name}"
        elif obj.room:
            return obj.room.room_name
        return "Not Assigned"
    
    def get_is_active(self, obj):
        return obj.vacating_date is None
    
    def validate(self, data):
        """Validate room capacity and assignment"""
        room = data.get('room')
        if room and room.sharing_type:
            # Count current tenants in this room (excluding this tenant if updating)
            current_tenant_count = Tenant.objects.filter(
                room=room, 
                vacating_date__isnull=True
            ).exclude(pk=self.instance.pk if self.instance else None).count()
            
            if current_tenant_count >= room.sharing_type:
                raise serializers.ValidationError({
                    "room": f"Room '{room.room_name}' is already full. "
                           f"Maximum capacity: {room.sharing_type}, "
                           f"Current occupants: {current_tenant_count}"
                })
        
        return data


class RoomOccupancySerializer(serializers.ModelSerializer):
    """Room occupancy history serializer"""
    room = RoomSerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    room_name = serializers.CharField(source='room.room_name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    branch_name = serializers.CharField(source='room.branch.name', read_only=True)
    duration_days = serializers.SerializerMethodField()
    is_current = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = RoomOccupancy
        fields = [
            'id', 'room', 'tenant', 'room_name', 'tenant_name', 'branch_name',
            'start_date', 'end_date', 'monthly_rent_agreed', 'security_deposit',
            'duration_days', 'is_current', 'created_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = [
            'id', 'room', 'tenant', 'room_name', 'tenant_name', 'branch_name',
            'duration_days', 'is_current', 'created_at', 'created_by', 'created_by_name'
        ]
        extra_kwargs = {
            'room': {'write_only': True},
            'tenant': {'write_only': True},
            'created_by': {'write_only': True}
        }
    
    def get_duration_days(self, obj):
        if obj.end_date:
            return (obj.end_date - obj.start_date).days
        else:
            from datetime import date
            return (date.today() - obj.start_date).days
    
    def get_is_current(self, obj):
        return obj.end_date is None


class RentPaymentSerializer(serializers.ModelSerializer):
    """Enhanced rent payment serializer"""
    tenant = TenantSerializer(read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    room_name = serializers.CharField(source='tenant.room.room_name', read_only=True)
    branch_name = serializers.CharField(source='tenant.room.branch.name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    collected_by_name = serializers.CharField(source='collected_by.get_full_name', read_only=True)
    for_month_display = serializers.SerializerMethodField()
    
    class Meta:
        model = RentPayment
        fields = [
            'id', 'tenant', 'tenant_name', 'room_name', 'branch_name',
            'payment_date', 'amount_paid', 'for_month', 'for_month_display',
            'payment_method', 'payment_method_display', 'reference_number',
            'notes', 'created_at', 'collected_by', 'collected_by_name'
        ]
        read_only_fields = [
            'id', 'tenant', 'tenant_name', 'room_name', 'branch_name',
            'payment_method_display', 'for_month_display', 'created_at',
            'collected_by', 'collected_by_name'
        ]
        extra_kwargs = {
            'tenant': {'write_only': True},
            'collected_by': {'write_only': True}
        }
    
    def get_for_month_display(self, obj):
        return obj.for_month.strftime('%B %Y')


# New serializers for RBAC models
class WardenAssignmentSerializer(serializers.ModelSerializer):
    """Warden assignment with permissions"""
    warden = UserSerializer(read_only=True)
    warden_name = serializers.CharField(source='warden.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    
    class Meta:
        model = WardenAssignment
        fields = [
            'id', 'warden', 'warden_name', 'branch', 'branch_name',
            'assigned_by', 'assigned_by_name', 'assigned_date', 'is_active',
            'can_manage_rooms', 'can_manage_tenants', 'can_view_payments',
            'can_collect_payments', 'notes'
        ]
        read_only_fields = [
            'id', 'warden', 'warden_name', 'branch_name',
            'assigned_by', 'assigned_by_name', 'assigned_date'
        ]


class TenantRequestSerializer(serializers.ModelSerializer):
    """Enhanced tenant request/complaint serializer with role-based access"""
    tenant = TenantSerializer(read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    tenant_phone = serializers.CharField(source='tenant.phone_number', read_only=True)
    tenant_room = serializers.CharField(source='tenant.room.room_name', read_only=True)
    branch_name = serializers.CharField(source='tenant.room.branch.name', read_only=True)
    branch_id = serializers.IntegerField(source='tenant.room.branch.id', read_only=True)
    
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    assigned_to_role = serializers.CharField(source='assigned_to.profile.role', read_only=True)
    
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    # Computed fields
    is_overdue = serializers.SerializerMethodField()
    days_since_created = serializers.SerializerMethodField()
    resolution_time_hours = serializers.SerializerMethodField()
    can_be_updated = serializers.SerializerMethodField()
    urgency_score = serializers.SerializerMethodField()
    
    # For creating requests on behalf of tenants (staff only)
    tenant_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = TenantRequest
        fields = [
            'id', 'tenant', 'tenant_id', 'tenant_name', 'tenant_phone', 
            'tenant_room', 'branch_name', 'branch_id',
            'request_type', 'request_type_display', 'title', 'description', 
            'priority', 'priority_display', 'status', 'status_display', 
            'assigned_to', 'assigned_to_name', 'assigned_to_role',
            'response_notes', 'resolution_date', 'created_at', 'updated_at',
            'is_overdue', 'days_since_created', 'resolution_time_hours',
            'can_be_updated', 'urgency_score'
        ]
        read_only_fields = [
            'id', 'tenant', 'tenant_name', 'tenant_phone', 'tenant_room',
            'branch_name', 'branch_id', 'request_type_display', 'status_display', 
            'priority_display', 'assigned_to_name', 'assigned_to_role',
            'created_at', 'updated_at', 'is_overdue', 'days_since_created',
            'resolution_time_hours', 'can_be_updated', 'urgency_score'
        ]
        extra_kwargs = {
            'tenant': {'write_only': True},
            'assigned_to': {'write_only': True}
        }
    
    def get_is_overdue(self, obj):
        """Check if request is overdue based on priority and creation time"""
        from datetime import timedelta
        from django.utils import timezone
        
        now = timezone.now()
        created = obj.created_at
        
        # Define SLA hours based on priority
        sla_hours = {
            'urgent': 2,   # 2 hours
            'high': 8,     # 8 hours
            'medium': 24,  # 24 hours
            'low': 72,     # 72 hours
        }
        
        threshold_hours = sla_hours.get(obj.priority, 24)
        threshold_time = created + timedelta(hours=threshold_hours)
        
        # Only consider overdue if still pending
        if obj.status in ['open', 'in_progress']:
            return now > threshold_time
        
        return False
    
    def get_days_since_created(self, obj):
        """Get number of days since request was created"""
        from django.utils import timezone
        delta = timezone.now() - obj.created_at
        return delta.days
    
    def get_resolution_time_hours(self, obj):
        """Get resolution time in hours if resolved"""
        if obj.resolution_date and obj.status in ['resolved', 'closed']:
            delta = obj.resolution_date - obj.created_at
            return round(delta.total_seconds() / 3600, 1)
        return None
    
    def get_can_be_updated(self, obj):
        """Check if request can be updated based on status"""
        return obj.status not in ['closed']
    
    def get_urgency_score(self, obj):
        """Calculate urgency score for prioritization"""
        priority_scores = {'urgent': 4, 'high': 3, 'medium': 2, 'low': 1}
        priority_score = priority_scores.get(obj.priority, 1)
        
        # Add time factor
        days_old = self.get_days_since_created(obj)
        time_factor = min(days_old * 0.1, 2)  # Max 2 points for age
        
        # Add type factor
        type_scores = {
            'maintenance': 1.5,
            'complaint': 1.2,
            'service': 1.0,
            'payment': 1.8,
            'other': 1.0
        }
        type_factor = type_scores.get(obj.request_type, 1.0)
        
        urgency = (priority_score + time_factor) * type_factor
        return round(urgency, 2)
    
    def validate_title(self, value):
        """Validate title field"""
        if len(value.strip()) < 5:
            raise serializers.ValidationError(
                "Title must be at least 5 characters long"
            )
        return value.strip()
    
    def validate_description(self, value):
        """Validate description field"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters long"
            )
        return value.strip()
    
    def validate(self, data):
        """Custom validation for the entire object"""
        request = self.context.get('request')
        
        if request and request.method == 'POST':
            # Validation for creation
            if not data.get('title') or not data.get('description'):
                raise serializers.ValidationError(
                    "Title and description are required"
                )
            
            # Check if user is tenant creating their own request
            if hasattr(request.user, 'profile') and request.user.profile.role == 'tenant':
                try:
                    tenant_profile = request.user.tenant_profile
                    if not tenant_profile.room:
                        raise serializers.ValidationError(
                            "You must be assigned to a room to create requests"
                        )
                except AttributeError:
                    raise serializers.ValidationError(
                        "Tenant profile not found"
                    )
        
        return data


class BranchPermissionSerializer(serializers.ModelSerializer):
    """Branch-level permissions serializer"""
    user = UserSerializer(read_only=True)
    branch = BranchSerializer(read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    granted_by_name = serializers.CharField(source='granted_by.get_full_name', read_only=True)
    
    class Meta:
        model = BranchPermission
        fields = [
            'id', 'user', 'user_name', 'branch', 'branch_name',
            'can_view_branch', 'can_edit_branch', 'can_manage_rooms',
            'can_manage_tenants', 'can_view_payments', 'can_collect_payments',
            'can_view_reports', 'can_assign_wardens', 'granted_by',
            'granted_by_name', 'granted_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'user', 'user_name', 'branch', 'branch_name',
            'granted_by', 'granted_by_name', 'granted_at'
        ]
        extra_kwargs = {
            'user': {'write_only': True},
            'branch': {'write_only': True},
            'granted_by': {'write_only': True}
        }
