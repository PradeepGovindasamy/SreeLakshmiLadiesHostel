// src/components/dashboards/TenantDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Divider,
  LinearProgress, Alert, IconButton, Tooltip, Button, List, ListItem,
  ListItemText, ListItemIcon, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Person, Home, Payment, ListAlt, Add, Edit, Visibility,
  Phone, Email, CalendarToday, LocationOn, AccountBalance,
  CheckCircle, Warning, Error, Info, Send
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { enhancedAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, getUserName } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    tenantProfile: null,
    recentPayments: [],
    serviceRequests: [],
    roomDetails: null,
    statistics: {
      totalRequests: 0,
      pendingRequests: 0,
      resolvedRequests: 0,
      totalPayments: 0,
      pendingPayments: 0
    }
  });

  const [newRequest, setNewRequest] = useState({
    request_type: '',
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch tenant profile
      const profileResponse = await api.get('/api/auth/profile/');
      const tenantProfile = profileResponse.data;

      // Fetch tenant's service requests
      const requestsResponse = await api.get('/api/tenant-requests/my/');
      const serviceRequests = requestsResponse.data.results || requestsResponse.data;

      // Fetch tenant's payments
      const paymentsResponse = await api.get('/api/payments/my/');
      const payments = paymentsResponse.data.results || paymentsResponse.data;

      // Fetch room details
      const roomResponse = await api.get('/api/tenants/my-room/');
      const roomDetails = roomResponse.data;

      // Calculate statistics
      const totalRequests = serviceRequests.length;
      const pendingRequests = serviceRequests.filter(req => 
        req.status === 'open' || req.status === 'in_progress'
      ).length;
      const resolvedRequests = serviceRequests.filter(req => 
        req.status === 'resolved' || req.status === 'closed'
      ).length;
      const totalPayments = payments.length;
      const pendingPayments = payments.filter(pay => pay.status === 'pending').length;

      setDashboardData({
        tenantProfile,
        recentPayments: payments.slice(0, 5),
        serviceRequests: serviceRequests.slice(0, 10),
        roomDetails,
        statistics: {
          totalRequests,
          pendingRequests,
          resolvedRequests,
          totalPayments,
          pendingPayments
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

  const handleSubmitRequest = async () => {
    try {
      await api.post('/api/tenant-requests/', newRequest);
      setOpenRequestDialog(false);
      setNewRequest({
        request_type: '',
        title: '',
        description: '',
        priority: 'medium'
      });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Failed to submit request:', err);
      setError('Failed to submit request');
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
      'open': 'warning',
      'in_progress': 'info', 
      'resolved': 'success',
      'closed': 'default',
      'pending': 'warning',
      'paid': 'success',
      'overdue': 'error'
    };
    return (
      <Chip 
        label={status?.replace('_', ' ').toUpperCase()} 
        color={statusColors[status] || 'default'} 
        size="small"
      />
    );
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      'urgent': <Error color="error" />,
      'high': <Warning color="warning" />,
      'medium': <Info color="info" />,
      'low': <CheckCircle color="success" />
    };
    return icons[priority] || <Info />;
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

  const { tenantProfile, recentPayments, serviceRequests, roomDetails, statistics } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {getUserName()}!
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Tenant Dashboard - Your hostel information
        </Typography>
      </Box>

      {/* Profile Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                  <Person fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6">{tenantProfile?.name || getUserName()}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {profile?.role?.toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" display="flex" alignItems="center" mb={1}>
                  <Phone sx={{ fontSize: 16, mr: 1 }} />
                  {tenantProfile?.phone_number || 'N/A'}
                </Typography>
                <Typography variant="body2" display="flex" alignItems="center" mb={1}>
                  <Email sx={{ fontSize: 16, mr: 1 }} />
                  {tenantProfile?.email || user?.email}
                </Typography>
                <Typography variant="body2" display="flex" alignItems="center" mb={1}>
                  <CalendarToday sx={{ fontSize: 16, mr: 1 }} />
                  Joined: {tenantProfile?.date_of_joining ? 
                    new Date(tenantProfile.date_of_joining).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                <Home sx={{ mr: 1 }} />
                Room Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" mb={1}>
                  <strong>Room:</strong> {roomDetails?.room_name || 'N/A'}
                </Typography>
                <Typography variant="body2" mb={1}>
                  <strong>Type:</strong> {roomDetails?.room_type || 'N/A'}
                </Typography>
                <Typography variant="body2" mb={1}>
                  <strong>Rent:</strong> ₹{roomDetails?.rent_amount?.toLocaleString() || 0}/month
                </Typography>
                <Typography variant="body2" mb={1} display="flex" alignItems="center">
                  <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                  {roomDetails?.branch_name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {roomDetails?.branch_address || 'Address not available'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                <AccountBalance sx={{ mr: 1 }} />
                Quick Actions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" flexDirection="column" gap={1}>
                <Button 
                  variant="outlined" 
                  startIcon={<Add />}
                  fullWidth
                  onClick={() => setOpenRequestDialog(true)}
                >
                  New Service Request
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Payment />}
                  fullWidth
                  onClick={() => navigate('/payments')}
                >
                  View Payments
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<ListAlt />}
                  fullWidth
                  onClick={() => navigate('/my-requests')}
                >
                  My Requests
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Requests" 
            value={statistics.totalRequests}
            icon={<ListAlt />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Requests" 
            value={statistics.pendingRequests}
            icon={<Warning />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Resolved Requests" 
            value={statistics.resolvedRequests}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Payment Status" 
            value={statistics.pendingPayments}
            icon={<Payment />}
            color={statistics.pendingPayments > 0 ? "error" : "success"}
            subtitle={statistics.pendingPayments > 0 ? "Pending" : "Up to date"}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Service Requests */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">My Service Requests</Typography>
                <Button 
                  startIcon={<Add />} 
                  variant="contained" 
                  size="small"
                  onClick={() => setOpenRequestDialog(true)}
                >
                  New Request
                </Button>
              </Box>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceRequests.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {request.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {request.description?.substring(0, 50)}...
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
                          <Box display="flex" alignItems="center">
                            {getPriorityIcon(request.priority)}
                            <Typography variant="body2" ml={1}>
                              {request.priority_display}
                            </Typography>
                          </Box>
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
                              onClick={() => navigate(`/requests/${request.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {serviceRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No service requests yet. Create your first request!
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payments */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Payments</Typography>
                <Button 
                  startIcon={<Payment />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/payments')}
                >
                  View All
                </Button>
              </Box>
              <List dense sx={{ maxHeight: 350, overflowY: 'auto' }}>
                {recentPayments.map((payment) => (
                  <ListItem key={payment.id} divider>
                    <ListItemIcon>
                      <Payment color={payment.status === 'paid' ? 'success' : 'warning'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          ₹{payment.amount?.toLocaleString()}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            {payment.month} {payment.year}
                          </Typography>
                          <br />
                          {getStatusChip(payment.status)}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {recentPayments.length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="No payment records"
                      secondary="Payment history will appear here"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Request Dialog */}
      <Dialog 
        open={openRequestDialog} 
        onClose={() => setOpenRequestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Service Request</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Request Type</InputLabel>
              <Select
                value={newRequest.request_type}
                onChange={(e) => setNewRequest({...newRequest, request_type: e.target.value})}
                label="Request Type"
              >
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="complaint">Complaint</MenuItem>
                <MenuItem value="service">Service</MenuItem>
                <MenuItem value="payment">Payment Issue</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                value={newRequest.priority}
                onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Title"
              value={newRequest.title}
              onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
              placeholder="Brief description of the issue"
            />

            <TextField
              fullWidth
              margin="normal"
              label="Description"
              multiline
              rows={4}
              value={newRequest.description}
              onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
              placeholder="Detailed description of the issue"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitRequest}
            variant="contained"
            startIcon={<Send />}
            disabled={!newRequest.request_type || !newRequest.title || !newRequest.description}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantDashboard;
