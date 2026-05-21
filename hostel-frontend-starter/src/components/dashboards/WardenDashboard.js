// src/components/dashboards/WardenDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Tooltip, Button, Avatar, Stack, Chip, alpha,
} from '@mui/material';
import {
  Home, People, ListAlt, CheckCircle, Phone, Email, Payment,
  Visibility, PriorityHigh, Notifications, MeetingRoom,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { enhancedAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';
import {
  PageShell, PageHeader, MetricCard, MetricGrid, SectionPanel,
  OccupancyBar, ResponsiveTableWrap, DashboardLoading, DashboardError, dash, occupancyTone,
} from '../ui/DashboardUI';

const PRIORITY_STYLES = {
  urgent: { bg: alpha('#ef4444', 0.08), color: '#dc2626' },
  high:   { bg: alpha('#f59e0b', 0.08), color: '#b45309' },
  medium: { bg: alpha('#0ea5e9', 0.08), color: '#0284c7' },
  low:    { bg: alpha('#64748b', 0.08), color: '#64748b' },
};

const STATUS_STYLES = {
  open:        { bg: alpha('#ef4444', 0.08), color: '#dc2626' },
  in_progress: { bg: alpha('#f59e0b', 0.08), color: '#b45309' },
  resolved:    { bg: alpha('#22c55e', 0.08), color: '#15803d' },
  closed:      { bg: alpha('#64748b', 0.08), color: '#64748b' },
};

function SoftChip({ label, style }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        px: 1,
        py: 0.25,
        borderRadius: 1.5,
        bgcolor: style.bg,
        flexShrink: 0,
      }}
    >
      <Typography variant="caption" sx={{ color: style.color, fontWeight: 500, fontSize: 10, lineHeight: 1.4 }}>
        {label}
      </Typography>
    </Box>
  );
}

