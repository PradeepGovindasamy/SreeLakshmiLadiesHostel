# core/views_enhanced.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Branch, Room, Tenant, RoomOccupancy, RentPayment, UserProfile
from .serializers import (
    BranchSerializer, RoomSerializer, TenantSerializer,
    RoomOccupancySerializer, RentPaymentSerializer, UserProfileSerializer
)


class RoleBasedPermission(permissions.BasePermission):
    """
    Custom permission class that checks user roles
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has a profile, create one if they don't
        if not hasattr(request.user, 'profile'):
            # Try to create a profile for the user if they don't have one
            try:
                from .models import UserProfile
                profile, created = UserProfile.objects.get_or_create(
                    user=request.user,
                    defaults={'role': 'owner'}  # Default role for new users
                )
                if created:
                    print(f"Created profile for user {request.user.username} with role {profile.role}")
            except Exception as e:
                print(f"Error creating profile for user {request.user.username}: {e}")
                return False
        
        # For creation (POST), check specific permissions
        if request.method == 'POST':
            user_role = request.user.profile.role
            
            # Only owners and admins can create branches
            if view.__class__.__name__ == 'EnhancedBranchViewSet':
                return user_role in ['owner', 'admin']
            
            # Owners and wardens can create rooms and tenants
            elif view.__class__.__name__ in ['EnhancedRoomViewSet', 'EnhancedTenantViewSet']:
                return user_role in ['owner', 'warden', 'admin']
        
        return True
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Ensure user has a profile
        if not hasattr(user, 'profile') or not user.profile:
            return False
            
        user_role = user.profile.role
        
        # Owners and admins have full access
        if user_role in ['owner', 'admin']:
            return True
        
        # For other roles, implement specific logic per model
        if isinstance(obj, Branch):
            # Owners can access their own branches
            if user_role == 'owner' and hasattr(obj, 'owner') and obj.owner == user:
                return True
            # Wardens can access branches they're assigned to
            if user_role == 'warden':
                from .models import WardenAssignment
                return WardenAssignment.objects.filter(
                    warden=user, branch=obj, is_active=True
                ).exists()
            # Tenants can view branches but not modify
            elif user_role == 'tenant':
                return request.method in permissions.SAFE_METHODS
        
        elif isinstance(obj, Room):
            # Check branch access first
            return self.has_object_permission(request, view, obj.branch)
        
        elif isinstance(obj, Tenant):
            # Users can access their own tenant record
            if obj.user == user:
                return True
            # Or if they have access to the branch
            if obj.room:
                return self.has_object_permission(request, view, obj.room.branch)
        
        return False


class EnhancedBranchViewSet(viewsets.ModelViewSet):
    """
    Enhanced Branch ViewSet with role-based access
    """
    serializer_class = BranchSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile') or not user.profile:
            return Branch.objects.none()
        
        user_role = user.profile.role
        
        # Admins see all branches
        if user_role == 'admin':
            return Branch.objects.all()
        
        # Owners see their own branches
        elif user_role == 'owner':
            return Branch.objects.filter(owner=user)
        
        # Wardens see assigned branches
        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            return Branch.objects.filter(id__in=assigned_branches)
        
        # Tenants see all branches (for selection)
        elif user_role == 'tenant':
            return Branch.objects.filter(is_active=True)
        
        return Branch.objects.none()
    
    def perform_create(self, serializer):
        # Set the current user as owner when creating a branch
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['owner', 'admin']:
            serializer.save(owner=user)
        else:
            # If user is not owner/admin, they shouldn't be able to create
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only owners and admins can create branches")
    
    @action(detail=True, methods=['get'])
    def rooms(self, request, pk=None):
        """Get all rooms for a branch"""
        branch = self.get_object()
        rooms = Room.objects.filter(branch=branch)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tenants(self, request, pk=None):
        """Get all tenants for a branch"""
        branch = self.get_object()
        tenants = Tenant.objects.filter(room__branch=branch)
        serializer = TenantSerializer(tenants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def occupancy_stats(self, request, pk=None):
        """Get occupancy statistics for a branch"""
        branch = self.get_object()
        
        rooms = Room.objects.filter(branch=branch)
        total_rooms = rooms.count()
        total_capacity = sum(room.sharing_type for room in rooms)
        
        active_tenants = Tenant.objects.filter(
            room__branch=branch, 
            vacating_date__isnull=True
        ).count()
        
        occupied_rooms = Room.objects.filter(
            branch=branch,
            tenants__vacating_date__isnull=True
        ).distinct().count()
        
        return Response({
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'total_capacity': total_capacity,
            'current_occupancy': active_tenants,
            'occupancy_rate': (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0,
            'capacity_utilization': (active_tenants / total_capacity * 100) if total_capacity > 0 else 0
        })


class EnhancedRoomViewSet(viewsets.ModelViewSet):
    """
    Enhanced Room ViewSet with role-based access
    """
    serializer_class = RoomSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile'):
            return Room.objects.none()
        
        user_role = user.profile.role
        
        # Owners and admins see all rooms
        if user_role in ['owner', 'admin']:
            return Room.objects.all().select_related('branch')
        
        # Owners see rooms in their branches
        elif user_role == 'owner':
            return Room.objects.filter(branch__owner=user).select_related('branch')
        
        # Wardens see rooms in assigned branches
        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            return Room.objects.filter(branch__in=assigned_branches).select_related('branch')
        
        # Tenants see available rooms in active branches
        elif user_role == 'tenant':
            return Room.objects.filter(
                branch__is_active=True,
                is_available=True
            ).select_related('branch')
        
        return Room.objects.none()
    
    @action(detail=True, methods=['get'])
    def tenants(self, request, pk=None):
        """Get current tenants in a room"""
        room = self.get_object()
        tenants = Tenant.objects.filter(room=room, vacating_date__isnull=True)
        serializer = TenantSerializer(tenants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Check room availability"""
        room = self.get_object()
        current_occupancy = room.current_occupancy
        available_slots = room.sharing_type - current_occupancy
        
        return Response({
            'room_name': room.room_name,
            'sharing_type': room.sharing_type,
            'current_occupancy': current_occupancy,
            'available_slots': available_slots,
            'is_available': available_slots > 0,
            'is_full': room.is_full
        })


