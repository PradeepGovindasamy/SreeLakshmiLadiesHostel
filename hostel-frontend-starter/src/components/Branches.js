import React, { useEffect, useState } from 'react';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';
import PropertyForm from './PropertyForm';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Home as HomeIcon,
  People as PeopleIcon
} from '@mui/icons-material';

function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [statsDialog, setStatsDialog] = useState(false);
  const [branchStats, setBranchStats] = useState(null);
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  
  const { getUserRole, hasAnyRole } = useUser();
  const userRole = getUserRole();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use enhanced API with role-based filtering
      const response = await enhancedAPI.branches.list();
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to load branches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (branch) => {
    try {
      setSelectedBranch(branch);
      const response = await enhancedAPI.branches.getStats(branch.id);
      setBranchStats(response.data);
      setStatsDialog(true);
    } catch (error) {
      console.error('Error fetching branch stats:', error);
      setError('Failed to load branch statistics.');
    }
  };

  const handleEdit = (branch) => {
    setEditingProperty(branch);
    setPropertyFormOpen(true);
  };

  const handleDelete = async (branch) => {
    if (window.confirm(`Are you sure you want to delete "${branch.name}"?`)) {
      try {
        await enhancedAPI.branches.delete(branch.id);
        await fetchBranches(); // Refresh list
      } catch (error) {
        console.error('Error deleting branch:', error);
        setError('Failed to delete branch.');
      }
    }
  };

  const handleAdd = () => {
    setEditingProperty(null);
    setPropertyFormOpen(true);
  };

  const handlePropertyFormClose = () => {
    setPropertyFormOpen(false);
    setEditingProperty(null);
  };

  const handlePropertyFormSave = () => {
    fetchBranches(); // Refresh the list
    setPropertyFormOpen(false);
    setEditingProperty(null);
  };

  const canEdit = hasAnyRole(['owner', 'admin']);
  const canDelete = hasAnyRole(['owner', 'admin']);
  const canAdd = hasAnyRole(['owner', 'admin']);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          {userRole === 'owner' ? 'My Properties' : 
           userRole === 'warden' ? 'Assigned Properties' : 
           'All Properties'}
        </Typography>
        {canAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            color="primary"
          >
            Add Property
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <HomeIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{branches.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Properties
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {branches.reduce((sum, branch) => sum + (branch.num_rooms || branch.total_rooms || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Rooms
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <HomeIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {branches.reduce((sum, branch) => sum + (branch.occupied_beds || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Occupied Beds
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {branches.reduce((sum, branch) => sum + (branch.total_beds || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Beds
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Branches Table */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
              <TableRow>
                <TableCell>Property Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Rooms</TableCell>
                <TableCell>Occupancy</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{branch.name}</Typography>
                      {branch.description && (
                        <Typography variant="caption" color="textSecondary">
                          {branch.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{branch.address}</TableCell>
                    <TableCell>
                      {branch.owner_name || 
                       (branch.owner && (branch.owner.first_name + ' ' + branch.owner.last_name).trim()) ||
                       (branch.owner && branch.owner.username) ||
                       'Not Assigned'}
                    </TableCell>
                    <TableCell>
                      {branch.num_rooms || branch.total_rooms || 0}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {branch.occupied_beds || 0}/{branch.total_beds || 0} beds
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {branch.vacant_beds || 0} vacant beds
                        </Typography>
                        {branch.bed_occupancy_rate !== undefined && (
                          <Chip
                            label={`${Math.round(branch.bed_occupancy_rate)}%`}
                            size="small"
                            color={branch.bed_occupancy_rate > 80 ? 'success' : 
                                   branch.bed_occupancy_rate > 50 ? 'warning' : 'default'}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {branch.contact_phone && (
                        <Typography variant="body2">{branch.contact_phone}</Typography>
                      )}
                      {branch.contact_email && (
                        <Typography variant="caption" color="textSecondary">
                          {branch.contact_email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={branch.is_active ? 'Active' : 'Inactive'}
                        color={branch.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Statistics">
                        <IconButton 
                          color="info" 
                          size="small"
                          onClick={() => handleViewStats(branch)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleEdit(branch)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDelete(branch)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={branches.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Branch Statistics Dialog */}
      <Dialog 
        open={statsDialog} 
        onClose={() => setStatsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Property Statistics - {selectedBranch?.name}
        </DialogTitle>
        <DialogContent>
          {branchStats && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="h6" color="primary">
                  {branchStats.total_rooms}
                </Typography>
                <Typography variant="body2">Total Rooms</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" color="secondary">
                  {branchStats.occupied_beds}
                </Typography>
                <Typography variant="body2">Occupied Beds</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" color="info.main">
                  {branchStats.total_capacity}
                </Typography>
                <Typography variant="body2">Vacant Beds</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" color="success.main">
                  {branchStats.vacant_beds}
                </Typography>
                <Typography variant="body2">Current Tenants</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">
                  {Math.round(branchStats.bed_occupancy_rate)}%
                </Typography>
                <Typography variant="body2">Bed Occupancy Rate</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">
                  {Math.round(branchStats.capacity_utilization)}%
                </Typography>
                <Typography variant="body2">Capacity Utilization</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Property Form Dialog */}
      <PropertyForm
        open={propertyFormOpen}
        onClose={handlePropertyFormClose}
        onSave={handlePropertyFormSave}
        property={editingProperty}
        isEdit={Boolean(editingProperty)}
      />
    </Box>
  );
}

export default Branches;
