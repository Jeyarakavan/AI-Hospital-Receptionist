/**
 * Appointments Management Page - Enhanced UI
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
} from '@mui/material';
import { Edit, Delete, Check, Close, CalendarToday, Add } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { appointmentAPI, availabilityAPI, doctorAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

/* ─── Shared glass field style ─── */
const glassField = {
  '& .MuiInputBase-root': {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: '#f1f5f9',
    transition: 'border 0.25s, box-shadow 0.25s',
    '&:hover': { border: '1px solid rgba(99,179,237,0.45)' },
    '&.Mui-focused': { border: '1px solid #63b3ed', boxShadow: '0 0 0 3px rgba(99,179,237,0.13)' },
  },
  '& .MuiInputBase-input': { color: '#f1f5f9' },
  '& .MuiInputBase-inputMultiline': { color: '#f1f5f9' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#63b3ed' },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)' },
  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' },
};

const darkMenuProps = {
  PaperProps: {
    sx: {
      background: '#0d1f3c',
      border: '1px solid rgba(99,179,237,0.2)',
      borderRadius: '12px', mt: 0.5,
      '& .MuiMenuItem-root': {
        color: '#f1f5f9', fontSize: '0.875rem', borderRadius: '8px', mx: 0.5,
        '&:hover': { background: 'rgba(99,179,237,0.12)' },
        '&.Mui-selected': { background: 'rgba(99,179,237,0.18)' },
      },
    },
  },
};

/* ─── Status config ─── */
const STATUS = {
  Confirmed: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
  Pending:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)' },
  Cancelled: { color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.6,
      px: 1.4, py: 0.4, borderRadius: '8px',
      background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.color,
        animation: status === 'Pending' ? 'dot 1.8s ease-in-out infinite' : 'none',
        '@keyframes dot': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
      }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: s.color, letterSpacing: '0.04em' }}>
        {status}
      </Typography>
    </Box>
  );
};

/* ─── Table head cell ─── */
const TH = ({ children }) => (
  <TableCell sx={{
    color: 'rgba(255,255,255,0.38)', fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.07)', py: 1.5, px: 2,
    background: 'transparent',
  }}>
    {children}
  </TableCell>
);

/* ─── Table data cell ─── */
const TD = ({ children, sx = {} }) => (
  <TableCell sx={{
    color: '#e2e8f0', fontSize: '0.845rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1.5, px: 2,
    ...sx,
  }}>
    {children}
  </TableCell>
);

/* ─── Empty state ─── */
const EmptyState = () => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Box sx={{ fontSize: '3rem', mb: 2 }}>📅</Box>
    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
      No appointments found
    </Typography>
  </Box>
);

