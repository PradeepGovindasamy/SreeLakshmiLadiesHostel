# Enhanced views with integrated role-based access control
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

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
from .decorators import (
    require_role, require_property_ownership, require_warden_permission,
    require_branch_permission, tenant_access_only, log_access_attempt,
    PermissionChecker
)


# Pagination for vacated tenants
class TenantPagination(PageNumberPagination):
    """Custom pagination for vacated tenants"""
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class RoleBasedViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet with role-based filtering and permissions.
    All other ViewSets inherit from this to get automatic role-based access control.
    """
    
    def get_queryset(self):
        """Override to filter queryset based on user role and permissions"""
        queryset = super().get_queryset()
        
        if not hasattr(self.request.user, 'profile'):
            return queryset.none()
            
        user_role = self.request.user.profile.role
        
        # Admin sees everything
        if user_role == 'admin':
            return queryset
            
        # Apply role-based filtering
        return self.filter_queryset_by_role(queryset, user_role)
    
    def filter_queryset_by_role(self, queryset, user_role):
        """Override in child classes to implement specific filtering logic"""
        return queryset
    
    def perform_create(self, serializer):
        """Add user context to creation"""
        # Add created_by field if model has it
        if hasattr(serializer.Meta.model, 'created_by'):
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        """Add user context to updates"""
        serializer.save()


class BranchViewSet(RoleBasedViewSet):
    """Branch management with role-based access control"""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def filter_queryset_by_role(self, queryset, user_role):
        """Filter branches based on user role"""
        if user_role == 'owner':
            return queryset.filter(owner=self.request.user)
        elif user_role == 'warden':
            # Get branches assigned to this warden
            return queryset.filter(
                warden_assignments__warden=self.request.user,
                warden_assignments__is_active=True
            )
        elif user_role == 'tenant':
            # Get branch where tenant resides
            try:
                tenant = self.request.user.tenant_profile
                if tenant.room:
                    return queryset.filter(id=tenant.room.branch.id)
            except AttributeError:
                pass
            return queryset.none()
        return queryset.none()
    
    def perform_create(self, serializer):
        """Set owner when creating branch"""
        serializer.save(owner=self.request.user)
    
    @method_decorator(require_role('owner', 'admin'))
    @action(detail=True, methods=['post'])
    def assign_warden(self, request, pk=None):
        """Assign a warden to this branch"""
        branch = self.get_object()
        warden_id = request.data.get('warden_id')
        
        try:
            warden_user = User.objects.get(id=warden_id)
            warden_profile = warden_user.profile
            
            if warden_profile.role != 'warden':
                return Response({
                    'error': 'User is not a warden'
                }, status=status.HTTP_400_BAD_REQUEST)
            
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
                assignment.can_manage_rooms = request.data.get('can_manage_rooms', assignment.can_manage_rooms)
                assignment.can_manage_tenants = request.data.get('can_manage_tenants', assignment.can_manage_tenants)
                assignment.can_view_payments = request.data.get('can_view_payments', assignment.can_view_payments)
                assignment.can_collect_payments = request.data.get('can_collect_payments', assignment.can_collect_payments)
                assignment.save()
            
            serializer = WardenAssignmentSerializer(assignment)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response({
                'error': 'Warden not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get branch statistics"""
        branch = self.get_object()
        
        stats = {
            'total_rooms': branch.rooms.count(),
            'occupied_rooms': branch.rooms.filter(tenants__vacating_date__isnull=True).distinct().count(),
            'total_tenants': branch.rooms.filter(tenants__vacating_date__isnull=True).aggregate(
                count=Count('tenants')
            )['count'] or 0,
            'total_capacity': branch.rooms.aggregate(
                capacity=Sum('sharing_type')
            )['capacity'] or 0,
            'monthly_revenue': branch.rooms.filter(
                tenants__vacating_date__isnull=True
            ).aggregate(revenue=Sum('rent'))['revenue'] or 0,
        }
        
        stats['occupancy_rate'] = (
            (stats['occupied_rooms'] / stats['total_rooms'] * 100) 
            if stats['total_rooms'] > 0 else 0
        )
        
        return Response(stats)


