import React, { useEffect, useState } from 'react';
import { enhancedAPI } from '../api';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress,
  Paper, Stack, LinearProgress, Alert, IconButton, Tooltip, Collapse
} from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BedIcon from '@mui/icons-material/Bed';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_META = {
  Vacant:             { color: 'success', border: '#22c55e', bg: '#f0fdf4' },
  'Partially Occupied': { color: 'warning', border: '#f59e0b', bg: '#fffbeb' },
  Occupied:           { color: 'error',   border: '#ef4444', bg: '#fef2f2' },
  Maintenance:        { color: 'default', border: '#9ca3af', bg: '#f9fafb' },
};

function getRoomStatus(room) {
  if (!room.is_available) return 'Maintenance';
  const occ = room.current_occupancy || 0;
  const cap = room.sharing_type || 0;
  if (occ === 0) return 'Vacant';
  if (occ >= cap) return 'Occupied';
  return 'Partially Occupied';
}

function getBranchSummary(rooms) {
  const totalBeds     = rooms.reduce((s, r) => s + (r.sharing_type || 0), 0);
  const occupiedBeds  = rooms.reduce((s, r) => s + (r.current_occupancy || 0), 0);
  const counts = { Vacant: 0, 'Partially Occupied': 0, Occupied: 0, Maintenance: 0 };
  rooms.forEach(r => { counts[getRoomStatus(r)]++; });
  return { total: rooms.length, totalBeds, occupiedBeds, ...counts };
}

// ─── OccupancyBar ────────────────────────────────────────────────────────────

function OccupancyBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct === 0 ? 'success' : pct >= 100 ? 'error' : 'warning';
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Occupancy</Typography>
        <Typography variant="caption" fontWeight={600}>{value}/{max} beds</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(pct, 100)}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}

// ─── StatBadge ───────────────────────────────────────────────────────────────

function StatBadge({ label, value, color = 'default' }) {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 60 }}>
      <Typography variant="h6" fontWeight={700} color={`${color}.main`}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{label}</Typography>
    </Box>
  );
}

// ─── RoomCard ────────────────────────────────────────────────────────────────

function RoomCard({ room }) {
  const status = getRoomStatus(room);
  const meta   = STATUS_META[status];
  const occ    = room.current_occupancy || 0;
  const cap    = room.sharing_type || 0;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'grey.200',
        borderLeft: `4px solid ${meta.border}`,
        borderRadius: 2,
        backgroundColor: meta.bg,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ pb: '16px !important' }}>
        {/* Room name + status badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <MeetingRoomIcon fontSize="small" sx={{ color: meta.border }} />
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              {room.room_name}
            </Typography>
          </Box>
          <Chip label={status} color={meta.color} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
        </Box>

        {/* Meta row */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Floor&nbsp;{room.floor_number || 1}&nbsp;&nbsp;·&nbsp;&nbsp;{cap}-Sharing
          {room.ac_room && <>&nbsp;&nbsp;·&nbsp;&nbsp;AC</>}
          {room.attached_bath && <>&nbsp;&nbsp;·&nbsp;&nbsp;Attached Bath</>}
        </Typography>

        {/* Occupancy bar */}
        <OccupancyBar value={occ} max={cap} />

        {/* Rent */}
        {room.rent && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            ₹{Number(room.rent).toLocaleString('en-IN')}&nbsp;/&nbsp;month
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ─── BranchSection ───────────────────────────────────────────────────────────

function BranchSection({ branchName, rooms }) {
  const [open, setOpen] = useState(true);
  const s = getBranchSummary(rooms);
  const bedPct = s.totalBeds > 0 ? Math.round((s.occupiedBeds / s.totalBeds) * 100) : 0;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Branch header card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'primary.200',
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          color: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {/* Left: name + meta */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HomeWorkIcon sx={{ fontSize: 28, opacity: 0.9 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>{branchName}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {s.total} room{s.total !== 1 ? 's' : ''}
                &nbsp;·&nbsp;{s.occupiedBeds}/{s.totalBeds} beds occupied ({bedPct}%)
              </Typography>
            </Box>
          </Box>

          {/* Right: stat badges + collapse toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Stack direction="row" spacing={3}>
              <StatBadge label="Vacant"   value={s.Vacant}   color="success" />
              <StatBadge label="Partial"  value={s['Partially Occupied']} color="warning" />
              <StatBadge label="Occupied" value={s.Occupied} color="error" />
              {s.Maintenance > 0 && <StatBadge label="Maint." value={s.Maintenance} />}
            </Stack>
            <Tooltip title={open ? 'Collapse' : 'Expand'}>
              <IconButton size="small" onClick={() => setOpen(o => !o)} sx={{ color: '#fff' }}>
                {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Room grid */}
      <Collapse in={open}>
        <Grid container spacing={2}>
          {rooms.map(room => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
              <RoomCard room={room} />
            </Grid>
          ))}
        </Grid>
      </Collapse>
    </Box>
  );
}

// ─── PageHeader ──────────────────────────────────────────────────────────────

function PageHeader({ totalRooms, totalBeds, occupiedBeds, onRefresh, loading }) {
  const overallPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="grey.900">Room Occupancy</Typography>
          <Typography variant="body2" color="text.secondary">
            {totalRooms} rooms &nbsp;·&nbsp; {occupiedBeds}/{totalBeds} beds occupied ({overallPct}%)
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} disabled={loading} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Overall occupancy bar */}
      <LinearProgress
        variant={loading ? 'indeterminate' : 'determinate'}
        value={Math.min(overallPct, 100)}
        color={overallPct >= 90 ? 'error' : overallPct >= 60 ? 'warning' : 'primary'}
        sx={{ height: 8, borderRadius: 4 }}
      />

      {/* Legend */}
      <Stack direction="row" spacing={2} mt={1.5} flexWrap="wrap">
        {Object.entries(STATUS_META).map(([label, meta]) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: meta.border }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

// ─── RoomStatus (main) ───────────────────────────────────────────────────────

function RoomStatus() {
  const [groupedRooms, setGroupedRooms] = useState({});
  const [totals, setTotals] = useState({ rooms: 0, beds: 0, occupied: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await enhancedAPI.rooms.list();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);

      const grouped = {};
      data.forEach(room => {
        const key = room.branch_name || room.branch?.name || 'Unassigned';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(room);
      });
      Object.keys(grouped).forEach(k =>
        grouped[k].sort((a, b) => (a.room_name || '').localeCompare(b.room_name || ''))
      );

      const totalBeds    = data.reduce((s, r) => s + (r.sharing_type || 0), 0);
      const occupiedBeds = data.reduce((s, r) => s + (r.current_occupancy || 0), 0);
      setTotals({ rooms: data.length, beds: totalBeds, occupied: occupiedBeds });
      setGroupedRooms(grouped);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load room data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const branchEntries = Object.entries(groupedRooms).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        totalRooms={totals.rooms}
        totalBeds={totals.beds}
        occupiedBeds={totals.occupied}
        onRefresh={fetchRooms}
        loading={loading}
      />

      {loading && !Object.keys(groupedRooms).length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" action={
          <IconButton size="small" onClick={fetchRooms}><RefreshIcon fontSize="small" /></IconButton>
        }>{error}</Alert>
      ) : branchEntries.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 3 }}>
          <BedIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">No rooms found. Add rooms to get started.</Typography>
        </Paper>
      ) : (
        branchEntries.map(([branchName, rooms]) => (
          <BranchSection key={branchName} branchName={branchName} rooms={rooms} />
        ))
      )}
    </Box>
  );
}

export default RoomStatus;
