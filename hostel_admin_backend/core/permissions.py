# Custom permissions for role-based access control
from rest_framework.permissions import BasePermission
from django.core.exceptions import PermissionDenied


class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission to only allow owners to edit their properties.
    """
    
    def has_permission(self, request, view):
        # Must be authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has a profile
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        # Read permissions for authenticated users
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # For creation (POST), check if user role allows creation
        if request.method == 'POST':
            # Admin can create anything
            if user_profile.role == 'admin':
                return True
            
            # Owner can create branches
            if user_profile.role == 'owner' and view.__class__.__name__ == 'BranchViewSet':
                return True
            
            # Owner and warden can create rooms in branches they have access to
            if user_profile.role in ['owner', 'warden'] and view.__class__.__name__ == 'RoomViewSet':
                return True
            
            # Owner and warden can create tenants in their branches
            if user_profile.role in ['owner', 'warden'] and view.__class__.__name__ == 'TenantViewSet':
                return True
        
        # Other write permissions (PUT, PATCH, DELETE) need object-level check
        return True
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for authenticated users
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return self._has_read_access(request.user, obj)
        
        # Write permissions only for owners
        return self._has_write_access(request.user, obj)
    
    def _has_read_access(self, user, obj):
        """Check if user has read access to the object"""
        user_profile = getattr(user, 'profile', None)
        if not user_profile:
            return False
        
        # Admin can access everything
        if user_profile.role == 'admin':
            return True
        
        # For Branch objects
        if hasattr(obj, 'owner'):
            # Owner can access their branches
            if user_profile.role == 'owner' and obj.owner == user:
                return True
            
            # Warden can access assigned branches
            if user_profile.role == 'warden':
                return obj.wardens.filter(warden=user, is_active=True).exists()
        
        # For Room objects
        if hasattr(obj, 'branch'):
            return self._has_read_access(user, obj.branch)
        
        # For Tenant objects
        if hasattr(obj, 'room') and obj.room:
            return self._has_read_access(user, obj.room.branch)
        
        # Tenants can only access their own records
        if user_profile.role == 'tenant':
            if hasattr(obj, 'user') and obj.user == user:
                return True
            if hasattr(obj, 'tenant') and obj.tenant.user == user:
                return True
        
        return False
    
    def _has_write_access(self, user, obj):
        """Check if user has write access to the object"""
        user_profile = getattr(user, 'profile', None)
        if not user_profile:
            return False
        
        # Admin can modify everything
        if user_profile.role == 'admin':
            return True
        
        # For Branch objects
        if hasattr(obj, 'owner'):
            return user_profile.role == 'owner' and obj.owner == user
        
        # For Room objects
        if hasattr(obj, 'branch'):
            # Owner can modify rooms in their branches
            if user_profile.role == 'owner' and obj.branch.owner == user:
                return True
            
            # Warden can modify rooms if they have permission
            if user_profile.role == 'warden':
                assignment = obj.branch.wardens.filter(
                    warden=user, 
                    is_active=True,
                    can_manage_rooms=True
                ).first()
                return assignment is not None
        
        # For Tenant objects
        if hasattr(obj, 'room') and obj.room:
            # Owner can modify tenants in their branches
            if user_profile.role == 'owner' and obj.room.branch.owner == user:
                return True
            
            # Warden can modify tenants if they have permission
            if user_profile.role == 'warden':
                assignment = obj.room.branch.wardens.filter(
                    warden=user,
                    is_active=True,
                    can_manage_tenants=True
                ).first()
                return assignment is not None
        
        # Tenants can only modify their own profile (limited fields)
        if user_profile.role == 'tenant':
            return hasattr(obj, 'user') and obj.user == user
        
        return False


class IsBranchOwnerOrWarden(BasePermission):
    """
    Permission for branch-specific access
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        # Admin has full access
        if user_profile.role == 'admin':
            return True
        
        # Get the branch for this object
        branch = None
        if hasattr(obj, 'branch'):
            branch = obj.branch
        elif hasattr(obj, 'owner'):  # Branch object itself
            branch = obj
        elif hasattr(obj, 'room') and obj.room:
            branch = obj.room.branch
        
        if not branch:
            return False
        
        # Owner has full access to their branches
        if user_profile.role == 'owner' and branch.owner == request.user:
            return True
        
        # Warden has access to assigned branches
        if user_profile.role == 'warden':
            return branch.wardens.filter(
                warden=request.user,
                is_active=True
            ).exists()
        
        return False


