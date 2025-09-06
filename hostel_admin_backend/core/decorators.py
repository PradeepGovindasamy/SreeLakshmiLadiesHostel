# Role-based access control decorators
from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def require_role(*allowed_roles):
    """
    Decorator to restrict view access to specific roles.
    
    Usage:
        @require_role('owner', 'admin')
        def my_view(request):
            # Only owners and admins can access
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not hasattr(request.user, 'profile'):
                return JsonResponse({
                    'error': 'Forbidden',
                    'message': 'User profile not found',
                    'code': 'NO_PROFILE'
                }, status=403)
                
            user_role = request.user.profile.role
            
            if user_role not in allowed_roles:
                return JsonResponse({
                    'error': 'Forbidden',
                    'message': f'Access denied for role: {user_role}',
                    'code': 'ROLE_NOT_ALLOWED'
                }, status=403)
                
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_property_ownership(resource_type='branch'):
    """
    Decorator to ensure user owns the property being accessed.
    
    Usage:
        @require_property_ownership('branch')
        def branch_detail_view(request, branch_id):
            # Only the owner of this branch can access
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            from .models import Branch, Room, Tenant
            
            user_role = getattr(request.user.profile, 'role', None)
            
            # Admin always has access
            if user_role == 'admin':
                return view_func(request, *args, **kwargs)
                
            try:
                if resource_type == 'branch':
                    branch_id = kwargs.get('branch_id') or kwargs.get('pk')
                    branch = Branch.objects.get(id=branch_id)
                    
                    if user_role == 'owner' and branch.owner != request.user:
                        raise PermissionDenied("You don't own this branch")
                    elif user_role == 'warden':
                        from .models import WardenAssignment
                        if not WardenAssignment.objects.filter(
                            warden=request.user, 
                            branch=branch, 
                            is_active=True
                        ).exists():
                            raise PermissionDenied("You're not assigned to this branch")
                            
                elif resource_type == 'room':
                    room_id = kwargs.get('room_id') or kwargs.get('pk')
                    room = Room.objects.get(id=room_id)
                    
                    if user_role == 'owner' and room.branch.owner != request.user:
                        raise PermissionDenied("You don't own this room's branch")
                    elif user_role == 'warden':
                        from .models import WardenAssignment
                        if not WardenAssignment.objects.filter(
                            warden=request.user,
                            branch=room.branch,
                            is_active=True
                        ).exists():
                            raise PermissionDenied("You're not assigned to this room's branch")
                            
                elif resource_type == 'tenant':
                    tenant_id = kwargs.get('tenant_id') or kwargs.get('pk')
                    tenant = Tenant.objects.get(id=tenant_id)
                    
                    if user_role == 'owner' and tenant.room.branch.owner != request.user:
                        raise PermissionDenied("You don't own this tenant's branch")
                    elif user_role == 'warden':
                        from .models import WardenAssignment
                        if not WardenAssignment.objects.filter(
                            warden=request.user,
                            branch=tenant.room.branch,
                            is_active=True
                        ).exists():
                            raise PermissionDenied("You're not assigned to this tenant's branch")
                    elif user_role == 'tenant' and tenant.user != request.user:
                        raise PermissionDenied("You can only access your own profile")
                        
            except (Branch.DoesNotExist, Room.DoesNotExist, Tenant.DoesNotExist):
                return JsonResponse({
                    'error': 'Not Found',
                    'message': f'{resource_type.title()} not found',
                    'code': 'RESOURCE_NOT_FOUND'
                }, status=404)
            except PermissionDenied as e:
                return JsonResponse({
                    'error': 'Forbidden',
                    'message': str(e),
                    'code': 'PERMISSION_DENIED'
                }, status=403)
                
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_warden_permission(permission_type):
    """
    Decorator to check specific warden permissions for branch operations.
    
    Usage:
        @require_warden_permission('can_manage_tenants')
        def create_tenant_view(request, branch_id):
            # Only wardens with tenant management permission can access
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            from .models import WardenAssignment, Branch
            
            user_role = getattr(request.user.profile, 'role', None)
            
            # Admin and owners always have permission
            if user_role in ['admin', 'owner']:
                return view_func(request, *args, **kwargs)
                
            if user_role != 'warden':
                return JsonResponse({
                    'error': 'Forbidden',
                    'message': 'Only wardens can use this permission check',
                    'code': 'NOT_WARDEN'
                }, status=403)
                
            # Get branch from various possible parameters
            branch_id = (kwargs.get('branch_id') or 
                        kwargs.get('pk') or 
                        request.data.get('branch') or
                        request.GET.get('branch'))
                        
            if not branch_id:
                return JsonResponse({
                    'error': 'Bad Request',
                    'message': 'Branch ID required for permission check',
                    'code': 'BRANCH_ID_REQUIRED'
                }, status=400)
                
            try:
                assignment = WardenAssignment.objects.get(
                    warden=request.user,
                    branch_id=branch_id,
                    is_active=True
                )
                
                if not getattr(assignment, permission_type, False):
                    return JsonResponse({
                        'error': 'Forbidden',
                        'message': f'You do not have {permission_type} permission for this branch',
                        'code': 'INSUFFICIENT_PERMISSIONS'
                    }, status=403)
                    
            except WardenAssignment.DoesNotExist:
                return JsonResponse({
                    'error': 'Forbidden',
                    'message': 'You are not assigned to this branch',
                    'code': 'NOT_ASSIGNED'
                }, status=403)
                
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_branch_permission(permission_type):
    """
    Decorator to check branch-level permissions.
    
    Usage:
        @require_branch_permission('can_collect_payments')
        def collect_payment_view(request, branch_id):
            # Only users with payment collection permission can access
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            from .models import BranchPermission, Branch
            
            user_role = getattr(request.user.profile, 'role', None)
            
            # Admin always has permission
            if user_role == 'admin':
                return view_func(request, *args, **kwargs)
                
            # Get branch from various possible parameters
            branch_id = (kwargs.get('branch_id') or 
                        kwargs.get('pk') or 
                        request.data.get('branch') or
                        request.GET.get('branch'))
                        
            if not branch_id:
                return JsonResponse({
                    'error': 'Bad Request',
                    'message': 'Branch ID required for permission check',
                    'code': 'BRANCH_ID_REQUIRED'
                }, status=400)
                
            try:
                branch = Branch.objects.get(id=branch_id)
                
                # Owner of branch always has permission
                if branch.owner == request.user:
                    return view_func(request, *args, **kwargs)
                    
                # Check explicit branch permissions
                permission = BranchPermission.objects.filter(
                    user=request.user,
                    branch=branch,
                    is_active=True
                ).first()
                
                if not permission or not getattr(permission, permission_type, False):
                    return JsonResponse({
                        'error': 'Forbidden',
                        'message': f'You do not have {permission_type} permission for this branch',
                        'code': 'INSUFFICIENT_BRANCH_PERMISSIONS'
                    }, status=403)
                    
            except Branch.DoesNotExist:
                return JsonResponse({
                    'error': 'Not Found',
                    'message': 'Branch not found',
                    'code': 'BRANCH_NOT_FOUND'
                }, status=404)
                
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def tenant_access_only(view_func):
    """
    Decorator to ensure tenants can only access their own data.
    
    Usage:
        @tenant_access_only
        def tenant_profile_view(request):
            # Tenants can only see their own profile
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        from .models import Tenant
        
        user_role = getattr(request.user.profile, 'role', None)
        
        # Non-tenants can access (will be filtered by other permissions)
        if user_role != 'tenant':
            return view_func(request, *args, **kwargs)
            
        # For tenants, ensure they can only access their own data
        try:
            tenant_profile = request.user.tenant_profile
            
            # If there's a tenant_id in the URL, ensure it matches
            tenant_id = kwargs.get('tenant_id') or kwargs.get('pk')
            if tenant_id and int(tenant_id) != tenant_profile.id:
                return JsonResponse({
                    'error': 'Forbidden',
                    'message': 'You can only access your own data',
                    'code': 'TENANT_ACCESS_VIOLATION'
                }, status=403)
                
            # Add tenant context to request
            request.tenant_profile = tenant_profile
            
        except AttributeError:
            return JsonResponse({
                'error': 'Forbidden',
                'message': 'Tenant profile not found',
                'code': 'NO_TENANT_PROFILE'
            }, status=403)
            
        return view_func(request, *args, **kwargs)
    return wrapper


def log_access_attempt(resource_type):
    """
    Decorator to log access attempts for audit purposes.
    
    Usage:
        @log_access_attempt('tenant_data')
        def sensitive_view(request):
            # Access attempts will be logged
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user_info = "Anonymous"
            if hasattr(request.user, 'username'):
                user_info = f"{request.user.username} ({getattr(request.user.profile, 'role', 'unknown')})"
                
            logger.info(
                f"Access attempt to {resource_type} by {user_info} "
                f"from {request.META.get('REMOTE_ADDR', 'unknown')} "
                f"- {request.method} {request.path}"
            )
            
            try:
                response = view_func(request, *args, **kwargs)
                
                # Log successful access
                if hasattr(response, 'status_code') and response.status_code < 400:
                    logger.info(f"Successful access to {resource_type} by {user_info}")
                else:
                    logger.warning(f"Failed access to {resource_type} by {user_info} - Status: {response.status_code}")
                    
                return response
                
            except Exception as e:
                logger.error(f"Error during access to {resource_type} by {user_info}: {str(e)}")
                raise
                
        return wrapper
    return decorator


