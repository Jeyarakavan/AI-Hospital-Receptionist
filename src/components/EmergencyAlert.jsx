import React from 'react';
import { Alert, AlertTitle, Box, Button, Collapse, keyframes } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(211, 47, 47, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
  }
`;

const EmergencyAlert = () => {
  const { emergencyAlert: emergency, dismissEmergency: clearEmergency } = useSocket();

  return (
    <Collapse in={Boolean(emergency)}>
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          icon={<Warning fontSize="inherit" />}
          action={
            <Button color="inherit" size="small" onClick={clearEmergency}>
              DISMISS
            </Button>
          }
          sx={{
            animation: `${pulse} 2s infinite`,
            '.MuiAlert-icon': {
              fontSize: '2rem',
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 'bold' }}>Emergency Alert</AlertTitle>
          {emergency ? `Urgent call from ${emergency.caller_number}. Keyword: "${emergency.keyword}"` : ''}
        </Alert>
      </Box>
    </Collapse>
  );
};

export default EmergencyAlert;
