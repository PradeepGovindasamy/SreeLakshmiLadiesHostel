import React, { useEffect, useState } from 'react';
import { enhancedAPI } from '../api';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Divider,
  Paper, Stack
} from '@mui/material';

function RoomStatus() {
  const [groupedRooms, setGroupedRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await enhancedAPI.rooms.list();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);

      const grouped = data.reduce((acc, room) => {
        // The v2 API returns branch_name as a flat string field
        const branchName = room.branch_name || room.branch?.name || 'Unassigned';
        if (!acc[branchName]) acc[branchName] = [];
        acc[branchName].push(room);
        return acc;
      }, {});

      // Sort rooms within each branch by room name
      Object.keys(grouped).forEach(branch => {
        grouped[branch].sort((a, b) => (a.room_name || '').localeCompare(b.room_name || ''));
      });

      setGroupedRooms(grouped);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load room data.');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (room) => {
    if (!room.is_available) return 'Maintenance';
    const occupancy = room.current_occupancy || 0;
    const capacity = room.sharing_type || 0;
    if (occupancy === 0) return 'Vacant';
    if (occupancy >= capacity) return 'Occupied';
    return 'Partially Occupied';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Vacant':       return 'success';
      case 'Occupied':     return 'error';
      case 'Partially Occupied': return 'warning';
      case 'Maintenance':  return 'default';
      default:             return 'primary';
    }
  };

  const getBranchSummary = (rooms) => {
    const total = rooms.length;
    const vacant = rooms.filter(r => getStatus(r) === 'Vacant').length;
    const occupied = rooms.filter(r => getStatus(r) === 'Occupied').length;
    const partial = rooms.filter(r => getStatus(r) === 'Partially Occupied').length;
    const maintenance = rooms.filter(r => getStatus(r) === 'Maintenance').length;
    const totalBeds = rooms.reduce((sum, r) => sum + (r.sharing_type || 0), 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + (r.current_occupancy || 0), 0);
    return { total, vacant, occupied, partial, maintenance, totalBeds, occupiedBeds };
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Room Occupancy Status</Typography>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : Object.keys(groupedRooms).length === 0 ? (
        <Typography color="text.secondary">No rooms found.</Typography>
      ) : (
        Object.entries(groupedRooms).map(([branchName, branchRooms]) => {
          const summary = getBranchSummary(branchRooms);
          return (
            <Box key={branchName} mt={4}>
              {/* Branch header */}
              <Paper elevation={2} sx={{ p: 2, mb: 2, backgroundColor: '#1976d2', color: '#fff' }}>
                <Typography variant="h5" fontWeight="bold">{branchName}</Typography>
                <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                  <Typography variant="body2">Rooms: <strong>{summary.total}</strong></Typography>
                  <Typography variant="body2">Beds: <strong>{summary.occupiedBeds}/{summary.totalBeds}</strong></Typography>
                  <Chip label={`Vacant: ${summary.vacant}`} color="success" size="small" sx={{ color: '#fff', fontWeight: 'bold' }} />
                  <Chip label={`Occupied: ${summary.occupied}`} color="error" size="small" sx={{ fontWeight: 'bold' }} />
                  {summary.partial > 0 && <Chip label={`Partial: ${summary.partial}`} color="warning" size="small" sx={{ fontWeight: 'bold' }} />}
                  {summary.maintenance > 0 && <Chip label={`Maintenance: ${summary.maintenance}`} size="small" sx={{ fontWeight: 'bold' }} />}
                </Stack>
              </Paper>

              {/* Room cards */}
              <Grid container spacing={2}>
                {branchRooms.map(room => {
                  const status = getStatus(room);
                  const occupancy = room.current_occupancy || 0;
                  const capacity = room.sharing_type || 0;
                  return (
                    <Grid item xs={12} sm={6} md={3} key={room.id}>
                      <Card sx={{ height: '100%', borderLeft: `4px solid`, borderLeftColor:
                        status === 'Vacant' ? 'success.main' :
                        status === 'Occupied' ? 'error.main' :
                        status === 'Partially Occupied' ? 'warning.main' : 'grey.400'
                      }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>{room.room_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Floor {room.floor_number || 1} &nbsp;|&nbsp; {capacity}-Sharing
                          </Typography>
                          <Typography variant="body2" mt={0.5}>
                            Occupancy: <strong>{occupancy} / {capacity}</strong>
                          </Typography>
                          {room.rent && (
                            <Typography variant="body2" color="text.secondary">
                              Rent: ₹{room.rent}
                            </Typography>
                          )}
                          <Chip
                            label={status}
                            color={getStatusColor(status)}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Divider sx={{ mt: 4 }} />
            </Box>
          );
        })
      )}
    </Box>
  );
}

export default RoomStatus;
