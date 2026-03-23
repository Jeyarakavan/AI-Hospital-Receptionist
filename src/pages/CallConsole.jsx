import React from 'react';
import {
  Box, Container, Typography, Paper, Button, Grid,
} from '@mui/material';
import { Phone } from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import CallCard from '../components/CallCard';
import { callAIAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function CallConsole() {
  const { activeCalls } = useSocket();

  const handleSimulate = async () => {
    try {
      await callAIAPI.simulateCall();
      toast.success('Simulated incoming call');
    } catch {
      toast.error('Failed to simulate call');
    }
  };

  const handleTransfer = async (callSid) => {
    try {
      await callAIAPI.transferCall(callSid);
      toast.success('Call transferred');
    } catch {
      toast.error('Failed to transfer call');
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Call Console</Typography>
        <Button variant="contained" startIcon={<Phone />} onClick={handleSimulate}>
          Simulate Incoming Call
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Use the simulate button to test Twilio webhook during development.
      </Typography>

      <Grid container spacing={3}>
        {activeCalls && activeCalls.length > 0 ? (
          activeCalls.map((call) => (
            <Grid item xs={12} md={6} key={call.id || call.call_sid}>
              <CallCard call={call} onTransfer={() => handleTransfer(call.call_sid || call.id)} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Phone sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No active calls</Typography>
              <Typography variant="body2" color="text.secondary">
                Incoming calls will appear here in real time.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
