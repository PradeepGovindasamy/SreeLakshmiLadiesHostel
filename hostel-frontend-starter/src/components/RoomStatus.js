import React, { useEffect, useState } from 'react';
import { enhancedAPI } from '../api';
import { sortRoomsByBuildingHierarchy, groupRoomsByFloor } from '../utils/roomSort';
import { formatRoomType, formatRoomAcLabel } from '../utils/roomFormatters';
import {
  Box, Typography, Grid, CircularProgress, Stack, Alert, IconButton,
  Collapse, alpha,
} from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BedIcon from '@mui/icons-material/Bed';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
  PageShell, PageHeader, SoftCard, MetricCard, MetricGrid,
  OccupancyBar, BedDots, StatusBadge, dash, STATUS_COLORS, occupancyTone,
} from './ui/DashboardUI';

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
  const totalBeds = rooms.reduce((s, r) => s + (r.sharing_type || 0), 0);
  const occupiedBeds = rooms.reduce((s, r) => s + (r.current_occupancy || 0), 0);
  const counts = { Vacant: 0, 'Partially Occupied': 0, Occupied: 0, Maintenance: 0 };
  rooms.forEach(r => { counts[getRoomStatus(r)]++; });
  return { total: rooms.length, totalBeds, occupiedBeds, ...counts };
}

// ─── RoomCard ────────────────────────────────────────────────────────────────

