// src/components/dashboards/TenantDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Paper, Chip, Divider,
  LinearProgress, Alert, Button, Collapse, IconButton, Avatar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Home, Payment, ExpandMore, ExpandLess,
  CheckCircle, Warning, Error as ErrorIcon, HourglassEmpty, Refresh,
  WbSunny, LunchDining, LocalCafe, DinnerDining, Restaurant,
  Bathtub, Stairs, SquareFoot, KingBed, AcUnit,
} from '@mui/icons-material';
import { myAPI, enhancedAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';
import { formatRoomType, formatRoomAcLabel } from '../../utils/roomFormatters';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: <WbSunny />,       color: '#f59e0b' },
  { value: 'lunch',     label: 'Lunch',     icon: <LunchDining />,    color: '#10b981' },
  { value: 'snacks',    label: 'Snacks',    icon: <LocalCafe />,      color: '#8b5cf6' },
  { value: 'dinner',    label: 'Dinner',    icon: <DinnerDining />,   color: '#3b82f6' },
];

function RentStatusChip({ status, due }) {
  const cfg = {
    PAID:    { label: '✓ Paid',                                         color: 'success' },
    PARTIAL: { label: `₹${Number(due || 0).toLocaleString('en-IN')} Due`, color: 'warning' },
    PENDING: { label: 'Pending',                                          color: 'default' },
    OVERDUE: { label: `₹${Number(due || 0).toLocaleString('en-IN')} Overdue`, color: 'error' },
    UNKNOWN: { label: 'Rent not configured',                              color: 'default' },
  }[status] || { label: status || '—', color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const { getUserName } = useUser();

  const [profile,      setProfile]      = useState(null);
  const [rentStatus,   setRentStatus]   = useState(null);
  const [ledger,       setLedger]       = useState([]);
  const [todayMenu,    setTodayMenu]    = useState([]);
  const [weekMenu,     setWeekMenu]     = useState([]);
  const [availability, setAvailability] = useState([]);

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [weekOpen,   setWeekOpen]   = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [profileRes, rentRes, ledgerRes, todayRes, weekRes, availRes] = await Promise.allSettled([
        myAPI.profile(),
        myAPI.rentStatus(),
        myAPI.rentLedger(),
        enhancedAPI.foodMenu.today(),
        enhancedAPI.foodMenu.week(),
        enhancedAPI.mealAvailability.myAvailability(),
      ]);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (rentRes.status === 'fulfilled')    setRentStatus(rentRes.value.data);
      if (ledgerRes.status === 'fulfilled')  setLedger(ledgerRes.value.data?.ledger ?? ledgerRes.value.data ?? []);
      if (todayRes.status === 'fulfilled')   setTodayMenu(todayRes.value.data?.results ?? todayRes.value.data ?? []);
      if (weekRes.status === 'fulfilled')    setWeekMenu(weekRes.value.data?.results ?? weekRes.value.data ?? []);
      if (availRes.status === 'fulfilled')   setAvailability(availRes.value.data ?? []);
    } catch (e) {
      setError('Failed to load dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
        <Typography color="text.secondary">Loading your dashboard…</Typography>
      </Box>
    );
  }

  const room   = profile?.room_detail  ?? profile?.room  ?? null;
  const branch = profile?.branch_detail ?? null;

  const todayMenuByType = Object.fromEntries(todayMenu.map(m => [m.meal_type, m]));
  const weekByDate = weekMenu.reduce((acc, m) => {
    (acc[m.date] = acc[m.date] || []).push(m);
    return acc;
  }, {});
  const weekDates = Object.keys(weekByDate).sort();

  // Availability for today (first element in availability array = today)
  const todayAvail = availability[0]?.meals ?? {};

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>

      {/* Welcome */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="grey.900">
          Welcome, {getUserName()} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Here's your room and meal information.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}
          action={<Button size="small" startIcon={<Refresh />} onClick={fetchAll}>Retry</Button>}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>

        {/* ── Room Details ─────────────────────────────────────────────────── */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}>
            <Box sx={{ height: 4, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', borderRadius: '12px 12px 0 0' }} />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Home sx={{ color: '#0ea5e9' }} />
                <Typography variant="h6" fontWeight={700}>My Room</Typography>
              </Box>

              {room ? (
                <Box>
                  <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mb: 0.5 }}>
                    {room.room_name}
                  </Typography>
                  {branch && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {branch.name}{branch.address ? ` · ${branch.address}` : ''}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1.5 }} />
                  <Grid container spacing={1.5}>
                    {[
                      { icon: <KingBed fontSize="small" />,     label: 'Type',    value: formatRoomType(room) },
                      { icon: <AcUnit fontSize="small" />,      label: 'AC',      value: formatRoomAcLabel(room) },
                      { icon: <Stairs fontSize="small" />,      label: 'Floor',   value: room.floor_number != null ? `Floor ${room.floor_number}` : '—' },
                      { icon: <SquareFoot fontSize="small" />,  label: 'Size',    value: room.room_size_sqft ? `${room.room_size_sqft} sq.ft` : '—' },
                      { icon: <Bathtub fontSize="small" />,     label: 'Bathroom',value: room.attached_bath ? 'Attached' : 'Common' },
                      { icon: <Payment fontSize="small" />,     label: 'Rent',    value: room.rent ? `₹${Number(room.rent).toLocaleString('en-IN')}/mo` : '—' },
                    ].map(({ icon, label, value }) => (
                      <Grid item xs={6} key={label}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          {icon}
                          <Typography variant="caption">{label}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Home sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No room assigned yet.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Rent Status ──────────────────────────────────────────────────── */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}>
            <Box sx={{ height: 4, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', borderRadius: '12px 12px 0 0' }} />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Payment sx={{ color: '#f59e0b' }} />
                <Typography variant="h6" fontWeight={700}>Rent Status</Typography>
              </Box>

              {rentStatus ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <RentStatusChip status={rentStatus.status} due={rentStatus.balance_due} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'Monthly Rent',   value: `₹${Number(rentStatus.agreed_rent   || 0).toLocaleString('en-IN')}` },
                      { label: 'Amount Paid',    value: `₹${Number(rentStatus.amount_paid   || 0).toLocaleString('en-IN')}` },
                      { label: 'Balance Due',    value: `₹${Number(rentStatus.balance_due   || 0).toLocaleString('en-IN')}` },
                      { label: 'Joining Date',   value: profile?.joining_date
                          ? new Date(profile.joining_date).toLocaleDateString('en-IN') : '—' },
                    ].map(({ label, value }) => (
                      <Grid item xs={6} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Rent ledger toggle */}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={ledgerOpen ? <ExpandLess /> : <ExpandMore />}
                      onClick={() => setLedgerOpen(o => !o)}
                    >
                      {ledgerOpen ? 'Hide' : 'View'} Rent History
                    </Button>
                    <Collapse in={ledgerOpen}>
                      <TableContainer component={Paper} elevation={0} sx={{ mt: 1, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' } }}>
                              <TableCell>Month</TableCell>
                              <TableCell align="right">Rent</TableCell>
                              <TableCell align="right">Paid</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {ledger.length === 0 ? (
                              <TableRow><TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>No history yet</TableCell></TableRow>
                            ) : ledger.map((row, i) => (
                              <TableRow key={i}>
                                <TableCell>{row.month_label ?? row.month}</TableCell>
                                <TableCell align="right">₹{Number(row.agreed_rent || 0).toLocaleString('en-IN')}</TableCell>
                                <TableCell align="right">₹{Number(row.amount_paid || 0).toLocaleString('en-IN')}</TableCell>
                                <TableCell><RentStatusChip status={row.status} due={row.balance_due} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Collapse>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">Rent information not available.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Today's Meal Availability Summary ─────────────────────────────── */}
        {Object.keys(todayAvail).length > 0 && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
              <Box sx={{ height: 4, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', borderRadius: '12px 12px 0 0' }} />
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight={700}>Today's Meal Status</Typography>
                  <Button size="small" variant="outlined" href="/my-availability">Manage Availability</Button>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {MEAL_TYPES.map(({ value, label }) => {
                    const m = todayAvail[value];
                    if (!m) return null;
                    return (
                      <Chip
                        key={value}
                        label={`${label}: ${m.is_available ? '✓ Eating' : '✗ Skipping'}`}
                        size="small"
                        color={m.is_available ? 'success' : 'default'}
                        variant={m.is_available ? 'filled' : 'outlined'}
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ── Today's Food Menu ─────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <Box sx={{ height: 4, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '12px 12px 0 0' }} />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Restaurant sx={{ color: '#10b981' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Today's Menu — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Typography>
                </Box>
                <Button size="small" variant="outlined"
                  endIcon={weekOpen ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setWeekOpen(o => !o)}>
                  {weekOpen ? 'Hide' : 'View'} Week
                </Button>
              </Box>

              {todayMenu.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Today's menu has not been updated yet. Please check back later.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {MEAL_TYPES.map(({ value, label, icon, color }) => {
                    const entry = todayMenuByType[value];
                    return (
                      <Grid item xs={12} sm={6} md={3} key={value}>
                        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${entry ? color + '40' : '#e2e8f0'}`, borderRadius: 2, height: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color, mb: 1 }}>
                            {icon}
                            <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
                          </Box>
                          {entry
                            ? <Typography variant="body2">{entry.items}</Typography>
                            : <Typography variant="body2" color="text.disabled" fontStyle="italic">Not set</Typography>
                          }
                          {entry?.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {entry.notes}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}

              {/* Weekly menu */}
              <Collapse in={weekOpen}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>This Week's Menu</Typography>
                {weekDates.length === 0 ? (
                  <Typography color="text.secondary">No menu set for this week.</Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' } }}>
                          <TableCell>Date</TableCell>
                          {MEAL_TYPES.map(m => <TableCell key={m.value}>{m.label}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {weekDates.map(date => {
                          const byType = Object.fromEntries((weekByDate[date] || []).map(m => [m.meal_type, m]));
                          const isToday = date === todayStr();
                          return (
                            <TableRow key={date} sx={{ bgcolor: isToday ? '#eff6ff' : 'inherit' }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="body2" fontWeight={isToday ? 700 : 400}>
                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  </Typography>
                                  {isToday && <Chip label="Today" size="small" color="primary" sx={{ height: 16, fontSize: 10 }} />}
                                </Box>
                              </TableCell>
                              {MEAL_TYPES.map(({ value }) => (
                                <TableCell key={value}>
                                  {byType[value]
                                    ? <Typography variant="body2">{byType[value].items}</Typography>
                                    : <Typography variant="caption" color="text.disabled">—</Typography>
                                  }
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}
