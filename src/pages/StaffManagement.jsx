import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  LocalHospital as LocalHospitalIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const staffRoles = {
  Doctor: { icon: <MedicalServicesIcon />, color: 'primary' },
  Nurse: { icon: <LocalHospitalIcon />, color: 'secondary' },
  Receptionist: { icon: <PersonIcon />, color: 'info' },
  Admin: { icon: <AdminPanelSettingsIcon />, color: 'warning' },
  Staff: { icon: <PersonIcon />, color: 'default' },
};

const validationSchema = Yup.object({
  full_name: Yup.string().required('Full Name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone_number: Yup.string().required('Phone number is required'),
  role: Yup.string().required('Role is required'),
  specialization: Yup.string().when('role', {
    is: 'Doctor',
    then: Yup.string().required('Specialization is required for doctors'),
    otherwise: Yup.string().nullable(),
  }),
  date_of_birth: Yup.date().required('Date of birth is required'),
  address: Yup.string().required('Address is required'),
});

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/staff/');

      let staffData = [];
      if (Array.isArray(response.data)) {
        staffData = response.data;
      } else if (Array.isArray(response.data?.results)) {
        staffData = response.data.results;
      } else if (Array.isArray(response.data?.data)) {
        staffData = response.data.data;
      } else {
        console.warn('Unexpected staff API response shape:', response.data);
      }

      setStaff(staffData.filter((item) => item != null));
    } catch (error) {
      toast.error('Failed to fetch staff data.');
      console.error('Failed to fetch staff:', error.response?.data || error.message);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAdd = () => {
    setEditingStaff(null);
    formik.resetForm();
    setModalOpen(true);
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    formik.setValues({
      ...staffMember,
      date_of_birth: staffMember.date_of_birth ? format(new Date(staffMember.date_of_birth), 'yyyy-MM-dd') : '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await api.delete(`/staff/${id}/`);
        toast.success('Staff member deleted successfully.');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to delete staff member.');
        console.error(error);
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingStaff(null);
  };

  const formik = useFormik({
    initialValues: {
      full_name: '',
      email: '',
      phone_number: '',
      role: 'Staff',
      specialization: '',
      date_of_birth: '',
      address: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const userData = { ...values };
        if (editingStaff) {
          await api.put(`/staff/${editingStaff.id}/`, userData);
          toast.success('Staff member updated successfully.');
        } else {
          // For creation, we might need to post to a user creation endpoint
          // This assumes the backend handles user creation from this data
          await api.post('/staff/', userData);
          toast.success('Staff member added successfully.');
        }
        fetchStaff();
        handleModalClose();
      } catch (error) {
        const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        toast.error(`Operation failed: ${errorMsg}`);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const filteredStaff = useMemo(() => {
    const query = (searchTerm || '').toLowerCase();
    return (Array.isArray(staff) ? staff : []).filter((member) => {
      if (!member) return false;

      const user = member.user || member;
      const fullName = user.full_name || user.name || user.username || '';
      const email = user.email || '';
      const role = user.role || member.role || '';
      const specialization = member.specialization || '';

      return (
        fullName.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        role.toLowerCase().includes(query) ||
        specialization.toLowerCase().includes(query)
      );
    });
  }, [staff, searchTerm]);

  const gridRows = useMemo(
    () =>
      filteredStaff.map((member, index) => {
        const user = member?.user || member || {};
        return {
          ...member,
          ...user,
          id: member?.id || user?.id || `staff-${index}`,
        };
      }),
    [filteredStaff]
  );

  const columns = [
    {
      field: 'full_name',
      headerName: 'Name',
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: 'primary.light' }}>
            {staffRoles[params.row.role]?.icon || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{params.row.full_name || params.row.name || params.row.username || 'N/A'}</Typography>
            <Typography variant="caption" color="text.secondary">{params.row.email || 'N/A'}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      renderCell: (params) => (
        <Chip
          icon={staffRoles[params.row.role]?.icon || <PersonIcon />}
          label={params.row.role || 'N/A'}
          color={staffRoles[params.row.role]?.color || 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    { field: 'specialization', headerName: 'Specialization', flex: 1 },
    {
      field: 'phone_number',
      headerName: 'Phone',
      flex: 1,
      valueGetter: (params) => params.row?.phone_number || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" component="h1" gutterBottom>
            Staff Management
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Staff
          </Button>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, email, role, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={gridRows}
              columns={columns}
              loading={loading}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              components={{
                Toolbar: GridToolbar,
              }}
              componentsProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              disableSelectionOnClick
              getRowId={(row) => row.id}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth disableRestoreFocus>
        <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="full_name"
                  name="full_name"
                  label="Full Name"
                  value={formik.values.full_name}
                  onChange={formik.handleChange}
                  error={formik.touched.full_name && Boolean(formik.errors.full_name)}
                  helperText={formik.touched.full_name && formik.errors.full_name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone_number"
                  name="phone_number"
                  label="Phone Number"
                  value={formik.values.phone_number}
                  onChange={formik.handleChange}
                  error={formik.touched.phone_number && Boolean(formik.errors.phone_number)}
                  helperText={formik.touched.phone_number && formik.errors.phone_number}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                 <TextField
                    fullWidth
                    id="date_of_birth"
                    name="date_of_birth"
                    label="Date of Birth"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.date_of_birth}
                    onChange={formik.handleChange}
                    error={formik.touched.date_of_birth && Boolean(formik.errors.date_of_birth)}
                    helperText={formik.touched.date_of_birth && formik.errors.date_of_birth}
                  />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address"
                  name="address"
                  label="Address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={formik.touched.address && formik.errors.address}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    label="Role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                  >
                    {Object.keys(staffRoles).map(role => (
                      <MenuItem key={role} value={role}>{role}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {formik.values.role === 'Doctor' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="specialization"
                    name="specialization"
                    label="Specialization"
                    value={formik.values.specialization}
                    onChange={formik.handleChange}
                    error={formik.touched.specialization && Boolean(formik.errors.specialization)}
                    helperText={formik.touched.specialization && formik.errors.specialization}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: '0 24px 16px' }}>
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? <CircularProgress size={24} /> : (editingStaff ? 'Save Changes' : 'Add Staff')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;
