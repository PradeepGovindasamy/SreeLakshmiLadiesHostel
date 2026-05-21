// src/components/dashboards/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Tooltip, Button, Avatar, Stack, alpha,
} from '@mui/material';
import {
  Business, People, Payment, MeetingRoom, Add, Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { enhancedAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';
import {
  PageShell, PageHeader, MetricCard, MetricGrid, SoftCard, SectionPanel,
  OccupancyBar, ResponsiveTableWrap, DashboardLoading, DashboardError, dash, occupancyTone,
} from '../ui/DashboardUI';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { getUserName } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    properties: [],
    tenants: [],
    statistics: {
      totalProperties: 0,
      totalRooms: 0,
      occupiedRooms: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      vacantBeds: 0,
      totalTenants: 0,
      monthlyRevenue: 0,
    },
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

      const totalRooms = properties.reduce((s, p) => s + (p.total_rooms || p.num_rooms || 0), 0);
      const occupiedRooms = properties.reduce((s, p) => s + (p.occupied_rooms || 0), 0);
      const totalBeds = properties.reduce((s, p) => s + (p.total_beds || 0), 0);
      const occupiedBeds = properties.reduce((s, p) => s + (p.occupied_beds || 0), 0);
      const vacantBeds = properties.reduce((s, p) => s + (p.vacant_beds || 0), 0);
      const monthlyRevenue = tenants.reduce((s, t) => s + (parseFloat(t.rent_amount) || 0), 0);

      setDashboardData({
        properties,
        tenants: tenants.slice(0, 8),
        statistics: {
          totalProperties: properties.length,
          totalRooms,
          occupiedRooms,
          totalBeds,
          occupiedBeds,
          vacantBeds,
          totalTenants: tenants.length,
          monthlyRevenue,
        },
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLoading message="Loading your dashboard…" />;
  if (error) return <DashboardError message={error} onRetry={fetchDashboardData} />;

  const { properties, tenants, statistics } = dashboardData;
  const roomOccupancyRate = statistics.totalRooms > 0
    ? Math.round((statistics.occupiedRooms / statistics.totalRooms) * 100) : 0;
  const bedOccupancyRate = statistics.totalBeds > 0
    ? Math.round((statistics.occupiedBeds / statistics.totalBeds) * 100) : 0;

  const tableHeadSx = {
    fontWeight: 500,
    color: dash.textMuted,
    fontSize: 11,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    borderBottom: `1px solid ${dash.borderLight}`,
    py: 1.25,
    whiteSpace: 'nowrap',
  };

  return (
    <PageShell>
      <PageHeader
        title={`Good day, ${getUserName()}`}
        subtitle="Overview of properties, occupancy, and tenants"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      <MetricGrid columns={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
        <MetricCard
          label="Properties"
          value={statistics.totalProperties}
          icon={<Business sx={{ fontSize: 18 }} />}
          accent="#6366f1"
          onClick={() => navigate('/branches')}
        />
        <MetricCard
          label="Total rooms"
          value={statistics.totalRooms}
          hint={`${statistics.occupiedRooms} occupied`}
          icon={<MeetingRoom sx={{ fontSize: 18 }} />}
          accent="#0ea5e9"
          onClick={() => navigate('/rooms')}
        />
        <MetricCard
          label="Active tenants"
          value={statistics.totalTenants}
          icon={<People sx={{ fontSize: 18 }} />}
          accent="#8b5cf6"
          onClick={() => navigate('/tenants')}
        />
        <MetricCard
          label="Est. monthly revenue"
          value={`₹${statistics.monthlyRevenue.toLocaleString('en-IN')}`}
          hint={`${statistics.vacantBeds} vacant beds`}
          icon={<Payment sx={{ fontSize: 18 }} />}
          accent="#10b981"
        />
      </MetricGrid>

      <SoftCard hover={false} sx={{ mb: { xs: 2.5, md: 3 }, p: { xs: 2, sm: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: dash.text, mb: 2 }}>
          Occupancy at a glance
        </Typography>
        <Stack spacing={2.5}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: dash.textSecondary }}>Room occupancy</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: occupancyTone(roomOccupancyRate) }}>
                {roomOccupancyRate}%
              </Typography>
            </Box>
            <OccupancyBar
              value={statistics.occupiedRooms}
              max={statistics.totalRooms}
              showLabel={false}
              height={6}
            />
            <Typography variant="caption" sx={{ color: dash.textMuted, mt: 0.75, display: 'block' }}>
              {statistics.occupiedRooms} occupied · {statistics.totalRooms - statistics.occupiedRooms} vacant rooms
            </Typography>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: dash.textSecondary }}>Bed occupancy</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: occupancyTone(bedOccupancyRate) }}>
                {bedOccupancyRate}%
              </Typography>
            </Box>
            <OccupancyBar
              value={statistics.occupiedBeds}
              max={statistics.totalBeds}
              showLabel={false}
              height={6}
            />
            <Typography variant="caption" sx={{ color: dash.textMuted, mt: 0.75, display: 'block' }}>
              {statistics.occupiedBeds} occupied · {statistics.vacantBeds} vacant · {statistics.totalBeds} total beds
            </Typography>
          </Box>
        </Stack>
      </SoftCard>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' },
          gap: { xs: 2, md: 2.5 },
          alignItems: 'start',
        }}
      >
        <SectionPanel title="Properties" actionLabel="Manage" onAction={() => navigate('/branches')}>
          <ResponsiveTableWrap>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeadSx}>Property</TableCell>
                  <TableCell sx={tableHeadSx}>City</TableCell>
                  <TableCell sx={tableHeadSx} align="center">Rooms</TableCell>
                  <TableCell sx={tableHeadSx}>Beds</TableCell>
                  <TableCell sx={tableHeadSx} align="center" />
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, border: 'none' }}>
                      <Typography variant="body2" sx={{ color: dash.textSecondary, mb: 1 }}>
                        No properties yet
                      </Typography>
                      <Button size="small" startIcon={<Add />} onClick={() => navigate('/branches')} sx={{ textTransform: 'none' }}>
                        Add property
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : properties.map((p) => {
                  const rooms = p.total_rooms || p.num_rooms || 0;
                  const totalBeds = p.total_beds || 0;
                  const occBeds = p.occupied_beds || 0;
                  const bedPct = totalBeds > 0 ? Math.round((occBeds / totalBeds) * 100) : 0;
                  return (
                    <TableRow
                      key={p.id}
                      sx={{
                        '&:last-child td': { border: 0 },
                        '&:hover': { bgcolor: alpha('#0f172a', 0.02) },
                      }}
                    >
                      <TableCell sx={{ borderColor: dash.borderLight, py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: dash.text }}>{p.name}</Typography>
                        <Typography variant="caption" sx={{ color: dash.textMuted }}>{p.property_type_display}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: dash.borderLight, color: dash.textSecondary, fontSize: 13 }}>
                        {p.city || '—'}
                      </TableCell>
                      <TableCell align="center" sx={{ borderColor: dash.borderLight, fontSize: 13 }}>
                        {rooms}
                      </TableCell>
                      <TableCell sx={{ borderColor: dash.borderLight, minWidth: 120 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, color: dash.text }}>
                          {occBeds}/{totalBeds}
                        </Typography>
                        <Box sx={{ mt: 0.5, maxWidth: 100 }}>
                          <OccupancyBar value={occBeds} max={totalBeds} showLabel={false} height={4} />
                        </Box>
                        <Typography variant="caption" sx={{ color: dash.textMuted }}>{bedPct}%</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ borderColor: dash.borderLight }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => navigate('/branches')} sx={{ color: dash.textSecondary }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ResponsiveTableWrap>
        </SectionPanel>

        <SectionPanel title="Recent tenants" actionLabel="View all" onAction={() => navigate('/tenants')}>
          {tenants.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <People sx={{ fontSize: 32, color: alpha('#0f172a', 0.12), mb: 1 }} />
              <Typography variant="body2" sx={{ color: dash.textSecondary }}>No tenants yet</Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {tenants.map((t) => (
                <Box
                  key={t.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: alpha('#0f172a', 0.02),
                    '&:hover': { bgcolor: alpha('#0f172a', 0.04) },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: 12,
                      fontWeight: 600,
                      bgcolor: alpha('#6366f1', 0.12),
                      color: '#6366f1',
                    }}
                  >
                    {(t.name || t.user?.first_name || 'T').slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: dash.text }} noWrap>
                      {t.name || `${t.user?.first_name || ''} ${t.user?.last_name || ''}`.trim() || 'Tenant'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: dash.textMuted }} noWrap>
                      {t.room_display || t.branch_name || '—'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669', whiteSpace: 'nowrap', fontSize: 13 }}>
                    ₹{Number(t.rent_amount || 0).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </SectionPanel>
      </Box>
    </PageShell>
  );
};

export default OwnerDashboard;
