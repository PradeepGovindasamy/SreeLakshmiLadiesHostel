// src/components/dashboards/WardenDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Divider,
  LinearProgress, Alert, IconButton, Tooltip, Button, List, ListItem,
  ListItemText, ListItemIcon, Badge
} from '@mui/material';
import {
  Home, People, ListAlt, CheckCircle, Warning, Phone, Email,
  Room, Payment, Visibility, Edit, PriorityHigh, Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { enhancedAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';

const WardenDashboard = () => {
  const navigate = useNavigate();
  const { user, getUserName } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    assignedProperty: null,
    tenants: [],
    recentRequests: [],
    pendingRequests: [],
    statistics: {
      totalRooms: 0,
      occupiedRooms: 0,
      totalTenants: 0,
      pendingRequests: 0,
      urgentRequests: 0,
      monthlyCollection: 0
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch assigned property and related data
      const propertyResponse = await api.get('/api/warden/assigned-property/');
      const assignedProperty = propertyResponse.data;

      // Fetch tenants in assigned property
      const tenantsResponse = await api.get('/api/tenants/');
      const tenants = tenantsResponse.data.results || tenantsResponse.data;

      // Fetch service requests for assigned property
      const requestsResponse = await api.get('/api/tenant-requests/');
      const requests = requestsResponse.data.results || requestsResponse.data;

      // Separate pending and recent requests
      const pendingRequests = requests.filter(req => 
        req.status === 'open' || req.status === 'in_progress'
      );
      const recentRequests = requests.slice(0, 10);

      // Calculate statistics
      const totalRooms = assignedProperty?.num_rooms || assignedProperty?.total_rooms || 0;
      const occupiedRooms = assignedProperty?.occupied_rooms || 0;
      const totalTenants = tenants.length;
      const pendingCount = pendingRequests.length;
      const urgentRequests = pendingRequests.filter(req => 
        req.priority === 'urgent' || req.priority === 'high'
      ).length;
      const monthlyCollection = tenants.reduce((sum, tenant) => 
        sum + (tenant.rent_amount || 0), 0
      );

      setDashboardData({
        assignedProperty,
        tenants,
        recentRequests,
        pendingRequests,
        statistics: {
          totalRooms,
          occupiedRooms,
          totalTenants,
          pendingRequests: pendingCount,
          urgentRequests,
          monthlyCollection
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

  const StatCard = ({ title, value, icon, color = 'primary', subtitle, onClick }) => (
    <Card sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
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

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'error',
      'high': 'warning',
      'medium': 'info',
      'low': 'default'
    };
    return colors[priority] || 'default';
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

  const { assignedProperty, tenants, recentRequests, pendingRequests, statistics } = dashboardData;
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
          Warden Dashboard - {assignedProperty?.name || 'Assigned Property'}
        </Typography>
        {assignedProperty && (
          <Box mt={1}>
            <Chip 
              label={`${assignedProperty.address}, ${assignedProperty.city}`}
              variant="outlined"
              color="primary"
            />
          </Box>
        )}
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Total Rooms" 
            value={statistics.totalRooms}
            icon={<Home />}
            color="info"
            onClick={() => navigate('/rooms')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Occupied" 
            value={statistics.occupiedRooms}
            icon={<People />}
            color="success"
            subtitle={`${occupancyRate}% occupancy`}
            onClick={() => navigate('/tenants')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Total Tenants" 
            value={statistics.totalTenants}
            icon={<People />}
            color="primary"
            onClick={() => navigate('/tenants')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Pending Requests" 
            value={statistics.pendingRequests}
            icon={<ListAlt />}
            color="warning"
            onClick={() => navigate('/tenant-requests')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Urgent Tasks" 
            value={statistics.urgentRequests}
            icon={
              <Badge badgeContent={statistics.urgentRequests} color="error">
                <PriorityHigh />
              </Badge>
            }
            color="error"
            onClick={() => navigate('/tenant-requests?priority=urgent,high')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard 
            title="Monthly Collection" 
            value={`₹${statistics.monthlyCollection.toLocaleString()}`}
            icon={<Payment />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Urgent Requests */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                <Typography variant="h6" color="error">
                  Urgent Requests
                </Typography>
                <Badge badgeContent={statistics.urgentRequests} color="error">
                  <Notifications />
                </Badge>
              </Box>
              <Box sx={{ maxHeight: '320px', overflowY: 'auto' }}>
                <List dense>
                  {pendingRequests
                    .filter(req => req.priority === 'urgent' || req.priority === 'high')
                    .map((request) => (
                    <ListItem key={request.id} divider>
                      <ListItemIcon>
                        <PriorityHigh color={getPriorityColor(request.priority)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {request.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              {request.tenant_name} • Room {request.tenant_room}
                            </Typography>
                            <br />
                            <Chip 
                              label={request.priority_display} 
                              color={getPriorityColor(request.priority)}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/tenant-requests/${request.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </ListItem>
                  ))}
                  {statistics.urgentRequests === 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="No urgent requests"
                        secondary="All caught up!"
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tenants Overview */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Current Tenants</Typography>
                <Button 
                  startIcon={<People />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/tenants')}
                >
                  View All Tenants
                </Button>
              </Box>
              <Box sx={{ maxHeight: '320px', overflowY: 'auto' }}>
                <TableContainer>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tenant Name</TableCell>
                        <TableCell>Room</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell align="right">Rent</TableCell>
                        <TableCell>Joined</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tenants.map((tenant) => (
                        <TableRow key={tenant.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {tenant.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {tenant.room_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="caption" display="flex" alignItems="center">
                                <Phone sx={{ fontSize: 12, mr: 0.5 }} />
                                {tenant.phone_number}
                              </Typography>
                              <Typography variant="caption" display="flex" alignItems="center">
                                <Email sx={{ fontSize: 12, mr: 0.5 }} />
                                {tenant.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              ₹{tenant.rent_amount?.toLocaleString() || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(tenant.date_of_joining).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Profile">
                              <IconButton 
                                size="small" 
                                onClick={() => navigate(`/tenants/${tenant.id}`)}
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
              </Box>
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
                  startIcon={<ListAlt />} 
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
                      <TableCell>Room</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentRequests.slice(0, 5).map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {request.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {request.description?.substring(0, 40)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.tenant_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.tenant_room}
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
                            color={getPriorityColor(request.priority)}
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
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/tenant-requests/${request.id}`)}
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
      </Grid>
    </Box>
  );
};

export default WardenDashboard;
