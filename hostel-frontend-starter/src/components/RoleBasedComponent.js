// src/components/RoleBasedComponent.js
import React from 'react';
import { useUser } from '../contexts/UserContext';

/**
 * A component that conditionally renders children based on user role
 * Usage:
 * <RoleBasedComponent allowedRoles={['owner', 'admin']}>
 *   <OwnerOnlyContent />
 * </RoleBasedComponent>
 */
const RoleBasedComponent = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  hideInsteadOfFallback = false 
}) => {
  const { getUserRole, isAuthenticated } = useUser();

  // Don't render anything if user is not authenticated
  if (!isAuthenticated()) {
    return hideInsteadOfFallback ? null : fallback;
  }

  const userRole = getUserRole();
  const hasPermission = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!hasPermission) {
    return hideInsteadOfFallback ? null : fallback;
  }

  return children;
};

export default RoleBasedComponent;
