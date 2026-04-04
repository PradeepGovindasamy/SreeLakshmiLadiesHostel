# Tenant Service Request API - Complete Implementation
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q
from .models import TenantServiceRequest, Tenant, Branch
from .serializers import TenantServiceRequestSerializer
from .permissions import IsOwnerWarden
                assigned_branches = WardenAssignment.objects.filter(
                    warden=user, is_active=True
                ).values_list('branch_id', flat=True)
                if not instance.tenant.room or instance.tenant.room.branch_id not in assigned_branches:
                    raise PermissionDenied("You don't have access to this request")rk.exceptions import PermissionDenied, ValidationError
from django.contrib.auth.models import User
from django.db.models import Q, Count, Case, When, IntegerField
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from functools import wraps

from .models import TenantRequest, Tenant, UserProfile, WardenAssignment, Branch
from .serializers import TenantRequestSerializer


# Custom decorators for role-based access control
def require_role(*allowed_roles):
    """Decorator to require specific user roles"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            if not hasattr(request.user, 'profile'):
                raise PermissionDenied("User profile not found")
            if request.user.profile.role not in allowed_roles:
                raise PermissionDenied(f"Access denied. Required roles: {allowed_roles}")
            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator


def tenant_access_only(view_func):
    """Decorator for tenant-only access"""
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'tenant':
            raise PermissionDenied("Access denied. Tenant access only.")
        return view_func(self, request, *args, **kwargs)
    return wrapper


class TenantRequestFilter(django_filters.FilterSet):
    """Advanced filtering for tenant requests"""
    
    # Filter by request type
    request_type = django_filters.ChoiceFilter(choices=TenantRequest.REQUEST_TYPE_CHOICES)
    
    # Filter by status
    status = django_filters.ChoiceFilter(choices=TenantRequest.STATUS_CHOICES)
    
    # Filter by priority
    priority = django_filters.ChoiceFilter(choices=TenantRequest.PRIORITY_CHOICES)
    
    # Filter by date range
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # Filter by resolution status
    is_resolved = django_filters.BooleanFilter(method='filter_resolved')
    
    # Filter by assigned status
    is_assigned = django_filters.BooleanFilter(method='filter_assigned')
    
    # Filter by branch (for owners/wardens)
    branch = django_filters.NumberFilter(field_name='tenant__room__branch__id')
    
    # Search in title and description
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = TenantRequest
        fields = ['request_type', 'status', 'priority', 'branch']
    
    def filter_resolved(self, queryset, name, value):
        """Filter by resolution status"""
        if value:
            return queryset.filter(status__in=['resolved', 'closed'])
        else:
            return queryset.filter(status__in=['open', 'in_progress'])
    
    def filter_assigned(self, queryset, name, value):
        """Filter by assignment status"""
        if value:
            return queryset.filter(assigned_to__isnull=False)
        else:
            return queryset.filter(assigned_to__isnull=True)
    
    def filter_search(self, queryset, name, value):
        """Search in title and description"""
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )


class TenantServiceRequestViewSet(viewsets.ModelViewSet):
    """
    Comprehensive API for tenant service requests with role-based access control.
    
    Endpoints:
    - GET /api/tenant-requests/          # List requests (filtered by role)
    - POST /api/tenant-requests/         # Create request (tenants only)
    - GET /api/tenant-requests/{id}/     # Get specific request
    - PUT /api/tenant-requests/{id}/     # Update request
    - DELETE /api/tenant-requests/{id}/  # Delete request
    
    Role-specific endpoints:
    - GET /api/tenant-requests/my/                    # Tenant's own requests
    - POST /api/tenant-requests/bulk_update_status/  # Bulk status update (staff only)
    - GET /api/tenant-requests/statistics/           # Request statistics
    - POST /api/tenant-requests/{id}/assign/         # Assign to warden/staff
    - POST /api/tenant-requests/{id}/update_status/  # Update status with notes
    """
    
    queryset = TenantRequest.objects.all()
    serializer_class = TenantRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TenantRequestFilter
    search_fields = ['title', 'description', 'tenant__name']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status']
    ordering = ['-created_at']  # Default ordering: newest first

    def get_queryset(self):
        """Filter queryset based on user role and permissions"""
        user = self.request.user
        
        if not hasattr(user, 'profile'):
            return TenantRequest.objects.none()
        
        user_role = user.profile.role
        
        # Admin sees all requests
        if user_role == 'admin':
            return TenantRequest.objects.all()
        
        # Owner sees requests from tenants in their properties
        elif user_role == 'owner':
            return TenantRequest.objects.filter(
                tenant__room__branch__owner=user
            ).select_related('tenant', 'assigned_to', 'tenant__room__branch')
        
        # Warden sees requests from tenants in assigned branches
        elif user_role == 'warden':
            assigned_branches = WardenAssignment.objects.filter(
                warden=user,
                is_active=True
            ).values_list('branch_id', flat=True)
            
            return TenantRequest.objects.filter(
                tenant__room__branch_id__in=assigned_branches
            ).select_related('tenant', 'assigned_to', 'tenant__room__branch')
        
        # Tenant sees only their own requests
        elif user_role == 'tenant':
            try:
                tenant_profile = user.tenant_profile
                return TenantRequest.objects.filter(
                    tenant=tenant_profile
                ).select_related('assigned_to', 'tenant__room__branch')
            except AttributeError:
                return TenantRequest.objects.none()
        
        return TenantRequest.objects.none()

    def perform_create(self, serializer):
        """Handle request creation with role-based logic"""
        user = self.request.user
        user_role = user.profile.role
        
        if user_role == 'tenant':
            # Tenants can only create requests for themselves
            try:
                tenant_profile = user.tenant_profile
                serializer.save(tenant=tenant_profile)
            except AttributeError:
                raise ValidationError("Tenant profile not found")
        
        elif user_role in ['owner', 'warden', 'admin']:
            # Staff can create requests on behalf of tenants
            tenant_id = self.request.data.get('tenant_id')
            if not tenant_id:
                raise ValidationError("tenant_id is required for staff users")
            
            try:
                tenant = Tenant.objects.get(id=tenant_id)
                
                # Check if staff has access to this tenant
                if user_role == 'owner':
                    if not tenant.room or tenant.room.branch.owner != user:
                        raise PermissionDenied("You don't have access to this tenant")
                elif user_role == 'warden':
                    assigned_branches = WardenAssignment.objects.filter(
                        warden=user, is_active=True
                    ).values_list('branch_id', flat=True)
                    if not tenant.room or tenant.room.branch_id not in assigned_branches:
                        raise PermissionDenied("You don't have access to this tenant")
                
                serializer.save(tenant=tenant)
            except Tenant.DoesNotExist:
                raise ValidationError("Tenant not found")
        else:
            raise PermissionDenied("Invalid user role")

    def perform_update(self, serializer):
        """Handle request updates with role-based permissions"""
        user = self.request.user
        user_role = user.profile.role
        instance = self.get_object()
        
        # Tenants can only update their own requests and limited fields
        if user_role == 'tenant':
            if instance.tenant.user != user:
                raise PermissionDenied("You can only update your own requests")
            
            # Tenants can only update title, description, and priority
            allowed_fields = ['title', 'description', 'priority']
            update_data = {k: v for k, v in self.request.data.items() 
                          if k in allowed_fields}
            
            for attr, value in update_data.items():
                setattr(instance, attr, value)
            
            instance.save()
            return
        
        # Staff can update all fields
        elif user_role in ['owner', 'warden', 'admin']:
            # Check access to the tenant
            if not PermissionChecker.can_user_manage_tenant(user, instance.tenant.id):
                raise PermissionDenied("You don't have access to this tenant")
            
            serializer.save()
        else:
            raise PermissionDenied("Invalid user role")

    @method_decorator(tenant_access_only)
    @action(detail=False, methods=['get'])
    def my(self, request):
        """
        Get current tenant's service requests
        
        GET /api/tenant-requests/my/
        
        Query parameters:
        - status: filter by status (open, in_progress, resolved, closed)
        - request_type: filter by type (maintenance, complaint, service, payment, other)
        - priority: filter by priority (low, medium, high, urgent)
        """
        try:
            tenant_profile = request.user.tenant_profile
            queryset = TenantRequest.objects.filter(tenant=tenant_profile)
            
            # Apply filters
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            request_type_filter = request.query_params.get('request_type')
            if request_type_filter:
                queryset = queryset.filter(request_type=request_type_filter)
            
            priority_filter = request.query_params.get('priority')
            if priority_filter:
                queryset = queryset.filter(priority=priority_filter)
            
            # Paginate and serialize
            page = self.paginate_queryset(queryset.order_by('-created_at'))
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except AttributeError:
            return Response({
                'error': 'Tenant profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

    @method_decorator(require_role('owner', 'warden', 'admin'))
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign request to a warden or staff member
        
        POST /api/tenant-requests/{id}/assign/
        {
            "assigned_to_id": 123,
            "notes": "Assigning to maintenance team"
        }
        """
        service_request = self.get_object()
        assigned_to_id = request.data.get('assigned_to_id')
        notes = request.data.get('notes', '')
        
        if not assigned_to_id:
            return Response({
                'error': 'assigned_to_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assigned_user = User.objects.get(id=assigned_to_id)
            
            # Verify the assignee has appropriate role
            if not hasattr(assigned_user, 'profile') or assigned_user.profile.role not in ['warden', 'admin']:
                return Response({
                    'error': 'Can only assign to wardens or admin users'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # For wardens, verify they have access to the branch
            if assigned_user.profile.role == 'warden':
                branch = service_request.tenant.room.branch if service_request.tenant.room else None
                if not branch or not WardenAssignment.objects.filter(
                    warden=assigned_user,
                    branch=branch,
                    is_active=True
                ).exists():
                    return Response({
                        'error': 'Warden is not assigned to this branch'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the request
            service_request.assigned_to = assigned_user
            service_request.status = 'in_progress'
            if notes:
                service_request.response_notes = notes
            service_request.save()
            
            serializer = self.get_serializer(service_request)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response({
                'error': 'Assigned user not found'
            }, status=status.HTTP_404_NOT_FOUND)

    @method_decorator(require_role('owner', 'warden', 'admin'))
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update request status with response notes
        
        POST /api/tenant-requests/{id}/update_status/
        {
            "status": "resolved",
            "response_notes": "Issue has been fixed",
            "resolution_date": "2025-08-21T10:30:00Z"  // optional, auto-set for resolved
        }
        """
        service_request = self.get_object()
        new_status = request.data.get('status')
        response_notes = request.data.get('response_notes', '')
        
        if not new_status:
            return Response({
                'error': 'status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate status choice
        valid_statuses = [choice[0] for choice in TenantRequest.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({
                'error': f'Invalid status. Must be one of: {valid_statuses}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the request
        service_request.status = new_status
        if response_notes:
            service_request.response_notes = response_notes
        
        # Auto-set resolution date for resolved/closed status
        if new_status in ['resolved', 'closed'] and not service_request.resolution_date:
            service_request.resolution_date = timezone.now()
        
        service_request.save()
        
        serializer = self.get_serializer(service_request)
        return Response(serializer.data)

    @method_decorator(require_role('owner', 'warden', 'admin'))
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """
        Bulk update status for multiple requests
        
        POST /api/tenant-requests/bulk_update_status/
        {
            "request_ids": [1, 2, 3, 4],
            "status": "resolved",
            "response_notes": "Bulk resolved by maintenance team"
        }
        """
        request_ids = request.data.get('request_ids', [])
        new_status = request.data.get('status')
        response_notes = request.data.get('response_notes', '')
        
        if not request_ids or not new_status:
            return Response({
                'error': 'request_ids and status are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate status
        valid_statuses = [choice[0] for choice in TenantRequest.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({
                'error': f'Invalid status. Must be one of: {valid_statuses}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get accessible requests for this user
        accessible_requests = self.get_queryset().filter(id__in=request_ids)
        
        if not accessible_requests.exists():
            return Response({
                'error': 'No accessible requests found with provided IDs'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update requests
        update_data = {'status': new_status}
        if response_notes:
            update_data['response_notes'] = response_notes
        
        if new_status in ['resolved', 'closed']:
            update_data['resolution_date'] = timezone.now()
        
        updated_count = accessible_requests.update(**update_data)
        
        return Response({
            'message': f'Updated {updated_count} requests',
            'updated_count': updated_count,
            'total_requested': len(request_ids)
        })

    @method_decorator(require_role('owner', 'warden', 'admin'))
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get statistics about service requests
        
        GET /api/tenant-requests/statistics/
        
        Query parameters:
        - branch_id: filter by specific branch (owners/wardens)
        - days: number of days to look back (default: 30)
        """
        days = int(request.query_params.get('days', 30))
        branch_id = request.query_params.get('branch_id')
        
        # Start with accessible queryset
        queryset = self.get_queryset()
        
        # Filter by branch if specified
        if branch_id:
            queryset = queryset.filter(tenant__room__branch_id=branch_id)
        
        # Filter by date range
        from datetime import timedelta
        date_threshold = timezone.now() - timedelta(days=days)
        recent_queryset = queryset.filter(created_at__gte=date_threshold)
        
        # Calculate statistics
        stats = {
            'total_requests': queryset.count(),
            'recent_requests': recent_queryset.count(),
            'status_breakdown': {},
            'type_breakdown': {},
            'priority_breakdown': {},
            'resolution_time_avg': 0,
            'pending_requests': queryset.filter(status__in=['open', 'in_progress']).count(),
            'resolved_requests': queryset.filter(status__in=['resolved', 'closed']).count(),
        }
        
        # Status breakdown
        for status_code, status_name in TenantRequest.STATUS_CHOICES:
            count = recent_queryset.filter(status=status_code).count()
            stats['status_breakdown'][status_code] = {
                'name': status_name,
                'count': count
            }
        
        # Type breakdown
        for type_code, type_name in TenantRequest.REQUEST_TYPE_CHOICES:
            count = recent_queryset.filter(request_type=type_code).count()
            stats['type_breakdown'][type_code] = {
                'name': type_name,
                'count': count
            }
        
        # Priority breakdown
        for priority_code, priority_name in TenantRequest.PRIORITY_CHOICES:
            count = recent_queryset.filter(priority=priority_code).count()
            stats['priority_breakdown'][priority_code] = {
                'name': priority_name,
                'count': count
            }
        
        # Calculate average resolution time
        resolved_requests = queryset.filter(
            status__in=['resolved', 'closed'],
            resolution_date__isnull=False
        )
        
        if resolved_requests.exists():
            from django.db.models import Avg, F
            avg_resolution = resolved_requests.aggregate(
                avg_hours=Avg(
                    (F('resolution_date') - F('created_at')) / timedelta(hours=1)
                )
            )['avg_hours']
            stats['resolution_time_avg'] = round(avg_resolution or 0, 2)
        
        return Response(stats)

    @method_decorator(require_role('owner', 'warden', 'admin'))
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending requests (open and in_progress)
        
        GET /api/tenant-requests/pending/
        """
        queryset = self.get_queryset().filter(status__in=['open', 'in_progress'])
        
        # Apply additional filters
        priority = request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        request_type = request.query_params.get('request_type')
        if request_type:
            queryset = queryset.filter(request_type=request_type)
        
        # Order by priority and creation date
        priority_order = Case(
            When(priority='urgent', then=1),
            When(priority='high', then=2),
            When(priority='medium', then=3),
            When(priority='low', then=4),
            output_field=IntegerField(),
        )
        queryset = queryset.annotate(priority_order=priority_order).order_by(
            'priority_order', 'created_at'
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @method_decorator(require_role('owner', 'admin'))
    @action(detail=False, methods=['get'])
    def by_branch(self, request):
        """
        Get requests grouped by branch (for owners managing multiple branches)
        
        GET /api/tenant-requests/by_branch/
        """
        user = request.user
        
        # Get accessible branches
        if user.profile.role == 'admin':
            branches = Branch.objects.all()
        else:  # owner
            branches = Branch.objects.filter(owner=user)
        
        result = []
        for branch in branches:
            branch_requests = TenantRequest.objects.filter(
                tenant__room__branch=branch
            ).order_by('-created_at')
            
            # Apply filters
            status_filter = request.query_params.get('status')
            if status_filter:
                branch_requests = branch_requests.filter(status=status_filter)
            
            branch_data = {
                'branch_id': branch.id,
                'branch_name': branch.name,
                'total_requests': branch_requests.count(),
                'pending_requests': branch_requests.filter(
                    status__in=['open', 'in_progress']
                ).count(),
                'recent_requests': list(
                    branch_requests[:5].values(
                        'id', 'title', 'request_type', 'priority', 
                        'status', 'created_at', 'tenant__name'
                    )
                )
            }
            result.append(branch_data)
        
        return Response(result)

    def destroy(self, request, *args, **kwargs):
        """Custom delete with role-based permissions"""
        instance = self.get_object()
        user = request.user
        user_role = user.profile.role
        
        # Only allow deletion by request creator (tenant) or admin
        if user_role == 'tenant':
            if instance.tenant.user != user:
                raise PermissionDenied("You can only delete your own requests")
            
            # Don't allow deletion of resolved/closed requests
            if instance.status in ['resolved', 'closed']:
                return Response({
                    'error': 'Cannot delete resolved or closed requests'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        elif user_role == 'admin':
            # Admin can delete any request
            pass
        
        else:
            # Owners and wardens cannot delete requests (only update status)
            raise PermissionDenied("You cannot delete requests")
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
