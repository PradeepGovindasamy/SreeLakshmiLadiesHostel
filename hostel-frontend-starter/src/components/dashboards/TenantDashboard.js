// src/components/dashboards/TenantDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Divider,
  LinearProgress, Alert, Button, Collapse, IconButton, Tooltip,
} from '@mui/material';
import {
  Person, Home, Payment, ExpandMore, ExpandLess,
  Phone, Email, CalendarToday, LocationOn, CheckCircle,
  Warning, Error as ErrorIcon, HourglassEmpty, Refresh,
} from '@mui/icons-material';
import { myAPI } from '../../api';
import { useUser } from '../../contexts/UserContext';

// ── Rent status chip ──────────────────────────────────────────────────────────

function RentStatusChip({ status, due }) {
  const cfg = {
    PAID:    { label: '✓ Paid',                                 color: 'success', icon: <CheckCircle fontSize="small" /> },
    PARTIAL: { label: `₹${Number(due || 0).toLocaleString('en-IN')} Due`, color: 'warning', icon: <Warning fontSize="small" /> },
    PENDING: { label: 'Pending',                                color: 'default', icon: <HourglassEmpty fontSize="small" /> },
    OVERDUE: { label: `₹${Number(due || 0).toLocaleString('en-IN')} Overdue`, color: 'error', icon: <ErrorIcon fontSize="small" /> },
    UNKNOWN: { label: 'Rent not configured',                    color: 'default', icon: null },
  }[status] || { label: status || '—', color: 'default', icon: null };

  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      color={cfg.color}
      variant={status === 'PAID' ? 'filled' : 'outlined'}
      sx={{ fontWeight: 600 }}
    />
  );
}

// ── Ledger row ────────────────────────────────────────────────────────────────

