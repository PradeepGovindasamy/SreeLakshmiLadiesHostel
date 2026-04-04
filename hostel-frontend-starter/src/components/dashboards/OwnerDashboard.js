// src/components/dashboards/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Divider,
  LinearProgress, Alert, IconButton, Tooltip, Button
} from '@mui/material';
import {
  Business, Home, People, Payment, TrendingUp, ListAlt,
  Visibility, Edit, Add, Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { enhancedAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, getUserName } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    properties: [],
    tenants: [],
    recentRequests: [],
    statistics: {
      totalProperties: 0,
      totalRooms: 0,
      occupiedRooms: 0,
      totalTenants: 0,
      pendingRequests: 0,
      monthlyRevenue: 0
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch properties (branches)
      const propertiesResponse = await enhancedAPI.branches.list();
      const properties = propertiesResponse.data.results || propertiesResponse.data;

      // Fetch tenants for owned properties
      const tenantsResponse = await enhancedAPI.tenants.list();
      const tenants = tenantsResponse.data.results || tenantsResponse.data;

      // Fetch recent service requests - temporarily commented out as endpoint might not be available
      // const requestsResponse = await api.get('/api/tenant-requests/?limit=10');
      const recentRequests = []; // Empty array until tenant requests are fixed

      // Calculate statistics
      const totalProperties = properties.length;
      const totalRooms = properties.reduce((sum, property) => sum + (property.num_rooms || property.total_rooms || 0), 0);
      const occupiedRooms = properties.reduce((sum, property) => sum + (property.occupied_rooms || 0), 0);
      const totalTenants = tenants.length;
      const pendingRequests = recentRequests.filter(req => req.status === 'open' || req.status === 'in_progress').length;
      const monthlyRevenue = tenants.reduce((sum, tenant) => sum + (tenant.rent_amount || 0), 0);

      setDashboardData({
        properties,
        tenants: tenants.slice(0, 10), // Show recent 10 tenants
        recentRequests: recentRequests.slice(0, 5), // Show recent 5 requests
        statistics: {
          totalProperties,
          totalRooms,
          occupiedRooms,
          totalTenants,
          pendingRequests,
          monthlyRevenue
        }
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusChip = (status) => {
    const statusColors = {
      'open': 'error',
      'in_progress': 'warning', 
      'resolved': 'success',
      'closed': 'default'
    };
    return (
      <Chip 
        label={status?.replace('_', ' ').toUpperCase()} 
        color={statusColors[status] || 'default'} 
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Loading Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchDashboardData} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  const { properties, tenants, recentRequests, statistics } = dashboardData;
  const occupancyRate = statistics.totalRooms > 0 ? 
    Math.round((statistics.occupiedRooms / statistics.totalRooms) * 100) : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {getUserName()}!
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Owner Dashboard - Manage your properties and tenants
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Properties" 
            value={statistics.totalProperties}
            icon={<Business />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Total Rooms" 
            value={statistics.totalRooms}
            icon={<Home />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Occupied" 
            value={statistics.occupiedRooms}
            icon={<People />}
            color="success"
            subtitle={`${occupancyRate}% occupancy`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Total Tenants" 
            value={statistics.totalTenants}
            icon={<People />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Pending Requests" 
            value={statistics.pendingRequests}
            icon={<ListAlt />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Monthly Revenue" 
            value={`₹${statistics.monthlyRevenue.toLocaleString()}`}
            icon={<Payment />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Properties Overview */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">My Properties</Typography>
                <Button 
                  startIcon={<Add />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/branches')}
                >
                  Manage Properties
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Property Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell align="center">Rooms</TableCell>
                      <TableCell align="center">Occupied</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {property.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {property.city}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{property.num_rooms || property.total_rooms || 0}</TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center">
                            {property.occupied_rooms || 0}
                            <Box ml={1} width={40}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(property.num_rooms || property.total_rooms) > 0 ? 
                                  (property.occupied_rooms / (property.num_rooms || property.total_rooms)) * 100 : 0}
                                size="small"
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/branches/${property.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tenants */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Tenants</Typography>
                <Button 
                  startIcon={<People />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/tenants')}
                >
                  View All Tenants
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tenant Name</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Property</TableCell>
                      <TableCell align="right">Rent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {tenant.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {tenant.phone_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {tenant.room_name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {tenant.branch_name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            ₹{tenant.rent_amount?.toLocaleString() || 0}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Service Requests */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Service Requests</Typography>
                <Button 
                  startIcon={<Assessment />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/tenant-requests')}
                >
                  View All Requests
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request</TableCell>
                      <TableCell>Tenant</TableCell>
                      <TableCell>Property</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {request.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {request.description?.substring(0, 50)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.tenant_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.branch_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={request.request_type_display} 
                            variant="outlined" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={request.priority_display} 
                            color={request.priority === 'urgent' ? 'error' : 
                                  request.priority === 'high' ? 'warning' : 'default'} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {getStatusChip(request.status)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(request.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OwnerDashboard;
