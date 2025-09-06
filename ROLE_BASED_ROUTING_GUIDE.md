# Role-Based Routing and Components Guide

## Overview
This guide explains how to implement conditional loading of dashboards and components based on user roles in the frontend application.

## 🔧 Core Components

### 1. **ProtectedRoute Component**
Location: `src/components/ProtectedRoute.js`

**Purpose**: Wraps routes to ensure only users with specific roles can access them.

**Usage:**
```jsx
<ProtectedRoute requiredRoles={['owner', 'admin']}>
  <OwnerOnlyComponent />
</ProtectedRoute>
```

**Props:**
- `requiredRoles`: Array of roles that can access the component
- `fallbackPath`: Where to redirect if access denied (default: '/dashboard')
- `showError`: Whether to show error message or redirect (default: true)

### 2. **ConditionalDashboard Component**
Location: `src/components/ConditionalDashboard.js`

**Purpose**: Automatically renders the appropriate dashboard based on user role.

**Logic:**
- Owner → OwnerDashboard
- Warden → WardenDashboard  
- Tenant → TenantDashboard
- Admin → OwnerDashboard

### 3. **RoleBasedComponent Wrapper**
Location: `src/components/RoleBasedComponent.js`

**Purpose**: Conditionally renders content based on user role within components.

**Usage:**
```jsx
<RoleBasedComponent allowedRoles={['owner', 'admin']}>
  <AdminOnlyButton />
</RoleBasedComponent>

<RoleBasedComponent 
  allowedRoles={['warden']} 
  fallback={<div>Access Denied</div>}
>
  <WardenContent />
</RoleBasedComponent>
```

### 4. **useRoleAccess Hook**
Location: `src/hooks/useRoleAccess.js`

**Purpose**: Provides convenient role checking methods throughout the app.

**Available Methods:**
```jsx
const {
  userRole,           // Current user role
  isOwner,           // Boolean: is user owner?
  isWarden,          // Boolean: is user warden?
  isTenant,          // Boolean: is user tenant?
  isAdmin,           // Boolean: is user admin?
  isStaff,           // Boolean: is user staff (owner/warden/admin)?
  canManageProperties, // Boolean: can manage properties?
  canManageTenants,   // Boolean: can manage tenants?
  getDataAccessLevel, // String: 'full', 'owned', 'assigned', 'personal'
  getAvailableActions // Array: available actions for user
} = useRoleAccess();
```

## 🛤️ Route Configuration System

### 5. **Route Config**
Location: `src/config/routes.js`

**Purpose**: Centralized route definitions with role-based access control.

**Structure:**
```javascript
{
  path: '/dashboard',
  component: ConditionalDashboard,
  requiredRoles: ['owner', 'warden', 'tenant', 'admin'],
  title: 'Dashboard',
  showInNav: true,
  navLabel: 'Dashboard'
}
```

**Helper Functions:**
- `getNavigationItems(userRole)` - Get nav items for specific role
- `getPublicRoutes()` - Get routes that don't require auth
- `getProtectedRoutes()` - Get routes that require auth

## 🎯 Implementation Examples

### Example 1: Protected Route in App.js
```jsx
// Automatically generate routes from config
{getProtectedRoutes().map((route) => (
  <Route 
    key={route.path}
    path={route.path} 
    element={
      <ProtectedRoute requiredRoles={route.requiredRoles}>
        <route.component />
      </ProtectedRoute>
    } 
  />
))}
```

### Example 2: Role-Based Navigation
```jsx
// Navigation items automatically filtered by role
const navigationItems = getNavigationItems(userRole);

{navigationItems.map((item) => (
  <ListItem button component={Link} to={item.path} key={item.path}>
    <ListItemText primary={item.navLabel || item.title} />
  </ListItem>
))}
```

### Example 3: Conditional Content Rendering
```jsx
// Show different content based on role
<RoleBasedComponent allowedRoles={['owner', 'admin']}>
  <Button startIcon={<Add />}>Add Property</Button>
</RoleBasedComponent>

<RoleBasedComponent allowedRoles={['warden']}>
  <Typography>View assigned property only</Typography>
</RoleBasedComponent>

<RoleBasedComponent allowedRoles={['tenant']}>
  <Button startIcon={<Add />}>Create Service Request</Button>
</RoleBasedComponent>
```

### Example 4: Using Role Access Hook
```jsx
const { isOwner, canManageProperties, getDataAccessLevel } = useRoleAccess();

// Conditional logic
if (isOwner()) {
  // Show owner-specific features
}

if (canManageProperties()) {
  // Show property management options
}

// Display user's access level
<Chip label={`Access: ${getDataAccessLevel()}`} />
```