function LedgerRow({ entry }) {
  const statusColor = {
    PAID:    'success.main',
    PARTIAL: 'warning.main',
    PENDING: 'text.secondary',
    OVERDUE: 'error.main',
    UNKNOWN: 'text.disabled',
  }[entry.rent_status] || 'text.secondary';

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>{entry.for_month_display}</Typography>
      </TableCell>
      <TableCell align="right">
        {entry.agreed_rent != null
          ? `₹${Number(entry.agreed_rent).toLocaleString('en-IN')}`
          : '—'}
      </TableCell>
      <TableCell align="right">
        {entry.total_paid > 0
          ? `₹${Number(entry.total_paid).toLocaleString('en-IN')}`
          : '—'}
      </TableCell>
      <TableCell align="right">
        {entry.due > 0
          ? <Typography variant="body2" color="error.main" fontWeight={600}>
              ₹{Number(entry.due).toLocaleString('en-IN')}
            </Typography>
          : <Typography variant="body2" color="success.main">—</Typography>}
      </TableCell>
      <TableCell>
        <Chip
          label={entry.rent_status}
          size="small"
          sx={{ color: statusColor, borderColor: statusColor, fontWeight: 600 }}
          variant="outlined"
        />
      </TableCell>
    </TableRow>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const TenantDashboard = () => {
  const { user, profile, getUserName } = useUser();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [error, setError] = useState(null);
  const [ledgerError, setLedgerError] = useState(null);

  const [tenantProfile, setTenantProfile] = useState(null);
  const [rentStatus, setRentStatus] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);

  // Load profile + current rent status
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const [profileRes, rentRes] = await Promise.all([
        myAPI.profile(),
        myAPI.rentStatus(),
      ]);
      setTenantProfile(profileRes.data);
      setRentStatus(rentRes.data);
    } catch (err) {
      console.error('TenantDashboard fetch error:', {
        status: err?.response?.status,
        data: err?.response?.data,
      });
      const msg = err?.response?.data?.error
        || err?.response?.data?.detail
        || 'Failed to load your profile. Please try again.';
      setError(msg);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Load full rent ledger (lazy — only when section is expanded)
  const fetchLedger = useCallback(async () => {
    if (loadingLedger) return;
    setLoadingLedger(true);
    setLedgerError(null);
    try {
      const res = await myAPI.rentLedger();
      setLedger(res.data.ledger || []);
      setLedgerSummary(res.data.summary || null);
    } catch (err) {
      console.error('Ledger fetch error:', err?.response?.data);
      setLedgerError('Failed to load payment history.');
    } finally {
      setLoadingLedger(false);
    }
  }, [loadingLedger]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleLedger = () => {
    if (!ledgerOpen && ledger.length === 0) {
      fetchLedger();
    }
    setLedgerOpen(o => !o);
  };

  // ── Render: loading ──────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
        <Typography color="text.secondary">Loading your dashboard…</Typography>
      </Box>
    );
  }

  // ── Render: error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={<Button size="small" onClick={fetchProfile}>Retry</Button>}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const rs = rentStatus;  // shorthand

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Welcome back, {tenantProfile?.name || getUserName()}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tenant Dashboard — your hostel information
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchProfile} size="small">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', borderRadius: 2 }}>
                  <Person fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {tenantProfile?.name || getUserName()}
                  </Typography>
                  <Chip label="Tenant" size="small" color="primary" variant="outlined" />
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {tenantProfile?.phone_number || 'Not provided'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {tenantProfile?.email || user?.email || 'Not provided'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Joined: {tenantProfile?.joining_date
                      ? new Date(tenantProfile.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Room card ────────────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Home color="primary" /> Room Information
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Room</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {tenantProfile?.room_display || 'Not assigned'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Branch</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {tenantProfile?.branch_name || '—'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Stay Type</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {tenantProfile?.stay_type || '—'}
                  </Typography>
                </Box>
                {rs?.agreed_rent && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Monthly Rent</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ₹{Number(rs.agreed_rent).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Current month rent status card ───────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: {
                PAID: 'success.light', OVERDUE: 'error.light',
                PARTIAL: 'warning.light', PENDING: '#e2e8f0',
              }[rs?.rent_status] || '#e2e8f0',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Payment color="primary" /> Rent — {rs?.for_month_display || 'This Month'}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {rs ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <RentStatusChip status={rs.rent_status} due={rs.due} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {rs.agreed_rent != null && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Rent due</Typography>
                        <Typography variant="body2">₹{Number(rs.agreed_rent).toLocaleString('en-IN')}</Typography>
                      </Box>
                    )}
                    {rs.total_paid > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Paid</Typography>
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          ₹{Number(rs.total_paid).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    )}
                    {rs.due > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Outstanding</Typography>
                        <Typography variant="body2" color="error.main" fontWeight={700}>
                          ₹{Number(rs.due).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Rent information not available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Rent Ledger (collapsible) ─────────────────────────────────── */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <CardContent
              sx={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={handleToggleLedger}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment color="primary" /> Payment History
                  {ledgerSummary && (
                    <Chip
                      label={`${ledgerSummary.overdue_months_count} overdue`}
                      color={ledgerSummary.overdue_months_count > 0 ? 'error' : 'success'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                <IconButton size="small" onClick={handleToggleLedger}>
                  {ledgerOpen ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              {ledgerSummary && !ledgerOpen && (
                <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total paid: <strong>₹{Number(ledgerSummary.total_paid).toLocaleString('en-IN')}</strong>
                  </Typography>
                  {ledgerSummary.total_due > 0 && (
                    <Typography variant="body2" color="error.main">
                      Outstanding: <strong>₹{Number(ledgerSummary.total_due).toLocaleString('en-IN')}</strong>
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>

            <Collapse in={ledgerOpen} timeout="auto" unmountOnExit>
              <Divider />
              <CardContent sx={{ pt: 0, pb: 1 }}>

                {loadingLedger && (
                  <Box sx={{ py: 3 }}>
                    <LinearProgress sx={{ borderRadius: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading payment history…
                    </Typography>
                  </Box>
                )}

                {ledgerError && (
                  <Alert
                    severity="error"
                    action={<Button size="small" onClick={fetchLedger}>Retry</Button>}
                    sx={{ my: 2, borderRadius: 2 }}
                  >
                    {ledgerError}
                  </Alert>
                )}

                {!loadingLedger && !ledgerError && ledger.length > 0 && (
                  <>
                    {/* Summary banner */}
                    {ledgerSummary && (
                      <Box sx={{ display: 'flex', gap: 3, py: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2">
                          Months tracked: <strong>{ledgerSummary.total_months}</strong>
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Total paid: <strong>₹{Number(ledgerSummary.total_paid).toLocaleString('en-IN')}</strong>
                        </Typography>
                        {ledgerSummary.total_due > 0 && (
                          <Typography variant="body2" color="error.main">
                            Outstanding: <strong>₹{Number(ledgerSummary.total_due).toLocaleString('en-IN')}</strong>
                          </Typography>
                        )}
                        {ledgerSummary.overdue_months_count > 0 && (
                          <Typography variant="body2" color="error.main">
                            Overdue months: <strong>{ledgerSummary.overdue_months_count}</strong>
                          </Typography>
                        )}
                      </Box>
                    )}

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                            <TableCell><strong>Month</strong></TableCell>
                            <TableCell align="right"><strong>Rent</strong></TableCell>
                            <TableCell align="right"><strong>Paid</strong></TableCell>
                            <TableCell align="right"><strong>Due</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ledger.map((entry) => (
                            <LedgerRow key={entry.for_month} entry={entry} />
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {!loadingLedger && !ledgerError && ledger.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No payment history found.
                  </Typography>
                )}
              </CardContent>
            </Collapse>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default TenantDashboard;
