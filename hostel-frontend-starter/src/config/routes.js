// src/config/routes.js
import LoginForm from '../components/LoginForm';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import PasswordResetConfirmPage from '../pages/PasswordResetConfirmPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ConditionalDashboard from '../components/ConditionalDashboard';
import Branches from '../components/Branches';
import Rooms from '../components/Rooms';
import TenantsPage from '../components/tenants/TenantsPage';
import RoomStatus from '../components/RoomStatus';
import RoleTestPage from '../components/RoleTestPage';
import RoleFilteredBranches from '../components/RoleFilteredBranches';
import UserManagement from '../components/UserManagement';
import Profile from '../components/Profile';
import HomePage from '../components/public/HomePage';
import Groceries from '../components/Groceries';
import Machines from '../components/Machines';
import Workers from '../components/Workers';
import FoodMenuPage from '../components/FoodMenuPage';
import ResidentAvailabilityPage from '../components/ResidentAvailabilityPage';
import MealCountPage from '../components/MealCountPage';

// Define all routes with their access controls
export const routeConfig = [
  // Public routes (no authentication required)
  {
    path: '/',
    component: HomePage,
    isPublic: true,
    title: 'Home'
  },
  {
    path: '/login',
    component: LoginPage,
    isPublic: true,
    title: 'Login'
  },
  {
    path: '/login-old',
    component: LoginForm, // Keep old login for fallback
    isPublic: true,
    title: 'Traditional Login'
  },
  {
    path: '/forgot-password',
    component: ForgotPasswordPage,
    isPublic: true,
    title: 'Forgot Password'
  },
  {
    path: '/password-reset/confirm',
    component: PasswordResetConfirmPage,
    isPublic: true,
    title: 'Reset Password'
  },
  {
    path: '/change-password',
    component: ChangePasswordPage,
    requiredRoles: ['owner', 'warden', 'tenant', 'admin'],
    title: 'Change Password',
    showInNav: false
  },

  // Dashboard routes (role-based)
  {
    path: '/dashboard',
    component: ConditionalDashboard,
    requiredRoles: ['owner', 'warden', 'tenant', 'admin'],
    title: 'Dashboard',
    showInNav: true
  },

  // Admin/Owner Management routes
  {
    path: '/user-management',
    component: UserManagement,
    requiredRoles: ['admin', 'owner'],
    title: 'User Management',
    showInNav: true,
    navLabel: 'User Management'
  },

  // Owner/Admin routes
  {
    path: '/branches',
    component: Branches, // Use enhanced Branches component
    requiredRoles: ['owner', 'admin'],
    title: 'Properties',
    showInNav: true,
    navLabel: 'Properties'
  },
  {
    path: '/rooms',
    component: Rooms,
    requiredRoles: ['owner', 'admin', 'warden'],
    title: 'Rooms',
    showInNav: true,
    navLabel: 'Rooms'
  },
  {
    path: '/tenants',
    component: TenantsPage,
    requiredRoles: ['owner', 'admin', 'warden'],
    title: 'Tenants',
    showInNav: true,
    navLabel: 'Tenants'
  },
  {
    path: '/room-status',
    component: RoomStatus,
    requiredRoles: ['owner', 'admin', 'warden'],
    title: 'Room Status',
    showInNav: true,
    navLabel: 'Room Status'
  },

  // Inventory & Management routes
  {
    path: '/groceries',
    component: Groceries,
    requiredRoles: ['owner', 'admin', 'warden'],
    title: 'Groceries & Inventory',
    showInNav: true,
    navLabel: 'Groceries'
  },
  {
    path: '/machines',
    component: Machines,
    requiredRoles: ['owner', 'admin', 'warden'],
    title: 'Machines & Equipment',
    showInNav: true,
    navLabel: 'Machines'
  },
  {
    path: '/workers',
    component: Workers,
    requiredRoles: ['owner', 'admin', 'warden'],
    title: 'Workers Management',
    showInNav: true,
    navLabel: 'Workers'
  },

  // Warden specific routes
  {
    path: '/my-property',
    component: Branches, // Shows role-filtered data
    requiredRoles: ['warden'],
    title: 'My Property',
    showInNav: true,
    navLabel: 'My Property'
  },
  {
    path: '/tenant-requests',
    component: () => <div>Service Requests (To be implemented)</div>,
    requiredRoles: ['warden', 'owner', 'admin'],
    title: 'Service Requests',
    showInNav: true,
    navLabel: 'Service Requests'
  },

  // Food Menu — visible to all authenticated roles
  {
    path: '/food-menu',
    component: FoodMenuPage,
    requiredRoles: ['owner', 'admin', 'warden', 'tenant'],
    title: 'Food Menu',
    showInNav: true,
    navLabel: 'Food Menu'
  },

  // Meal Count — warden/admin/owner can see counts and trigger consumption
  {
    path: '/meal-count',
    component: MealCountPage,
    requiredRoles: ['owner', 'admin', 'warden'],
    title: 'Meal Count',
    showInNav: true,
    navLabel: 'Meal Count'
  },

  // Tenant routes
  {
    path: '/my-availability',
    component: ResidentAvailabilityPage,
    requiredRoles: ['tenant'],
    title: 'My Meal Availability',
    showInNav: true,
    navLabel: 'Meal Availability'
  },
  {
    path: '/my-profile',
    component: Profile,
    requiredRoles: ['tenant'],
    title: 'My Profile',
    showInNav: true,
    navLabel: 'My Profile'
  },
  {
    path: '/my-payments',
    component: () => <div>My Payments (To be implemented)</div>,
    requiredRoles: ['tenant'],
    title: 'My Payments',
    showInNav: true,
    navLabel: 'My Payments'
  },
  {
    path: '/my-requests',
    component: () => <div>My Requests (To be implemented)</div>,
    requiredRoles: ['tenant'],
    title: 'My Requests',
    showInNav: true,
    navLabel: 'My Requests'
  },

  // Shared routes (all authenticated users)
  {
    path: '/profile',
    component: Profile,
    requiredRoles: ['owner', 'warden', 'tenant', 'admin'],
    title: 'Profile',
    showInNav: false // Available in user menu
  },

  // Testing route (admin only)
  {
    path: '/role-test',
    component: RoleTestPage,
    requiredRoles: ['admin'],
    title: 'Role Test',
    showInNav: false
  }
];

// Helper function to get navigation items for a specific role
export const getNavigationItems = (userRole) => {
  return routeConfig.filter(route => 
    route.showInNav && 
    route.requiredRoles && 
    route.requiredRoles.includes(userRole)
  );
};

// Helper function to get public routes
export const getPublicRoutes = () => {
  return routeConfig.filter(route => route.isPublic);
};

// Helper function to get protected routes
export const getProtectedRoutes = () => {
  return routeConfig.filter(route => !route.isPublic);
};
