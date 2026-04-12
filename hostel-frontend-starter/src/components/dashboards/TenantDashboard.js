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
      const tenantsRes = await enhancedAPI.tenants.list();
      const allTenants = tenantsRes.data.results || tenantsRes.data || [];
      // Find the current user's tenant record
      const myTenant = allTenants.find(t => t.user === user?.id || t.user?.id === user?.id) || null;

      let paymentsData = [];
      try {
        const paymentsRes = await enhancedAPI.payments.list();
        paymentsData = paymentsRes.data.results || paymentsRes.data || [];
      } catch (_) {
        // Payments endpoint may not be available yet
      }

      const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
      setDashboardData({
        tenantProfile: myTenant,
        recentPayments: paymentsData.slice(0, 5),
        serviceRequests: [],
        roomDetails: myTenant
          ? { room_number: myTenant.room_display, branch: myTenant.branch_name }
          : null,
        statistics: {
          totalRequests: 0,
          pendingRequests: 0,
          resolvedRequests: 0,
          totalPayments: paymentsData.length,
          pendingPayments,
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
    // Service requests endpoint not yet available
    setOpenRequestDialog(false);
    setNewRequest({ request_type: '', title: '', description: '', priority: 'medium' });
  };

  const StatCard = ({ title, value, icon, gradient, subtitle }) => (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', position: 'relative', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
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
      <Box sx={{ p: 4 }}>
        <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
        <Typography color="text.secondary">Loading your dashboard…</Typography>
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