class IsTenantOwner(BasePermission):
    """
    Permission for tenant to access only their own data
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        # Admin has full access
        if user_profile.role == 'admin':
            return True
        
        # Tenant can only access their own records
        if user_profile.role == 'tenant':
            # For tenant profile
            if hasattr(obj, 'user') and obj.user == request.user:
                return True
            
            # For tenant-related objects (payments, requests, etc.)
            if hasattr(obj, 'tenant') and obj.tenant.user == request.user:
                return True
        
        # Branch owners and wardens might also have access
        if user_profile.role in ['owner', 'warden']:
            tenant = None
            if hasattr(obj, 'tenant'):
                tenant = obj.tenant
            elif hasattr(obj, 'user') and hasattr(obj, 'room'):  # Tenant object
                tenant = obj
            
            if tenant and tenant.room:
                branch = tenant.room.branch
                
                # Owner has access to tenants in their branches
                if user_profile.role == 'owner' and branch.owner == request.user:
                    return True
                
                # Warden has access to tenants in assigned branches
                if user_profile.role == 'warden':
                    return branch.wardens.filter(
                        warden=request.user,
                        is_active=True
                    ).exists()
        
        return False


class CanManagePayments(BasePermission):
    """
    Permission for payment management
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        # Admin has full access
        if user_profile.role == 'admin':
            return True
        
        # Get the tenant for this payment
        tenant = getattr(obj, 'tenant', None)
        if not tenant or not tenant.room:
            return False
        
        branch = tenant.room.branch
        
        # Owner can manage payments in their branches
        if user_profile.role == 'owner' and branch.owner == request.user:
            return True
        
        # Warden can manage payments if they have permission
        if user_profile.role == 'warden':
            assignment = branch.wardens.filter(
                warden=request.user,
                is_active=True
            ).first()
            
            if assignment:
                # Read access if can view payments
                if request.method in ['GET', 'HEAD', 'OPTIONS']:
                    return assignment.can_view_payments
                
                # Write access if can collect payments
                return assignment.can_collect_payments
        
        # Tenants can view their own payments
        if user_profile.role == 'tenant' and tenant.user == request.user:
            return request.method in ['GET', 'HEAD', 'OPTIONS']
        
        return False


# Utility functions for checking permissions programmatically
def user_can_access_branch(user, branch):
    """Check if user can access a specific branch"""
    user_profile = getattr(user, 'profile', None)
    if not user_profile:
        return False
    
    if user_profile.role == 'admin':
        return True
    
    if user_profile.role == 'owner' and branch.owner == user:
        return True
    
    if user_profile.role == 'warden':
        return branch.wardens.filter(warden=user, is_active=True).exists()
    
    return False


def get_user_accessible_branches(user):
    """Get all branches accessible to a user"""
    from .models import Branch
    
    user_profile = getattr(user, 'profile', None)
    if not user_profile:
        return Branch.objects.none()
    
    if user_profile.role == 'admin':
        return Branch.objects.filter(is_active=True)
    
    if user_profile.role == 'owner':
        return Branch.objects.filter(owner=user, is_active=True)
    
    if user_profile.role == 'warden':
        return Branch.objects.filter(
            wardens__warden=user,
            wardens__is_active=True,
            is_active=True
        ).distinct()
    
    return Branch.objects.none()


def get_user_accessible_tenants(user):
    """Get all tenants accessible to a user"""
    from .models import Tenant
    
    user_profile = getattr(user, 'profile', None)
    if not user_profile:
        return Tenant.objects.none()
    
    if user_profile.role == 'admin':
        return Tenant.objects.all()
    
    if user_profile.role == 'tenant':
        return Tenant.objects.filter(user=user)
    
    # For owners and wardens, get tenants in accessible branches
    accessible_branches = get_user_accessible_branches(user)
    return Tenant.objects.filter(room__branch__in=accessible_branches)