### Example 5: Component with Multiple Role Views
```jsx
const BranchesComponent = () => {
  const { userRole, isOwner, isWarden, isAdmin } = useRoleAccess();

  return (
    <Box>
      <Typography variant="h4">
        {isOwner() && "My Properties"}
        {isWarden() && "Assigned Property"}
        {isAdmin() && "All Properties"}
      </Typography>

      {/* Owner/Admin: Grid view with all properties */}
      <RoleBasedComponent allowedRoles={['owner', 'admin']}>
        <PropertiesGrid />
      </RoleBasedComponent>

      {/* Warden: Table view with assigned property */}
      <RoleBasedComponent allowedRoles={['warden']}>
        <AssignedPropertyTable />
      </RoleBasedComponent>

      {/* Role-specific actions */}
      <RoleBasedComponent allowedRoles={['owner', 'admin']}>
        <Button>Add New Property</Button>
      </RoleBasedComponent>
    </Box>
  );
};
```

## 🔄 Data Filtering by Role

### API Calls with Role Context
```jsx
const fetchData = async () => {
  const { userRole } = useRoleAccess();
  
  let endpoint = '/api/branches/';
  
  switch (userRole) {
    case 'warden':
      endpoint = '/api/warden/assigned-property/';
      break;
    case 'tenant':
      endpoint = '/api/tenant/my-info/';
      break;
    // owner and admin use default endpoint
  }
  
  const response = await api.get(endpoint);
  return response.data;
};
```

### Component State Based on Role
```jsx
const [viewMode, setViewMode] = useState(() => {
  const { userRole } = useRoleAccess();
  return userRole === 'warden' ? 'table' : 'grid';
});

const [allowedActions, setAllowedActions] = useState(() => {
  const { getAvailableActions } = useRoleAccess();
  return getAvailableActions();
});
```

## 🎨 UI Variations by Role

### Different Layouts
```jsx
// Owner: Dashboard with multiple property cards
<RoleBasedComponent allowedRoles={['owner', 'admin']}>
  <Grid container spacing={3}>
    {properties.map(property => <PropertyCard key={property.id} />)}
  </Grid>
</RoleBasedComponent>

// Warden: Single property focus
<RoleBasedComponent allowedRoles={['warden']}>
  <Card>
    <AssignedPropertyDetails />
  </Card>
</RoleBasedComponent>

// Tenant: Personal dashboard
<RoleBasedComponent allowedRoles={['tenant']}>
  <PersonalDashboard />
</RoleBasedComponent>
```

### Role-Specific Colors and Icons
```jsx
const getRoleTheme = () => {
  const { userRole } = useRoleAccess();
  
  const themes = {
    owner: { color: 'primary', icon: <Business /> },
    warden: { color: 'secondary', icon: <Security /> },
    tenant: { color: 'info', icon: <Person /> },
    admin: { color: 'error', icon: <AdminPanel /> }
  };
  
  return themes[userRole] || themes.tenant;
};
```

## 🔐 Security Best Practices

### 1. **Always Validate on Backend**
- Frontend role checks are for UX only
- Backend must validate all permissions
- Never trust client-side role information

### 2. **Graceful Degradation**
- Provide fallback content for unauthorized users
- Show appropriate error messages
- Redirect to appropriate pages

### 3. **Consistent Role Checking**
- Use the same role checking logic throughout app
- Centralize role definitions
- Keep role names consistent between frontend and backend

## 🚀 Testing Role-Based Features

### Test Scenarios
1. **Login with different roles** - Verify correct dashboard loads
2. **Navigation access** - Check only appropriate menu items show
3. **Component visibility** - Verify role-specific content appears
4. **Route protection** - Test unauthorized access attempts
5. **Data filtering** - Confirm users see only their data

### Testing Code
```jsx
// Example test for role-based routing
describe('Role-based routing', () => {
  test('Owner sees all properties', async () => {
    mockUserRole('owner');
    render(<App />);
    expect(screen.getByText('My Properties')).toBeInTheDocument();
    expect(screen.getByText('Add Property')).toBeInTheDocument();
  });

  test('Tenant sees personal dashboard', async () => {
    mockUserRole('tenant');
    render(<App />);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.queryByText('Add Property')).not.toBeInTheDocument();
  });
});
```

This comprehensive system provides flexible, maintainable role-based access control throughout your React application while ensuring a great user experience for each role type.
