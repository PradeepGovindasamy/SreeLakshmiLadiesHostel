import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Typography, Divider, Box, Chip, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Alert, Collapse, IconButton, Tooltip,
  TextField, FormControl, InputLabel, Select, MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  ContactEmergency as EmergencyIcon,
  Badge as BadgeIcon,
  Payment as PaymentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  AddCircleOutline as RecordIcon,
} from '@mui/icons-material';
import { enhancedAPI } from '../../api';

// ── Rent status chip ──────────────────────────────────────────────────────────
function RentStatusChip({ status }) {
  const cfg = {
    PAID:    { label: 'Paid',    color: 'success' },
    PARTIAL: { label: 'Partial', color: 'warning' },
    PENDING: { label: 'Pending', color: 'default' },
    OVERDUE: { label: 'Overdue', color: 'error'   },
    UNKNOWN: { label: 'No rent', color: 'default' },
  }[status] || { label: status || '—', color: 'default' };

  return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600 }} />;
}

// ── Single ledger row ─────────────────────────────────────────────────────────
function LedgerRow({ entry, tenantId, onRecordPayment }) {
  const canRecord = ['PENDING', 'OVERDUE', 'PARTIAL'].includes(entry.rent_status);

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
          ? <Typography variant="body2" color="success.main" fontWeight={600}>
              ₹{Number(entry.total_paid).toLocaleString('en-IN')}
            </Typography>
          : <Typography variant="body2" color="text.disabled">—</Typography>}
      </TableCell>
      <TableCell align="right">
        {entry.due > 0
          ? <Typography variant="body2" color="error.main" fontWeight={700}>
              ₹{Number(entry.due).toLocaleString('en-IN')}
            </Typography>
          : <Typography variant="body2" color="success.main">—</Typography>}
      </TableCell>
      <TableCell>
        <RentStatusChip status={entry.rent_status} />
      </TableCell>
      <TableCell align="center">
        {canRecord && (
          <Tooltip title={entry.rent_status === 'PARTIAL' ? 'Update payment' : 'Record payment'}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => onRecordPayment(entry)}
            >
              <RecordIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Record Payment Dialog ─────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash' },
  { value: 'upi',           label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card',          label: 'Card' },
  { value: 'cheque',        label: 'Cheque' },
];

function RecordPaymentDialog({ open, onClose, entry, tenantId, tenantName, onSuccess }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    amount_paid:      '',
    payment_method:   'cash',
    payment_date:     today,
    reference_number: '',
    notes:            '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Pre-fill amount when entry changes
  useEffect(() => {
    if (!entry) return;
    setForm(f => ({
      ...f,
      amount_paid:  entry.due > 0 ? String(entry.due) : String(entry.agreed_rent || ''),
      payment_date: today,
      reference_number: '',
      notes: '',
    }));
    setError('');
  }, [entry]);

  const handleSubmit = async () => {
    if (!form.amount_paid || Number(form.amount_paid) <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await enhancedAPI.tenants.recordPayment(tenantId, {
        for_month:        entry.for_month,           // "YYYY-MM-DD" first of month
        amount_paid:      Number(form.amount_paid),
        payment_method:   form.payment_method,
        payment_date:     form.payment_date,
        reference_number: form.reference_number,
        notes:            form.notes,
      });
      onSuccess(res.data.message);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error
        || err?.response?.data?.detail
        || 'Failed to record payment.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!entry) return null;

  const isUpdate = entry.rent_status === 'PARTIAL';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            {isUpdate ? 'Update Payment' : 'Record Payment'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {tenantName} · {entry.for_month_display}
          {isUpdate && (
            <Chip label={`Already paid ₹${Number(entry.total_paid).toLocaleString('en-IN')}`}
              size="small" color="warning" sx={{ ml: 1, fontSize: '0.7rem' }} />
          )}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Amount */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount Paid *"
              type="number"
              value={form.amount_paid}
              onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              helperText={entry.agreed_rent
                ? `Monthly rent: ₹${Number(entry.agreed_rent).toLocaleString('en-IN')}`
                : undefined}
            />
          </Grid>

          {/* Payment Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Date *"
              type="date"
              value={form.payment_date}
              onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Payment Method */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={form.payment_method}
                label="Payment Method"
                onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              >
                {PAYMENT_METHODS.map(m => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Reference Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Reference / Transaction ID"
              value={form.reference_number}
              onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
              placeholder="UPI ref, cheque no., etc."
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={<PaymentIcon />}
        >
          {saving ? 'Saving…' : isUpdate ? 'Update Payment' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────
function TenantDetailsDialog({ open, onClose, tenant, readOnly = false }) {
  const [ledger, setLedger]               = useState([]);
  const [summary, setSummary]             = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError]     = useState(null);
  const [ledgerOpen, setLedgerOpen]       = useState(true);

  // Record Payment dialog state
  const [paymentEntry, setPaymentEntry]     = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg]         = useState('');

  useEffect(() => {
    if (!open || !tenant?.id) return;
    fetchLedger();
  }, [open, tenant?.id]);

  const fetchLedger = async () => {
    if (!tenant?.id) return;
    setLedgerLoading(true);
    setLedgerError(null);
    try {
      const res = await enhancedAPI.tenants.getRentLedger(tenant.id);
      setLedger(res.data.ledger || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      const msg = err?.response?.data?.error
        || err?.response?.data?.detail
        || 'Failed to load rent history.';
      setLedgerError(msg);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleOpenPayment = (entry) => {
    setPaymentEntry(entry);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = (message) => {
    setSuccessMsg(message);
    fetchLedger(); // Refresh ledger to show updated status
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  if (!tenant) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const DetailRow = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
      <Box sx={{ mr: 2, color: 'primary.main', mt: 0.3 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2">{value || 'Not provided'}</Typography>
      </Box>
    </Box>
  );

  const lifecycleStatus = tenant.status
    || (tenant.vacating_date ? 'VACATED' : tenant.joining_date ? 'ACTIVE' : 'PENDING');

  const statusChipProps = {
    ACTIVE:  { label: 'Active',  color: 'success' },
    VACATED: { label: 'Vacated', color: 'default' },
    PENDING: { label: 'Pending', color: 'warning' },
  }[lifecycleStatus] || { label: lifecycleStatus, color: 'default' };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>

        {/* ── Title ─────────────────────────────────────────────────── */}
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>Tenant Details</Typography>
            <Chip {...statusChipProps} size="small" />
            {tenant.current_rent_status && (
              <RentStatusChip status={tenant.current_rent_status.rent_status} />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {tenant.name} · {tenant.room_display || tenant.room_detail?.room_name || 'No room assigned'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>

          {/* ── Success banner ───────────────────────────────────────── */}
          {successMsg && (
            <Alert severity="success" sx={{ m: 2, borderRadius: 2 }}>{successMsg}</Alert>
          )}

          {/* ── Profile + Room + Emergency + ID ─────────────────────── */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>

              {/* Personal Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                  Personal Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <DetailRow icon={<PersonIcon fontSize="small" />}  label="Full Name"  value={tenant.name} />
                  <DetailRow icon={<PhoneIcon fontSize="small" />}   label="Phone"      value={tenant.phone_number} />
                  <DetailRow icon={<EmailIcon fontSize="small" />}   label="Email"      value={tenant.email} />
                  <DetailRow icon={<HomeIcon fontSize="small" />}    label="Address"    value={tenant.address} />
                </Paper>
              </Grid>

              {/* Room Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                  Room Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <DetailRow icon={<HomeIcon fontSize="small" />}     label="Room"         value={tenant.room_detail?.room_name} />
                  <DetailRow icon={<HomeIcon fontSize="small" />}     label="Branch"       value={tenant.branch_name} />
                  <DetailRow icon={<CalendarIcon fontSize="small" />} label="Joining Date" value={formatDate(tenant.joining_date)} />
                  {(lifecycleStatus === 'VACATED' || tenant.vacating_date) && (
                    <DetailRow icon={<CalendarIcon fontSize="small" />} label="Vacating Date" value={formatDate(tenant.vacating_date)} />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Stay Type</Typography>
                    <Chip
                      label={tenant.stay_type || 'N/A'}
                      size="small"
                      color={tenant.stay_type === 'monthly' ? 'primary' : 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                  Emergency Contact
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <DetailRow icon={<EmergencyIcon fontSize="small" />} label="Name"  value={tenant.emergency_contact_name} />
                  <DetailRow icon={<PhoneIcon fontSize="small" />}      label="Phone" value={tenant.emergency_contact_phone} />
                </Paper>
              </Grid>

              {/* ID Proof */}
              {tenant.id_proof_type && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                    ID Proof
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <DetailRow icon={<BadgeIcon fontSize="small" />} label="ID Type"   value={tenant.id_proof_type_display || tenant.id_proof_type} />
                    <DetailRow icon={<BadgeIcon fontSize="small" />} label="ID Number" value={tenant.id_proof_number} />
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* ── Rent History ─────────────────────────────────────────── */}
          <Divider />
          <Box sx={{ px: 3, py: 1.5, backgroundColor: '#f8fafc' }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setLedgerOpen(o => !o)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>Rent History</Typography>
                {summary && (
                  <>
                    <Chip label={`${summary.total_months} months`} size="small" variant="outlined"
                      sx={{ fontSize: '0.7rem' }} />
                    {summary.overdue_months_count > 0 && (
                      <Chip label={`${summary.overdue_months_count} overdue`} color="error"
                        size="small" sx={{ fontSize: '0.7rem' }} />
                    )}
                  </>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={e => { e.stopPropagation(); fetchLedger(); }}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton size="small">
                  {ledgerOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            </Box>

            {summary && ledgerOpen && (
              <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  Total paid:&nbsp;
                  <strong style={{ color: '#16a34a' }}>
                    ₹{Number(summary.total_paid).toLocaleString('en-IN')}
                  </strong>
                </Typography>
                {summary.total_due > 0 && (
                  <Typography variant="caption" color="error.main">
                    Outstanding:&nbsp;
                    <strong>₹{Number(summary.total_due).toLocaleString('en-IN')}</strong>
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Collapse in={ledgerOpen}>
            <Box sx={{ px: 3, pb: 2 }}>
              {ledgerLoading && (
                <Box sx={{ py: 2 }}>
                  <LinearProgress sx={{ borderRadius: 2 }} />
                </Box>
              )}

              {ledgerError && !ledgerLoading && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}
                  action={<Button size="small" onClick={fetchLedger}>Retry</Button>}>
                  {ledgerError}
                </Alert>
              )}

              {!ledgerLoading && !ledgerError && ledger.length > 0 && (
                <TableContainer sx={{ mt: 1, maxHeight: 320, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: '#f1f5f9' }}>Month</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#f1f5f9' }}>Rent</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#f1f5f9' }}>Paid</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#f1f5f9' }}>Due</TableCell>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: '#f1f5f9' }}>Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f1f5f9' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ledger.map(entry => (
                        <LedgerRow
                          key={entry.for_month}
                          entry={entry}
                          tenantId={tenant.id}
                          onRecordPayment={handleOpenPayment}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {!ledgerLoading && !ledgerError && ledger.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No rent history found for this tenant.
                </Typography>
              )}
            </Box>
          </Collapse>

        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          {readOnly && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
              Read-only view
            </Typography>
          )}
          <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Record Payment sub-dialog ──────────────────────────────── */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        entry={paymentEntry}
        tenantId={tenant?.id}
        tenantName={tenant?.name}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

export default TenantDetailsDialog;
