import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CardActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, Person, MedicalServices, Event } from '@mui/icons-material';
import { format } from 'date-fns';

const AppointmentCard = ({ appointment, onEdit, onDelete }) => {
  const appointmentDate = new Date(appointment.appointment_date);
  const appointmentTime = appointment.appointment_time; // Assuming time is in 'HH:mm:ss' format

  // Combine date and time
  const [hours, minutes] = appointmentTime.split(':');
  appointmentDate.setHours(hours, minutes);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Person color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="bold">
            {appointment.patient_name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
          <MedicalServices fontSize="small" sx={{ mr: 1.5 }} />
          <Typography variant="body2">
            Dr. {appointment.doctor_name || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
          <Event fontSize="small" sx={{ mr: 1.5 }} />
          <Typography variant="body2">
            {format(appointmentDate, 'PPpp')}
          </Typography>
        </Box>
        <Chip label={appointment.patient_disease} sx={{ mt: 2 }} />
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="Edit Appointment">
          <IconButton onClick={onEdit} size="small">
            <Edit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Appointment">
          <IconButton onClick={onDelete} size="small">
            <Delete />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default AppointmentCard;
