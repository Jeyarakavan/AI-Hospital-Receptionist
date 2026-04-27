import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  Skeleton,
} from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function MyPatients() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [linkingId, setLinkingId] = useState(null);
  const [linkError, setLinkError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      // Doctor role is already server-filtered to own appointments
      const res = await appointmentAPI.getAll({ status: 'Confirmed', page_size: 200 });
      const rows = res.data?.results || res.data || [];
      setAppointments(rows);
    } catch (e) {
      toast.error('Failed to load confirmed appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const ad = `${a.appointment_date}T${a.appointment_time}`;
      const bd = `${b.appointment_date}T${b.appointment_time}`;
      return bd.localeCompare(ad);
    });
  }, [appointments]);

  const openRecord = async (apptId) => {
    setLinkingId(apptId);
    setLinkError('');
    try {
      const res = await appointmentAPI.getPatientLink(apptId);
      const patientId = res.data?.patient_id;
      if (!patientId) throw new Error('Missing patient_id');
      navigate(`/patients/${patientId}`);
    } catch (e) {
      setLinkError(e?.response?.data?.error || 'Failed to open patient record for this appointment');
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>My Patients</Typography>
          <Button variant="contained" onClick={load}>Refresh</Button>
        </Stack>
        <Typography color="text.secondary">
          Shows only patients with appointments you confirmed. Open a patient to add encounter notes, medicines, follow-up, and admission updates.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {loading && Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} variant="rounded" height={92} />
        ))}

        {!loading && sorted.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700 }}>No confirmed patients yet</Typography>
            <Typography color="text.secondary">Confirm an appointment first, then the patient record will appear here.</Typography>
          </Box>
        )}

        {!loading && sorted.map((a) => (
          <Card key={a.id} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{a.patient_name}</Typography>
                  <Typography color="text.secondary">
                    {a.patient_disease || 'Consultation'}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {dayjs(a.appointment_date).format('MMM D, YYYY')} · {String(a.appointment_time || '').slice(0, 5)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {a.contact_number}{a.patient_email ? ` · ${a.patient_email}` : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={`Age ${a.patient_age}`} />
                  <Chip label="Confirmed" color="success" variant="outlined" />
                  <Button variant="contained" onClick={() => openRecord(a.id)} disabled={linkingId === a.id}>
                    {linkingId === a.id ? 'Opening…' : 'Open Medical Record'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={!!linkError} onClose={() => setLinkError('')} maxWidth="sm" fullWidth>
        <DialogTitle>Could not open record</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">{linkError}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkError('')}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

