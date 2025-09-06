// src/hooks/useRoleAccess.js
import { useUser } from '../contexts/UserContext';

/**
 * Custom hook for role-based access control
 * Provides convenient methods for checking user roles and permissions
 */
export const useRoleAccess = () => {
  const { getUserRole, isAuthenticated, user, profile } = useUser();

  const userRole = getUserRole();

  // Check if user has specific role
  const hasRole = (role) => {
    return isAuthenticated() && userRole === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return isAuthenticated() && roles.includes(userRole);
  };

  // Check if user has all of the specified roles (useful for compound permissions)
  const hasAllRoles = (roles) => {
    return isAuthenticated() && roles.every(role => userRole === role);
  };

  // Specific role checkers
  const isOwner = () => hasRole('owner');
  const isWarden = () => hasRole('warden');
  const isTenant = () => hasRole('tenant');
  const isAdmin = () => hasRole('admin');

  // Check if user is staff (owner, warden, or admin)
  const isStaff = () => hasAnyRole(['owner', 'warden', 'admin']);

  // Check if user can manage properties
  const canManageProperties = () => hasAnyRole(['owner', 'admin']);

  // Check if user can manage tenants
  const canManageTenants = () => hasAnyRole(['owner', 'warden', 'admin']);

  // Check if user can view financial data
  const canViewFinancials = () => hasAnyRole(['owner', 'admin']);

  // Check if user can create service requests
  const canCreateRequests = () => isAuthenticated();

  // Check if user can manage service requests
  const canManageRequests = () => hasAnyRole(['owner', 'warden', 'admin']);

  // Get role-specific data access level
  const getDataAccessLevel = () => {
    if (isAdmin()) return 'full'; // Access to all data
    if (isOwner()) return 'owned'; // Access to owned properties
    if (isWarden()) return 'assigned'; // Access to assigned properties
    if (isTenant()) return 'personal'; // Access to personal data only
    return 'none';
  };

  // Get available actions based on role
  const getAvailableActions = () => {
    const actions = [];

    if (canManageProperties()) {
      actions.push('create_property', 'edit_property', 'delete_property');
    }

    if (canManageTenants()) {
      actions.push('create_tenant', 'edit_tenant', 'view_tenant_details');
    }

    if (canManageRequests()) {
      actions.push('assign_request', 'update_request_status', 'view_all_requests');
    }

    if (canCreateRequests()) {
      actions.push('create_request', 'view_own_requests');
    }

    if (canViewFinancials()) {
      actions.push('view_revenue', 'view_financial_reports');
    }

    return actions;
  };

  return {
    // Basic role info
    userRole,
    isAuthenticated: isAuthenticated(),
    user,
    profile,

    // Role checkers
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isOwner,
    isWarden,
    isTenant,
    isAdmin,
    isStaff,

    // Permission checkers
    canManageProperties,
    canManageTenants,
    canViewFinancials,
    canCreateRequests,
    canManageRequests,

    // Utility methods
    getDataAccessLevel,
    getAvailableActions
  };
};
