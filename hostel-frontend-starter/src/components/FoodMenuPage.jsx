import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, Alert, CircularProgress, Tooltip,
  Grid, Card, CardContent, Stack, Divider,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Restaurant as RestaurantIcon,
  WbSunny, LunchDining, LocalCafe, DinnerDining,
} from '@mui/icons-material';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: <WbSunny fontSize="small" />, color: '#f59e0b' },
  { value: 'lunch',     label: 'Lunch',     icon: <LunchDining fontSize="small" />, color: '#10b981' },
  { value: 'snacks',    label: 'Snacks',    icon: <LocalCafe fontSize="small" />,   color: '#8b5cf6' },
  { value: 'dinner',    label: 'Dinner',    icon: <DinnerDining fontSize="small" />, color: '#3b82f6' },
];

const mealMeta = Object.fromEntries(MEAL_TYPES.map(m => [m.value, m]));

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = { date: todayStr(), meal_type: 'breakfast', items: '', notes: '' };

export default function FoodMenuPage() {
  const { hasAnyRole } = useUser();
  const canEdit = hasAnyRole(['admin', 'owner']);

  const [menus, setMenus]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [alert, setAlert]     = useState({ open: false, message: '', severity: 'success' });

  // Filters
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  });

  // Dialog
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showAlert = (message, severity = 'success') =>
    setAlert({ open: true, message, severity });

  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await enhancedAPI.foodMenu.list({ from: fromDate, to: toDate });
      setMenus(res.data?.results ?? res.data ?? []);
    } catch (e) {
      setError('Failed to load food menu');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchMenus(); }, [fetchMenus]);

  // Group menus by date
  const grouped = menus.reduce((acc, m) => {
    (acc[m.date] = acc[m.date] || []).push(m);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  const openAdd = () => {
    setEditingMenu(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (menu) => {
    setEditingMenu(menu);
    setForm({ date: menu.date, meal_type: menu.meal_type, items: menu.items, notes: menu.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.date || !form.meal_type || !form.items.trim()) {
      showAlert('Date, meal type and items are required', 'error');
      return;
    }
    try {
      setSaving(true);
      if (editingMenu) {
        await enhancedAPI.foodMenu.update(editingMenu.id, form);
        showAlert('Menu updated successfully');
      } else {
        await enhancedAPI.foodMenu.create(form);
        showAlert('Menu added successfully');
      }
      setDialogOpen(false);
      fetchMenus();
    } catch (e) {
      const msg = e.response?.data?.non_field_errors?.[0]
        || e.response?.data?.detail
        || 'Failed to save menu';
      showAlert(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await enhancedAPI.foodMenu.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      showAlert('Menu deleted');
      fetchMenus();
    } catch {
      showAlert('Failed to delete menu', 'error');
    }
  };

  const formatDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const isToday = (d) => d === todayStr();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={800}>Food Menu</Typography>
            <Typography variant="body2" color="text.secondary">
              {canEdit ? 'Manage daily meal schedule' : 'View meal schedule'}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={fetchMenus} variant="outlined" size="small">
            Refresh
          </Button>
          {canEdit && (
            <Button startIcon={<AddIcon />} onClick={openAdd} variant="contained" size="small">
              Add Meal
            </Button>
          )}
        </Stack>
      </Box>

      {/* Date range filter */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField fullWidth size="small" label="From" type="date"
              value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField fullWidth size="small" label="To" type="date"
              value={toDate} onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button fullWidth variant="contained" size="small" onClick={fetchMenus}>
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {alert.open && (
        <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert(a => ({ ...a, open: false }))}>
          {alert.message}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : sortedDates.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 2 }}>
          <RestaurantIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No menu entries for this date range.</Typography>
          {canEdit && (
            <Button sx={{ mt: 2 }} variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
              Add First Meal
            </Button>
          )}
        </Paper>
      ) : (
        sortedDates.map(date => (
          <Card key={date} elevation={0} sx={{
            mb: 3, border: isToday(date) ? '2px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: 2
          }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{formatDate(date)}</Typography>
                  {isToday(date) && <Chip label="Today" color="primary" size="small" />}
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' } }}>
                      <TableCell width={120}>Meal</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Notes</TableCell>
                      {canEdit && <TableCell width={90} align="center">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MEAL_TYPES.map(({ value, label, icon, color }) => {
                      const entry = grouped[date]?.find(m => m.meal_type === value);
                      return (
                        <TableRow key={value} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color }}>
                              {icon}
                              <Typography variant="body2" fontWeight={600}>{label}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {entry
                              ? <Typography variant="body2">{entry.items}</Typography>
                              : <Typography variant="body2" color="text.disabled" fontStyle="italic">Not set</Typography>
                            }
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{entry?.notes || '—'}</Typography>
                          </TableCell>
                          {canEdit && (
                            <TableCell align="center">
                              {entry ? (
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => openEdit(entry)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(entry)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Tooltip title={`Add ${label}`}>
                                  <IconButton size="small" color="primary"
                                    onClick={() => { setEditingMenu(null); setForm({ date, meal_type: value, items: '', notes: '' }); setDialogOpen(true); }}>
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMenu ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Date" type="date"
                value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Meal Type</InputLabel>
                <Select value={form.meal_type} label="Meal Type"
                  onChange={(e) => setForm(f => ({ ...f, meal_type: e.target.value }))}>
                  {MEAL_TYPES.map(m => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Menu Items" multiline rows={3}
                placeholder="e.g. Idli, Sambar, Coconut Chutney, Filter Coffee"
                value={form.items} onChange={(e) => setForm(f => ({ ...f, items: e.target.value }))}
                required helperText="List the food items for this meal" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes (optional)" multiline rows={2}
                placeholder="e.g. Special occasion, No onion-garlic today"
                value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : (editingMenu ? 'Update' : 'Add Meal')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs">
        <DialogTitle>Delete Meal Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{mealMeta[deleteConfirm?.meal_type]?.label}</strong> entry
            for <strong>{deleteConfirm?.date}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
