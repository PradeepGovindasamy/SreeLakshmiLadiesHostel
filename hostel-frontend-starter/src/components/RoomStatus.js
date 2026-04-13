import React, { useEffect, useState } from 'react';
import { enhancedAPI } from '../api';
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Paper, Stack, Alert, IconButton, Tooltip, Collapse
} from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BedIcon from '@mui/icons-material/Bed';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// ─── Design Tokens ───────────────────────────────────────────────────────────

const STATUS_META = {
  Vacant: {
    chip: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    accent: '#22c55e',
  },
  'Partially Occupied': {
    chip: { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
    accent: '#f59e0b',
  },
  Occupied: {
    chip: { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
    accent: '#ef4444',
  },
  Maintenance: {
    chip: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
    accent: '#94a3b8',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoomStatus(room) {
  if (!room.is_available) return 'Maintenance';
  const occ = room.current_occupancy || 0;
  const cap = room.sharing_type || 0;
  if (occ === 0) return 'Vacant';
  if (occ >= cap) return 'Occupied';
  return 'Partially Occupied';
}

function getBranchSummary(rooms) {
  const totalBeds    = rooms.reduce((s, r) => s + (r.sharing_type || 0), 0);
  const occupiedBeds = rooms.reduce((s, r) => s + (r.current_occupancy || 0), 0);
  const counts = { Vacant: 0, 'Partially Occupied': 0, Occupied: 0, Maintenance: 0 };
  rooms.forEach(r => { counts[getRoomStatus(r)]++; });
  return { total: rooms.length, totalBeds, occupiedBeds, ...counts };
}

// ─── ProgressBar (custom) ────────────────────────────────────────────────────

function ProgressBar({ value, max, height = 8, animate = false }) {
  const pct   = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct === 0 ? '#22c55e' : pct >= 100 ? '#ef4444' : '#f59e0b';
  return (
    <Box sx={{ position: 'relative', height, borderRadius: 8, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
      <Box sx={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: animate ? '100%' : `${Math.min(pct, 100)}%`,
        borderRadius: 8,
        backgroundColor: color,
        transition: 'width 0.6s ease',
        ...(animate && {
          backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.25) 40px,rgba(255,255,255,0.25) 80px)',
          animation: 'shimmer 1.2s linear infinite',
          '@keyframes shimmer': {
            '0%':   { backgroundPosition: '0 0' },
            '100%': { backgroundPosition: '80px 0' },
          },
        }),
      }} />
    </Box>
  );
}

// ─── OccupancyBar ────────────────────────────────────────────────────────────

function OccupancyBar({ value, max }) {
  const pct   = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct === 0 ? '#22c55e' : pct >= 100 ? '#ef4444' : '#f59e0b';
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>Occupancy</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" fontWeight={700} color="grey.800">{value}</Typography>
          <Typography variant="caption" color="text.secondary">/ {max} beds</Typography>
          <Typography variant="caption" fontWeight={600} sx={{ ml: 0.5, color }}>({pct}%)</Typography>
        </Box>
      </Box>
      <ProgressBar value={value} max={max} height={6} />
    </Box>
  );
}

// ─── StatusChip ──────────────────────────────────────────────────────────────

function StatusChip({ status }) {
  const meta = STATUS_META[status];
  const label = status === 'Partially Occupied' ? 'Partial' : status;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1.25, py: 0.4,
      borderRadius: 1.5,
      backgroundColor: meta.chip.bg,
      border: `1px solid ${meta.chip.border}`,
      lineHeight: 1,
      flexShrink: 0,
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.accent, flexShrink: 0 }} />
      <Typography variant="caption" fontWeight={700} sx={{ color: meta.chip.color, lineHeight: 1, fontSize: 11 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── StatPill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, dotColor }) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      px: 2, py: 0.875,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.18)',
      minWidth: 60,
    }}>
      <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.1 }}>{value}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.3 }}>
        {dotColor && <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />}
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', fontSize: 10, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── MetaTag ─────────────────────────────────────────────────────────────────

