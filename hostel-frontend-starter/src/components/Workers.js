import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, Alert, Grid, Card, CardContent, Avatar,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, PersonAdd, Assignment } from '@mui/icons-material';
import api, { enhancedAPI } from '../api';
import { STAFF } from '../config/staffLabels';

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0, terminated: 0 });

  useEffect(() => {
    fetchBranches();
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [selectedBranch, selectedStatus]);

  const fetchBranches = async () => {
    try {
      const response = await enhancedAPI.branches.list();
      const branchData = Array.isArray(response.data)
        ? response.data
        : (response.data.results || []);
      setBranches(branchData);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching properties');
    }
  };

  const fetchWorkers = async () => {
    try {
      const params = {};
      if (selectedBranch !== 'all') params.branch = selectedBranch;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const response = await api.get('/api/workers/workers/', { params });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setWorkers(data);

      const total = data.length;
      const active = data.filter(w => w.status === 'active').length;
      const onLeave = data.filter(w => w.status === 'on_leave').length;
      const terminated = data.filter(w => w.status === 'terminated').length;
      setStats({ total, active, onLeave, terminated });
    } catch (err) {
      setError(err.response?.data?.message || `Error fetching ${STAFF.plural.toLowerCase()}`);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const response = await api.get('/api/workers/attendance/');
      setAttendanceRecords(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching attendance records');
    }
  };

  const handleAddWorker = () => {
    setCurrentWorker(null);
    setOpenDialog(true);
  };

  const handleEditWorker = (worker) => {
    setCurrentWorker(worker);
    setOpenDialog(true);
  };

  const handleDeleteWorker = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${STAFF.singular.toLowerCase()}?`)) return;
    
    try {
      await api.delete(`/api/workers/workers/${id}/`);
      setSuccess(`${STAFF.singular} deleted successfully`);
      fetchWorkers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting worker');
    }
  };

  const handleMarkAttendance = (worker) => {
    setCurrentWorker(worker);
    setCurrentAttendance(null);
    setOpenAttendanceDialog(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'success';
      case 'on_leave': return 'warning';
      case 'terminated': return 'error';
      default: return 'default';
    }
  };

  const getAttendanceStatusColor = (status) => {
    switch(status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'half_day': return 'warning';
      case 'on_leave': return 'info';
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
              <Typography color="textSecondary" gutterBottom>Total {STAFF.plural}</Typography>
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
              <Typography color="textSecondary" gutterBottom>On Leave</Typography>
              <Typography variant="h4" color="warning.main">{stats.onLeave}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Terminated</Typography>
              <Typography variant="h4" color="error.main">{stats.terminated}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">{STAFF.management}</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAdd />}
            onClick={handleAddWorker}
          >
            {STAFF.add}
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Property</InputLabel>
              <Select
                value={selectedBranch}
                label="Filter by Property"
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <MenuItem value="all">All Properties</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Filter by Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="on_leave">On Leave</MenuItem>
                <MenuItem value="resigned">Resigned</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Photo</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Join Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <Avatar src={worker.photo} alt={worker.name}>
                      {worker.name?.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>{worker.name}</TableCell>
                  <TableCell>{worker.worker_type_display || worker.worker_type}</TableCell>
                  <TableCell>{worker.branch_name}</TableCell>
                  <TableCell>{worker.phone_number}</TableCell>
                  <TableCell>₹{worker.salary}</TableCell>
                  <TableCell>
                    {worker.joining_date ? new Date(worker.joining_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={(worker.status_display || worker.status || '').replace('_', ' ').toUpperCase()} 
                      color={getStatusColor(worker.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditWorker(worker)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleMarkAttendance(worker)} size="small" color="primary">
                      <Assignment />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteWorker(worker.id)} size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Attendance Records */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Assignment sx={{ mr: 1 }} />
          <Typography variant="h5">Recent Attendance Records</Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff Member</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Hours Worked</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceRecords.slice(0, 10).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.worker_name}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={record.status.replace('_', ' ').toUpperCase()} 
                      color={getAttendanceStatusColor(record.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{record.check_in_time || 'N/A'}</TableCell>
                  <TableCell>{record.check_out_time || 'N/A'}</TableCell>
                  <TableCell>{record.hours_worked || '0'} hrs</TableCell>
                  <TableCell>{record.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default Workers;
