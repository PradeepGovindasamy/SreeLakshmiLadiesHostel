import React, { useEffect, useState } from 'react';
import axiosInstance from './axiosInstance';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Divider
} from '@mui/material';

function RoomStatus() {
  const [rooms, setRooms] = useState([]);
  const [groupedRooms, setGroupedRooms] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axiosInstance.get('http://127.0.0.1:8000/api/rooms/');

      const grouped = res.data.reduce((acc, room) => {
        const branchName = room.branch?.name || 'Unassigned';
        if (!acc[branchName]) acc[branchName] = [];
        acc[branchName].push(room);
        return acc;
      }, {});
      setGroupedRooms(grouped);
      setRooms(res.data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (room) => {
    // Use the status field from backend if available
    if (room.status) {
      return room.status.charAt(0).toUpperCase() + room.status.slice(1);
    }
    
    // Fallback to manual calculation
    if (!room.is_available) {
      return 'Maintenance';
    }
    
    const currentOccupancy = room.current_occupancy || room.occupied || 0;
    const capacity = room.sharing_type || 0;
    
    if (currentOccupancy === 0) {
      return 'Vacant';
    } else if (currentOccupancy >= capacity) {
      return 'Occupied';
    } else {
      return 'Partially Occupied';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'vacant':
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'partially occupied':
        return 'warning';
      case 'maintenance':
        return 'default';
      default:
        return 'primary';
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Room Occupancy Status</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        Object.entries(groupedRooms).map(([branchName, branchRooms]) => (
          <Box key={branchName} mt={4}>
            <Typography variant="h5" gutterBottom>{branchName}</Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {branchRooms.map(room => (
                <Grid item xs={12} sm={6} md={4} key={room.id}>
                  <Card sx={{ backgroundColor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="h6">{room.room_name}</Typography>
                      <Typography variant="body2">
                        Occupied: {room.current_occupancy || room.occupied || 0} / {room.sharing_type}
                      </Typography>
                      <Chip
                        label={getStatus(room)}
                        color={getStatusColor(getStatus(room))}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
}

export default RoomStatus;
