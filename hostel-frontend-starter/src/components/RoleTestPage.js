// src/components/RoleTestPage.js
import React from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Chip, 
  Alert, List, ListItem, ListItemText, Divider 
} from '@mui/material';
import { useRoleAccess } from '../hooks/useRoleAccess';
import RoleBasedComponent from './RoleBasedComponent';

const RoleTestPage = () => {
  const {
    userRole,
    isOwner,
    isWarden,
    isTenant,
    isAdmin,
    isStaff,
    canManageProperties,
    canManageTenants,
    canViewFinancials,
    canCreateRequests,
    canManageRequests,
    getDataAccessLevel,
    getAvailableActions
  } = useRoleAccess();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Role-Based Component Testing Page
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page demonstrates how role-based components work. Different content will appear based on your role.
      </Alert>

      <Grid container spacing={3}>
        {/* User Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current User Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip label={`Role: ${userRole}`} color="primary" sx={{ mr: 1 }} />
                <Chip label={`Access Level: ${getDataAccessLevel()}`} color="secondary" />
              </Box>
              
              <Typography variant="body2" gutterBottom>
                <strong>Role Checks:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary={`Is Owner: ${isOwner()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Is Warden: ${isWarden()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Is Tenant: ${isTenant()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Is Admin: ${isAdmin()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Is Staff: ${isStaff()}`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Permissions & Actions
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Permissions:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary={`Can Manage Properties: ${canManageProperties()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Can Manage Tenants: ${canManageTenants()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Can View Financials: ${canViewFinancials()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Can Create Requests: ${canCreateRequests()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`Can Manage Requests: ${canManageRequests()}`} />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" gutterBottom>
                <strong>Available Actions:</strong>
              </Typography>
              <Box>
                {getAvailableActions().map((action, index) => (
                  <Chip 
                    key={index}
                    label={action.replace('_', ' ')}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Role-Based Content Examples */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role-Based Content Examples
              </Typography>

              {/* Owner-only content */}
              <RoleBasedComponent allowedRoles={['owner']}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  🏢 <strong>Owner Content:</strong> You can see this because you're an owner!
                  <Box sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>
                      Add Property
                    </Button>
                    <Button variant="outlined" size="small">
                      View Revenue Reports
                    </Button>
                  </Box>
                </Alert>
              </RoleBasedComponent>

              {/* Warden-only content */}
              <RoleBasedComponent allowedRoles={['warden']}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  🛡️ <strong>Warden Content:</strong> You can see this because you're a warden!
                  <Box sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>
                      Manage Assigned Property
                    </Button>
                    <Button variant="outlined" size="small">
                      Handle Service Requests
                    </Button>
                  </Box>
                </Alert>
              </RoleBasedComponent>

              {/* Tenant-only content */}
              <RoleBasedComponent allowedRoles={['tenant']}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  👤 <strong>Tenant Content:</strong> You can see this because you're a tenant!
                  <Box sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>
                      Create Service Request
                    </Button>
                    <Button variant="outlined" size="small">
                      View My Payments
                    </Button>
                  </Box>
                </Alert>
              </RoleBasedComponent>

              {/* Admin-only content */}
              <RoleBasedComponent allowedRoles={['admin']}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  ⚙️ <strong>Admin Content:</strong> You can see this because you're an admin!
                  <Box sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>
                      System Settings
                    </Button>
                    <Button variant="outlined" size="small">
                      Manage All Users
                    </Button>
                  </Box>
                </Alert>
              </RoleBasedComponent>

              {/* Staff-only content (Owner, Warden, Admin) */}
              <RoleBasedComponent allowedRoles={['owner', 'warden', 'admin']}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  👥 <strong>Staff Content:</strong> You can see this because you're staff (Owner/Warden/Admin)!
                  <Box sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>
                      Staff Dashboard
                    </Button>
                    <Button variant="outlined" size="small">
                      Manage Service Requests
                    </Button>
                  </Box>
                </Alert>
              </RoleBasedComponent>

              {/* Multiple role example */}
              <RoleBasedComponent allowedRoles={['owner', 'admin']}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  🔒 <strong>Owner/Admin Only:</strong> High-level management features
                  <Box sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>
                      Financial Reports
                    </Button>
                    <Button variant="outlined" size="small">
                      System Analytics
                    </Button>
                  </Box>
                </Alert>
              </RoleBasedComponent>

              {/* Content with fallback */}
              <RoleBasedComponent 
                allowedRoles={['nonexistent']} 
                fallback={
                  <Alert severity="info">
                    📝 <strong>Fallback Content:</strong> This shows when you don't have the required role
                  </Alert>
                }
              >
                <Alert severity="success">
                  This won't show unless you have the 'nonexistent' role
                </Alert>
              </RoleBasedComponent>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoleTestPage;
