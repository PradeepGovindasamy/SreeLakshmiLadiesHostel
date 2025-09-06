// src/components/RoleFilteredBranches.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Alert, Card, CardContent, Grid, 
  Button, Chip, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper 
} from '@mui/material';
import { Add, Visibility, Edit } from '@mui/icons-material';
import { useRoleAccess } from '../hooks/useRoleAccess';
import RoleBasedComponent from './RoleBasedComponent';
import { enhancedAPI } from '../api';

const RoleFilteredBranches = () => {
  const { 
    userRole, 
    isOwner, 
    isWarden, 
    isAdmin, 
    canManageProperties,
    getDataAccessLevel 
  } = useRoleAccess();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      
      // Fetch different data based on role
      let endpoint = '/api/branches/';
      
      if (isWarden()) {
        // Wardens only see their assigned property
        endpoint = '/api/warden/assigned-property/';
      }
      
      const response = await api.get(endpoint);
      const data = response.data;
      
      // Handle different response formats
      if (isWarden()) {
        setBranches(data ? [data] : []);
      } else {
        setBranches(data.results || data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    switch (userRole) {
      case 'owner':
        return 'My Properties';
      case 'warden':
        return 'Assigned Property';
      case 'admin':
        return 'All Properties';
      default:
        return 'Properties';
    }
  };

  const getPageDescription = () => {
    switch (userRole) {
      case 'owner':
        return 'Manage your owned properties and their details';
      case 'warden':
        return 'View and manage your assigned property';
      case 'admin':
        return 'System-wide property management';
      default:
        return 'Property information';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Loading Properties...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchBranches} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with role-based title */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {getPageTitle()}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {getPageDescription()}
          </Typography>
          <Chip 
            label={`Access Level: ${getDataAccessLevel()}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Role-based action buttons */}
        <RoleBasedComponent allowedRoles={['owner', 'admin']}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => console.log('Add new property')}
          >
            Add Property
          </Button>
        </RoleBasedComponent>
      </Box>

      {/* Properties Grid for Owner/Admin */}
      <RoleBasedComponent allowedRoles={['owner', 'admin']}>
        <Grid container spacing={3} mb={4}>
          {branches.map((branch) => (
            <Grid item xs={12} md={6} lg={4} key={branch.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {branch.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {branch.address}, {branch.city}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Box>
                      <Typography variant="caption" display="block">
                        Rooms: {branch.num_rooms || branch.total_rooms || 0}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Occupied: {branch.occupied_rooms || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Button size="small" startIcon={<Visibility />}>
                        View
                      </Button>
                      <RoleBasedComponent allowedRoles={['owner', 'admin']}>
                        <Button size="small" startIcon={<Edit />}>
                          Edit
                        </Button>
                      </RoleBasedComponent>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </RoleBasedComponent>

      {/* Table View for Warden */}
      <RoleBasedComponent allowedRoles={['warden']}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Property Details
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Property Name</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Total Rooms</TableCell>
                    <TableCell>Occupied Rooms</TableCell>
                    <TableCell>Occupancy Rate</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branches.map((branch) => {
                    const totalRooms = branch.num_rooms || branch.total_rooms || 0;
                    const occupancyRate = totalRooms > 0 
                      ? Math.round((branch.occupied_rooms / totalRooms) * 100)
                      : 0;
                    
                    return (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {branch.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {branch.address}, {branch.city}
                          </Typography>
                        </TableCell>
                        <TableCell>{branch.num_rooms || branch.total_rooms || 0}</TableCell>
                        <TableCell>{branch.occupied_rooms || 0}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${occupancyRate}%`}
                            color={occupancyRate > 80 ? 'success' : occupancyRate > 50 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" startIcon={<Visibility />}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </RoleBasedComponent>

      {/* No properties message */}
      {branches.length === 0 && (
        <Alert severity="info">
          No properties found. 
          <RoleBasedComponent allowedRoles={['owner', 'admin']} hideInsteadOfFallback>
            Click "Add Property" to create your first property.
          </RoleBasedComponent>
        </Alert>
      )}
    </Box>
  );
};

export default RoleFilteredBranches;
