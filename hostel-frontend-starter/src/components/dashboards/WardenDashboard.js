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
      const [branchesRes, tenantsRes, roomsRes] = await Promise.all([
        enhancedAPI.branches.list(),
        enhancedAPI.tenants.list(),
        enhancedAPI.rooms.list(),
      ]);
      const branches = branchesRes.data.results || branchesRes.data || [];
      const allTenants = tenantsRes.data.results || tenantsRes.data || [];
      const rooms = roomsRes.data.results || roomsRes.data || [];

      const activeTenants = allTenants.filter(t => t.joining_date && !t.vacating_date);
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => (r.current_occupancy || 0) > 0).length;
      const monthlyCollection = activeTenants.reduce((s, t) => s + (parseFloat(t.rent_amount) || 0), 0);
      const assignedProperty = branches.length > 0 ? branches[0] : null;

      setDashboardData({
        assignedProperty,
        tenants: activeTenants,
        recentRequests: [],
        pendingRequests: [],
        statistics: {
          totalRooms,
          occupiedRooms,
          totalTenants: activeTenants.length,
          pendingRequests: 0,
          urgentRequests: 0,
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

  const StatCard = ({ title, value, icon, gradient, subtitle, onClick }) => (
    <Card elevation={0} onClick={onClick} sx={{ height: '100%', border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: gradient }} />
      <CardContent sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</Typography>
            <Typography variant="h3" fontWeight={800} color="grey.900" sx={{ mt: 0.5, lineHeight: 1 }}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ borderRadius: 2, background: gradient, width: 44, height: 44 }}>{icon}</Avatar>
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
      <Box sx={{ p: 4 }}>
        <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
        <Typography color="text.secondary">Loading dashboard…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}
          action={<Button size="small" onClick={fetchDashboardData}>Retry</Button>}
        >{error}</Alert>
      </Box>
    );
  }

  const { assignedProperty, tenants, recentRequests, pendingRequests, statistics } = dashboardData;
  const occupancyRate = statistics.totalRooms > 0 ?
    Math.round((statistics.occupiedRooms / statistics.totalRooms) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
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
            gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)"
            onClick={() => navigate('/rooms')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Occupied"
            value={statistics.occupiedRooms}
            icon={<People />}
            gradient="linear-gradient(135deg,#10b981,#059669)"
            subtitle={`${occupancyRate}% occupancy`}
            onClick={() => navigate('/tenants')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Tenants"
            value={statistics.totalTenants}
            icon={<People />}
            gradient="linear-gradient(135deg,#1e40af,#3b82f6)"
            onClick={() => navigate('/tenants')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Pending Requests"
            value={statistics.pendingRequests}
            icon={<ListAlt />}
            gradient="linear-gradient(135deg,#f59e0b,#d97706)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Urgent Tasks"
            value={statistics.urgentRequests}
            icon={<PriorityHigh />}
            gradient="linear-gradient(135deg,#ef4444,#dc2626)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Monthly Collection"
            value={`₹${statistics.monthlyCollection.toLocaleString()}`}
            icon={<Payment />}
            gradient="linear-gradient(135deg,#10b981,#059669)"
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