class EnhancedTenantViewSet(viewsets.ModelViewSet):
    """
    Enhanced Tenant ViewSet with role-based access
    """
    serializer_class = TenantSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile'):
            return Tenant.objects.none()
        
        user_role = user.profile.role
        
        # Owners and admins see all tenants
        if user_role in ['owner', 'admin']:
            return Tenant.objects.all().select_related('user', 'room', 'room__branch')
        
        # Owners see tenants in their branches
        elif user_role == 'owner':
            return Tenant.objects.filter(
                room__branch__owner=user
            ).select_related('user', 'room', 'room__branch')
        
        # Wardens see tenants in assigned branches
        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            return Tenant.objects.filter(
                room__branch__in=assigned_branches
            ).select_related('user', 'room', 'room__branch')
        
        # Tenants see only themselves
        elif user_role == 'tenant':
            return Tenant.objects.filter(user=user).select_related('user', 'room', 'room__branch')
        
        return Tenant.objects.none()
    
    def perform_create(self, serializer):
        # Set created_by to current user
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to add better error handling"""
        try:
            print(f"Creating tenant with data: {request.data}")
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                print(f"Serializer validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print(f"Error creating tenant: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create tenant: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get payment history for a tenant"""
        tenant = self.get_object()
        payments = RentPayment.objects.filter(tenant=tenant).order_by('-payment_date')
        serializer = RentPaymentSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """Check out a tenant (set vacating date)"""
        tenant = self.get_object()
        
        from datetime import date
        vacating_date = request.data.get('vacating_date', date.today())
        
        tenant.vacating_date = vacating_date
        tenant.save()
        
        serializer = self.get_serializer(tenant)
        return Response({
            'message': 'Tenant checked out successfully',
            'tenant': serializer.data
        })


class EnhancedRoomOccupancyViewSet(viewsets.ModelViewSet):
    """
    Enhanced Room Occupancy ViewSet with role-based access
    """
    serializer_class = RoomOccupancySerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile'):
            return RoomOccupancy.objects.none()
        
        user_role = user.profile.role
        
        # Owners and admins see all occupancy records
        if user_role in ['owner', 'admin']:
            return RoomOccupancy.objects.all().select_related('room', 'tenant', 'room__branch')
        
        # Owners see occupancy in their branches
        elif user_role == 'owner':
            return RoomOccupancy.objects.filter(
                room__branch__owner=user
            ).select_related('room', 'tenant', 'room__branch')
        
        # Wardens see occupancy in assigned branches
        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            return RoomOccupancy.objects.filter(
                room__branch__in=assigned_branches
            ).select_related('room', 'tenant', 'room__branch')
        
        # Tenants see only their own occupancy records
        elif user_role == 'tenant':
            return RoomOccupancy.objects.filter(
                tenant__user=user
            ).select_related('room', 'tenant', 'room__branch')
        
        return RoomOccupancy.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EnhancedRentPaymentViewSet(viewsets.ModelViewSet):
    """
    Enhanced Rent Payment ViewSet with role-based access
    """
    serializer_class = RentPaymentSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        user = self.request.user
        
        if not hasattr(user, 'profile'):
            return RentPayment.objects.none()
        
        user_role = user.profile.role
        
        # Owners and admins see all payments
        if user_role in ['owner', 'admin']:
            return RentPayment.objects.all().select_related('tenant', 'tenant__room', 'tenant__room__branch')
        
        # Owners see payments for their branches
        elif user_role == 'owner':
            return RentPayment.objects.filter(
                tenant__room__branch__owner=user
            ).select_related('tenant', 'tenant__room', 'tenant__room__branch')
        
        # Wardens see payments in assigned branches
        elif user_role == 'warden':
            from .models import WardenAssignment
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch', flat=True)
            return RentPayment.objects.filter(
                tenant__room__branch__in=assigned_branches
            ).select_related('tenant', 'tenant__room', 'tenant__room__branch')
        
        # Tenants see only their own payments
        elif user_role == 'tenant':
            return RentPayment.objects.filter(
                tenant__user=user
            ).select_related('tenant', 'tenant__room', 'tenant__room__branch')
        
        return RentPayment.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(collected_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly payment summary"""
        from django.db.models import Sum, Count
        from datetime import date, timedelta
        
        # Get date range (current month by default)
        today = date.today()
        month = request.query_params.get('month', today.month)
        year = request.query_params.get('year', today.year)
        
        payments = self.get_queryset().filter(
            payment_date__month=month,
            payment_date__year=year
        )
        
        summary = payments.aggregate(
            total_amount=Sum('amount_paid'),
            total_payments=Count('id')
        )
        
        return Response({
            'month': month,
            'year': year,
            'total_amount': summary['total_amount'] or 0,
            'total_payments': summary['total_payments'] or 0,
            'payments': RentPaymentSerializer(payments, many=True).data
        })
