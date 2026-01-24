import React, { useState, useEffect } from 'react';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Collapse,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Block as BlockIcon,
  ExitToApp as ExitToAppIcon,
  Restore as RestoreIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon
} from '@mui/icons-material';

function SimpleTenants() {
  // Active tenants state
  const [activeTenants, setActiveTenants] = useState([]);
  const [activeLoading, setActiveLoading] = useState(true);
  
  // Vacated tenants state
  const [vacatedTenants, setVacatedTenants] = useState([]);
  const [vacatedLoading, setVacatedLoading] = useState(false);
  const [vacatedExpanded, setVacatedExpanded] = useState(false);
  const [vacatedDataLoaded, setVacatedDataLoaded] = useState(false);
  const [vacatedPage, setVacatedPage] = useState(0);
  const [vacatedRowsPerPage, setVacatedRowsPerPage] = useState(10);
  
  // Common state
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutTenant, setCheckoutTenant] = useState(null);
  const [vacatingDate, setVacatingDate] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    room: '',
    joining_date: '',
    vacating_date: '',
    id_proof_type: '',
    id_proof_number: '',
    father_name: '',
    father_aadhar: '',
    mother_name: '',
    mother_aadhar: '',
    guardian_name: '',
    guardian_aadhar: ''
  });

  const { getUserRole, hasAnyRole } = useUser();
  const userRole = getUserRole();

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch vacated tenants when section is expanded
  useEffect(() => {
    if (vacatedExpanded && !vacatedDataLoaded) {
      fetchVacatedTenants();
    }
  }, [vacatedExpanded]);

  const fetchInitialData = async () => {
    try {
      setActiveLoading(true);
      const [branchesRes, roomsRes] = await Promise.all([
        enhancedAPI.branches.list(),
        enhancedAPI.rooms.list()
      ]);
      
      setBranches(branchesRes.data || []);
      setRooms(roomsRes.data || []);
      
      // Fetch active tenants
      await fetchActiveTenants();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setActiveLoading(false);
    }
  };

  const fetchActiveTenants = async () => {
    try {
      setActiveLoading(true);
      const response = await enhancedAPI.tenants.list({ status: 'active' });
      // Filter to ensure only active tenants (no vacating_date)
      const activeOnly = (response.data || []).filter(tenant => !tenant.vacating_date);
      setActiveTenants(activeOnly);
    } catch (err) {
      console.error('Error fetching active tenants:', err);
      setError('Failed to load active tenants. Please try again.');
    } finally {
      setActiveLoading(false);
    }
  };

  const fetchVacatedTenants = async () => {
    try {
      setVacatedLoading(true);
      const response = await enhancedAPI.tenants.list({ status: 'vacated' });
      // Filter to ensure only vacated tenants (has vacating_date)
      const vacatedOnly = (response.data || []).filter(tenant => tenant.vacating_date);
      setVacatedTenants(vacatedOnly);
      setVacatedDataLoaded(true);
    } catch (err) {
      console.error('Error fetching vacated tenants:', err);
      setAlert({ open: true, message: 'Failed to load vacated tenants', severity: 'error' });
    } finally {
      setVacatedLoading(false);
    }
  };

  const fetchData = async () => {
    await fetchActiveTenants();
    if (vacatedDataLoaded) {
      await fetchVacatedTenants();
    }
  };

  const handleAdd = () => {
    setEditingTenant(null);
    setFormData({
      name: '',
      phone_number: '',
      email: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      room: '',
      joining_date: new Date().toISOString().split('T')[0],
      vacating_date: '',
      id_proof_type: '',
      id_proof_number: '',
      father_name: '',
      father_aadhar: '',
      mother_name: '',
      mother_aadhar: '',
      guardian_name: '',
      guardian_aadhar: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name || '',
      phone_number: tenant.phone_number || '',
      email: tenant.email || '',
      address: tenant.address || '',
      emergency_contact_name: tenant.emergency_contact_name || '',
      emergency_contact_phone: tenant.emergency_contact_phone || '',
      // Backend returns room_detail (full object) for display, but we need the room ID
      room: tenant.room_detail?.id || tenant.room || '',
      joining_date: tenant.joining_date || '',
      vacating_date: tenant.vacating_date || '',
      id_proof_type: tenant.id_proof_type || '',
      id_proof_number: tenant.id_proof_number || '',
      father_name: tenant.father_name || '',
      father_aadhar: tenant.father_aadhar || '',
      mother_name: tenant.mother_name || '',
      mother_aadhar: tenant.mother_aadhar || '',
      guardian_name: tenant.guardian_name || '',
      guardian_aadhar: tenant.guardian_aadhar || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (tenant) => {
    if (window.confirm(`Are you sure you want to delete tenant "${tenant.name}"?`)) {
      try {
        await enhancedAPI.tenants.delete(tenant.id);
        setAlert({ open: true, message: 'Tenant deleted successfully', severity: 'success' });
        fetchData();
      } catch (err) {
        console.error('Error deleting tenant:', err);
        setAlert({ open: true, message: 'Failed to delete tenant', severity: 'error' });
      }
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.name || !formData.phone_number || !formData.room || !formData.joining_date) {
        setAlert({ open: true, message: 'Please fill all required fields', severity: 'error' });
        return;
      }

      const submitData = {
        ...formData,
        stay_type: 'monthly',
        // Convert empty strings to null for date fields
        joining_date: formData.joining_date || null,
        vacating_date: formData.vacating_date || null
      };

      if (editingTenant) {
        await enhancedAPI.tenants.update(editingTenant.id, submitData);
        setAlert({ open: true, message: 'Tenant updated successfully', severity: 'success' });
      } else {
        await enhancedAPI.tenants.create(submitData);
        setAlert({ open: true, message: 'Tenant added successfully', severity: 'success' });
      }

      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving tenant:', err);
      setAlert({ open: true, message: err.response?.data?.detail || 'Failed to save tenant', severity: 'error' });
    }
  };

  const handleCheckout = (tenant) => {
    setCheckoutTenant(tenant);
    setVacatingDate(new Date().toISOString().split('T')[0]);
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutTenant || !vacatingDate) {
      setAlert({ open: true, message: 'Please select a vacating date', severity: 'error' });
      return;
    }

    try {
      await enhancedAPI.tenants.checkout(checkoutTenant.id, { vacating_date: vacatingDate });
      setAlert({ open: true, message: 'Tenant checked out successfully!', severity: 'success' });
      setCheckoutDialogOpen(false);
      setCheckoutTenant(null);
      setVacatingDate('');
      fetchData();
    } catch (err) {
      console.error('Error checking out tenant:', err);
      setAlert({ open: true, message: 'Failed to checkout tenant', severity: 'error' });
    }
  };

  const handleReactivate = async (tenant) => {
    if (window.confirm(`Are you sure you want to reactivate tenant "${tenant.name}"? This will clear their vacating date.`)) {
      try {
        await enhancedAPI.tenants.reactivate(tenant.id);
        setAlert({ open: true, message: 'Tenant reactivated successfully!', severity: 'success' });
        fetchData();
      } catch (err) {
        console.error('Error reactivating tenant:', err);
        setAlert({ open: true, message: err.response?.data?.error || 'Failed to reactivate tenant', severity: 'error' });
      }
    }
  };

  const getTenantStatus = (tenant) => {
    if (tenant.vacating_date) return 'vacated';
    if (tenant.joining_date) return 'active';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'vacated': return 'default';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon fontSize="small" />;
      case 'pending': return <PendingIcon fontSize="small" />;
      case 'vacated': return <BlockIcon fontSize="small" />;
      default: return <PersonIcon fontSize="small" />;
    }
  };

  const canEdit = hasAnyRole(['owner', 'admin', 'warden']);
  const canDelete = hasAnyRole(['owner', 'admin']);
  const canAdd = hasAnyRole(['owner', 'admin', 'warden']);

  // Filter active tenants
  const filteredActiveTenants = activeTenants.filter(tenant => {
    const branchId = tenant.room_detail?.branch || rooms.find(r => r.id === tenant.room)?.branch;
    const roomId = tenant.room_detail?.id || tenant.room;
    
    const matchesProperty = propertyFilter === 'all' || branchId === parseInt(propertyFilter);
    const matchesRoom = roomFilter === 'all' || roomId === parseInt(roomFilter);
    const matchesSearch = !searchTerm ||
      tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone_number?.includes(searchTerm);
      
    return matchesProperty && matchesRoom && matchesSearch;
  });

  // Filter vacated tenants
  const filteredVacatedTenants = vacatedTenants.filter(tenant => {
    // MUST have vacating_date to be in vacated section
    if (!tenant.vacating_date) return false;
    
    const branchId = tenant.room_detail?.branch || rooms.find(r => r.id === tenant.room)?.branch;
    const roomId = tenant.room_detail?.id || tenant.room;
    
    const matchesProperty = propertyFilter === 'all' || branchId === parseInt(propertyFilter);
    const matchesRoom = roomFilter === 'all' || roomId === parseInt(roomFilter);
    const matchesSearch = !searchTerm ||
      tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone_number?.includes(searchTerm);
      
    return matchesProperty && matchesRoom && matchesSearch;
  });

  const activeTenantsCount = filteredActiveTenants.length;
  const totalTenants = activeTenantsCount; // Only count active tenants

  if (activeLoading && activeTenants.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const handleVacatedToggle = () => {
    setVacatedExpanded(!vacatedExpanded);
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tenants</Typography>
        {canAdd && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Tenant
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary">{totalTenants}</Typography>
              <Typography variant="body2" color="textSecondary">Total Tenants (Active)</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Filter by Property</InputLabel>
            <Select
              value={propertyFilter}
              onChange={(e) => {
                setPropertyFilter(e.target.value);
                setRoomFilter('all'); // Reset room filter when property changes
                setPage(0); // Reset to first page when filter changes
              }}
              label="Filter by Property"
            >
              <MenuItem value="all">All Properties</MenuItem>
              {branches.map(branch => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Filter by Room</InputLabel>
            <Select
              value={roomFilter}
              onChange={(e) => {
                setRoomFilter(e.target.value);
                setPage(0); // Reset to first page when filter changes
              }}
              label="Filter by Room"
              disabled={propertyFilter === 'all'}
            >
              <MenuItem value="all">All Rooms</MenuItem>
              {rooms
                .filter(room => propertyFilter === 'all' || room.branch === parseInt(propertyFilter))
                .map(room => {
                  const branch = branches.find(b => b.id === room.branch);
                  const sharingTypeDisplay = room.sharing_type ? `${room.sharing_type}-Sharing` : '';
                  // Format: "G1 - Sri Lakshmi Hostel - Vaniyar street (4-Sharing)"
                  let roomDisplay = room.room_name;
                  if (branch?.name) {
                    roomDisplay += ` - ${branch.name}`;
                  }
                  if (sharingTypeDisplay) {
                    roomDisplay += ` (${sharingTypeDisplay})`;
                  }
                  return (
                    <MenuItem key={room.id} value={room.id}>
                      {roomDisplay}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Search */}
      <Box mb={2}>
        <TextField
          fullWidth
          label="Search by Name, Email or Phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search..."
        />
      </Box>

      {/* Active Tenants Section */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f5f5f5' }}>
          <PeopleIcon color="primary" />
          <Typography variant="h6" component="h2">
            Active Tenants ({filteredActiveTenants.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
                <TableCell><strong>Room</strong></TableCell>
                <TableCell><strong>Join Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActiveTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No active tenants found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredActiveTenants
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((tenant) => {
                    const status = getTenantStatus(tenant);
                    const room = rooms.find(r => r.id === tenant.room);
                    const branch = branches.find(b => b.id === room?.branch);
                    
                    const roomDetail = tenant.room_detail;
                    const roomName = roomDetail?.room_name || room?.room_name || 'Not Assigned';
                    const branchName = roomDetail?.branch_detail?.name || tenant.branch_name || branch?.name || '';
                    const sharingType = roomDetail?.sharing_type_display || '';
                    
                    let roomDisplay = roomName;
                    if (branchName) {
                      roomDisplay += ` - ${branchName}`;
                    }
                    if (sharingType) {
                      roomDisplay += ` (${sharingType})`;
                    }
                    
                    return (
                      <TableRow key={tenant.id} hover>
                        <TableCell>
                          <Typography variant="body1">{tenant.name}</Typography>
                          {tenant.email && (
                            <Typography variant="caption" color="textSecondary">{tenant.email}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{tenant.phone_number || 'N/A'}</Typography>
                          {tenant.emergency_contact_name && (
                            <Typography variant="caption" color="textSecondary">
                              Emergency: {tenant.emergency_contact_phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {roomDisplay}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {tenant.joining_date ? new Date(tenant.joining_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(status)}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            color={getStatusColor(status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {canEdit && (
                            <Tooltip title="Edit">
                              <IconButton size="small" color="primary" onClick={() => handleEdit(tenant)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canEdit && (
                            <Tooltip title="Checkout/Vacate Tenant">
                              <IconButton size="small" color="warning" onClick={() => handleCheckout(tenant)}>
                                <ExitToAppIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(tenant)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredActiveTenants.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Vacated Tenants Section - Collapsible */}
      <Paper sx={{ backgroundColor: '#fafafa' }}>
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#f0f0f0' }
          }}
          onClick={handleVacatedToggle}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BlockIcon color="action" />
            <Typography variant="h6" component="h2" color="text.secondary">
              Vacated Tenants
            </Typography>
            {vacatedDataLoaded && (
              <Chip 
                label={filteredVacatedTenants.length} 
                size="small" 
                color="default" 
              />
            )}
          </Box>
          <IconButton
            sx={{
              transform: vacatedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        
        <Collapse in={vacatedExpanded} timeout="auto">
          {vacatedLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {filteredVacatedTenants.length === 0 && vacatedDataLoaded && (
                <Box p={3} textAlign="center">
                  <Typography variant="body2" color="textSecondary">
                    No vacated tenants found
                  </Typography>
                </Box>
              )}
              
              {filteredVacatedTenants.length > 0 && (
                <>
                  <Alert severity="info" sx={{ m: 2 }}>
                    Historical records of vacated tenants (read-only)
                  </Alert>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Contact</strong></TableCell>
                          <TableCell><strong>Room</strong></TableCell>
                          <TableCell><strong>Join Date</strong></TableCell>
                          <TableCell><strong>Vacated Date</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredVacatedTenants
                          .slice(vacatedPage * vacatedRowsPerPage, vacatedPage * vacatedRowsPerPage + vacatedRowsPerPage)
                          .map((tenant) => {
                            const status = getTenantStatus(tenant);
                            const room = rooms.find(r => r.id === tenant.room);
                            const branch = branches.find(b => b.id === room?.branch);
                            
                            const roomDetail = tenant.room_detail;
                            const roomName = roomDetail?.room_name || room?.room_name || 'Not Assigned';
                            const branchName = roomDetail?.branch_detail?.name || tenant.branch_name || branch?.name || '';
                            const sharingType = roomDetail?.sharing_type_display || '';
                            
                            let roomDisplay = roomName;
                            if (branchName) {
                              roomDisplay += ` - ${branchName}`;
                            }
                            if (sharingType) {
                              roomDisplay += ` (${sharingType})`;
                            }
                            
                            return (
                              <TableRow key={tenant.id} hover sx={{ opacity: 0.8 }}>
                                <TableCell>
                                  <Typography variant="body1">{tenant.name}</Typography>
                                  {tenant.email && (
                                    <Typography variant="caption" color="textSecondary">{tenant.email}</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{tenant.phone_number || 'N/A'}</Typography>
                                  {tenant.emergency_contact_name && (
                                    <Typography variant="caption" color="textSecondary">
                                      Emergency: {tenant.emergency_contact_phone}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {roomDisplay}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {tenant.joining_date ? new Date(tenant.joining_date).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {tenant.vacating_date ? new Date(tenant.vacating_date).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getStatusIcon(status)}
                                    label={status.charAt(0).toUpperCase() + status.slice(1)}
                                    color={getStatusColor(status)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {canEdit && (
                                    <Tooltip title="Reactivate Tenant">
                                      <IconButton size="small" color="success" onClick={() => handleReactivate(tenant)}>
                                        <RestoreIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {canDelete && (
                                    <Tooltip title="Delete">
                                      <IconButton size="small" color="error" onClick={() => handleDelete(tenant)}>
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filteredVacatedTenants.length}
                    page={vacatedPage}
                    onPageChange={(_, newPage) => setVacatedPage(newPage)}
                    rowsPerPage={vacatedRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setVacatedRowsPerPage(parseInt(e.target.value, 10));
                      setVacatedPage(0);
                    }}
                  />
                </>
              )}
            </>
          )}
        </Collapse>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>

            {/* Emergency Contact */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Emergency Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Emergency Contact Name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Emergency Contact Phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </Grid>

            {/* Room Assignment */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Room Assignment
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Room</InputLabel>
                <Select
                  value={formData.room}
                  label="Room"
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                >
                  {rooms.filter(r => r.is_available).map((room) => {
                    const branch = branches.find(b => b.id === room.branch);
                    return (
                      <MenuItem key={room.id} value={room.id}>
                        {room.room_name} - {branch?.name || 'Unknown'} ({room.sharing_type}-Sharing)
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Joining Date"
                type="date"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vacating/Leave Date"
                type="date"
                value={formData.vacating_date || ''}
                onChange={(e) => setFormData({ ...formData, vacating_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText={formData.vacating_date 
                  ? `Tenant will vacate on: ${new Date(formData.vacating_date).toLocaleDateString()}` 
                  : 'Leave empty if not vacating. Set date to mark as leaving/vacated.'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: formData.vacating_date ? '#fff3cd' : 'inherit',
                  }
                }}
              />
            </Grid>

            {/* Family Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Family Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Name"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Aadhar Number"
                value={formData.father_aadhar}
                onChange={(e) => setFormData({ ...formData, father_aadhar: e.target.value })}
                inputProps={{ maxLength: 12 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mother's Name"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mother's Aadhar Number"
                value={formData.mother_aadhar}
                onChange={(e) => setFormData({ ...formData, mother_aadhar: e.target.value })}
                inputProps={{ maxLength: 12 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guardian's Name"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guardian's Aadhar Number"
                value={formData.guardian_aadhar}
                onChange={(e) => setFormData({ ...formData, guardian_aadhar: e.target.value })}
                inputProps={{ maxLength: 12 }}
              />
            </Grid>

            {/* ID Proof */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                ID Proof (Optional)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>ID Proof Type</InputLabel>
                <Select
                  value={formData.id_proof_type}
                  label="ID Proof Type"
                  onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                >
                  <MenuItem value="aadhar">Aadhar Card</MenuItem>
                  <MenuItem value="pan_card">PAN Card</MenuItem>
                  <MenuItem value="driving_license">Driving License</MenuItem>
                  <MenuItem value="passport">Passport</MenuItem>
                  <MenuItem value="voter_id">Voter ID</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Proof Number"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTenant ? 'Update' : 'Add'} Tenant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={checkoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)}>
        <DialogTitle>Checkout Tenant</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to checkout <strong>{checkoutTenant?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will mark the tenant as vacated. The tenant record will be preserved and can be reactivated later.
          </Typography>
          <TextField
            fullWidth
            type="date"
            label="Vacating Date"
            value={vacatingDate}
            onChange={(e) => setVacatingDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Select the tenant's last day at the hostel"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCheckoutConfirm} 
            variant="contained" 
            color="warning"
          >
            Confirm Checkout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SimpleTenants;
