import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid
} from '@mui/material';

function TenantDialog({ open, onClose, onSave, tenant, rooms }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    stay_type: '',
    joining_date: '',
    vacating_date: '',
    room: ''
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        address: tenant.address || '',
        stay_type: tenant.stay_type || '',
        joining_date: tenant.joining_date || '',
        vacating_date: tenant.vacating_date || '',
        room: typeof tenant.room === 'object' ? tenant.room.id : tenant.room || ''
      });
    } else {
      setFormData({
        name: '',
        address: '',
        stay_type: '',
        joining_date: '',
        vacating_date: '',
        room: ''
      });
    }
  }, [tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.stay_type || !formData.joining_date || !formData.room) {
      alert('Please fill all required fields.');
      return;
    }

    const payload = {
      ...formData,
      room: Number(formData.room),
      vacating_date: formData.vacating_date ? formData.vacating_date : null,
      joining_date: formData.joining_date ? formData.joining_date : null,
    };

    console.log('TenantDialog submitting payload:', payload);

    if (tenant?.id) {
      onSave({ ...payload, id: tenant.id });
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{tenant ? 'Edit Tenant' : 'Add Tenant'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12}>
            <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select fullWidth label="Stay Type" name="stay_type"
              value={formData.stay_type} onChange={handleChange}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Joining Date" name="joining_date" type="date"
              value={formData.joining_date} onChange={handleChange} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Vacating Date" name="vacating_date" type="date"
              value={formData.vacating_date} onChange={handleChange} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select fullWidth label="Room" name="room"
              value={formData.room} onChange={handleChange}
            >
              {rooms.map(room => (
                <MenuItem key={room.id} value={room.id} disabled={room.is_full}>
                  {room.room_name} — {room.branch_detail?.name || room.branch_name || 'Unknown Branch'} {room.is_full ? '(Full)' : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default TenantDialog;
