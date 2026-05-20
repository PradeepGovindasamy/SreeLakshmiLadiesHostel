import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tabs, Tab, Alert, MenuItem, Grid,
  Card, CardContent, Chip, FormControl, InputLabel, Select,
  Stack, CircularProgress, List, ListItem, ListItemText, Link,
} from '@mui/material';
import {
  Add, Edit, Delete, History, ShoppingCart, RemoveCircleOutline,
  CheckCircle, Warning, Inventory2,
} from '@mui/icons-material';
import { groceriesAPI, enhancedAPI } from '../api';

const UNITS = ['kg', 'g', 'l', 'ml', 'piece', 'packet'];
const asList = (data) => (Array.isArray(data) ? data : data?.results ?? []);

const STATUS = {
  Healthy: 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'error',
};

export default function Groceries() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dashboard, setDashboard] = useState(null);
  const [stock, setStock] = useState([]);
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [reduceOpen, setReduceOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickProductOpen, setQuickProductOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');

  const branchParams = selectedBranch !== 'all' ? { branch: selectedBranch } : {};
  const defaultBranch = selectedBranch !== 'all' ? selectedBranch : (branches[0] ? String(branches[0].id) : '');

  const [productForm, setProductForm] = useState({ name: '', unit: 'kg', min_stock_level: '' });
  const [quickProduct, setQuickProduct] = useState({ name: '', unit: 'kg' });
  const [purchaseForm, setPurchaseForm] = useState({
    branch: '', purchase_date: new Date().toISOString().slice(0, 10),
    items: [{ item_id: '', quantity: '', unit_price: '' }],
  });
  const [reduceForm, setReduceForm] = useState({
    branch: '', grocery_item: '', quantity: '', reason: 'wastage', notes: '',
  });

  const notify = (msg, ok = true) => { ok ? setSuccess(msg) : setError(msg); if (ok) setError(''); else setSuccess(''); };

  useEffect(() => {
    enhancedAPI.branches.list().then(r => {
      const list = asList(r.data);
      setBranches(list);
      if (list.length === 1) setSelectedBranch(String(list[0].id));
    }).catch(() => {});
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, stockRes, itemsRes, purchasesRes] = await Promise.all([
        groceriesAPI.stock.dashboard(branchParams),
        groceriesAPI.stock.list(branchParams),
        groceriesAPI.items.list({ is_active: true }),
        groceriesAPI.purchases.list({ ...branchParams, ordering: '-purchase_date' }),
      ]);
      setDashboard(dash.data);
      setStock(asList(stockRes.data));
      setItems(asList(itemsRes.data));
      setPurchases(asList(purchasesRes.data).slice(0, 50));
    } catch (e) {
      notify(e.response?.data?.detail || 'Failed to load', false);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openPurchase = () => {
    setPurchaseForm({
      branch: defaultBranch,
      purchase_date: new Date().toISOString().slice(0, 10),
      items: [{ item_id: '', quantity: '', unit_price: '' }],
    });
    setPurchaseOpen(true);
  };

  const openReduce = () => {
    setReduceForm({ branch: defaultBranch, grocery_item: '', quantity: '', reason: 'wastage', notes: '' });
    setReduceOpen(true);
  };

  const saveProduct = async () => {
    if (!productForm.name.trim()) { notify('Product name is required', false); return; }
    try {
      const payload = {
        name: productForm.name.trim(),
        unit: productForm.unit,
        min_stock_level: parseFloat(productForm.min_stock_level) || 0,
        is_active: true,
      };
      if (editingProduct) {
        await groceriesAPI.items.update(editingProduct.id, payload);
        notify('Product updated');
      } else {
        await groceriesAPI.items.create(payload);
        notify('Product added');
      }
      setProductOpen(false);
      loadAll();
    } catch (e) {
      notify('Could not save product', false);
    }
  };

  const saveQuickProduct = async () => {
    if (!quickProduct.name.trim()) return;
    try {
      const res = await groceriesAPI.items.create({
        name: quickProduct.name.trim(),
        unit: quickProduct.unit,
        min_stock_level: 0,
        is_active: true,
      });
      const newItem = res.data;
      setItems(prev => [...prev, newItem]);
      setPurchaseForm(f => {
        const lines = [...f.items];
        const emptyIdx = lines.findIndex(l => !l.item_id);
        const idx = emptyIdx >= 0 ? emptyIdx : lines.length - 1;
        lines[idx] = { ...lines[idx], item_id: String(newItem.id) };
        return { ...f, items: lines };
      });
      setQuickProductOpen(false);
      setQuickProduct({ name: '', unit: 'kg' });
      notify(`"${newItem.name}" added — now enter quantity`);
    } catch {
      notify('Could not add product', false);
    }
  };

  const savePurchase = async () => {
    const lines = purchaseForm.items.filter(l => l.item_id && l.quantity);
    if (!purchaseForm.branch || lines.length === 0) {
      notify('Select branch and add at least one item with quantity', false);
      return;
    }
    try {
      await groceriesAPI.purchases.record({
        branch: parseInt(purchaseForm.branch, 10),
        purchase_date: purchaseForm.purchase_date,
        items: lines.map(l => ({
          item_id: parseInt(l.item_id, 10),
          quantity: parseFloat(l.quantity),
          unit_price: parseFloat(l.unit_price) || 0,
        })),
      });
      notify('Purchase saved — stock updated');
      setPurchaseOpen(false);
      loadAll();
    } catch (e) {
      notify(e.response?.data?.detail || 'Purchase failed', false);
    }
  };

  const saveReduce = async () => {
    if (!reduceForm.branch || !reduceForm.grocery_item || !reduceForm.quantity) {
      notify('Fill all fields', false);
      return;
    }
    try {
      await groceriesAPI.transactions.record({
        branch: parseInt(reduceForm.branch, 10),
        grocery_item: parseInt(reduceForm.grocery_item, 10),
        transaction_type: reduceForm.reason,
        quantity: parseFloat(reduceForm.quantity),
        notes: reduceForm.notes || reduceForm.reason,
      });
      notify('Stock reduced');
      setReduceOpen(false);
      loadAll();
    } catch {
      notify('Could not update stock', false);
    }
  };

  const openHistory = async (row) => {
    const res = await groceriesAPI.stock.history(row.id);
    setHistoryRows(asList(res.data));
    setHistoryTitle(row.item_name);
    setHistoryOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={2}>
        <Typography variant="h5" fontWeight={800}>Groceries & Inventory</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          <strong>Easy flow:</strong> Add product once → Record purchase daily → Stock updates automatically
        </Typography>
      </Box>

      {/* Simple 3-step guide */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={700}>① Products</Typography>
            <Typography variant="caption" color="text.secondary">Add Rice, Dal, Oil… (one time)</Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={700}>② Record Purchase</Typography>
            <Typography variant="caption" color="text.secondary">What you bought today + quantity</Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={700}>③ Stock</Typography>
            <Typography variant="caption" color="text.secondary">Updates automatically — no manual edit</Typography>
          </Box>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Main actions — always visible */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2}>
        <Button variant="contained" size="large" startIcon={<ShoppingCart />} onClick={openPurchase} sx={{ flex: 1 }}>
          Record Purchase
        </Button>
        <Button variant="outlined" size="large" startIcon={<Add />} onClick={() => { setEditingProduct(null); setProductForm({ name: '', unit: 'kg', min_stock_level: '' }); setProductOpen(true); }}>
          Add Product
        </Button>
        <Button variant="outlined" color="warning" size="large" startIcon={<RemoveCircleOutline />} onClick={openReduce}>
          Reduce Stock
        </Button>
        {branches.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={selectedBranch} label="Branch" onChange={e => setSelectedBranch(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              {branches.map(b => <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab icon={<Inventory2 />} iconPosition="start" label="Current Stock" />
          <Tab icon={<ShoppingCart />} iconPosition="start" label="Purchase History" />
          <Tab label="All Products" />
        </Tabs>

        {loading ? (
          <Box py={6} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : tab === 0 ? (
          <>
            <Grid container spacing={1.5} mb={2}>
              {[
                { l: 'Products', v: dashboard?.total_items },
                { l: 'Low Stock', v: dashboard?.low_stock_count, c: '#f59e0b' },
                { l: 'Out of Stock', v: dashboard?.out_of_stock_count, c: '#ef4444' },
              ].map(x => (
                <Grid item xs={4} key={x.l}>
                  <Card variant="outlined"><CardContent sx={{ py: 1, textAlign: 'center' }}>
                    <Typography variant="caption">{x.l}</Typography>
                    <Typography variant="h6" fontWeight={700} color={x.c}>{x.v ?? '—'}</Typography>
                  </CardContent></Card>
                </Grid>
              ))}
            </Grid>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stock.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No stock yet. Add a product, then click <strong>Record Purchase</strong>.
                    </TableCell></TableRow>
                  ) : stock.map(row => (
                    <TableRow key={row.id} hover>
                      <TableCell fontWeight={600}>{row.item_name}</TableCell>
                      <TableCell align="right">{parseFloat(row.quantity).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{row.item_unit}</TableCell>
                      <TableCell><Chip size="small" color={STATUS[row.status_label] || 'default'} label={row.status_label} /></TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => openHistory(row)}><History fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : tab === 1 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell><TableCell>Branch</TableCell><TableCell>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No purchases yet. Click <strong>Record Purchase</strong> above.
                  </TableCell></TableRow>
                ) : purchases.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.purchase_date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{p.branch_name}</TableCell>
                    <TableCell>₹{parseFloat(p.total_amount || 0).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>Unit</TableCell><TableCell>Min Stock</TableCell><TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.min_stock_level}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setEditingProduct(item); setProductForm({ name: item.name, unit: item.unit, min_stock_level: item.min_stock_level }); setProductOpen(true); }}><Edit fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Record Purchase (main daily dialog) ── */}
      <Dialog open={purchaseOpen} onClose={() => setPurchaseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Purchase</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {branches.length > 1 && (
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select value={purchaseForm.branch} label="Branch" onChange={e => setPurchaseForm(f => ({ ...f, branch: e.target.value }))}>
                  {branches.map(b => <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <TextField size="small" type="date" label="Purchase Date" InputLabelProps={{ shrink: true }}
              value={purchaseForm.purchase_date} onChange={e => setPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))} />

            <Typography variant="subtitle2">What did you buy?</Typography>
            {purchaseForm.items.map((line, idx) => (
              <Grid container spacing={1} key={idx} alignItems="center">
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Product</InputLabel>
                    <Select value={line.item_id} label="Product" onChange={e => {
                      const c = [...purchaseForm.items]; c[idx].item_id = e.target.value;
                      setPurchaseForm(f => ({ ...f, items: c }));
                    }}>
                      {items.map(i => <MenuItem key={i.id} value={String(i.id)}>{i.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField size="small" fullWidth type="number" label="Qty" value={line.quantity}
                    onChange={e => { const c = [...purchaseForm.items]; c[idx].quantity = e.target.value; setPurchaseForm(f => ({ ...f, items: c })); }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField size="small" fullWidth type="number" label="Price (optional)" value={line.unit_price}
                    onChange={e => { const c = [...purchaseForm.items]; c[idx].unit_price = e.target.value; setPurchaseForm(f => ({ ...f, items: c })); }} />
                </Grid>
              </Grid>
            ))}
            <Stack direction="row" spacing={2}>
              <Link component="button" variant="body2" onClick={() => setPurchaseForm(f => ({ ...f, items: [...f.items, { item_id: '', quantity: '', unit_price: '' }] }))}>
                + Add another item
              </Link>
              <Link component="button" variant="body2" onClick={() => setQuickProductOpen(true)}>
                + New product not in list?
              </Link>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePurchase}>Save Purchase</Button>
        </DialogActions>
      </Dialog>

      {/* Quick add product during purchase */}
      <Dialog open={quickProductOpen} onClose={() => setQuickProductOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField autoFocus label="Product name" fullWidth size="small" placeholder="e.g. Rice"
              value={quickProduct.name} onChange={e => setQuickProduct(p => ({ ...p, name: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>Unit</InputLabel>
              <Select value={quickProduct.unit} label="Unit" onChange={e => setQuickProduct(p => ({ ...p, unit: e.target.value }))}>
                {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickProductOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveQuickProduct}>Add & Continue</Button>
        </DialogActions>
      </Dialog>

      {/* Add / edit product */}
      <Dialog open={productOpen} onClose={() => setProductOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" fullWidth size="small" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>Unit</InputLabel>
              <Select value={productForm.unit} label="Unit" onChange={e => setProductForm(f => ({ ...f, unit: e.target.value }))}>
                {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Minimum stock (alert level)" type="number" fullWidth size="small"
              value={productForm.min_stock_level} onChange={e => setProductForm(f => ({ ...f, min_stock_level: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveProduct}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Reduce stock */}
      <Dialog open={reduceOpen} onClose={() => setReduceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reduce Stock</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {branches.length > 1 && (
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select value={reduceForm.branch} label="Branch" onChange={e => setReduceForm(f => ({ ...f, branch: e.target.value }))}>
                  {branches.map(b => <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth size="small">
              <InputLabel>Product</InputLabel>
              <Select value={reduceForm.grocery_item} label="Product" onChange={e => setReduceForm(f => ({ ...f, grocery_item: e.target.value }))}>
                {items.map(i => <MenuItem key={i.id} value={String(i.id)}>{i.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Reason</InputLabel>
              <Select value={reduceForm.reason} label="Reason" onChange={e => setReduceForm(f => ({ ...f, reason: e.target.value }))}>
                <MenuItem value="wastage">Wastage / Spoiled</MenuItem>
                <MenuItem value="consumption">Used in kitchen</MenuItem>
                <MenuItem value="adjustment">Correction</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Quantity" type="number" fullWidth size="small" value={reduceForm.quantity}
              onChange={e => setReduceForm(f => ({ ...f, quantity: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReduceOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={saveReduce}>Reduce</Button>
        </DialogActions>
      </Dialog>

      {/* History */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>History — {historyTitle}</DialogTitle>
        <DialogContent dividers>
          {historyRows.length === 0 ? (
            <Typography color="text.secondary">No history yet</Typography>
          ) : (
            <List dense>
              {historyRows.map(t => (
                <ListItem key={t.id} divider>
                  <ListItemText
                    primary={`${new Date(t.created_at).toLocaleDateString('en-IN')} — ${t.transaction_type_display} — ${t.quantity} ${t.unit}`}
                    secondary={t.notes}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setHistoryOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Container>
  );
}
