import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, Alert, Grid, Card, CardContent, Avatar
} from '@mui/material';
import { Add, Edit, Delete, PersonAdd, Assignment } from '@mui/icons-material';
import api from '../api';

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0, terminated: 0 });

  useEffect(() => {
    fetchWorkers();
    fetchAttendanceRecords();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/api/workers/workers/');
      setWorkers(response.data);
      
      // Calculate stats
      const total = response.data.length;
      const active = response.data.filter(w => w.employment_status === 'active').length;
      const onLeave = response.data.filter(w => w.employment_status === 'on_leave').length;
      const terminated = response.data.filter(w => w.employment_status === 'terminated').length;
      setStats({ total, active, onLeave, terminated });
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching workers');
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
    if (!window.confirm('Are you sure you want to delete this worker?')) return;
    
    try {
      await api.delete(`/api/workers/workers/${id}/`);
      setSuccess('Worker deleted successfully');
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
              <Typography color="textSecondary" gutterBottom>Total Workers</Typography>
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
          <Typography variant="h4">Workers Management</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAdd />}
            onClick={handleAddWorker}
          >
            Add Worker
          </Button>
        </Box>

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
                    <Avatar src={worker.photo} alt={worker.full_name}>
                      {worker.full_name.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>{worker.full_name}</TableCell>
                  <TableCell>{worker.role}</TableCell>
                  <TableCell>{worker.branch_name}</TableCell>
                  <TableCell>{worker.phone_number}</TableCell>
                  <TableCell>₹{worker.salary}</TableCell>
                  <TableCell>
                    {worker.date_of_joining ? new Date(worker.date_of_joining).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={worker.employment_status.replace('_', ' ').toUpperCase()} 
                      color={getStatusColor(worker.employment_status)}
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
                <TableCell>Worker</TableCell>
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