/* ─── Free slots ─── */
const SlotPill = ({ slot, selected, onClick }) => (
  <Box onClick={onClick} sx={{
    px: 1.5, py: 0.6, borderRadius: '8px', cursor: 'pointer',
    border: `1px solid ${selected ? '#63b3ed' : 'rgba(255,255,255,0.12)'}`,
    background: selected ? 'rgba(99,179,237,0.18)' : 'rgba(255,255,255,0.04)',
    color: selected ? '#63b3ed' : 'rgba(255,255,255,0.5)',
    fontSize: '0.78rem', fontWeight: selected ? 700 : 400,
    transition: 'all 0.2s',
    '&:hover': { border: '1px solid rgba(99,179,237,0.4)', color: '#63b3ed' },
  }}>
    {slot}
  </Box>
);

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [freeSlots, setFreeSlots] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [formData, setFormData] = useState({
    patient_name: '', patient_age: '', patient_disease: '',
    contact_number: '', address: '', doctor: '',
    appointment_date: dayjs(), appointment_time: dayjs(),
  });

  useEffect(() => { loadAppointments(); loadDoctors(); }, []);

  useEffect(() => {
    const { doctor, appointment_date } = formData;
    if (!doctor || !appointment_date) { setAvailability([]); return; }
    const load = async () => {
      try {
        const res = await availabilityAPI.getAll({ doctor });
        const allSlots = res.data.results || res.data || [];
        const dayName = appointment_date.format('dddd');
        setAvailability(allSlots.filter(s => s.is_available && s.day_display === dayName));
      } catch { setAvailability([]); }
    };
    load();
  }, [formData.doctor, formData.appointment_date]);

  useEffect(() => {
    const load = async () => {
      if (!formData.doctor || !formData.appointment_date) { setFreeSlots([]); return; }
      try {
        const res = await appointmentAPI.getAvailableSlots({
          doctor: formData.doctor,
          appointment_date: formData.appointment_date.format('YYYY-MM-DD'),
        });
        setFreeSlots((res.data || [])[0]?.available_slots || []);
      } catch { setFreeSlots([]); }
    };
    load();
  }, [formData.doctor, formData.appointment_date]);

  const loadAppointments = async () => {
    try {
      const res = await appointmentAPI.getAll();
      setAppointments(res.data.results || res.data || []);
    } catch { toast.error('Failed to load appointments'); }
  };

  const loadDoctors = async () => {
    try {
      const res = await doctorAPI.getAll();
      setDoctors(res.data.results || res.data || []);
    } catch { toast.error('Failed to load doctors'); }
  };

  const handleOpen = (appointment = null) => {
    if (appointment) {
      setEditing(appointment);
      setFormData({
        patient_name: appointment.patient_name,
        patient_age: appointment.patient_age,
        patient_disease: appointment.patient_disease,
        contact_number: appointment.contact_number,
        address: appointment.address,
        doctor: appointment.doctor,
        appointment_date: dayjs(appointment.appointment_date),
        appointment_time: dayjs(`${appointment.appointment_date}T${appointment.appointment_time}`),
      });
    } else {
      setEditing(null);
      setFormData({ patient_name: '', patient_age: '', patient_disease: '', contact_number: '', address: '', doctor: '', appointment_date: dayjs(), appointment_time: dayjs() });
    }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); };

  const handleSubmit = async () => {
    try {
      if (!availability.length) { toast.error('Doctor has no available slots for this day.'); return; }
      const selectedTime = formData.appointment_time.format('HH:mm:ss');
      if (freeSlots.length && !freeSlots.includes(selectedTime)) { toast.error('Selected time is already booked or unavailable.'); return; }
      const data = { ...formData, appointment_date: formData.appointment_date.format('YYYY-MM-DD'), appointment_time: formData.appointment_time.format('HH:mm:ss') };
      if (editing) { await appointmentAPI.update(editing.id, data); toast.success('Appointment updated'); }
      else { await appointmentAPI.create(data); toast.success('Appointment created'); }
      handleClose(); loadAppointments();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save appointment'); }
  };

  const handleAccept = async (id) => {
    try { await appointmentAPI.accept(id); toast.success('Appointment accepted'); loadAppointments(); }
    catch { toast.error('Failed to accept appointment'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try { await appointmentAPI.delete(id); toast.success('Appointment deleted'); loadAppointments(); }
    catch { toast.error('Failed to delete appointment'); }
  };

  const canEdit = (appt) =>
    user?.role === 'Admin' || user?.role === 'Receptionist' ||
    (user?.role === 'Doctor' && appt.doctor === user.id);

  const filtered = filterStatus === 'All'
    ? appointments
    : appointments.filter(a => a.status === filterStatus);

  const counts = ['All', 'Confirmed', 'Pending', 'Cancelled'].map(s => ({
    label: s,
    count: s === 'All' ? appointments.length : appointments.filter(a => a.status === s).length,
  }));

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 50%, #071422 100%)',
      fontFamily: "'Sora','Nunito',sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <Box sx={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 70%)', top: '-15%', right: '-8%', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(129,140,248,0.05) 0%,transparent 70%)', bottom: '-10%', left: '-6%', pointerEvents: 'none' }} />

      <Container maxWidth="xl" sx={{ py: 5, position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4,
          animation: 'fadeDown 0.5s ease both',
          '@keyframes fadeDown': { from: { opacity: 0, transform: 'translateY(-14px)' }, to: { opacity: 1, transform: 'none' } },
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#38bdf8,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarToday sx={{ fontSize: 18, color: '#fff' }} />
              </Box>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>
                Appointments
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', ml: 6.5 }}>
              {appointments.length} total · {dayjs().format('dddd, MMMM D')}
            </Typography>
          </Box>
          {(user?.role === 'Admin' || user?.role === 'Receptionist') && (
            <Button onClick={() => handleOpen()} startIcon={<Add />}
              sx={{
                px: 2.5, py: 1.2, borderRadius: '12px', textTransform: 'none',
                fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
                background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
                color: '#fff', boxShadow: '0 4px 18px rgba(56,189,248,0.3)',
                transition: 'all 0.25s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 28px rgba(56,189,248,0.4)' },
              }}>
              New Appointment
            </Button>
          )}
        </Box>

        {/* ── Filter tabs ── */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap',
          animation: 'fadeIn 0.5s ease 0.1s both',
          '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
        }}>
          {counts.map(({ label, count }) => {
            const active = filterStatus === label;
            const dot = STATUS[label];
            return (
              <Box key={label} onClick={() => setFilterStatus(label)} sx={{
                px: 2, py: 0.8, borderRadius: '10px', cursor: 'pointer',
                border: `1px solid ${active ? (dot?.border || 'rgba(99,179,237,0.4)') : 'rgba(255,255,255,0.08)'}`,
                background: active ? (dot?.bg || 'rgba(99,179,237,0.1)') : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 1,
                '&:hover': { border: `1px solid ${dot?.border || 'rgba(99,179,237,0.3)'}` },
              }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: active ? (dot?.color || '#63b3ed') : 'rgba(255,255,255,0.45)' }}>
                  {label}
                </Typography>
                <Box sx={{ px: 0.8, py: 0.1, borderRadius: '6px', background: active ? (dot?.bg || 'rgba(99,179,237,0.18)') : 'rgba(255,255,255,0.06)' }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: active ? (dot?.color || '#63b3ed') : 'rgba(255,255,255,0.3)' }}>
                    {count}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ── Table ── */}
        <Box sx={{
          borderRadius: '20px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.035)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          animation: 'cardIn 0.55s cubic-bezier(.22,1,.36,1) 0.12s both',
          '@keyframes cardIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'none' } },
        }}>
          <TableContainer sx={{ background: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { background: 'rgba(255,255,255,0.025)' } }}>
                  <TH>Patient</TH>
                  <TH>Age</TH>
                  <TH>Condition</TH>
                  <TH>Doctor</TH>
                  <TH>Date</TH>
                  <TH>Time</TH>
                  <TH>Status</TH>
                  <TH>Actions</TH>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ border: 'none', p: 0 }}>
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((appt, idx) => (
                    <TableRow key={appt.id} sx={{
                      transition: 'background 0.18s',
                      animation: `rowIn 0.4s ease ${idx * 0.04}s both`,
                      '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'none' } },
                      '&:hover': { background: 'rgba(99,179,237,0.04)' },
                      '& td:first-of-type': { borderLeft: '3px solid transparent' },
                      ...(appt.status === 'Confirmed' && { '& td:first-of-type': { borderLeft: '3px solid #34d399' } }),
                      ...(appt.status === 'Pending' && { '& td:first-of-type': { borderLeft: '3px solid #fbbf24' } }),
                      ...(appt.status === 'Cancelled' && { '& td:first-of-type': { borderLeft: '3px solid #fb7185' } }),
                    }}>
                      <TD>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 32, height: 32, borderRadius: '9px', flexShrink: 0,
                            background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                          }}>
                            {appt.patient_name?.[0]?.toUpperCase()}
                          </Box>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                            {appt.patient_name}
                          </Typography>
                        </Box>
                      </TD>
                      <TD sx={{ color: 'rgba(255,255,255,0.55)' }}>{appt.patient_age}</TD>
                      <TD>
                        <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {appt.patient_disease}
                        </Typography>
                      </TD>
                      <TD>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg,#38bdf8,#818cf8)', flexShrink: 0 }} />
                          <Typography sx={{ fontSize: '0.83rem', color: '#94a3b8' }}>{appt.doctor_name}</Typography>
                        </Box>
                      </TD>
                      <TD>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <CalendarToday sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                          <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                            {dayjs(appt.appointment_date).format('MMM D, YYYY')}
                          </Typography>
                        </Box>
                      </TD>
                      <TD>
                        <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                          {appt.appointment_time?.slice(0, 5)}
                        </Typography>
                      </TD>
                      <TD><StatusBadge status={appt.status} /></TD>
                      <TD>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {user?.role === 'Doctor' && appt.status === 'Pending' && (<>
                            <IconButton size="small" onClick={() => handleAccept(appt.id)} sx={{ width: 30, height: 30, borderRadius: '8px', background: 'rgba(52,211,153,0.12)', color: '#34d399', '&:hover': { background: 'rgba(52,211,153,0.22)' } }}>
                              <Check sx={{ fontSize: 15 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(appt.id)} sx={{ width: 30, height: 30, borderRadius: '8px', background: 'rgba(251,113,133,0.12)', color: '#fb7185', '&:hover': { background: 'rgba(251,113,133,0.22)' } }}>
                              <Close sx={{ fontSize: 15 }} />
                            </IconButton>
                          </>)}
                          {canEdit(appt) && (<>
                            <IconButton size="small" onClick={() => handleOpen(appt)} sx={{ width: 30, height: 30, borderRadius: '8px', background: 'rgba(99,179,237,0.1)', color: '#63b3ed', '&:hover': { background: 'rgba(99,179,237,0.22)' } }}>
                              <Edit sx={{ fontSize: 15 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(appt.id)} sx={{ width: 30, height: 30, borderRadius: '8px', background: 'rgba(251,113,133,0.1)', color: '#fb7185', '&:hover': { background: 'rgba(251,113,133,0.22)' } }}>
                              <Delete sx={{ fontSize: 15 }} />
                            </IconButton>
                          </>)}
                        </Box>
                      </TD>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>

      {/* ── Dialog ── */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            background: '#0d1f3c',
            border: '1px solid rgba(99,179,237,0.18)',
            borderRadius: '22px', color: '#f1f5f9',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          },
        }}>

        {/* Dialog top bar */}
        <Box sx={{ px: 3.5, pt: 3.5, pb: 0, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#38bdf8,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarToday sx={{ fontSize: 17, color: '#fff' }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9' }}>
                {editing ? 'Edit Appointment' : 'New Appointment'}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                {editing ? 'Update appointment details' : 'Fill in the patient details below'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ px: 3.5, py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Section: Patient */}
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#63b3ed', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              👤 Patient Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Patient Name" value={formData.patient_name} onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })} fullWidth required sx={glassField} />
              <TextField label="Age" type="number" value={formData.patient_age} onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })} fullWidth required sx={glassField} />
            </Box>
            <TextField label="Disease / Problem" multiline rows={2} value={formData.patient_disease} onChange={(e) => setFormData({ ...formData, patient_disease: e.target.value })} fullWidth required sx={glassField} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Contact Number" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} fullWidth required sx={glassField} />
              <TextField label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} fullWidth required sx={glassField} />
            </Box>

            {/* Section: Scheduling */}
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#63b3ed', letterSpacing: '0.1em', textTransform: 'uppercase', mt: 0.5 }}>
              📅 Scheduling
            </Typography>
            <TextField select label="Select Doctor" value={formData.doctor} onChange={(e) => setFormData({ ...formData, doctor: e.target.value })} fullWidth required sx={glassField} SelectProps={{ MenuProps: darkMenuProps }}>
              {doctors.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  🩺 {d.user?.full_name} — {d.specialization}
                </MenuItem>
              ))}
            </TextField>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <DatePicker label="Appointment Date" value={formData.appointment_date}
                  onChange={(v) => setFormData({ ...formData, appointment_date: v })}
                  slotProps={{ textField: { fullWidth: true, required: true, sx: glassField } }} />
                <TimePicker label="Appointment Time" value={formData.appointment_time}
                  onChange={(v) => setFormData({ ...formData, appointment_time: v })}
                  slotProps={{ textField: { fullWidth: true, required: true, sx: glassField } }} />
              </Box>
            </LocalizationProvider>

            {/* Free slots */}
            {!!freeSlots.length && (
              <Box>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', mb: 1 }}>
                  Available slots for this day:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {freeSlots.map(slot => (
                    <SlotPill key={slot} slot={slot}
                      selected={formData.appointment_time?.format('HH:mm:ss') === slot}
                      onClick={() => setFormData({ ...formData, appointment_time: dayjs(`2000-01-01T${slot}`) })} />
                  ))}
                </Box>
              </Box>
            )}

            {/* No availability warning */}
            {formData.doctor && formData.appointment_date && !availability.length && (
              <Box sx={{ px: 2, py: 1.5, borderRadius: '12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box sx={{ fontSize: '1rem', mt: 0.1 }}>⚠️</Box>
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(251,191,36,0.9)' }}>
                  This doctor has no available slots for the selected day.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3.5, pb: 3, pt: 0, gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none', borderRadius: '10px', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}
            sx={{
              px: 3, py: 1, borderRadius: '10px', textTransform: 'none',
              fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
              background: 'linear-gradient(135deg,#38bdf8,#818cf8)', color: '#fff',
              boxShadow: '0 4px 16px rgba(56,189,248,0.3)',
              '&:hover': { opacity: 0.9 },
            }}>
            {editing ? 'Update Appointment' : 'Create Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}