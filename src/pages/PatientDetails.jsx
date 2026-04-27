import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import PatientHeaderCard from '../components/patient/PatientHeaderCard';
import CaseSummaryPanel from '../components/patient/CaseSummaryPanel';
import EncounterTimeline from '../components/patient/EncounterTimeline';
import AdmissionStatusPanel from '../components/patient/AdmissionStatusPanel';
import PrescriptionEditor from '../components/patient/PrescriptionEditor';
import { usePatientFullHistory } from '../hooks/usePatientHistory';
import { patientHistoryAPI } from '../services/api';

export default function PatientDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = usePatientFullHistory(id);
  const [openEncounterDialog, setOpenEncounterDialog] = useState(false);
  const [encounterForm, setEncounterForm] = useState({
    notes: '',
    current_situation: '',
    follow_up_plan: '',
    encounter_date: dayjs().format('YYYY-MM-DD'),
    next_checkup_date: '',
  });
  const [prescriptions, setPrescriptions] = useState([]);

  const latestCase = useMemo(() => (data?.cases?.length ? data.cases[0] : null), [data]);

  const createEncounterMutation = useMutation({
    mutationFn: (payload) => patientHistoryAPI.createEncounter(payload),
    onSuccess: () => {
      toast.success('Encounter saved successfully');
      setOpenEncounterDialog(false);
      setEncounterForm({
        notes: '',
        current_situation: '',
        follow_up_plan: '',
        encounter_date: dayjs().format('YYYY-MM-DD'),
        next_checkup_date: '',
      });
      setPrescriptions([]);
      queryClient.invalidateQueries({ queryKey: ['patient-history', id] });
    },
    onError: (e) => {
      const d = e?.response?.data;
      let msg = d?.error;

      const formatValue = (val) => {
        if (Array.isArray(val)) {
          return val
            .map((item, idx) => {
              if (item && typeof item === 'object') {
                const inner = Object.entries(item)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
                  .join(', ');
                return `item ${idx + 1} -> ${inner}`;
              }
              return String(item);
            })
            .join(' | ');
        }
        if (val && typeof val === 'object') {
          return Object.entries(val)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join(', ');
        }
        return String(val);
      };

      if (!msg && d && typeof d === 'object') {
        const first = Object.entries(d)[0];
        if (first) {
          const [field, val] = first;
          msg = `${field}: ${formatValue(val)}`;
        }
      }
      toast.error(msg || 'Failed to save encounter');
    },
  });

  const handleCreateEncounter = () => {
    if (!latestCase) {
      toast.error('Create a patient case first.');
      return;
    }
    if (!encounterForm.notes?.trim()) {
      toast.error('Clinical Notes are required.');
      return;
    }
    const normalizedPrescriptions = prescriptions
      .map((p) => ({
        medicine_name: (p.medicine_name ?? p.medicineName ?? p.medicine ?? '').trim(),
        dosage: (p.dosage ?? '').trim(),
        frequency: (p.frequency ?? '').trim(),
        duration: (p.duration ?? '').trim(),
        instructions: (p.instructions ?? '').trim(),
      }))
      .filter((p) => p.medicine_name);

    createEncounterMutation.mutate({
      patient_case: latestCase.id,
      ...encounterForm,
      notes: encounterForm.notes.trim(),
      next_checkup_date: encounterForm.next_checkup_date || null,
      prescriptions: normalizedPrescriptions,
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={240} />
      </Container>
    );
  }

  if (error || !data) {
    return <Alert severity="error">Failed to load patient history.</Alert>;
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <PatientHeaderCard patient={data.patient} profile={data.medical_profile} />
        {latestCase ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <CaseSummaryPanel patientCase={latestCase} />
            </Grid>
            <Grid item xs={12} md={5}>
              <AdmissionStatusPanel admissions={latestCase.admissions || []} />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Clinical Timeline</Typography>
                <Button variant="contained" onClick={() => setOpenEncounterDialog(true)}>Add Encounter</Button>
              </Stack>
              <EncounterTimeline encounters={latestCase.encounters || []} />
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">No case found for this patient yet.</Alert>
        )}
      </Stack>

      <Dialog open={openEncounterDialog} onClose={() => setOpenEncounterDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Patient Encounter</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Clinical Notes"
              multiline
              minRows={3}
              value={encounterForm.notes}
              onChange={(e) => setEncounterForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <TextField
              label="Current Situation"
              value={encounterForm.current_situation}
              onChange={(e) => setEncounterForm((prev) => ({ ...prev, current_situation: e.target.value }))}
            />
            <TextField
              label="Follow-up Plan"
              value={encounterForm.follow_up_plan}
              onChange={(e) => setEncounterForm((prev) => ({ ...prev, follow_up_plan: e.target.value }))}
            />
            <TextField
              type="date"
              label="Encounter Date"
              InputLabelProps={{ shrink: true }}
              value={encounterForm.encounter_date}
              onChange={(e) => setEncounterForm((prev) => ({ ...prev, encounter_date: e.target.value }))}
            />
            <TextField
              type="date"
              label="Next Checkup Date"
              InputLabelProps={{ shrink: true }}
              value={encounterForm.next_checkup_date}
              onChange={(e) => setEncounterForm((prev) => ({ ...prev, next_checkup_date: e.target.value }))}
            />
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Prescriptions</Typography>
              <PrescriptionEditor prescriptions={prescriptions} setPrescriptions={setPrescriptions} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEncounterDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateEncounter} variant="contained" disabled={createEncounterMutation.isPending}>
            Save Encounter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