const WardenDashboard = () => {
  const navigate = useNavigate();
  const { getUserName } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    assignedProperty: null,
    tenants: [],
    recentRequests: [],
    pendingRequests: [],
    statistics: {
      totalRooms: 0,
      occupiedRooms: 0,
      totalTenants: 0,
      pendingRequests: 0,
      urgentRequests: 0,
      monthlyCollection: 0,
    },
  });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [branchesRes, tenantsRes, roomsRes] = await Promise.all([
        enhancedAPI.branches.list(),
        enhancedAPI.tenants.list(),
        enhancedAPI.rooms.list(),
      ]);
      const branches = branchesRes.data.results || branchesRes.data || [];
      const allTenants = tenantsRes.data.results || tenantsRes.data || [];
      const rooms = roomsRes.data.results || roomsRes.data || [];

      const activeTenants = allTenants.filter(t => t.joining_date && !t.vacating_date);
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => (r.current_occupancy || 0) > 0).length;
      const monthlyCollection = activeTenants.reduce((s, t) => s + (parseFloat(t.rent_amount) || 0), 0);
      const assignedProperty = branches.length > 0 ? branches[0] : null;

      setDashboardData({
        assignedProperty,
        tenants: activeTenants,
        recentRequests: [],
        pendingRequests: [],
        statistics: {
          totalRooms,
          occupiedRooms,
          totalTenants: activeTenants.length,
          pendingRequests: 0,
          urgentRequests: 0,
          monthlyCollection,
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

  const getStatusChip = (status) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.closed;
    return <SoftChip label={(status || 'unknown').replace('_', ' ')} style={style} />;
  };

  const getPriorityChip = (priority) => {
    const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;
    return <SoftChip label={priority || 'low'} style={style} />;
  };

  if (loading) return <DashboardLoading message="Loading dashboard…" />;
  if (error) return <DashboardError message={error} onRetry={fetchDashboardData} />;

  const { assignedProperty, tenants, recentRequests, pendingRequests, statistics } = dashboardData;
  const occupancyRate = statistics.totalRooms > 0
    ? Math.round((statistics.occupiedRooms / statistics.totalRooms) * 100) : 0;
  const vacantRooms = statistics.totalRooms - statistics.occupiedRooms;

  const tableHeadSx = {
    fontWeight: 500,
    color: dash.textMuted,
    fontSize: 11,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    borderBottom: `1px solid ${dash.borderLight}`,
    py: 1.25,
    whiteSpace: 'nowrap',
    bgcolor: dash.surface,
  };

  const urgentItems = pendingRequests.filter(req => req.priority === 'urgent' || req.priority === 'high');

  return (
    <PageShell>
      <PageHeader
        title={`Welcome back, ${getUserName()}`}
        subtitle={assignedProperty?.name || 'Assigned property'}
        onRefresh={fetchDashboardData}
        loading={loading}
        actions={
          assignedProperty && (
            <Chip
              size="small"
              label={`${assignedProperty.address || ''}${assignedProperty.city ? `, ${assignedProperty.city}` : ''}`}
              sx={{
                height: 28,
                bgcolor: alpha('#0f172a', 0.04),
                color: dash.textSecondary,
                fontWeight: 400,
                fontSize: 12,
                maxWidth: { xs: '100%', sm: 280 },
                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
              }}
            />
          )
        }
      />

      <MetricGrid columns={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
        <MetricCard
          label="Total rooms"
          value={statistics.totalRooms}
          hint={`${vacantRooms} vacant`}
          icon={<MeetingRoom sx={{ fontSize: 18 }} />}
          accent="#6366f1"
          onClick={() => navigate('/rooms')}
        />
        <MetricCard
          label="Occupied rooms"
          value={statistics.occupiedRooms}
          hint={`${occupancyRate}% occupancy`}
          icon={<Home sx={{ fontSize: 18 }} />}
          accent={occupancyTone(occupancyRate)}
          onClick={() => navigate('/room-status')}
        />
        <MetricCard
          label="Active tenants"
          value={statistics.totalTenants}
          icon={<People sx={{ fontSize: 18 }} />}
          accent="#8b5cf6"
          onClick={() => navigate('/tenants')}
        />
        <MetricCard
          label="Monthly collection"
          value={`₹${statistics.monthlyCollection.toLocaleString('en-IN')}`}
          icon={<Payment sx={{ fontSize: 18 }} />}
          accent="#10b981"
        />
      </MetricGrid>

      <Box sx={{ mb: { xs: 2.5, md: 3 }, px: 0.25 }}>
        <OccupancyBar
          value={statistics.occupiedRooms}
          max={statistics.totalRooms}
          height={6}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },
          gap: { xs: 2, md: 2.5 },
          mb: { xs: 2, md: 2.5 },
          alignItems: 'start',
        }}
      >
        {/* Urgent requests */}
        <SectionPanel
          title="Urgent requests"
          actionLabel="View all"
          onAction={() => navigate('/tenant-requests')}
          sx={{ minHeight: { lg: 360 } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Notifications sx={{ fontSize: 16, color: dash.textMuted }} />
            <Typography variant="caption" sx={{ color: dash.textSecondary }}>
              {statistics.urgentRequests} urgent · {statistics.pendingRequests} pending
            </Typography>
          </Box>
          <Stack spacing={1} sx={{ maxHeight: { lg: 280 }, overflowY: 'auto' }}>
            {urgentItems.map((request) => (
              <Box
                key={request.id}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: alpha('#ef4444', 0.03),
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <PriorityHigh sx={{ fontSize: 16, color: PRIORITY_STYLES[request.priority]?.color || '#64748b', mt: 0.25 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: dash.text }} noWrap>
                    {request.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: dash.textMuted, display: 'block' }}>
                    {request.tenant_name} · Room {request.tenant_room}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{getPriorityChip(request.priority)}</Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/tenant-requests/${request.id}`)}
                  sx={{ color: dash.textSecondary }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {statistics.urgentRequests === 0 && (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 28, color: alpha('#22c55e', 0.5), mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: dash.text }}>All caught up</Typography>
                <Typography variant="caption" sx={{ color: dash.textMuted }}>No urgent requests</Typography>
              </Box>
            )}
          </Stack>
        </SectionPanel>

        {/* Current tenants */}
        <SectionPanel
          title="Current tenants"
          actionLabel="View all"
          onAction={() => navigate('/tenants')}
        >
          <ResponsiveTableWrap>
            <Table size="small" stickyHeader sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeadSx}>Tenant</TableCell>
                  <TableCell sx={tableHeadSx}>Room</TableCell>
                  <TableCell sx={{ ...tableHeadSx, display: { xs: 'none', md: 'table-cell' } }}>Contact</TableCell>
                  <TableCell sx={tableHeadSx} align="right">Rent</TableCell>
                  <TableCell sx={{ ...tableHeadSx, display: { xs: 'none', sm: 'table-cell' } }}>Joined</TableCell>
                  <TableCell sx={tableHeadSx} align="center" />
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, border: 'none', color: dash.textSecondary }}>
                      No active tenants
                    </TableCell>
                  </TableRow>
                ) : tenants.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    sx={{
                      '&:last-child td': { border: 0 },
                      '&:hover': { bgcolor: alpha('#0f172a', 0.02) },
                    }}
                  >
                    <TableCell sx={{ borderColor: dash.borderLight, py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: dash.text }}>{tenant.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: dash.borderLight, fontSize: 13, color: dash.textSecondary }}>
                      {tenant.room_name || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ borderColor: dash.borderLight, display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="caption" sx={{ color: dash.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ fontSize: 11 }} />{tenant.phone_number || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: dash.textMuted, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email sx={{ fontSize: 11 }} />{tenant.email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ borderColor: dash.borderLight, fontWeight: 600, fontSize: 13, color: dash.text }}>
                      ₹{tenant.rent_amount?.toLocaleString('en-IN') || 0}
                    </TableCell>
                    <TableCell sx={{ borderColor: dash.borderLight, display: { xs: 'none', sm: 'table-cell' }, fontSize: 12, color: dash.textSecondary }}>
                      {tenant.date_of_joining ? new Date(tenant.date_of_joining).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell align="center" sx={{ borderColor: dash.borderLight }}>
                      <Tooltip title="View profile">
                        <IconButton size="small" onClick={() => navigate(`/tenants/${tenant.id}`)} sx={{ color: dash.textSecondary }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTableWrap>
        </SectionPanel>
      </Box>

      {/* Recent service requests */}
      <SectionPanel
        title="Recent service requests"
        actionLabel="View all"
        onAction={() => navigate('/tenant-requests')}
      >
        <ResponsiveTableWrap>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeadSx}>Request</TableCell>
                <TableCell sx={tableHeadSx}>Tenant</TableCell>
                <TableCell sx={{ ...tableHeadSx, display: { xs: 'none', sm: 'table-cell' } }}>Room</TableCell>
                <TableCell sx={{ ...tableHeadSx, display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
                <TableCell sx={tableHeadSx}>Priority</TableCell>
                <TableCell sx={{ ...tableHeadSx, display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
                <TableCell sx={{ ...tableHeadSx, display: { xs: 'none', lg: 'table-cell' } }}>Date</TableCell>
                <TableCell sx={tableHeadSx} align="center" />
              </TableRow>
            </TableHead>
            <TableBody>
              {recentRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, border: 'none' }}>
                    <ListAlt sx={{ fontSize: 28, color: alpha('#0f172a', 0.1), mb: 1 }} />
                    <Typography variant="body2" sx={{ color: dash.textSecondary }}>No service requests yet</Typography>
                  </TableCell>
                </TableRow>
              ) : recentRequests.slice(0, 5).map((request) => (
                <TableRow
                  key={request.id}
                  sx={{
                    '&:last-child td': { border: 0 },
                    '&:hover': { bgcolor: alpha('#0f172a', 0.02) },
                  }}
                >
                  <TableCell sx={{ borderColor: dash.borderLight, py: 1.25, maxWidth: 200 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: dash.text }} noWrap>{request.title}</Typography>
                    <Typography variant="caption" sx={{ color: dash.textMuted }} noWrap>
                      {request.description?.substring(0, 40)}{(request.description?.length || 0) > 40 ? '…' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: dash.borderLight, fontSize: 13 }}>{request.tenant_name}</TableCell>
                  <TableCell sx={{ borderColor: dash.borderLight, display: { xs: 'none', sm: 'table-cell' }, fontSize: 13 }}>
                    {request.tenant_room}
                  </TableCell>
                  <TableCell sx={{ borderColor: dash.borderLight, display: { xs: 'none', md: 'table-cell' } }}>
                    <SoftChip label={request.request_type_display || '—'} style={PRIORITY_STYLES.low} />
                  </TableCell>
                  <TableCell sx={{ borderColor: dash.borderLight }}>{getPriorityChip(request.priority)}</TableCell>
                  <TableCell sx={{ borderColor: dash.borderLight, display: { xs: 'none', sm: 'table-cell' } }}>
                    {getStatusChip(request.status)}
                  </TableCell>
                  <TableCell sx={{ borderColor: dash.borderLight, display: { xs: 'none', lg: 'table-cell' }, fontSize: 12, color: dash.textSecondary }}>
                    {request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell align="center" sx={{ borderColor: dash.borderLight }}>
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/tenant-requests/${request.id}`)} sx={{ color: dash.textSecondary }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTableWrap>
      </SectionPanel>
    </PageShell>
  );
};

export default WardenDashboard;
