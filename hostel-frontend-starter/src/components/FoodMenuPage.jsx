import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, Alert, CircularProgress, Tooltip,
  Grid, Card, CardContent, Stack, Divider, List, ListItem,
  ListItemText, ListItemSecondaryAction, Collapse, Snackbar,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Restaurant as RestaurantIcon,
  WbSunny, LunchDining, LocalCafe, DinnerDining,
  MenuBook as RecipeIcon, ExpandMore, ExpandLess,
  Science as IngredientIcon,
} from '@mui/icons-material';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: <WbSunny fontSize="small" />,         color: '#f59e0b' },
  { value: 'lunch',     label: 'Lunch',     icon: <LunchDining fontSize="small" />,      color: '#10b981' },
  { value: 'snacks',    label: 'Snacks',    icon: <LocalCafe fontSize="small" />,        color: '#8b5cf6' },
  { value: 'dinner',   label: 'Dinner',    icon: <DinnerDining fontSize="small" />,     color: '#3b82f6' },
];
const mealMeta = Object.fromEntries(MEAL_TYPES.map(m => [m.value, m]));

const UNITS = ['g', 'kg', 'ml', 'l', 'piece', 'packet'];

function todayStr() { return new Date().toISOString().slice(0, 10); }
const emptyMenuForm = { date: todayStr(), meal_type: 'breakfast', items: '', notes: '' };

