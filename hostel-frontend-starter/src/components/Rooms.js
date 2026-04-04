import React, { useEffect, useState } from 'react';
import { enhancedAPI } from '../api';
import { useUser } from '../contexts/UserContext';
import RoomForm from './RoomForm';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Badge,
  Avatar,
  Menu,
  ButtonGroup
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Bed as BedIcon,
  People as PeopleIcon,
  Room as RoomIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ContentCopy as CopyIcon,
  ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetailsDialog, setRoomDetailsDialog] = useState(false);
  const [roomFormOpen, setRoomFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [copyFromRoom, setCopyFromRoom] = useState(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [copySelectDialog, setCopySelectDialog] = useState(false);
  
  const { getUserRole, hasAnyRole } = useUser();
  const userRole = getUserRole();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      fetchRooms();
    }
  }, [selectedBranch, selectedStatus, branches]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch branches for filter dropdown
      const branchResponse = await enhancedAPI.branches.list();
      console.log('Branches API response:', branchResponse);
      
      // Handle different response formats for branches
      let branchData;
      if (Array.isArray(branchResponse.data)) {
        branchData = branchResponse.data;
      } else if (branchResponse.data.results) {
        branchData = branchResponse.data.results;
      } else if (branchResponse.data.data) {
        branchData = branchResponse.data.data;
      } else {
        branchData = [];
      }
      
      console.log('Processed branch data:', branchData);
      setBranches(branchData);
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      console.error('Branches error details:', error.response?.data);
      setError(`Failed to load data: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setError(null);
      console.log('Fetching rooms with selectedBranch:', selectedBranch, 'selectedStatus:', selectedStatus);
      
      // Build query parameters
      const params = {};
      if (selectedBranch !== 'all') {
        params.branch = selectedBranch;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      
      console.log('Rooms API call params:', params);
      console.log('API URL will be:', '/api/v2/rooms/' + (Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : ''));
      
      const response = await enhancedAPI.rooms.list(params);
      console.log('Rooms API response:', response);
      
      // Handle different response formats for rooms
      let roomData;
      if (Array.isArray(response.data)) {
        roomData = response.data;
      } else if (response.data.results) {
        roomData = response.data.results;
      } else if (response.data.data) {
        roomData = response.data.data;
      } else {
        roomData = [];
      }
      
      console.log('Processed room data:', roomData);
      console.log('Room statuses:', roomData.map(room => ({ name: room.room_name, status: room.status, is_available: room.is_available, occupancy: room.current_occupancy, capacity: room.sharing_type })));
      setRooms(roomData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      console.error('Rooms error details:', error.response?.data);
      setError(`Failed to load rooms: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleViewDetails = async (room) => {
    try {
      setSelectedRoom(room);
      const response = await enhancedAPI.rooms.get(room.id);
      setSelectedRoom(response.data);
      setRoomDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching room details:', error);
      setError('Failed to load room details.');
    }
  };

  const handleEdit = async (room) => {
    try {
      // Fetch complete room details before editing
      const response = await enhancedAPI.rooms.get(room.id);
      console.log('Room data for editing:', response.data);
      setEditingRoom(response.data);
      setRoomFormOpen(true);
    } catch (error) {
      console.error('Error fetching room details for editing:', error);
      setError('Failed to load room details for editing.');
    }
  };

  const handleDelete = async (room) => {
    if (window.confirm(`Are you sure you want to delete room "${room.room_number}"?`)) {
      try {
        await enhancedAPI.rooms.delete(room.id);
        await fetchRooms(); // Refresh list
      } catch (error) {
        console.error('Error deleting room:', error);
        setError('Failed to delete room.');
      }
    }
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setCopyFromRoom(null);
    setAddMenuAnchor(null);
    setRoomFormOpen(true);
  };

  const handleCopyFrom = (sourceRoom) => {
    setCopyFromRoom(sourceRoom);
    setEditingRoom(null);
    setAddMenuAnchor(null);
    setRoomFormOpen(true);
  };

  const handleAddMenuClick = (event) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  const handleRoomFormClose = () => {
    setRoomFormOpen(false);
    setEditingRoom(null);
    setCopyFromRoom(null);
  };

  const handleRoomFormSave = () => {
    fetchRooms(); // Refresh the list
    setRoomFormOpen(false);
    setEditingRoom(null);
    setCopyFromRoom(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'primary';
      case 'maintenance': return 'warning';
      case 'reserved': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircleIcon />;
      case 'occupied': return <PeopleIcon />;
      case 'maintenance': return <WarningIcon />;
      case 'reserved': return <CancelIcon />;
      default: return <RoomIcon />;
    }
  };

  const canEdit = hasAnyRole(['owner', 'admin', 'warden']);
  const canDelete = hasAnyRole(['owner', 'admin']);
  const canAdd = hasAnyRole(['owner', 'admin', 'warden']);

  const filteredRooms = rooms;

  // Calculate summary statistics based on beds rather than rooms
  const totalRooms = filteredRooms.length;
  
  // Calculate bed statistics
  const totalBeds = filteredRooms.reduce((sum, room) => sum + (room.sharing_type || 0), 0);
  const availableBeds = filteredRooms
    .filter(room => (room.status === 'available' || room.is_available))
    .reduce((sum, room) => sum + Math.max(0, (room.sharing_type || 0) - (room.current_occupancy || 0)), 0);
  const occupiedBeds = filteredRooms
    .reduce((sum, room) => sum + (room.current_occupancy || 0), 0);
  const maintenanceBeds = filteredRooms
    .filter(room => (room.status === 'maintenance' || !room.is_available))
    .reduce((sum, room) => sum + (room.sharing_type || 0), 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          {userRole === 'owner' ? 'My Rooms' : 
           userRole === 'warden' ? 'Managed Rooms' : 
           'All Rooms'}
        </Typography>
        {canAdd && (
          <Box>
            <ButtonGroup variant="contained" color="primary">
              <Button
                startIcon={<AddIcon />}
                onClick={handleAdd}
              >
                Add Room
              </Button>
              <Button
                size="small"
                onClick={handleAddMenuClick}
                sx={{ px: 1 }}
              >
                <ArrowDropDownIcon />
              </Button>
            </ButtonGroup>
            <Menu
              anchorEl={addMenuAnchor}
              open={Boolean(addMenuAnchor)}
              onClose={handleAddMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleAdd}>
                <AddIcon sx={{ mr: 1 }} />
                Add New Room
              </MenuItem>
              <MenuItem 
                onClick={() => {
                  handleAddMenuClose();
                  setCopySelectDialog(true);
                }}
                disabled={filteredRooms.length === 0}
              >
                <CopyIcon sx={{ mr: 1 }} />
                Copy From Existing Room
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <RoomIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{totalRooms}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Rooms
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BedIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{totalBeds}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Beds
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{availableBeds}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Available Beds
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{occupiedBeds}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Occupied Beds
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{maintenanceBeds}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Maintenance Beds
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Property</InputLabel>
              <Select
                value={selectedBranch}
                label="Filter by Property"
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <MenuItem value="all">All Properties</MenuItem>
                {branches && branches.length > 0 ? (
                  branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name || branch.branch_name || `Branch ${branch.id}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No properties available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Filter by Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="occupied">Occupied</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Rooms Table */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
              <TableRow>
                <TableCell>Room Number</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Current Occupancy</TableCell>
                <TableCell>Rent</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRooms
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Badge
                          badgeContent={room.current_occupancy || 0}
                          color="primary"
                          sx={{ mr: 2 }}
                        >
                          <BedIcon />
                        </Badge>
                        <Box>
                          <Typography variant="subtitle2">
                            {room.room_name || 'Unnamed Room'}
                          </Typography>
                          {room.description && (
                            <Typography variant="caption" color="textSecondary">
                              {room.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {room.branch_name || room.branch}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={room.sharing_type_display || 'Not specified'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                        {room.sharing_type || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {room.current_occupancy || 0}/{room.sharing_type || 'N/A'}
                        </Typography>
                        {room.sharing_type && room.current_occupancy !== undefined && (
                          <Typography variant="caption" color="textSecondary">
                            {Math.round((room.current_occupancy / room.sharing_type) * 100)}% full
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {room.rent ? `₹${room.rent}` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(room.status || (room.is_available ? 'available' : 'maintenance'))}
                        label={room.status ? 
                          (room.status.charAt(0).toUpperCase() + room.status.slice(1)) : 
                          (room.is_available ? 'Available' : 'Maintenance')
                        }
                        color={getStatusColor(room.status || (room.is_available ? 'available' : 'maintenance'))}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          color="info" 
                          size="small"
                          onClick={() => handleViewDetails(room)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleEdit(room)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canAdd && (
                        <Tooltip title="Copy Room">
                          <IconButton 
                            color="info" 
                            size="small"
                            onClick={() => handleCopyFrom(room)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDelete(room)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredRooms.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Room Details Dialog */}
      <Dialog 
        open={roomDetailsDialog} 
        onClose={() => setRoomDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Room Details - {selectedRoom?.room_number}
        </DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Typography><strong>Property:</strong> {selectedRoom.branch_name}</Typography>
                <Typography><strong>Room Type:</strong> {selectedRoom.sharing_type_display || 'Not specified'}</Typography>
                <Typography><strong>Capacity:</strong> {selectedRoom.sharing_type || 'N/A'} people</Typography>
                <Typography><strong>Current Occupancy:</strong> {selectedRoom.current_occupancy || 0}</Typography>
                <Typography><strong>Rent:</strong> {selectedRoom.rent ? `₹${selectedRoom.rent}` : 'N/A'}</Typography>
                <Typography><strong>Status:</strong> 
                  <Chip
                    label={selectedRoom.status ? 
                      (selectedRoom.status.charAt(0).toUpperCase() + selectedRoom.status.slice(1)) : 
                      (selectedRoom.is_available ? 'Available' : 'Maintenance')
                    }
                    color={getStatusColor(selectedRoom.status || (selectedRoom.is_available ? 'available' : 'maintenance'))}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Additional Details</Typography>
                {selectedRoom.description && (
                  <Typography><strong>Description:</strong> {selectedRoom.description}</Typography>
                )}
                {selectedRoom.amenities && (
                  <Typography><strong>Amenities:</strong> {selectedRoom.amenities}</Typography>
                )}
                {selectedRoom.floor_number && (
                  <Typography><strong>Floor:</strong> {selectedRoom.floor_number}</Typography>
                )}
                {selectedRoom.room_size_sqft && (
                  <Typography><strong>Size:</strong> {selectedRoom.room_size_sqft} sq ft</Typography>
                )}
                <Typography><strong>Attached Bath:</strong> {selectedRoom.attached_bath ? 'Yes' : 'No'}</Typography>
                <Typography><strong>AC Room:</strong> {selectedRoom.ac_room ? 'Yes' : 'No'}</Typography>
                <Typography><strong>Created:</strong> 
                  {selectedRoom.created_at ? new Date(selectedRoom.created_at).toLocaleDateString() : 'N/A'}
                </Typography>
                <Typography><strong>Last Updated:</strong> 
                  {selectedRoom.updated_at ? new Date(selectedRoom.updated_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>

              {selectedRoom.tenants && selectedRoom.tenants.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Current Tenants</Typography>
                  {selectedRoom.tenants.map((tenant, index) => (
                    <Box key={index} display="flex" alignItems="center" mb={1}>
                      <Avatar sx={{ mr: 2 }}>{tenant.name?.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body1">{tenant.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {tenant.email} | {tenant.phone}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Copy Room Selection Dialog */}
      <Dialog
        open={copySelectDialog}
        onClose={() => setCopySelectDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Select Room to Copy From
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Choose a room to copy its configuration. The new room will inherit all settings except room name and number.
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Room</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Floor</TableCell>
                  <TableCell>Rent</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {room.room_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {room.branch_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={room.sharing_type_display || `${room.sharing_type} Sharing`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>Floor {room.floor_number || 'N/A'}</TableCell>
                    <TableCell>₹{room.rent || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CopyIcon />}
                        onClick={() => {
                          setCopySelectDialog(false);
                          handleCopyFrom(room);
                        }}
                      >
                        Copy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopySelectDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Room Form Dialog */}
      <RoomForm
        open={roomFormOpen}
        onClose={handleRoomFormClose}
        onSave={handleRoomFormSave}
        room={editingRoom}
        copyFromRoom={copyFromRoom}
        isEdit={Boolean(editingRoom)}
      />
    </Box>
  );
}

export default Rooms;