class RoomViewSet(RoleBasedViewSet):
    """Room management with role-based access control"""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsBranchOwnerOrWarden]
    
    def filter_queryset_by_role(self, queryset, user_role):
        """Filter rooms based on user role"""
        accessible_branches = get_user_accessible_branches(self.request.user, user_role)
        return queryset.filter(branch_id__in=accessible_branches)
    
    def get_queryset(self):
        """Override to add status filtering"""
        queryset = super().get_queryset()
        
        # Apply status filtering if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            if status_filter == 'available':
                # Room is available if it's marked available and has space
                queryset = queryset.filter(is_available=True)
                # Additional filtering by occupancy will be done in the view
            elif status_filter == 'occupied':
                # Room is occupied if it has any active tenants
                queryset = queryset.filter(
                    tenants__joining_date__isnull=False,
                    tenants__vacating_date__isnull=True
                ).distinct()
            elif status_filter == 'maintenance':
                # Room is in maintenance if marked as not available
                queryset = queryset.filter(is_available=False)
            elif status_filter == 'reserved':
                # Reserved rooms are available but full - handle in Python filtering
                queryset = queryset.filter(is_available=True)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to add additional filtering for status"""
        queryset = self.get_queryset()
        status_filter = request.query_params.get('status', None)
        
        # Additional Python-based filtering for complex status logic
        if status_filter == 'available':
            # Only show rooms that are available and have space
            queryset = [room for room in queryset if not room.is_full]
        elif status_filter == 'reserved':
            # Only show rooms that are available but full
            queryset = [room for room in queryset if room.is_full]
        
        # Convert back to queryset if we filtered in Python
        if isinstance(queryset, list):
            room_ids = [room.id for room in queryset]
            queryset = self.get_queryset().filter(id__in=room_ids)
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @method_decorator(require_warden_permission('can_manage_rooms'))
    def create(self, request, *args, **kwargs):
        """Create room with warden permission check"""
        return super().create(request, *args, **kwargs)
    
    @method_decorator(require_warden_permission('can_manage_rooms'))
    def update(self, request, *args, **kwargs):
        """Update room with warden permission check"""
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def occupancy_history(self, request, pk=None):
        """Get occupancy history for this room"""
        room = self.get_object()
        occupancies = RoomOccupancy.objects.filter(room=room).order_by('-start_date')
        serializer = RoomOccupancySerializer(occupancies, many=True)
        return Response(serializer.data)


class TenantViewSet(RoleBasedViewSet):
    """Enhanced tenant management with role-based access control, status filtering, and pagination"""
    queryset = Tenant.objects.select_related('room', 'room__branch', 'user')
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantOwner]
    pagination_class = TenantPagination
    
    def get_queryset(self):
        """Filter and optimize queryset with status-based filtering"""
        queryset = super().get_queryset()
        
        # Apply role-based filtering first
        if not hasattr(self.request.user, 'profile'):
            return queryset.none()
        
        user_role = self.request.user.profile.role
        queryset = self.filter_queryset_by_role(queryset, user_role)
        
        # Status filtering (active, vacated, pending)
        status_param = self.request.query_params.get('status')
        if status_param == 'active':
            # Active: has joining_date, no vacating_date
            queryset = queryset.filter(
                joining_date__isnull=False,
                vacating_date__isnull=True
            ).order_by('name')
        elif status_param == 'vacated':
            # Vacated: has vacating_date set
            queryset = queryset.filter(
                vacating_date__isnull=False
            ).order_by('-vacating_date')  # Most recent first
        elif status_param == 'pending':
            # Pending: no joining_date yet
            queryset = queryset.filter(
                joining_date__isnull=True
            ).order_by('created_at')
        
        # Branch filtering
        branch_id = self.request.query_params.get('branch')
        if branch_id and branch_id != 'all':
            queryset = queryset.filter(room__branch_id=branch_id)
        
        # Search filtering
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(email__icontains=search) |
                Q(room__room_name__icontains=search)
            )
        
        return queryset
    
    def filter_queryset_by_role(self, queryset, user_role):
        """Filter tenants based on user role"""
        if user_role == 'owner':
            return queryset.filter(room__branch__owner=self.request.user)
        elif user_role == 'warden':
            # Get branches assigned to this warden
            assigned_branches = WardenAssignment.objects.filter(
                warden=self.request.user,
                is_active=True
            ).values_list('branch_id', flat=True)
            return queryset.filter(room__branch_id__in=assigned_branches)
        elif user_role == 'tenant':
            # Tenants can only see their own profile
            try:
                return queryset.filter(user=self.request.user)
            except:
                return queryset.none()
        return queryset.none()
    
    def list(self, request, *args, **kwargs):
        """Custom list with conditional pagination"""
        queryset = self.filter_queryset(self.get_queryset())
        status_param = request.query_params.get('status')
        
        # Only paginate vacated tenants (can grow to thousands)
        if status_param == 'vacated':
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
        
        # No pagination for active/pending tenants (typically < 200 records)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @method_decorator(require_warden_permission('can_manage_tenants'))
    def create(self, request, *args, **kwargs):
        """Create tenant with warden permission check"""
        return super().create(request, *args, **kwargs)
    
    @method_decorator(tenant_access_only)
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current tenant's profile"""
        try:
            tenant = request.user.tenant_profile
            serializer = self.get_serializer(tenant)
            return Response(serializer.data)
        except AttributeError:
            return Response({
                'error': 'Tenant profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @method_decorator(tenant_access_only)
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current tenant's profile"""
        try:
            tenant = request.user.tenant_profile
            serializer = self.get_serializer(tenant, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except AttributeError:
            return Response({
                'error': 'Tenant profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def payment_history(self, request, pk=None):
        """Get payment history for this tenant"""
        tenant = self.get_object()
        payments = RentPayment.objects.filter(tenant=tenant).order_by('-payment_date')
        serializer = RentPaymentSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """Checkout tenant (set vacating_date)"""
        tenant = self.get_object()
        vacating_date = request.data.get('vacating_date')
        
        if not vacating_date:
            return Response(
                {'error': 'vacating_date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant.vacating_date = vacating_date
        tenant.save()
        
        serializer = self.get_serializer(tenant)
        return Response({
            'message': 'Tenant checked out successfully',
            'tenant': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate vacated tenant (clear vacating_date)"""
        tenant = self.get_object()
        
        if not tenant.vacating_date:
            return Response(
                {'error': 'Tenant is already active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant.vacating_date = None
        tenant.save()
        
        serializer = self.get_serializer(tenant)
        return Response({
            'message': 'Tenant reactivated successfully',
            'tenant': serializer.data
        })


class RentPaymentViewSet(RoleBasedViewSet):
    """Rent payment management with role-based access control"""
    queryset = RentPayment.objects.all()
    serializer_class = RentPaymentSerializer
    permission_classes = [permissions.IsAuthenticated, CanManagePayments]
    
    def filter_queryset_by_role(self, queryset, user_role):
        """Filter payments based on user role"""
        if user_role == 'owner':
            return queryset.filter(tenant__room__branch__owner=self.request.user)
        elif user_role == 'warden':
            # Get branches assigned to this warden with payment permissions
            assigned_branches = WardenAssignment.objects.filter(
                warden=self.request.user,
                is_active=True,
                can_view_payments=True
            ).values_list('branch_id', flat=True)
            return queryset.filter(tenant__room__branch_id__in=assigned_branches)
        elif user_role == 'tenant':
            # Tenants can only see their own payments
            try:
                tenant = self.request.user.tenant_profile
                return queryset.filter(tenant=tenant)
            except AttributeError:
                return queryset.none()
        return queryset.none()
    
    @method_decorator(require_warden_permission('can_collect_payments'))
    def create(self, request, *args, **kwargs):
        """Create payment with collection permission check"""
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Set collected_by when creating payment"""
        serializer.save(collected_by=self.request.user)
    
    @method_decorator(tenant_access_only)
    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get current tenant's payment history"""
        try:
            tenant = request.user.tenant_profile
            payments = RentPayment.objects.filter(tenant=tenant).order_by('-payment_date')
            serializer = self.get_serializer(payments, many=True)
            return Response(serializer.data)
        except AttributeError:
            return Response({
                'error': 'Tenant profile not found'
            }, status=status.HTTP_404_NOT_FOUND)


class TenantRequestViewSet(RoleBasedViewSet):
    """Tenant request/complaint management with role-based access control"""
    queryset = TenantRequest.objects.all()
    serializer_class = TenantRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def filter_queryset_by_role(self, queryset, user_role):
        """Filter requests based on user role"""
        if user_role == 'owner':
            return queryset.filter(tenant__room__branch__owner=self.request.user)
        elif user_role == 'warden':
            # Get branches assigned to this warden
            assigned_branches = WardenAssignment.objects.filter(
                warden=self.request.user,
                is_active=True
            ).values_list('branch_id', flat=True)
            return queryset.filter(tenant__room__branch_id__in=assigned_branches)
        elif user_role == 'tenant':
            # Tenants can only see their own requests
            try:
                tenant = self.request.user.tenant_profile
                return queryset.filter(tenant=tenant)
            except AttributeError:
                return queryset.none()
        return queryset.none()
    
    @method_decorator(tenant_access_only)
    def create(self, request, *args, **kwargs):
        """Create request - tenants can only create for themselves"""
        try:
            tenant = request.user.tenant_profile
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(tenant=tenant)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except AttributeError:
            return Response({
                'error': 'Tenant profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @method_decorator(tenant_access_only)
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get current tenant's requests"""
        try:
            tenant = request.user.tenant_profile
            requests = TenantRequest.objects.filter(tenant=tenant).order_by('-created_at')
            serializer = self.get_serializer(requests, many=True)
            return Response(serializer.data)
        except AttributeError:
            return Response({
                'error': 'Tenant profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @method_decorator(require_role('owner', 'warden', 'admin'))
    @action(detail=True, methods=['post'])
    def assign_to_warden(self, request, pk=None):
        """Assign request to a warden"""
        tenant_request = self.get_object()
        warden_id = request.data.get('warden_id')
        
        try:
            warden = User.objects.get(id=warden_id, profile__role='warden')
            tenant_request.assigned_to = warden
            tenant_request.status = 'in_progress'
            tenant_request.save()
            
            serializer = self.get_serializer(tenant_request)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response({
                'error': 'Warden not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @method_decorator(require_role('owner', 'warden', 'admin'))
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update request status and response"""
        tenant_request = self.get_object()
        
        tenant_request.status = request.data.get('status', tenant_request.status)
        tenant_request.response_notes = request.data.get('response_notes', tenant_request.response_notes)
        
        if request.data.get('status') == 'resolved':
            from django.utils import timezone
            tenant_request.resolution_date = timezone.now()
        
        tenant_request.save()
        
        serializer = self.get_serializer(tenant_request)
        return Response(serializer.data)


# Dashboard ViewSets for role-specific dashboards
class OwnerDashboardViewSet(viewsets.ViewSet):
    """Owner-specific dashboard endpoints"""
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(require_role('owner', 'admin'))
    def list(self, request):
        """Get owner dashboard data"""
        user = request.user
        
        # Get owner's branches
        branches = Branch.objects.filter(owner=user)
        
        dashboard_data = {
            'total_branches': branches.count(),
            'total_rooms': Room.objects.filter(branch__owner=user).count(),
            'total_tenants': Tenant.objects.filter(
                room__branch__owner=user,
                vacating_date__isnull=True
            ).count(),
            'monthly_revenue': RentPayment.objects.filter(
                tenant__room__branch__owner=user
            ).aggregate(revenue=Sum('amount_paid'))['revenue'] or 0,
            'recent_payments': RentPaymentSerializer(
                RentPayment.objects.filter(
                    tenant__room__branch__owner=user
                ).order_by('-payment_date')[:5],
                many=True
            ).data,
            'pending_requests': TenantRequestSerializer(
                TenantRequest.objects.filter(
                    tenant__room__branch__owner=user,
                    status__in=['open', 'in_progress']
                ).order_by('-created_at')[:5],
                many=True
            ).data,
        }
        
        return Response(dashboard_data)


class WardenDashboardViewSet(viewsets.ViewSet):
    """Warden-specific dashboard endpoints"""
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(require_role('warden', 'admin'))
    def list(self, request):
        """Get warden dashboard data"""
        user = request.user
        
        # Get assigned branches
        assigned_branches = WardenAssignment.objects.filter(
            warden=user,
            is_active=True
        ).values_list('branch_id', flat=True)
        
        dashboard_data = {
            'assigned_branches': assigned_branches.count(),
            'managed_rooms': Room.objects.filter(branch_id__in=assigned_branches).count(),
            'managed_tenants': Tenant.objects.filter(
                room__branch_id__in=assigned_branches,
                vacating_date__isnull=True
            ).count(),
            'pending_requests': TenantRequestSerializer(
                TenantRequest.objects.filter(
                    tenant__room__branch_id__in=assigned_branches,
                    status__in=['open', 'in_progress']
                ).order_by('-created_at')[:10],
                many=True
            ).data,
            'recent_payments': RentPaymentSerializer(
                RentPayment.objects.filter(
                    tenant__room__branch_id__in=assigned_branches
                ).order_by('-payment_date')[:5],
                many=True
            ).data,
        }
        
        return Response(dashboard_data)


class TenantDashboardViewSet(viewsets.ViewSet):
    """Tenant-specific dashboard endpoints"""
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(require_role('tenant'))
    @method_decorator(tenant_access_only)
    def list(self, request):
        """Get tenant dashboard data"""
        try:
            tenant = request.user.tenant_profile
            
            dashboard_data = {
                'profile': TenantSerializer(tenant).data,
                'room_info': RoomSerializer(tenant.room).data if tenant.room else None,
                'recent_payments': RentPaymentSerializer(
                    RentPayment.objects.filter(tenant=tenant).order_by('-payment_date')[:5],
                    many=True
                ).data,
                'my_requests': TenantRequestSerializer(
                    TenantRequest.objects.filter(tenant=tenant).order_by('-created_at')[:5],
                    many=True
                ).data,
                'payment_summary': {
                    'total_paid': RentPayment.objects.filter(tenant=tenant).aggregate(
                        total=Sum('amount_paid')
                    )['total'] or 0,
                    'pending_amount': 0,  # Calculate based on current month
                }
            }
            
            return Response(dashboard_data)
            
        except AttributeError:
            return Response({
                'error': 'Tenant profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