def rate_limit_by_role(requests_per_minute=None):
    """
    Decorator for additional rate limiting based on user role.
    
    Usage:
        @rate_limit_by_role({'tenant': 10, 'warden': 50, 'owner': 100})
        def expensive_operation_view(request):
            # Different rate limits for different roles
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # This would integrate with a rate limiting system like Redis
            # For now, it's a placeholder
            
            user_role = getattr(request.user.profile, 'role', 'anonymous') if hasattr(request.user, 'profile') else 'anonymous'
            
            if requests_per_minute and user_role in requests_per_minute:
                limit = requests_per_minute[user_role]
                # Here you would implement actual rate limiting logic
                # For example, using Redis to track requests per user per minute
                pass
                
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


class PermissionChecker:
    """
    Utility class for checking permissions programmatically within views.
    """
    
    @staticmethod
    def can_user_access_branch(user, branch_id):
        """Check if user can access a specific branch"""
        from .models import Branch, WardenAssignment
        
        if not hasattr(user, 'profile'):
            return False
            
        user_role = user.profile.role
        
        if user_role == 'admin':
            return True
            
        try:
            branch = Branch.objects.get(id=branch_id)
            
            if user_role == 'owner':
                return branch.owner == user
            elif user_role == 'warden':
                return WardenAssignment.objects.filter(
                    warden=user, branch=branch, is_active=True
                ).exists()
            elif user_role == 'tenant':
                return hasattr(user, 'tenant_profile') and \
                       user.tenant_profile.room and \
                       user.tenant_profile.room.branch == branch
                       
        except Branch.DoesNotExist:
            return False
            
        return False
    
    @staticmethod
    def can_user_manage_tenant(user, tenant_id):
        """Check if user can manage a specific tenant"""
        from .models import Tenant, WardenAssignment
        
        if not hasattr(user, 'profile'):
            return False
            
        user_role = user.profile.role
        
        if user_role == 'admin':
            return True
            
        try:
            tenant = Tenant.objects.get(id=tenant_id)
            
            if user_role == 'owner':
                return tenant.room and tenant.room.branch.owner == user
            elif user_role == 'warden':
                return tenant.room and WardenAssignment.objects.filter(
                    warden=user, 
                    branch=tenant.room.branch, 
                    is_active=True,
                    can_manage_tenants=True
                ).exists()
            elif user_role == 'tenant':
                return tenant.user == user
                
        except Tenant.DoesNotExist:
            return False
            
        return False
    
    @staticmethod
    def can_user_collect_payment(user, tenant_id):
        """Check if user can collect payment from a specific tenant"""
        from .models import Tenant, WardenAssignment, BranchPermission
        
        if not hasattr(user, 'profile'):
            return False
            
        user_role = user.profile.role
        
        if user_role == 'admin':
            return True
            
        try:
            tenant = Tenant.objects.get(id=tenant_id)
            branch = tenant.room.branch if tenant.room else None
            
            if not branch:
                return False
                
            if user_role == 'owner':
                return branch.owner == user
            elif user_role == 'warden':
                return WardenAssignment.objects.filter(
                    warden=user,
                    branch=branch,
                    is_active=True,
                    can_collect_payments=True
                ).exists()
            else:
                # Check branch permissions
                return BranchPermission.objects.filter(
                    user=user,
                    branch=branch,
                    is_active=True,
                    can_collect_payments=True
                ).exists()
                
        except Tenant.DoesNotExist:
            return False
            
        return False
