# Enhanced serializers for role-based access control
from rest_framework import serializers
from django.contrib.auth.models import User
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


class BranchSerializer(serializers.ModelSerializer):
    """Enhanced branch serializer with ownership and statistics"""
    owner = UserSerializer(read_only=True)
    owner_name = serializers.SerializerMethodField()
    
    # Statistics (computed fields)
    total_rooms = serializers.SerializerMethodField()
    occupied_rooms = serializers.SerializerMethodField()
    total_capacity = serializers.SerializerMethodField()
    current_occupancy = serializers.SerializerMethodField()
    occupancy_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'address', 'description', 'num_rooms', 'num_bathrooms',
            'owner', 'owner_name', 'contact_phone', 'contact_email',
            'established_date', 'is_active', 'created_at', 'updated_at',
            # Statistics
            'total_rooms', 'occupied_rooms', 'total_capacity', 
            'current_occupancy', 'occupancy_rate'
        ]
        read_only_fields = [
            'id', 'owner', 'owner_name', 'created_at', 'updated_at',
            'total_rooms', 'occupied_rooms', 'total_capacity',
            'current_occupancy', 'occupancy_rate'
        ]
    
    def get_total_rooms(self, obj):
        return obj.rooms.count()
    
    def get_occupied_rooms(self, obj):
        return obj.rooms.filter(tenants__vacating_date__isnull=True).distinct().count()
    
    def get_total_capacity(self, obj):
        return sum(room.sharing_type for room in obj.rooms.all())
    
    def get_current_occupancy(self, obj):
        return sum(room.current_occupancy for room in obj.rooms.all())
    
    def get_occupancy_rate(self, obj):
        total_rooms = self.get_total_rooms(obj)
        occupied_rooms = self.get_occupied_rooms(obj)
        return (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    def get_owner_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return None


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


class RoomSerializer(serializers.ModelSerializer):
    """Enhanced room serializer with occupancy information"""
    branch_detail = BranchSerializer(source='branch', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    sharing_type_display = serializers.SerializerMethodField()
    current_occupancy = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    is_available = serializers.BooleanField(default=True)
    
    class Meta:
        model = Room
        fields = [
            'id', 'room_name', 'sharing_type', 'sharing_type_display',
            'branch', 'branch_detail', 'branch_name', 'attached_bath', 'ac_room',
            'rent', 'floor_number', 'room_size_sqft', 'is_available',
            'current_occupancy', 'is_full', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'branch_detail', 'branch_name', 'sharing_type_display',
            'current_occupancy', 'is_full', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'branch': {'write_only': True}
        }
    
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
            'created_at', 'updated_at', 'created_by', 'created_by_name'
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
        if room:
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


class TenantRequestSerializer(serializers.ModelSerializer):
    """Tenant request/complaint serializer"""
    tenant = TenantSerializer(read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = TenantRequest
        fields = [
            'id', 'tenant', 'tenant_name', 'request_type', 'request_type_display',
            'title', 'description', 'priority', 'priority_display',
            'status', 'status_display', 'assigned_to', 'assigned_to_name',
            'response_notes', 'resolution_date', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tenant', 'tenant_name', 'request_type_display',
            'status_display', 'priority_display', 'assigned_to_name',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'tenant': {'write_only': True},
            'assigned_to': {'write_only': True}
        }


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


# Simplified serializers for dropdowns and selections
class BranchListSerializer(serializers.ModelSerializer):
    """Simplified branch serializer for lists and dropdowns"""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    
    class Meta:
        model = Branch
        fields = ['id', 'name', 'address', 'owner_name', 'is_active']


class RoomListSerializer(serializers.ModelSerializer):
    """Simplified room serializer for lists and dropdowns"""
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    sharing_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'room_name', 'branch_name', 'sharing_type', 
            'sharing_type_display', 'rent', 'is_available', 'is_full'
        ]
    
    def get_sharing_type_display(self, obj):
        return f"{obj.sharing_type}-Sharing"


class TenantListSerializer(serializers.ModelSerializer):
    """Simplified tenant serializer for lists and dropdowns"""
    room_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'phone_number', 'room_display', 'joining_date']
    
    def get_room_display(self, obj):
        if obj.room and obj.room.branch:
            return f"{obj.room.room_name} - {obj.room.branch.name}"
        return "Not Assigned"