function RoomCard({ room }) {
  const status = getRoomStatus(room);
  const meta = STATUS_COLORS[status === 'Partially Occupied' ? 'Partial' : status];
  const occ = room.current_occupancy || 0;
  const cap = room.sharing_type || 0;

  return (
    <SoftCard hover sx={{ height: '100%' }}>
      <Box sx={{ p: { xs: 1.75, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                flexShrink: 0,
                bgcolor: meta.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MeetingRoomIcon sx={{ fontSize: 15, color: meta.dot }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: dash.text }} noWrap>
              {room.room_name}
            </Typography>
          </Box>
          <StatusBadge status={status} />
        </Box>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: dash.textSecondary }}>
            Floor {room.floor_number || 1}
          </Typography>
          <Typography variant="caption" sx={{ color: dash.textMuted }}>·</Typography>
          <Typography variant="caption" sx={{ color: dash.textSecondary }}>
            {formatRoomType(room)}
          </Typography>
          <Typography variant="caption" sx={{ color: dash.textMuted }}>·</Typography>
          <Typography variant="caption" sx={{ color: dash.textSecondary }}>
            {formatRoomAcLabel(room)}
          </Typography>
          {room.attached_bath && (
            <>
              <Typography variant="caption" sx={{ color: dash.textMuted }}>·</Typography>
              <Typography variant="caption" sx={{ color: dash.textSecondary }}>Attached bath</Typography>
            </>
          )}
        </Stack>

        {cap > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Typography variant="caption" sx={{ color: dash.textSecondary }}>Beds</Typography>
              <Typography variant="caption" sx={{ color: dash.textSecondary }}>
                {occ}/{cap}
              </Typography>
            </Box>
            <BedDots occupied={occ} total={cap} size={7} />
          </Box>
        )}

        <OccupancyBar value={occ} max={cap} height={5} />

        {room.rent && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${dash.borderLight}`, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: dash.textSecondary }}>Rent</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: dash.text }}>
              ₹{Number(room.rent).toLocaleString('en-IN')}/mo
            </Typography>
          </Box>
        )}
      </Box>
    </SoftCard>
  );
}

// ─── Branch mini stat ────────────────────────────────────────────────────────

function BranchStat({ label, value, color }) {
  return (
    <Box sx={{ textAlign: 'center', px: { xs: 1, sm: 1.5 }, py: 0.75, minWidth: 52 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: dash.text, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4, mt: 0.25 }}>
        {color && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color }} />}
        <Typography variant="caption" sx={{ color: dash.textMuted, fontSize: 10, whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── BranchSection ───────────────────────────────────────────────────────────

function BranchSection({ branchName, rooms }) {
  const [open, setOpen] = useState(true);
  const s = getBranchSummary(rooms);
  const bedPct = s.totalBeds > 0 ? Math.round((s.occupiedBeds / s.totalBeds) * 100) : 0;
  const barColor = occupancyTone(bedPct);

  return (
    <Box sx={{ mb: { xs: 3, md: 4 } }}>
      <SoftCard hover={false} sx={{ mb: 2 }}>
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  flexShrink: 0,
                  bgcolor: alpha('#6366f1', 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HomeWorkIcon sx={{ fontSize: 20, color: '#6366f1' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: dash.text, lineHeight: 1.3 }}>
                  {branchName}
                </Typography>
                <Typography variant="caption" sx={{ color: dash.textSecondary }}>
                  {s.total} room{s.total !== 1 ? 's' : ''} · {s.occupiedBeds}/{s.totalBeds} beds filled
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                width: { xs: '100%', md: 'auto' },
                justifyContent: { xs: 'space-between', md: 'flex-end' },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: alpha('#0f172a', 0.02),
                  borderRadius: 2,
                  py: 0.25,
                }}
              >
                <BranchStat label="Vacant" value={s.Vacant} color="#22c55e" />
                <BranchStat label="Partial" value={s['Partially Occupied']} color="#f59e0b" />
                <BranchStat label="Full" value={s.Occupied} color="#6366f1" />
                {s.Maintenance > 0 && <BranchStat label="Maint." value={s.Maintenance} color="#94a3b8" />}
              </Box>
              <IconButton
                size="small"
                onClick={() => setOpen(o => !o)}
                sx={{ color: dash.textSecondary, bgcolor: alpha('#0f172a', 0.04) }}
              >
                {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1, height: 5, borderRadius: 99, bgcolor: alpha('#0f172a', 0.05), overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${Math.min(bedPct, 100)}%`,
                  borderRadius: 99,
                  bgcolor: barColor,
                  transition: 'width 0.5s ease',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: barColor, minWidth: 32, textAlign: 'right' }}>
              {bedPct}%
            </Typography>
          </Box>
        </Box>
      </SoftCard>

      <Collapse in={open}>
        {groupRoomsByFloor(rooms).map(section => (
          <Box key={section.group} sx={{ mb: 2.5 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                px: 0.5,
                mb: 1.5,
                color: dash.textSecondary,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {section.title}
            </Typography>
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              {section.data.map(room => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
                  <RoomCard room={room} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Collapse>
    </Box>
  );
}

// ─── Overview strip ──────────────────────────────────────────────────────────

function OverviewStrip({ totalRooms, totalBeds, occupiedBeds, loading }) {
  const overallPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const vacantBeds = totalBeds - occupiedBeds;

  return (
    <>
      <MetricGrid columns={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
        <MetricCard label="Total rooms" value={totalRooms} accent="#6366f1" />
        <MetricCard label="Total beds" value={totalBeds} accent="#0ea5e9" />
        <MetricCard
          label="Occupied beds"
          value={occupiedBeds}
          hint={`${overallPct}% utilisation`}
          accent={occupancyTone(overallPct)}
        />
        <MetricCard label="Vacant beds" value={vacantBeds} accent="#22c55e" />
      </MetricGrid>

      <SoftCard hover={false} sx={{ mb: { xs: 2.5, md: 3 }, p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: dash.text }}>
            Overall bed utilisation
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: occupancyTone(overallPct) }}>
            {overallPct}%
          </Typography>
        </Box>
        <OccupancyBar value={occupiedBeds} max={totalBeds} showLabel={false} height={8} animate={loading} />

        <Stack direction="row" spacing={2} mt={1.75} flexWrap="wrap" useFlexGap>
          {Object.entries(STATUS_COLORS).filter(([k]) => !['Partial'].includes(k)).map(([label, meta]) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.dot }} />
              <Typography variant="caption" sx={{ color: dash.textSecondary }}>{label}</Typography>
            </Box>
          ))}
        </Stack>
      </SoftCard>
    </>
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
      Object.keys(grouped).forEach(k => {
        grouped[k] = sortRoomsByBuildingHierarchy(grouped[k]);
      });

      const totalBeds = data.reduce((s, r) => s + (r.sharing_type || 0), 0);
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
    <PageShell>
      <PageHeader
        title="Room status"
        subtitle="Live occupancy across all properties"
        onRefresh={fetchRooms}
        loading={loading}
      />

      <OverviewStrip
        totalRooms={totals.rooms}
        totalBeds={totals.beds}
        occupiedBeds={totals.occupied}
        loading={loading}
      />

      {loading && !Object.keys(groupedRooms).length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} thickness={4} sx={{ color: alpha('#0f172a', 0.15) }} />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{ borderRadius: dash.radius, bgcolor: alpha('#ef4444', 0.04) }}
          action={
            <IconButton size="small" onClick={fetchRooms} color="inherit">
              <RefreshIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      ) : branchEntries.length === 0 ? (
        <SoftCard hover={false} sx={{ p: { xs: 5, sm: 8 }, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: alpha('#0f172a', 0.04),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <BedIcon sx={{ fontSize: 28, color: dash.textMuted }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: dash.text, mb: 0.5 }}>
            No rooms found
          </Typography>
          <Typography variant="body2" sx={{ color: dash.textSecondary }}>
            Add rooms to start tracking occupancy.
          </Typography>
        </SoftCard>
      ) : (
        branchEntries.map(([branchName, rooms]) => (
          <BranchSection key={branchName} branchName={branchName} rooms={rooms} />
        ))
      )}
    </PageShell>
  );
}

export default RoomStatus;
