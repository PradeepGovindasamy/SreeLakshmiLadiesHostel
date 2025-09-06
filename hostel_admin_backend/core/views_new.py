# Enhanced views with role-based access control
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import (
    Branch, Room, Tenant, RoomOccupancy, RentPayment, 
    UserProfile, WardenAssignment, TenantRequest, BranchPermission
)
from .serializers import (
    BranchSerializer, RoomSerializer, TenantSerializer, 
    RoomOccupancySerializer, RentPaymentSerializer,
    UserProfileSerializer, WardenAssignmentSerializer,
    TenantRequestSerializer, BranchPermissionSerializer
)
from .permissions import (
    IsOwnerOrReadOnly, IsBranchOwnerOrWarden, 
    IsTenantOwner, CanManagePayments,
    get_user_accessible_branches, get_user_accessible_tenants
)


class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile management"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_profile = getattr(self.request.user, 'userprofile', None)
        
        # Admin can see all profiles
        if user_profile and user_profile.role == 'admin':
            return UserProfile.objects.all()
        
        # Users can only see their own profile
        return UserProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        """Get or update current user's profile"""
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            # Limit what fields users can update
            allowed_fields = ['phone_number']
            if profile.role == 'owner':
                allowed_fields.extend(['business_name', 'business_license'])
            
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            serializer = self.get_serializer(profile, data=data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BranchViewSet(viewsets.ModelViewSet):
    """Branch/Property management with ownership control"""
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        """Filter branches based on user role"""
        return get_user_accessible_branches(self.request.user)
    
    def perform_create(self, serializer):
        """Set the owner when creating a branch"""
        user_profile = getattr(self.request.user, 'userprofile', None)
        
        if not user_profile or user_profile.role != 'owner':
            raise PermissionDenied("Only property owners can create branches")
        
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'])
    def wardens(self, request, pk=None):
        """Get wardens assigned to this branch"""
        branch = self.get_object()
        assignments = WardenAssignment.objects.filter(
            branch=branch, 
            is_active=True
        )
        serializer = WardenAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_warden(self, request, pk=None):
        """Assign a warden to this branch"""
        branch = self.get_object()
        
        # Only owners can assign wardens
        if branch.owner != request.user:
            raise PermissionDenied("Only the branch owner can assign wardens")
        
        warden_id = request.data.get('warden_id')
        if not warden_id:
            return Response(
                {'error': 'warden_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            warden_user = User.objects.get(id=warden_id)
            if warden_user.userprofile.role != 'warden':
                return Response(
                    {'error': 'User is not a warden'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return Response(
                {'error': 'Warden not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create or update assignment
        assignment, created = WardenAssignment.objects.get_or_create(
            warden=warden_user,
            branch=branch,
            defaults={
                'assigned_by': request.user,
                'can_manage_rooms': request.data.get('can_manage_rooms', True),
                'can_manage_tenants': request.data.get('can_manage_tenants', True),
                'can_view_payments': request.data.get('can_view_payments', True),
                'can_collect_payments': request.data.get('can_collect_payments', False),
            }
        )
        
        if not created:
            # Update existing assignment
            assignment.is_active = True
            assignment.assigned_by = request.user
            assignment.can_manage_rooms = request.data.get('can_manage_rooms', assignment.can_manage_rooms)
            assignment.can_manage_tenants = request.data.get('can_manage_tenants', assignment.can_manage_tenants)
            assignment.can_view_payments = request.data.get('can_view_payments', assignment.can_view_payments)
            assignment.can_collect_payments = request.data.get('can_collect_payments', assignment.can_collect_payments)
            assignment.save()
        
        serializer = WardenAssignmentSerializer(assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Get branch dashboard data"""
        branch = self.get_object()
        
        # Calculate statistics
        total_rooms = branch.rooms.count()
        occupied_rooms = branch.rooms.filter(
            tenants__vacating_date__isnull=True
        ).distinct().count()
        
        total_capacity = sum(room.sharing_type for room in branch.rooms.all())
        current_occupancy = branch.rooms.aggregate(
            total=models.Sum('tenants__id', filter=Q(tenants__vacating_date__isnull=True))
        )['total'] or 0
        
        # Recent payments (last 30 days)
        from datetime import datetime, timedelta
        recent_payments = RentPayment.objects.filter(
            tenant__room__branch=branch,
            payment_date__gte=datetime.now().date() - timedelta(days=30)
        ).aggregate(
            total=models.Sum('amount_paid')
        )['total'] or 0
        
        # Pending requests
        pending_requests = TenantRequest.objects.filter(
            tenant__room__branch=branch,
            status='pending'
        ).count()
        
        return Response({
            'branch_id': branch.id,
            'branch_name': branch.name,
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'occupancy_rate': (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0,
            'total_capacity': total_capacity,
            'current_occupancy': current_occupancy,
            'capacity_utilization': (current_occupancy / total_capacity * 100) if total_capacity > 0 else 0,
            'recent_payments_30days': recent_payments,
            'pending_requests': pending_requests,
        })


class RoomViewSet(viewsets.ModelViewSet):
    """Room management with branch-level access control"""
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsBranchOwnerOrWarden]
    
    def get_queryset(self):
        """Filter rooms based on accessible branches"""
        accessible_branches = get_user_accessible_branches(self.request.user)
        return Room.objects.filter(branch__in=accessible_branches)
    
    def perform_create(self, serializer):
        """Ensure user can create rooms in the specified branch"""
        branch = serializer.validated_data['branch']
        
        # Check if user has access to this branch
        if not get_user_accessible_branches(self.request.user).filter(id=branch.id).exists():
            raise PermissionDenied("You don't have permission to create rooms in this branch")
        
        serializer.save()


class TenantViewSet(viewsets.ModelViewSet):
    """Tenant management with role-based access"""
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter tenants based on user role and access"""
        return get_user_accessible_tenants(self.request.user)
    
    def perform_create(self, serializer):
        """Set created_by when creating tenant"""
        user_profile = getattr(self.request.user, 'userprofile', None)
        
        # Only owners and wardens can create tenant records
        if not user_profile or user_profile.role not in ['owner', 'warden', 'admin']:
            raise PermissionDenied("You don't have permission to create tenant records")
        
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current tenant's profile (for tenant users)"""
        user_profile = getattr(request.user, 'userprofile', None)
        
        if not user_profile or user_profile.role != 'tenant':
            return Response(
                {'error': 'Only tenants can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            tenant = Tenant.objects.get(user=request.user)
            serializer = self.get_serializer(tenant)
            return Response(serializer.data)
        except Tenant.DoesNotExist:
            return Response(
                {'error': 'Tenant profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Update current tenant's profile (limited fields)"""
        user_profile = getattr(request.user, 'userprofile', None)
        
        if not user_profile or user_profile.role != 'tenant':
            return Response(
                {'error': 'Only tenants can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            tenant = Tenant.objects.get(user=request.user)
        except Tenant.DoesNotExist:
            return Response(
                {'error': 'Tenant profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Tenants can only update limited fields
        allowed_fields = [
            'phone_number', 'email', 'address', 
            'emergency_contact_name', 'emergency_contact_phone'
        ]
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = self.get_serializer(tenant, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TenantRequestViewSet(viewsets.ModelViewSet):
    """Tenant request management"""
    serializer_class = TenantRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter requests based on user role"""
        user_profile = getattr(self.request.user, 'userprofile', None)
        
        if not user_profile:
            return TenantRequest.objects.none()
        
        if user_profile.role == 'admin':
            return TenantRequest.objects.all()
        
        if user_profile.role == 'tenant':
            # Tenants see only their own requests
            return TenantRequest.objects.filter(tenant__user=self.request.user)
        
        if user_profile.role in ['owner', 'warden']:
            # Owners/wardens see requests from their accessible branches
            accessible_tenants = get_user_accessible_tenants(self.request.user)
            return TenantRequest.objects.filter(tenant__in=accessible_tenants)
        
        return TenantRequest.objects.none()
    
    def perform_create(self, serializer):
        """Ensure tenants can only create requests for themselves"""
        user_profile = getattr(self.request.user, 'userprofile', None)
        
        if not user_profile:
            raise PermissionDenied("User profile required")
        
        if user_profile.role == 'tenant':
            # Tenants can only create requests for themselves
            try:
                tenant = Tenant.objects.get(user=self.request.user)
                serializer.save(tenant=tenant)
            except Tenant.DoesNotExist:
                raise PermissionDenied("Tenant profile not found")
        else:
            # Owners/wardens can create requests for any tenant in their branches
            tenant = serializer.validated_data['tenant']
            accessible_tenants = get_user_accessible_tenants(self.request.user)
            
            if tenant not in accessible_tenants:
                raise PermissionDenied("You don't have access to this tenant")
            
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign request to a warden"""
        request_obj = self.get_object()
        user_profile = getattr(request.user, 'userprofile', None)
        
        # Only owners and wardens can assign requests
        if not user_profile or user_profile.role not in ['owner', 'warden', 'admin']:
            raise PermissionDenied("You don't have permission to assign requests")
        
        assignee_id = request.data.get('assignee_id')
        if not assignee_id:
            return Response(
                {'error': 'assignee_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assignee = User.objects.get(id=assignee_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Assignee not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        request_obj.assigned_to = assignee
        request_obj.status = 'in_progress'
        request_obj.save()
        
        serializer = self.get_serializer(request_obj)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark request as resolved"""
        request_obj = self.get_object()
        
        response_notes = request.data.get('response_notes', '')
        request_obj.status = 'resolved'
        request_obj.response_notes = response_notes
        request_obj.resolution_date = timezone.now()
        request_obj.save()
        
        serializer = self.get_serializer(request_obj)
        return Response(serializer.data)


class RentPaymentViewSet(viewsets.ModelViewSet):
    """Rent payment management with role-based access"""
    serializer_class = RentPaymentSerializer
    permission_classes = [permissions.IsAuthenticated, CanManagePayments]
    
    def get_queryset(self):
        """Filter payments based on user role and access"""
        user_profile = getattr(self.request.user, 'userprofile', None)
        
        if not user_profile:
            return RentPayment.objects.none()
        
        if user_profile.role == 'admin':
            return RentPayment.objects.all()
        
        if user_profile.role == 'tenant':
            # Tenants see only their own payments
            return RentPayment.objects.filter(tenant__user=self.request.user)
        
        # Owners and wardens see payments from their accessible branches
        accessible_tenants = get_user_accessible_tenants(self.request.user)
        return RentPayment.objects.filter(tenant__in=accessible_tenants)
    
    def perform_create(self, serializer):
        """Set collected_by when recording payment"""
        serializer.save(collected_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get current tenant's payment history"""
        user_profile = getattr(request.user, 'userprofile', None)
        
        if not user_profile or user_profile.role != 'tenant':
            return Response(
                {'error': 'Only tenants can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        payments = RentPayment.objects.filter(tenant__user=request.user)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)


class RoomOccupancyViewSet(viewsets.ModelViewSet):
    """Room occupancy tracking"""
    serializer_class = RoomOccupancySerializer
    permission_classes = [permissions.IsAuthenticated, IsBranchOwnerOrWarden]
    
    def get_queryset(self):
        """Filter occupancies based on accessible branches"""
        accessible_branches = get_user_accessible_branches(self.request.user)
        return RoomOccupancy.objects.filter(room__branch__in=accessible_branches)
    
    def perform_create(self, serializer):
        """Set created_by when creating occupancy record"""
        serializer.save(created_by=self.request.user)
