import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, Alert, Grid, Card, CardContent
} from '@mui/material';
import { Add, Edit, Delete, Build, Assessment } from '@mui/icons-material';
import api from '../api';

function Machines() {
  const [machines, setMachines] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [currentMachine, setCurrentMachine] = useState(null);
  const [currentMaintenance, setCurrentMaintenance] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, maintenance: 0, outOfService: 0 });

  useEffect(() => {
    fetchMachines();
    fetchMaintenanceRecords();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await api.get('/api/machines/machines/');
      setMachines(response.data);
      
      // Calculate stats
      const total = response.data.length;
      const active = response.data.filter(m => m.status === 'active').length;
      const maintenance = response.data.filter(m => m.status === 'maintenance').length;
      const outOfService = response.data.filter(m => m.status === 'out_of_service').length;
      setStats({ total, active, maintenance, outOfService });
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching machines');
    }
  };

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await api.get('/api/machines/maintenance/');
      setMaintenanceRecords(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching maintenance records');
    }
  };

  const handleAddMachine = () => {
    setCurrentMachine(null);
    setOpenDialog(true);
  };

  const handleEditMachine = (machine) => {
    setCurrentMachine(machine);
    setOpenDialog(true);
  };

  const handleDeleteMachine = async (id) => {
    if (!window.confirm('Are you sure you want to delete this machine?')) return;
    
    try {
      await api.delete(`/api/machines/machines/${id}/`);
      setSuccess('Machine deleted successfully');
      fetchMachines();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting machine');
    }
  };

  const handleAddMaintenance = (machine) => {
    setCurrentMachine(machine);
    setCurrentMaintenance(null);
    setOpenMaintenanceDialog(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'out_of_service': return 'error';
      default: return 'default';
    }
  };

  const getMaintenanceTypeColor = (type) => {
    switch(type) {
      case 'preventive': return 'info';
      case 'corrective': return 'warning';
      case 'emergency': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Machines</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active</Typography>
              <Typography variant="h4" color="success.main">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Under Maintenance</Typography>
              <Typography variant="h4" color="warning.main">{stats.maintenance}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Out of Service</Typography>
              <Typography variant="h4" color="error.main">{stats.outOfService}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Machines & Equipment</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleAddMachine}
          >
            Add Machine
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell>Warranty Expiry</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell>{machine.name}</TableCell>
                  <TableCell>{machine.machine_type}</TableCell>
                  <TableCell>{machine.branch_name}</TableCell>
                  <TableCell>{machine.serial_number}</TableCell>
                  <TableCell>
                    <Chip 
                      label={machine.status.replace('_', ' ').toUpperCase()} 
                      color={getStatusColor(machine.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {machine.purchase_date ? new Date(machine.purchase_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {machine.warranty_expiry_date ? new Date(machine.warranty_expiry_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditMachine(machine)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleAddMaintenance(machine)} size="small" color="primary">
                      <Build />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteMachine(machine.id)} size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Maintenance Records */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Assessment sx={{ mr: 1 }} />
          <Typography variant="h5">Recent Maintenance Records</Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Machine</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Performed By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {maintenanceRecords.slice(0, 10).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.machine_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={record.maintenance_type} 
                      color={getMaintenanceTypeColor(record.maintenance_type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(record.maintenance_date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>₹{record.cost}</TableCell>
                  <TableCell>{record.performed_by}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default Machines;
