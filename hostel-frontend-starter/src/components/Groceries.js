import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tabs, Tab, Alert, MenuItem
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import api from '../api';

function Groceries() {
  const [tabValue, setTabValue] = useState(0);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [consumption, setConsumption] = useState([]);
  const [stock, setStock] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    try {
      switch(tabValue) {
        case 0:
          const itemsRes = await api.get('/api/groceries/items/');
          setItems(itemsRes.data);
          break;
        case 1:
          const categoriesRes = await api.get('/api/groceries/categories/');
          setCategories(categoriesRes.data);
          break;
        case 2:
          const vendorsRes = await api.get('/api/groceries/vendors/');
          setVendors(vendorsRes.data);
          break;
        case 3:
          const purchasesRes = await api.get('/api/groceries/purchases/');
          setPurchases(purchasesRes.data);
          break;
        case 4:
          const consumptionRes = await api.get('/api/groceries/consumption/');
          setConsumption(consumptionRes.data);
          break;
        case 5:
          const stockRes = await api.get('/api/groceries/stock/');
          setStock(stockRes.data);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAdd = () => {
    setCurrentItem(null);
    setOpenDialog(true);
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const endpoints = ['items', 'categories', 'vendors', 'purchases', 'consumption', 'stock'];
      await api.delete(`/api/groceries/${endpoints[tabValue]}/${id}/`);
      setSuccess('Item deleted successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting item');
    }
  };

  const handleSave = async (formData) => {
    try {
      const endpoints = ['items', 'categories', 'vendors', 'purchases', 'consumption', 'stock'];
      
      if (currentItem) {
        await api.put(`/api/groceries/${endpoints[tabValue]}/${currentItem.id}/`, formData);
        setSuccess('Item updated successfully');
      } else {
        await api.post(`/api/groceries/${endpoints[tabValue]}/`, formData);
        setSuccess('Item created successfully');
      }
      
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving item');
    }
  };

  const renderTable = () => {
    switch(tabValue) {
      case 0: // Items
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Min Stock Level</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell>{item.unit_of_measurement}</TableCell>
                    <TableCell>{item.minimum_stock_level}</TableCell>
                    <TableCell>{item.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(item)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item.id)} size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      
      case 1: // Categories
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(category)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(category.id)} size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      
      case 2: // Vendors
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>{vendor.contact_person}</TableCell>
                    <TableCell>{vendor.phone}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>{vendor.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(vendor)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(vendor.id)} size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      
      case 3: // Purchases
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell>{purchase.vendor_name}</TableCell>
                    <TableCell>{purchase.branch_name}</TableCell>
                    <TableCell>₹{purchase.total_amount}</TableCell>
                    <TableCell>{purchase.payment_status}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(purchase)} size="small">
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      
      case 4: // Consumption
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consumption.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.consumption_date).toLocaleDateString()}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.branch_name}</TableCell>
                    <TableCell>{item.quantity_consumed} {item.unit}</TableCell>
                    <TableCell>{item.purpose}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(item)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item.id)} size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      
      case 5: // Stock
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.branch_name}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell>{new Date(item.last_updated).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {item.quantity <= item.minimum_stock_level ? (
                        <Typography color="error">Low Stock</Typography>
                      ) : (
                        <Typography color="success">In Stock</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Groceries & Inventory Management</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleAdd}
          >
            Add New
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Items" />
          <Tab label="Categories" />
          <Tab label="Vendors" />
          <Tab label="Purchases" />
          <Tab label="Consumption" />
          <Tab label="Stock" />
        </Tabs>

        {renderTable()}
      </Paper>
    </Container>
  );
}

export default Groceries;
