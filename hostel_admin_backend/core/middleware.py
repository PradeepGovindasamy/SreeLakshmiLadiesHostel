# Role-based access control middleware
from django.http import JsonResponse
from django.urls import resolve
from django.contrib.auth.models import AnonymousUser
from rest_framework import status
from rest_framework.response import Response
import json
import logging

logger = logging.getLogger(__name__)


class RoleBasedAccessMiddleware:
    """
    Middleware to enforce role-based access control across the application.
    
    This middleware checks user roles and permissions before allowing access
    to specific API endpoints and resources.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Define role-based URL patterns and their required permissions
        self.role_permissions = {
            # Admin routes - full access
            'admin': {
                'allowed_patterns': ['*'],  # Admin can access everything
                'required_permissions': []
            },
            
            # Owner routes - can access their own properties
            'owner': {
                'allowed_patterns': [
                    'api/branches/',
                    'api/rooms/',
                    'api/tenants/',
                    'api/rent-payments/',
                    'api/room-occupancies/',
                    'api/warden-assignments/',
                    'api/tenant-requests/',
                    'api/branch-permissions/',
                    'api/dashboard/owner/',
                    'api/reports/owner/',
                ],
                'required_permissions': ['view_own_properties']
            },
            
            # Warden routes - can access assigned properties only
            'warden': {
                'allowed_patterns': [
                    'api/branches/',  # Read-only for assigned branches
                    'api/rooms/',     # Manage rooms in assigned branches
                    'api/tenants/',   # Manage tenants in assigned branches
                    'api/rent-payments/',  # View/collect payments for assigned branches
                    'api/room-occupancies/',  # View occupancies in assigned branches
                    'api/tenant-requests/',   # Handle requests for assigned branches
                    'api/dashboard/warden/',
                ],
                'required_permissions': ['view_assigned_properties']
            },
            
            # Tenant routes - can access only their own data
            'tenant': {
                'allowed_patterns': [
                    'api/tenants/me/',           # Own profile
                    'api/rent-payments/me/',     # Own payments
                    'api/tenant-requests/me/',   # Own requests
                    'api/dashboard/tenant/',
                ],
                'required_permissions': ['view_own_data']
            }
        }
        
        # Public endpoints that don't require authentication
        self.public_endpoints = [
            'api/auth/login/',
            'api/auth/register/',
            'api/auth/refresh/',
            'api/auth/logout/',
            'api/health/',
            'admin/',
        ]

    def __call__(self, request):
        # Process the request before view
        response = self.process_request(request)
        if response:
            return response
            
        # Get the actual response from the view
        response = self.get_response(request)
        
        # Process the response after view
        return self.process_response(request, response)

    def process_request(self, request):
        """Process request before it reaches the view"""
        
        # Skip middleware for public endpoints
        if self.is_public_endpoint(request.path):
            return None
            
        # Skip for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return None
            
        # Check if user is authenticated
        if isinstance(request.user, AnonymousUser):
            return self.unauthorized_response("Authentication required")
            
        # Get user role
        try:
            user_role = request.user.profile.role
        except AttributeError:
            logger.warning(f"User {request.user.username} has no profile")
            return self.forbidden_response("User profile not found")
            
        # Check role-based access
        if not self.has_role_access(request, user_role):
            return self.forbidden_response(
                f"Access denied for role '{user_role}' to endpoint '{request.path}'"
            )
            
        # Add user context to request for views
        request.user_role = user_role
        request.accessible_branches = self.get_accessible_branches(request.user, user_role)
        request.accessible_tenants = self.get_accessible_tenants(request.user, user_role)
        
        return None

    def process_response(self, request, response):
        """Process response after view execution"""
        
        # Add role-based headers for frontend
        if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
            try:
                user_role = request.user.profile.role
                response['X-User-Role'] = user_role
                response['X-User-Permissions'] = json.dumps(
                    self.get_user_permissions(request.user, user_role)
                )
            except AttributeError:
                pass
                
        return response

    def is_public_endpoint(self, path):
        """Check if endpoint is public (doesn't require authentication)"""
        return any(path.startswith(endpoint) for endpoint in self.public_endpoints)

    def has_role_access(self, request, user_role):
        """Check if user role has access to the requested endpoint"""
        
        # Admin has access to everything
        if user_role == 'admin':
            return True
            
        # Get allowed patterns for this role
        role_config = self.role_permissions.get(user_role, {})
        allowed_patterns = role_config.get('allowed_patterns', [])
        
        # Check if path matches any allowed pattern
        path = request.path.strip('/')
        for pattern in allowed_patterns:
            if pattern == '*' or path.startswith(pattern.strip('/')):
                # Additional checks based on HTTP method and resource ownership
                return self.check_resource_ownership(request, user_role)
                
        return False

    def check_resource_ownership(self, request, user_role):
        """Check resource-level permissions based on ownership"""
        
        # Extract resource information from URL
        url_match = resolve(request.path)
        view_name = url_match.url_name
        kwargs = url_match.kwargs
        
        # Different ownership checks based on role
        if user_role == 'owner':
            return self.check_owner_access(request, kwargs)
        elif user_role == 'warden':
            return self.check_warden_access(request, kwargs)
        elif user_role == 'tenant':
            return self.check_tenant_access(request, kwargs)
            
        return True

    def check_owner_access(self, request, kwargs):
        """Check if owner has access to the requested resource"""
        from .models import Branch, Room, Tenant
        
        try:
            # For branch-related operations
            if 'branch_id' in kwargs:
                branch_id = kwargs['branch_id']
                branch = Branch.objects.get(id=branch_id)
                return branch.owner == request.user
                
            # For room-related operations
            elif 'room_id' in kwargs:
                room_id = kwargs['room_id']
                room = Room.objects.get(id=room_id)
                return room.branch.owner == request.user
                
            # For tenant-related operations
            elif 'tenant_id' in kwargs:
                tenant_id = kwargs['tenant_id']
                tenant = Tenant.objects.get(id=tenant_id)
                return tenant.room and tenant.room.branch.owner == request.user
                
            # For list operations, filtering will be handled in views
            return True
            
        except (Branch.DoesNotExist, Room.DoesNotExist, Tenant.DoesNotExist):
            return False

    def check_warden_access(self, request, kwargs):
        """Check if warden has access to the requested resource"""
        from .models import Branch, Room, Tenant, WardenAssignment
        
        try:
            # Get warden's assigned branches
            assigned_branches = WardenAssignment.objects.filter(
                warden=request.user,
                is_active=True
            ).values_list('branch_id', flat=True)
            
            # For branch-related operations
            if 'branch_id' in kwargs:
                return int(kwargs['branch_id']) in assigned_branches
                
            # For room-related operations
            elif 'room_id' in kwargs:
                room = Room.objects.get(id=kwargs['room_id'])
                return room.branch_id in assigned_branches
                
            # For tenant-related operations
            elif 'tenant_id' in kwargs:
                tenant = Tenant.objects.get(id=kwargs['tenant_id'])
                return tenant.room and tenant.room.branch_id in assigned_branches
                
            # For list operations, filtering will be handled in views
            return True
            
        except (Room.DoesNotExist, Tenant.DoesNotExist):
            return False

    def check_tenant_access(self, request, kwargs):
        """Check if tenant has access to the requested resource"""
        from .models import Tenant, RentPayment, TenantRequest
        
        try:
            # Get tenant profile
            tenant_profile = Tenant.objects.get(user=request.user)
            
            # For tenant-specific operations
            if 'tenant_id' in kwargs:
                return int(kwargs['tenant_id']) == tenant_profile.id
                
            # For payment-related operations
            elif 'payment_id' in kwargs:
                payment = RentPayment.objects.get(id=kwargs['payment_id'])
                return payment.tenant == tenant_profile
                
            # For request-related operations
            elif 'request_id' in kwargs:
                tenant_request = TenantRequest.objects.get(id=kwargs['request_id'])
                return tenant_request.tenant == tenant_profile
                
            # For "me" endpoints, always allow
            if request.path.endswith('/me/'):
                return True
                
            return True
            
        except (Tenant.DoesNotExist, RentPayment.DoesNotExist, TenantRequest.DoesNotExist):
            return False

    def get_accessible_branches(self, user, user_role):
        """Get list of branch IDs accessible to the user"""
        from .models import Branch, WardenAssignment
        
        if user_role == 'admin':
            return list(Branch.objects.values_list('id', flat=True))
        elif user_role == 'owner':
            return list(Branch.objects.filter(owner=user).values_list('id', flat=True))
        elif user_role == 'warden':
            return list(WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch_id', flat=True))
        elif user_role == 'tenant':
            try:
                tenant = user.tenant_profile
                return [tenant.room.branch.id] if tenant.room else []
            except AttributeError:
                return []
        return []

    def get_accessible_tenants(self, user, user_role):
        """Get list of tenant IDs accessible to the user"""
        from .models import Tenant, WardenAssignment
        
        if user_role == 'admin':
            return list(Tenant.objects.values_list('id', flat=True))
        elif user_role == 'owner':
            return list(Tenant.objects.filter(
                room__branch__owner=user
            ).values_list('id', flat=True))
        elif user_role == 'warden':
            assigned_branches = WardenAssignment.objects.filter(
                warden=user, is_active=True
            ).values_list('branch_id', flat=True)
            return list(Tenant.objects.filter(
                room__branch_id__in=assigned_branches
            ).values_list('id', flat=True))
        elif user_role == 'tenant':
            try:
                return [user.tenant_profile.id]
            except AttributeError:
                return []
        return []

    def get_user_permissions(self, user, user_role):
        """Get detailed permissions for the user"""
        from .models import WardenAssignment, BranchPermission
        
        permissions = {
            'role': user_role,
            'can_create_branches': user_role in ['admin', 'owner'],
            'can_assign_wardens': user_role in ['admin', 'owner'],
            'can_view_all_reports': user_role == 'admin',
            'accessible_branches': self.get_accessible_branches(user, user_role),
            'accessible_tenants': self.get_accessible_tenants(user, user_role),
        }
        
        # Add warden-specific permissions
        if user_role == 'warden':
            warden_assignments = WardenAssignment.objects.filter(
                warden=user, is_active=True
            )
            permissions['warden_permissions'] = {}
            for assignment in warden_assignments:
                permissions['warden_permissions'][assignment.branch_id] = {
                    'can_manage_rooms': assignment.can_manage_rooms,
                    'can_manage_tenants': assignment.can_manage_tenants,
                    'can_view_payments': assignment.can_view_payments,
                    'can_collect_payments': assignment.can_collect_payments,
                }
        
        # Add branch-specific permissions
        branch_permissions = BranchPermission.objects.filter(
            user=user, is_active=True
        )
        permissions['branch_permissions'] = {}
        for perm in branch_permissions:
            permissions['branch_permissions'][perm.branch_id] = {
                'can_view_branch': perm.can_view_branch,
                'can_edit_branch': perm.can_edit_branch,
                'can_manage_rooms': perm.can_manage_rooms,
                'can_manage_tenants': perm.can_manage_tenants,
                'can_view_payments': perm.can_view_payments,
                'can_collect_payments': perm.can_collect_payments,
                'can_view_reports': perm.can_view_reports,
                'can_assign_wardens': perm.can_assign_wardens,
            }
            
        return permissions

    def unauthorized_response(self, message="Authentication required"):
        """Return 401 Unauthorized response"""
        return JsonResponse({
            'error': 'Unauthorized',
            'message': message,
            'code': 'AUTH_REQUIRED'
        }, status=401)

    def forbidden_response(self, message="Access denied"):
        """Return 403 Forbidden response"""
        return JsonResponse({
            'error': 'Forbidden', 
            'message': message,
            'code': 'ACCESS_DENIED'
        }, status=403)


class PropertyOwnershipMiddleware:
    """
    Additional middleware specifically for property ownership validation.
    
    This middleware adds property ownership context to requests and ensures
    that operations are performed only on owned/assigned properties.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Add property context before processing
        self.add_property_context(request)
        
        response = self.get_response(request)
        
        return response

    def add_property_context(self, request):
        """Add property ownership context to the request"""
        
        if isinstance(request.user, AnonymousUser):
            return
            
        try:
            user_role = request.user.profile.role
            
            # Add context based on role
            if user_role == 'owner':
                request.owned_branches = self.get_owned_branches(request.user)
                request.owned_rooms = self.get_owned_rooms(request.user)
                request.owned_tenants = self.get_owned_tenants(request.user)
                
            elif user_role == 'warden':
                request.assigned_branches = self.get_assigned_branches(request.user)
                request.managed_rooms = self.get_managed_rooms(request.user)
                request.managed_tenants = self.get_managed_tenants(request.user)
                request.warden_permissions = self.get_warden_permissions(request.user)
                
            elif user_role == 'tenant':
                request.tenant_profile = self.get_tenant_profile(request.user)
                request.tenant_room = self.get_tenant_room(request.user)
                request.tenant_branch = self.get_tenant_branch(request.user)
                
        except AttributeError:
            logger.warning(f"User {request.user.username} has no profile")

    def get_owned_branches(self, user):
        """Get branches owned by the user"""
        from .models import Branch
        return Branch.objects.filter(owner=user, is_active=True)

    def get_owned_rooms(self, user):
        """Get rooms owned by the user"""
        from .models import Room
        return Room.objects.filter(branch__owner=user, is_available=True)

    def get_owned_tenants(self, user):
        """Get tenants in properties owned by the user"""
        from .models import Tenant
        return Tenant.objects.filter(
            room__branch__owner=user,
            vacating_date__isnull=True
        )

    def get_assigned_branches(self, user):
        """Get branches assigned to the warden"""
        from .models import Branch, WardenAssignment
        return Branch.objects.filter(
            warden_assignments__warden=user,
            warden_assignments__is_active=True
        )

    def get_managed_rooms(self, user):
        """Get rooms managed by the warden"""
        from .models import Room, WardenAssignment
        assigned_branch_ids = WardenAssignment.objects.filter(
            warden=user, is_active=True
        ).values_list('branch_id', flat=True)
        
        return Room.objects.filter(branch_id__in=assigned_branch_ids)

    def get_managed_tenants(self, user):
        """Get tenants managed by the warden"""
        from .models import Tenant, WardenAssignment
        assigned_branch_ids = WardenAssignment.objects.filter(
            warden=user, is_active=True
        ).values_list('branch_id', flat=True)
        
        return Tenant.objects.filter(
            room__branch_id__in=assigned_branch_ids,
            vacating_date__isnull=True
        )

    def get_warden_permissions(self, user):
        """Get warden's permissions for each assigned branch"""
        from .models import WardenAssignment
        assignments = WardenAssignment.objects.filter(warden=user, is_active=True)
        
        permissions = {}
        for assignment in assignments:
            permissions[assignment.branch_id] = {
                'can_manage_rooms': assignment.can_manage_rooms,
                'can_manage_tenants': assignment.can_manage_tenants,
                'can_view_payments': assignment.can_view_payments,
                'can_collect_payments': assignment.can_collect_payments,
            }
        return permissions

    def get_tenant_profile(self, user):
        """Get tenant profile for the user"""
        try:
            return user.tenant_profile
        except AttributeError:
            return None

    def get_tenant_room(self, user):
        """Get room assigned to the tenant"""
        try:
            tenant = user.tenant_profile
            return tenant.room if tenant else None
        except AttributeError:
            return None

    def get_tenant_branch(self, user):
        """Get branch where the tenant resides"""
        try:
            tenant = user.tenant_profile
            return tenant.room.branch if tenant and tenant.room else None
        except AttributeError:
            return None


class APIRateLimitMiddleware:
    """
    Rate limiting middleware for API endpoints based on user role.
    
    Different roles have different rate limits to prevent abuse.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Rate limits per role (requests per minute)
        self.rate_limits = {
            'admin': 1000,    # High limit for admin
            'owner': 500,     # Medium-high for owners
            'warden': 300,    # Medium for wardens
            'tenant': 100,    # Lower for tenants
            'anonymous': 20,  # Very low for unauthenticated
        }

    def __call__(self, request):
        # Check rate limit before processing
        if not self.check_rate_limit(request):
            return JsonResponse({
                'error': 'Rate Limit Exceeded',
                'message': 'Too many requests. Please try again later.',
                'code': 'RATE_LIMIT_EXCEEDED'
            }, status=429)
            
        response = self.get_response(request)
        
        # Add rate limit headers
        self.add_rate_limit_headers(request, response)
        
        return response

    def check_rate_limit(self, request):
        """Check if request is within rate limits"""
        # Implementation would use Redis or similar for tracking
        # This is a placeholder for the rate limiting logic
        return True

    def add_rate_limit_headers(self, request, response):
        """Add rate limit information to response headers"""
        user_role = 'anonymous'
        
        if not isinstance(request.user, AnonymousUser):
            try:
                user_role = request.user.profile.role
            except AttributeError:
                pass
                
        limit = self.rate_limits.get(user_role, 20)
        response['X-RateLimit-Limit'] = str(limit)
        response['X-RateLimit-Remaining'] = str(limit - 1)  # Placeholder
        response['X-RateLimit-Reset'] = '60'  # Reset in 60 seconds