function MetaTag({ label, color }) {
  const bg      = color === 'blue'  ? '#eff6ff' : color === 'green' ? '#f0fdf4' : '#f8fafc';
  const border  = color === 'blue'  ? '#bfdbfe' : color === 'green' ? '#bbf7d0' : '#e2e8f0';
  const text    = color === 'blue'  ? '#1d4ed8' : color === 'green' ? '#15803d' : '#64748b';
  return (
    <Box sx={{ px: 1, py: 0.3, borderRadius: 1, backgroundColor: bg, border: `1px solid ${border}` }}>
      <Typography variant="caption" sx={{ color: text, fontWeight: 500, fontSize: 11 }}>{label}</Typography>
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
        border: '1px solid #e2e8f0',
        borderLeft: `3px solid ${meta.accent}`,
        borderRadius: 2.5,
        backgroundColor: '#ffffff',
        transition: 'box-shadow 0.2s ease, transform 0.15s ease',
        '&:hover': {
          boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header: room name + status chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
              backgroundColor: `${meta.accent}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MeetingRoomIcon sx={{ fontSize: 16, color: meta.accent }} />
            </Box>
            <Typography variant="subtitle2" fontWeight={700} color="grey.900" noWrap>
              {room.room_name}
            </Typography>
          </Box>
          <StatusChip status={status} />
        </Box>

        {/* Meta tags */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.75 }}>
          <MetaTag label={`Floor ${room.floor_number || 1}`} />
          <MetaTag label={`${cap}-Sharing`} />
          {room.ac_room      && <MetaTag label="AC"   color="blue" />}
          {room.attached_bath && <MetaTag label="Bath" color="green" />}
        </Stack>

        {/* Occupancy */}
        <OccupancyBar value={occ} max={cap} />

        {/* Rent */}
        {room.rent && (
          <Box sx={{
            mt: 1.5, pt: 1.5,
            borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Typography variant="caption" color="text.secondary">Rent</Typography>
            <Typography variant="caption" fontWeight={700} color="grey.800">
              ₹{Number(room.rent).toLocaleString('en-IN')}/mo
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── BranchSection ───────────────────────────────────────────────────────────

function BranchSection({ branchName, rooms }) {
  const [open, setOpen] = useState(true);
  const s      = getBranchSummary(rooms);
  const bedPct = s.totalBeds > 0 ? Math.round((s.occupiedBeds / s.totalBeds) * 100) : 0;
  const barColor = bedPct >= 90 ? '#f87171' : bedPct >= 60 ? '#fbbf24' : '#4ade80';

  return (
    <Box sx={{ mb: 5 }}>
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #1e3a8a',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 65%, #1d4ed8 100%)',
        }}
      >
        {/* Header row */}
        <Box sx={{
          px: 3, py: 2.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 2,
        }}>
          {/* Branch name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2, flexShrink: 0,
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HomeWorkIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.25}>
                {branchName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {s.total} room{s.total !== 1 ? 's' : ''} &nbsp;·&nbsp; {s.occupiedBeds}/{s.totalBeds} beds
              </Typography>
            </Box>
          </Box>

          {/* Stat pills + toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Stack direction="row" spacing={1}>
              <StatPill label="Vacant"   value={s.Vacant}                dotColor="#4ade80" />
              <StatPill label="Partial"  value={s['Partially Occupied']} dotColor="#fbbf24" />
              <StatPill label="Occupied" value={s.Occupied}              dotColor="#f87171" />
              {s.Maintenance > 0 && <StatPill label="Maint." value={s.Maintenance} dotColor="#94a3b8" />}
            </Stack>
            <Tooltip title={open ? 'Collapse' : 'Expand'}>
              <IconButton
                size="small"
                onClick={() => setOpen(o => !o)}
                sx={{
                  color: '#fff',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                }}
              >
                {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Occupancy strip */}
        <Box sx={{ px: 3, pb: 2.25, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            flex: 1, position: 'relative', height: 6,
            borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden',
          }}>
            <Box sx={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${Math.min(bedPct, 100)}%`,
              borderRadius: 8,
              backgroundColor: barColor,
              transition: 'width 0.6s ease',
            }} />
          </Box>
          <Typography variant="caption" fontWeight={700} sx={{ color: '#fff', minWidth: 36, textAlign: 'right' }}>
            {bedPct}%
          </Typography>
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

// ─── OverviewStat ────────────────────────────────────────────────────────────

function OverviewStat({ label, value, sub, color }) {
  return (
    <Box sx={{
      flex: 1, px: 3, py: 2.25,
      borderRight: '1px solid #f1f5f9',
      '&:last-child': { borderRight: 'none' },
    }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: 0.7 }}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ color: color || 'grey.900', lineHeight: 1.2, mt: 0.5 }}>
        {value}
      </Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Box>
  );
}

// ─── PageHeader ──────────────────────────────────────────────────────────────

function PageHeader({ totalRooms, totalBeds, occupiedBeds, onRefresh, loading }) {
  const overallPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const vacantBeds = totalBeds - occupiedBeds;
  const barColor   = overallPct >= 90 ? '#ef4444' : overallPct >= 60 ? '#f59e0b' : '#22c55e';

  return (
    <Paper
      elevation={0}
      sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#fff', overflow: 'hidden' }}
    >
      {/* Title row */}
      <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="grey.900">Room Occupancy</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Live overview of all rooms across properties
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            size="small"
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              color: 'grey.600',
              '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats strip */}
      <Box sx={{ display: 'flex', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <OverviewStat label="Total Rooms" value={totalRooms} />
        <OverviewStat label="Total Beds"  value={totalBeds} />
        <OverviewStat label="Occupied"    value={occupiedBeds} color="#ef4444" sub={`${overallPct}% of beds`} />
        <OverviewStat label="Vacant"      value={vacantBeds}   color="#22c55e" />
      </Box>

      {/* Overall progress */}
      <Box sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.875 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            Overall Bed Utilisation
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: barColor }}>{overallPct}%</Typography>
        </Box>
        <ProgressBar value={occupiedBeds} max={totalBeds} height={10} animate={loading} />

        {/* Legend */}
        <Stack direction="row" spacing={2.5} mt={1.5} flexWrap="wrap">
          {Object.entries(STATUS_META).map(([label, meta]) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: meta.accent }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}

// ─── RoomStatus (main) ───────────────────────────────────────────────────────

function RoomStatus() {
  const [groupedRooms, setGroupedRooms] = useState({});
  const [totals, setTotals]             = useState({ rooms: 0, beds: 0, occupied: 0 });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await enhancedAPI.rooms.list();
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress thickness={3} />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{ borderRadius: 2, border: '1px solid #fecaca' }}
          action={
            <IconButton size="small" onClick={fetchRooms} color="inherit">
              <RefreshIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      ) : branchEntries.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8, textAlign: 'center',
            border: '1px dashed #e2e8f0',
            borderRadius: 3,
            backgroundColor: '#fafbfc',
          }}
        >
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <BedIcon sx={{ fontSize: 36, color: '#94a3b8' }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="grey.600" gutterBottom>No rooms found</Typography>
          <Typography variant="body2" color="text.secondary">Add rooms to start tracking occupancy.</Typography>
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