// ---------------------------------------------------------------------------
export default function FoodMenuPage() {
  const { hasAnyRole } = useUser();
  const canEdit = hasAnyRole(['admin', 'owner']);

  const [menus, setMenus]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [snack, setSnack]       = useState({ open: false, message: '', severity: 'success' });
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 6); return d.toISOString().slice(0, 10);
  });

  // Menu CRUD dialog
  const [menuDialog, setMenuDialog]   = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuForm, setMenuForm]       = useState(emptyMenuForm);
  const [savingMenu, setSavingMenu]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Dishes dialog
  const [dishesDialog, setDishesDialog] = useState(false);
  const [activeMealEntry, setActiveMealEntry] = useState(null);
  const [dishes, setDishes]             = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [newDishName, setNewDishName]   = useState('');
  const [savingDish, setSavingDish]     = useState(false);
  const [expandedDish, setExpandedDish] = useState(null);

  // Ingredients
  const [groceryItems, setGroceryItems] = useState([]);
  const [ingredients, setIngredients]   = useState({}); // { dishId: [...] }
  const [newIngr, setNewIngr]           = useState({ grocery_item: null, quantity_per_person: '', unit: 'g' });
  const [savingIngr, setSavingIngr]     = useState(false);

  const showSnack = (msg, sev = 'success') => setSnack({ open: true, message: msg, severity: sev });

  // ---------- Fetch menus ----------
  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await enhancedAPI.foodMenu.list({ from: fromDate, to: toDate });
      setMenus(res.data?.results ?? res.data ?? []);
    } catch { setError('Failed to load food menu'); }
    finally  { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchMenus(); }, [fetchMenus]);

  // ---------- Fetch grocery items for autocomplete ----------
  useEffect(() => {
    if (!canEdit) return;
    import('../api').then(({ default: api }) => {
      api.get('/api/groceries/items/?is_active=true&limit=500')
        .then(r => setGroceryItems(r.data?.results ?? r.data ?? []))
        .catch(() => {});
    });
  }, [canEdit]);

  // ---------- Group menus by date ----------
  const grouped = menus.reduce((acc, m) => { (acc[m.date] = acc[m.date] || []).push(m); return acc; }, {});
  const sortedDates = Object.keys(grouped).sort();

  // ---------- Menu CRUD ----------
  const openAdd = () => { setEditingMenu(null); setMenuForm(emptyMenuForm); setMenuDialog(true); };
  const openEdit = (menu) => {
    setEditingMenu(menu);
    setMenuForm({ date: menu.date, meal_type: menu.meal_type, items: menu.items || '', notes: menu.notes || '' });
    setMenuDialog(true);
  };

  const handleSaveMenu = async () => {
    if (!menuForm.date || !menuForm.meal_type) { showSnack('Date and meal type are required', 'error'); return; }
    try {
      setSavingMenu(true);
      if (editingMenu) {
        await enhancedAPI.foodMenu.update(editingMenu.id, menuForm);
        showSnack('Menu updated');
      } else {
        await enhancedAPI.foodMenu.create(menuForm);
        showSnack('Menu added');
      }
      setMenuDialog(false);
      fetchMenus();
    } catch (e) {
      const msg = e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail || 'Failed to save';
      showSnack(msg, 'error');
    } finally { setSavingMenu(false); }
  };

  const handleDeleteMenu = async () => {
    try {
      await enhancedAPI.foodMenu.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      showSnack('Menu deleted');
      fetchMenus();
    } catch { showSnack('Failed to delete', 'error'); }
  };

  // ---------- Dishes ----------
  const openDishes = async (menuEntry) => {
    setActiveMealEntry(menuEntry);
    setNewDishName('');
    setExpandedDish(null);
    setDishesDialog(true);
    await loadDishes(menuEntry.id);
  };

  const loadDishes = async (menuId) => {
    setLoadingDishes(true);
    try {
      const res = await enhancedAPI.foodMenuItems.list({ food_menu: menuId });
      const list = res.data?.results ?? res.data ?? [];
      setDishes(list);
      // Pre-load ingredients for all dishes
      const ingrMap = {};
      await Promise.all(list.map(async (dish) => {
        const ir = await enhancedAPI.menuIngredients.list({ menu_item: dish.id });
        ingrMap[dish.id] = ir.data?.results ?? ir.data ?? [];
      }));
      setIngredients(ingrMap);
    } catch { showSnack('Failed to load dishes', 'error'); }
    finally  { setLoadingDishes(false); }
  };

  const handleAddDish = async () => {
    if (!newDishName.trim()) return;
    setSavingDish(true);
    try {
      await enhancedAPI.foodMenuItems.create({ food_menu: activeMealEntry.id, name: newDishName.trim() });
      setNewDishName('');
      await loadDishes(activeMealEntry.id);
      showSnack('Dish added');
    } catch { showSnack('Failed to add dish', 'error'); }
    finally  { setSavingDish(false); }
  };

  const handleDeleteDish = async (dishId) => {
    try {
      await enhancedAPI.foodMenuItems.delete(dishId);
      await loadDishes(activeMealEntry.id);
      showSnack('Dish removed');
    } catch { showSnack('Failed to remove dish', 'error'); }
  };

  // ---------- Ingredients ----------
  const handleAddIngredient = async (dishId) => {
    if (!newIngr.grocery_item || !newIngr.quantity_per_person) {
      showSnack('Select ingredient and enter quantity', 'warning'); return;
    }
    setSavingIngr(true);
    try {
      await enhancedAPI.menuIngredients.create({
        menu_item: dishId,
        grocery_item: newIngr.grocery_item.id,
        quantity_per_person: parseFloat(newIngr.quantity_per_person),
        unit: newIngr.unit,
      });
      setNewIngr({ grocery_item: null, quantity_per_person: '', unit: 'g' });
      const ir = await enhancedAPI.menuIngredients.list({ menu_item: dishId });
      setIngredients(prev => ({ ...prev, [dishId]: ir.data?.results ?? ir.data ?? [] }));
      showSnack('Ingredient added');
    } catch (e) {
      showSnack(e.response?.data?.non_field_errors?.[0] || 'Failed to add ingredient', 'error');
    } finally { setSavingIngr(false); }
  };

  const handleDeleteIngredient = async (ingrId, dishId) => {
    try {
      await enhancedAPI.menuIngredients.delete(ingrId);
      const ir = await enhancedAPI.menuIngredients.list({ menu_item: dishId });
      setIngredients(prev => ({ ...prev, [dishId]: ir.data?.results ?? ir.data ?? [] }));
      showSnack('Ingredient removed');
    } catch { showSnack('Failed to remove ingredient', 'error'); }
  };

  const formatDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const isToday = (d) => d === todayStr();

  // ---------- Render ----------
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={800}>Food Menu</Typography>
            <Typography variant="body2" color="text.secondary">
              {canEdit ? 'Manage meals, dishes & recipes' : 'View meal schedule'}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={fetchMenus} variant="outlined" size="small">Refresh</Button>
          {canEdit && (
            <Button startIcon={<AddIcon />} onClick={openAdd} variant="contained" size="small">Add Meal</Button>
          )}
        </Stack>
      </Box>

      {/* Date filter */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField fullWidth size="small" label="From" type="date" value={fromDate}
              onChange={e => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField fullWidth size="small" label="To" type="date" value={toDate}
              onChange={e => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button fullWidth variant="contained" size="small" onClick={fetchMenus}>Filter</Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
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
                      {canEdit && <TableCell width={80} align="center">Dishes</TableCell>}
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
                              ? <Typography variant="body2">{entry.items || <em style={{ color: '#9ca3af' }}>See dishes →</em>}</Typography>
                              : <Typography variant="body2" color="text.disabled" fontStyle="italic">Not set</Typography>
                            }
                          </TableCell>
                          {canEdit && (
                            <TableCell align="center">
                              {entry ? (
                                <Tooltip title="Manage dishes & recipes">
                                  <IconButton size="small" color="secondary" onClick={() => openDishes(entry)}>
                                    <RecipeIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : '—'}
                            </TableCell>
                          )}
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{entry?.notes || '—'}</Typography>
                          </TableCell>
                          {canEdit && (
                            <TableCell align="center">
                              {entry ? (
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => openEdit(entry)}><EditIcon fontSize="small" /></IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(entry)}><DeleteIcon fontSize="small" /></IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Tooltip title={`Add ${label}`}>
                                  <IconButton size="small" color="primary"
                                    onClick={() => { setEditingMenu(null); setMenuForm({ date, meal_type: value, items: '', notes: '' }); setMenuDialog(true); }}>
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

      {/* ─── Add/Edit Menu Dialog ─── */}
      <Dialog open={menuDialog} onClose={() => setMenuDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMenu ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Date" type="date"
                value={menuForm.date} onChange={e => setMenuForm(f => ({ ...f, date: e.target.value }))}
                InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Meal Type</InputLabel>
                <Select value={menuForm.meal_type} label="Meal Type"
                  onChange={e => setMenuForm(f => ({ ...f, meal_type: e.target.value }))}>
                  {MEAL_TYPES.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Items summary (optional)" multiline rows={2}
                placeholder="e.g. Idli, Sambar, Chutney — add detailed dishes using the Recipe button"
                value={menuForm.items} onChange={e => setMenuForm(f => ({ ...f, items: e.target.value }))}
                helperText="A brief human-readable summary. Use Recipe (book icon) for structured dish & ingredient mapping." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes (optional)" multiline rows={2}
                placeholder="Special occasion, No onion-garlic today…"
                value={menuForm.notes} onChange={e => setMenuForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMenuDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMenu} disabled={savingMenu}>
            {savingMenu ? <CircularProgress size={20} /> : (editingMenu ? 'Update' : 'Add Meal')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Dishes & Recipes Dialog ─── */}
      <Dialog open={dishesDialog} onClose={() => setDishesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <RecipeIcon color="secondary" />
            <span>
              Dishes & Recipes —{' '}
              <Chip
                size="small"
                label={mealMeta[activeMealEntry?.meal_type]?.label}
                sx={{ bgcolor: mealMeta[activeMealEntry?.meal_type]?.color + '30',
                      color: mealMeta[activeMealEntry?.meal_type]?.color, fontWeight: 700 }}
              />
              {' '}{activeMealEntry?.date}
            </span>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDishes ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : (
            <>
              {/* Add dish row */}
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  size="small" fullWidth placeholder="Dish name, e.g. Idli"
                  value={newDishName} onChange={e => setNewDishName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddDish()}
                />
                <Button variant="contained" startIcon={<AddIcon />}
                  onClick={handleAddDish} disabled={savingDish || !newDishName.trim()}>
                  Add Dish
                </Button>
              </Box>

              {dishes.length === 0 ? (
                <Alert severity="info">No dishes added yet. Add dishes above, then map recipe ingredients.</Alert>
              ) : (
                <List disablePadding>
                  {dishes.map((dish, idx) => (
                    <Paper key={dish.id} variant="outlined" sx={{ mb: 1, borderRadius: 1 }}>
                      <ListItem>
                        <ListItemText
                          primary={<Typography fontWeight={600}>{dish.name}</Typography>}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {(ingredients[dish.id] || []).length} ingredient(s) mapped
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Tooltip title="Manage ingredients / recipe">
                            <IconButton size="small" color="primary"
                              onClick={() => setExpandedDish(expandedDish === dish.id ? null : dish.id)}>
                              <IngredientIcon fontSize="small" />
                              {expandedDish === dish.id ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove dish">
                            <IconButton size="small" color="error" onClick={() => handleDeleteDish(dish.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>

                      <Collapse in={expandedDish === dish.id}>
                        <Box sx={{ px: 2, pb: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" color="text.secondary" display="block" mt={1} mb={1}>
                            Ingredients / Recipe for <strong>{dish.name}</strong>
                          </Typography>

                          {/* Existing ingredients */}
                          {(ingredients[dish.id] || []).length > 0 && (
                            <TableContainer sx={{ mb: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Ingredient</TableCell>
                                    <TableCell align="center">Qty / person</TableCell>
                                    <TableCell align="center">Unit</TableCell>
                                    <TableCell align="center"></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(ingredients[dish.id] || []).map(ingr => (
                                    <TableRow key={ingr.id}>
                                      <TableCell>{ingr.grocery_item_name || ingr.grocery_item}</TableCell>
                                      <TableCell align="center">{ingr.quantity_per_person}</TableCell>
                                      <TableCell align="center">{ingr.unit}</TableCell>
                                      <TableCell align="center">
                                        <IconButton size="small" color="error"
                                          onClick={() => handleDeleteIngredient(ingr.id, dish.id)}>
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}

                          {/* Add ingredient row */}
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={5}>
                              <Autocomplete
                                size="small"
                                options={groceryItems}
                                getOptionLabel={o => `${o.name} (${o.unit})`}
                                value={newIngr.grocery_item}
                                onChange={(_, v) => setNewIngr(n => ({ ...n, grocery_item: v }))}
                                renderInput={params => <TextField {...params} label="Ingredient" />}
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <TextField size="small" fullWidth type="number" label="Qty / person"
                                value={newIngr.quantity_per_person}
                                onChange={e => setNewIngr(n => ({ ...n, quantity_per_person: e.target.value }))} />
                            </Grid>
                            <Grid item xs={6} sm={2}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Unit</InputLabel>
                                <Select value={newIngr.unit} label="Unit"
                                  onChange={e => setNewIngr(n => ({ ...n, unit: e.target.value }))}>
                                  {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <Button fullWidth variant="outlined" size="small"
                                onClick={() => handleAddIngredient(dish.id)} disabled={savingIngr}>
                                {savingIngr ? <CircularProgress size={16} /> : 'Add'}
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </Paper>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDishesDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete confirmation ─── */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs">
        <DialogTitle>Delete Meal Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{mealMeta[deleteConfirm?.meal_type]?.label}</strong> entry for{' '}
            <strong>{deleteConfirm?.date}</strong>? This will also delete all dishes and recipe data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteMenu}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
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
