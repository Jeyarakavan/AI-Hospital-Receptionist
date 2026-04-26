import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Container,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function Patients() {
  const [search, setSearch] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [admissionFilter, setAdmissionFilter] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone_number: '',
    nic_number: '',
    email: '',
    primary_disease: '',
    patient_type: 'General',
    address: '',
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: patients = [], isLoading, refetch } = useQuery({
    queryKey: ['patients-list', search, diseaseFilter, typeFilter, admissionFilter],
    queryFn: async () => {
      const response = await patientAPI.getAll({
        ...(search ? { search } : {}),
        ...(diseaseFilter ? { disease: diseaseFilter } : {}),
        ...(typeFilter ? { patient_type: typeFilter } : {}),
        ...(admissionFilter ? { admission_state: admissionFilter } : {}),
      });
      return response.data?.results || response.data || [];
    },
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) => p.name?.toLowerCase().includes(term) || p.phone_number?.includes(term));
  }, [patients, search]);

  return (
    <Container maxWidth="xl">
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Patients</Typography>
          {(user?.role === 'Admin' || user?.role === 'Doctor' || user?.role === 'Receptionist') && (
            <Button variant="contained" onClick={() => setOpenAdd(true)}>
              Add Patient
            </Button>
          )}
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            placeholder="Search by name or phone"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { md: 280 } }}
          />
          <TextField
            size="small"
            label="Disease"
            value={diseaseFilter}
            onChange={(e) => setDiseaseFilter(e.target.value)}
          />
          <TextField
            select
            size="small"
            label="Patient Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Clinic">Clinic</MenuItem>
            <MenuItem value="Accident">Accident</MenuItem>
            <MenuItem value="General">General</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Admission"
            value={admissionFilter}
            onChange={(e) => setAdmissionFilter(e.target.value)}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="admitted">Admitted</MenuItem>
            <MenuItem value="discharged">Discharged</MenuItem>
          </TextField>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        {isLoading &&
          Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} variant="rounded" height={84} />
          ))}

        {!isLoading && filtered.map((patient) => (
          <Card key={patient.id} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{patient.name}</Typography>
                  <Typography color="text.secondary">{patient.phone_number}</Typography>
                  <Typography color="text.secondary">NIC: {patient.nic_number || 'N/A'}</Typography>
                  <Typography color="text.secondary">{patient.email || 'No email'}</Typography>
                  <Typography color="text.secondary">{patient.primary_disease || 'No disease noted'}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label={patient.patient_type || 'General'} color="info" variant="outlined" />
                  <Chip label={`Age ${patient.age}`} />
                  <Button variant="contained" onClick={() => navigate(`/patients/${patient.id}`)}>
                    Open Details
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Patient</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full Name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="Age" type="number" value={formData.age} onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))} />
            <TextField label="Phone" value={formData.phone_number} onChange={(e) => setFormData((p) => ({ ...p, phone_number: e.target.value }))} />
            <TextField label="NIC Number" value={formData.nic_number} onChange={(e) => setFormData((p) => ({ ...p, nic_number: e.target.value }))} />
            <TextField label="Email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
            <TextField label="Disease" value={formData.primary_disease} onChange={(e) => setFormData((p) => ({ ...p, primary_disease: e.target.value }))} />
            <TextField select label="Patient Type" value={formData.patient_type} onChange={(e) => setFormData((p) => ({ ...p, patient_type: e.target.value }))}>
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Clinic">Clinic</MenuItem>
              <MenuItem value="Accident">Accident</MenuItem>
            </TextField>
            <TextField label="Address" multiline rows={2} value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await patientAPI.create({ ...formData, age: Number(formData.age) });
                toast.success('Patient added successfully');
                setOpenAdd(false);
                setFormData({
                  name: '',
                  age: '',
                  phone_number: '',
                  nic_number: '',
                  email: '',
                  primary_disease: '',
                  patient_type: 'General',
                  address: '',
                });
                refetch();
              } catch (e) {
                toast.error('Failed to add patient');
              }
            }}
          >
            Save Patient
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
