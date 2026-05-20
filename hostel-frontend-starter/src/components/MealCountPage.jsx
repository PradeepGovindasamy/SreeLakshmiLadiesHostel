import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, Button, Alert, CircularProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select,
  Snackbar, Tooltip, IconButton, LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  PlayArrow as TriggerIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  CheckCircle as DoneIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' };
const MEAL_COLORS = { breakfast: '#FF9800', lunch: '#4CAF50', snacks: '#9C27B0', dinner: '#2196F3' };

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function MealCountPage() {
  const { user } = useUser();
  const role = user?.profile?.role;
  const canTrigger = ['admin', 'owner', 'warden'].includes(role);

  const [liveDate, setLiveDate] = useState(today());
  const [liveCounts, setLiveCounts] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Trigger dialog
  const [triggerDialog, setTriggerDialog] = useState(false);
  const [triggerData, setTriggerData] = useState({ date: today(), meal_type: 'breakfast', branch_id: '' });
  const [triggering, setTriggering] = useState(false);

  const showSnack = (msg, sev = 'success') => setSnack({ open: true, message: msg, severity: sev });

  const fetchLiveCounts = useCallback(async () => {
    setLoadingLive(true);
    try {
      const res = await enhancedAPI.mealCounts.live({ date: liveDate });
      setLiveCounts(res.data);
    } catch {
      setError('Failed to load live counts.');
    } finally {
      setLoadingLive(false);
    }
  }, [liveDate]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await enhancedAPI.mealCounts.list({ date: liveDate });
      setSnapshots(res.data.results || res.data);
    } catch {
      /* ignore */
    } finally {
      setLoadingHistory(false);
    }
  }, [liveDate]);

  useEffect(() => {
    fetchLiveCounts();
    fetchHistory();
  }, [fetchLiveCounts, fetchHistory]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await enhancedAPI.mealCounts.triggerConsumption(triggerData);
      const results = res.data.results || [];
      const summary = results.map(r => `${r.branch}: ${r.status} (${r.meal_count} meals, ${r.transactions} txns)`).join('; ');
      showSnack(`Consumption generated. ${summary}`);
      setTriggerDialog(false);
      fetchLiveCounts();
      fetchHistory();
    } catch (err) {
      showSnack(err.response?.data?.error || 'Failed to trigger consumption.', 'error');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>Meal Count</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <TextField
            type="date"
            size="small"
            value={liveDate}
            onChange={e => setLiveDate(e.target.value)}
            sx={{ width: 160 }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={() => { fetchLiveCounts(); fetchHistory(); }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {canTrigger && (
            <Button
              variant="contained"
              startIcon={<TriggerIcon />}
              onClick={() => { setTriggerData(d => ({ ...d, date: liveDate })); setTriggerDialog(true); }}
            >
              Trigger Consumption
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Live Counts Grid */}
      <Typography variant="subtitle1" fontWeight={600} mb={1}>
        Live Count for {new Date(liveDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
      </Typography>
      {loadingLive ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : liveCounts ? (
        <Grid container spacing={2} mb={3}>
          {Object.entries(MEAL_LABELS).map(([mt, label]) => {
            const c = liveCounts.counts?.[mt] || {};
            return (
              <Grid item xs={6} sm={3} key={mt}>
                <Card variant="outlined" sx={{ borderRadius: 2, borderColor: MEAL_COLORS[mt] }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="h3" fontWeight={700} sx={{ color: MEAL_COLORS[mt] }}>
                      {c.meal_count ?? '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.total_residents} residents − {c.unavailable_count} unavailable
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : null}

      <Divider sx={{ my: 2 }} />

      {/* Snapshot History */}
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <HistoryIcon fontSize="small" color="action" />
        <Typography variant="subtitle1" fontWeight={600}>Consumption Snapshots</Typography>
      </Box>
      {loadingHistory ? (
        <CircularProgress size={24} />
      ) : snapshots.length === 0 ? (
        <Alert severity="info">No snapshots recorded for this date yet.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Meal</TableCell>
                <TableCell align="center">Total Residents</TableCell>
                <TableCell align="center">Unavailable</TableCell>
                <TableCell align="center">Meal Count</TableCell>
                <TableCell align="center">Consumption</TableCell>
                <TableCell>Taken At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {snapshots.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Chip
                      size="small"
                      label={MEAL_LABELS[s.meal_type] || s.meal_type}
                      sx={{ bgcolor: MEAL_COLORS[s.meal_type] + '20', color: MEAL_COLORS[s.meal_type], fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">{s.total_residents}</TableCell>
                  <TableCell align="center">{s.unavailable_count}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={700}>{s.meal_count}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {s.consumption_generated ? (
                      <Chip size="small" icon={<DoneIcon />} label="Generated" color="success" />
                    ) : (
                      <Chip size="small" icon={<PendingIcon />} label="Pending" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {s.snapshot_taken_at
                        ? new Date(s.snapshot_taken_at).toLocaleString('en-IN')
                        : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Trigger Dialog */}
      <Dialog open={triggerDialog} onClose={() => setTriggerDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Trigger Inventory Consumption</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Alert severity="warning" sx={{ fontSize: 12 }}>
            This will create inventory deduction transactions for the selected meal.
            It cannot be reversed automatically.
          </Alert>
          <TextField
            label="Date"
            type="date"
            value={triggerData.date}
            onChange={e => setTriggerData(d => ({ ...d, date: e.target.value }))}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Meal Type</InputLabel>
            <Select
              value={triggerData.meal_type}
              label="Meal Type"
              onChange={e => setTriggerData(d => ({ ...d, meal_type: e.target.value }))}
            >
              {Object.entries(MEAL_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Branch ID (leave blank for all)"
            type="number"
            value={triggerData.branch_id}
            onChange={e => setTriggerData(d => ({ ...d, branch_id: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTriggerDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTrigger}
            disabled={triggering}
            startIcon={triggering ? <CircularProgress size={16} /> : <TriggerIcon />}
          >
            {triggering ? 'Generating…' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
