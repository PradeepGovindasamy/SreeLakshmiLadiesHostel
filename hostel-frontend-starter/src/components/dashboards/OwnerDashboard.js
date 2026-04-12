// src/components/dashboards/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, LinearProgress, Alert,
  IconButton, Tooltip, Button, Avatar, Stack, Paper
} from '@mui/material';
import {
  Business, Home, People, Payment, TrendingUp,
  Visibility, Add, Refresh, ArrowUpward, MeetingRoom
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { enhancedAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';

// ─── Reusable stat card ──────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon, gradient, trend }) {
  return (
    <Card elevation={0} sx={{
      height: '100%',
      border: '1px solid #e2e8f0',
      borderRadius: 3,
      overflow: 'hidden',
      position: 'relative',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 6 },
    }}>
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: gradient,
      }} />
      <CardContent sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={800} color="grey.900" sx={{ mt: 0.5, lineHeight: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{
            width: 48, height: 48, borderRadius: 2,
            background: gradient, boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" fontWeight={700} color="grey.900">{title}</Typography>
      {actionLabel && (
        <Button size="small" variant="outlined" onClick={onAction}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

// ─── OwnerDashboard ──────────────────────────────────────────────────────────
const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { getUserName } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    properties: [],
    tenants: [],
    statistics: {
      totalProperties: 0, totalRooms: 0, occupiedRooms: 0,
      totalTenants: 0, pendingRequests: 0, monthlyRevenue: 0
    }
  });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [propertiesRes, tenantsRes] = await Promise.all([
        enhancedAPI.branches.list(),
        enhancedAPI.tenants.list(),
      ]);
      const properties = propertiesRes.data.results || propertiesRes.data;
      const tenants = tenantsRes.data.results || tenantsRes.data;

      const totalRooms    = properties.reduce((s, p) => s + (p.total_rooms || p.num_rooms || 0), 0);
      const occupiedRooms = properties.reduce((s, p) => s + (p.occupied_rooms || 0), 0);
      const monthlyRevenue = tenants.reduce((s, t) => s + (parseFloat(t.rent_amount) || 0), 0);

      setDashboardData({
        properties,
        tenants: tenants.slice(0, 10),
        statistics: {
          totalProperties: properties.length,
          totalRooms,
          occupiedRooms,
          totalTenants: tenants.length,
          pendingRequests: 0,
          monthlyRevenue,
        }
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
        <Typography color="text.secondary">Loading your dashboard…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" action={
          <Button size="small" startIcon={<Refresh />} onClick={fetchDashboardData}>Retry</Button>
        }>{error}</Alert>
      </Box>
    );
  }

  const { properties, tenants, statistics } = dashboardData;
  const occupancyRate = statistics.totalRooms > 0
    ? Math.round((statistics.occupiedRooms / statistics.totalRooms) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

      {/* ── Welcome header ── */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="grey.900">
          Good day, {getUserName()} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Here's what's happening across your properties today.
        </Typography>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Properties', value: statistics.totalProperties,
            icon: <Business sx={{ fontSize: 22 }} />,
            gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)',
          },
          {
            title: 'Total Rooms', value: statistics.totalRooms,
            icon: <MeetingRoom sx={{ fontSize: 22 }} />,
            gradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
          },
          {
            title: 'Occupied Rooms', value: statistics.occupiedRooms,
            subtitle: `${occupancyRate}% occupancy rate`,
            icon: <Home sx={{ fontSize: 22 }} />,
            gradient: 'linear-gradient(135deg,#10b981,#059669)',
          },
          {
            title: 'Active Tenants', value: statistics.totalTenants,
            icon: <People sx={{ fontSize: 22 }} />,
            gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
          },
          {
            title: 'Vacant Rooms', value: statistics.totalRooms - statistics.occupiedRooms,
            subtitle: `${100 - occupancyRate}% available`,
            icon: <TrendingUp sx={{ fontSize: 22 }} />,
            gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
          },
          {
            title: 'Est. Monthly Revenue',
            value: `₹${statistics.monthlyRevenue.toLocaleString('en-IN')}`,
            icon: <Payment sx={{ fontSize: 22 }} />,
            gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',
          },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.title}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* ── Overall occupancy bar ── */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>Overall Occupancy</Typography>
          <Typography variant="body2" fontWeight={700} color={occupancyRate >= 80 ? 'error.main' : 'success.main'}>
            {occupancyRate}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={occupancyRate}
          color={occupancyRate >= 90 ? 'error' : occupancyRate >= 60 ? 'warning' : 'success'}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Stack direction="row" spacing={3} mt={1.5}>
          <Typography variant="caption" color="text.secondary">
            {statistics.occupiedRooms} occupied &nbsp;·&nbsp; {statistics.totalRooms - statistics.occupiedRooms} vacant
          </Typography>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* ── Properties table ── */}
        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <CardContent>
              <SectionHeader
                title="My Properties"
                actionLabel="Manage Properties"
                onAction={() => navigate('/branches')}
              />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #e2e8f0' } }}>
                      <TableCell>Property</TableCell>
                      <TableCell>City</TableCell>
                      <TableCell align="center">Rooms</TableCell>
                      <TableCell>Occupancy</TableCell>
                      <TableCell align="center"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {properties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No properties found.{' '}
                          <Button size="small" startIcon={<Add />} onClick={() => navigate('/branches')}>
                            Add one
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : properties.map((p) => {
                      const rooms = p.total_rooms || p.num_rooms || 0;
                      const occ   = p.occupied_rooms || 0;
                      const pct   = rooms > 0 ? Math.round((occ / rooms) * 100) : 0;
                      return (
                        <TableRow key={p.id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.property_type_display}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{p.city || '—'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={rooms} size="small" sx={{ fontWeight: 600, minWidth: 36 }} />
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                color={pct >= 90 ? 'error' : pct >= 60 ? 'warning' : 'success'}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                {pct}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View details">
                              <IconButton size="small" onClick={() => navigate('/branches')}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Recent tenants ── */}
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <CardContent>
              <SectionHeader
                title="Recent Tenants"
                actionLabel="View All"
                onAction={() => navigate('/tenants')}
              />
              {tenants.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <People sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                  <Typography variant="body2">No tenants yet.</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {tenants.map((t) => (
                    <Box key={t.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      p: 1.5, borderRadius: 2, border: '1px solid #f1f5f9',
                      '&:hover': { backgroundColor: '#f8fafc' }
                    }}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, backgroundColor: '#3b82f6' }}>
                        {(t.name || t.user?.first_name || 'T').slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {t.name || `${t.user?.first_name || ''} ${t.user?.last_name || ''}`.trim() || 'Tenant'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {t.room_display || t.branch_name || '—'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="success.main" sx={{ whiteSpace: 'nowrap' }}>
                        ₹{Number(t.rent_amount || 0).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OwnerDashboard;


