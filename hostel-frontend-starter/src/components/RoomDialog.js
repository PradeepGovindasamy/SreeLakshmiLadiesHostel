import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControlLabel, Checkbox, MenuItem
} from '@mui/material';

const sharingOptions = [
  { value: '1', label: '1-Sharing' },
  { value: '2', label: '2-Sharing' },
  { value: '3', label: '3-Sharing' },
  { value: '4', label: '4-Sharing' },
  { value: '5', label: '5-Sharing' },
  { value: '6', label: '6-Sharing' },
  { value: '7', label: '7-Sharing' }
];

function RoomDialog({ open, onClose, onSave, room, branches }) {
  const [formData, setFormData] = useState({
    id: null,
    room_name: '',
    branch: '',
    sharing_type: '',
    attached_bath: false,
    ac_room: false,
    rent: ''
  });

  useEffect(() => {
    if (room) {
      setFormData({
        id: room.id || null,
        room_name: room.room_name || '',
        branch: room.branch?.id?.toString() || room.branch?.toString() || '',
        sharing_type: room.sharing_type?.toString() || '',
        attached_bath: room.attached_bath || false,
        ac_room: room.ac_room || false,
        rent: room.rent || ''
      });
    } else {
      setFormData({
        id: null,
        room_name: '',
        branch: branches.length === 1 && branches[0]?.id ? branches[0].id.toString() : '',
        sharing_type: '',
        attached_bath: false,
        ac_room: false,
        rent: ''
      });
    }
  }, [room, branches]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = () => {
    if (!formData.branch || !formData.sharing_type || formData.rent === '') {
      alert('Please fill all required fields correctly.');
      return;
    }

    const payload = {
      ...formData,
      branch: Number(formData.branch),
      sharing_type: Number(formData.sharing_type),
      rent: Number(formData.rent)
    };

    console.log("Submitting Room:", payload);  // ✅ For debugging

    onSave(payload);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{formData.id ? 'Edit Room' : 'Add Room'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Room Name"
          name="room_name"
          fullWidth
          margin="dense"
          value={formData.room_name}
          onChange={handleChange}
          required
        />
        <TextField
          label="Branch"
          name="branch"
          fullWidth
          select
          margin="dense"
          value={formData.branch}
          onChange={handleChange}
          required
        >
          {branches.map((b) => (
            <MenuItem key={b.id} value={b.id.toString()}>
              {b.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Sharing Type"
          name="sharing_type"
          fullWidth
          select
          margin="dense"
          value={formData.sharing_type}
          onChange={handleChange}
          required
        >
          {sharingOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.attached_bathroom}
              onChange={handleChange}
              name="attached_bath"
            />
          }
          label="Attached Bath"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.ac_room}
              onChange={handleChange}
              name="ac_room"
            />
          }
          label="AC Room"
        />
        <TextField
          label="Rent"
          name="rent"
          fullWidth
          type="number"
          margin="dense"
          value={formData.rent}
          onChange={handleChange}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RoomDialog;
