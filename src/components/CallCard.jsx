import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { PhoneInTalk, TransferWithinAStation } from '@mui/icons-material';

const CallCard = ({ call, onTransfer }) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const startedAt = new Date(call.started_at);
    const timer = setInterval(() => {
      const now = new Date();
      setDuration(Math.floor((now - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [call.started_at]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {call.caller_number}
          </Typography>
          <Chip icon={<PhoneInTalk />} label={formatDuration(duration)} color="primary" size="small" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Intent: {call.intent || 'N/A'}
        </Typography>
        <LinearProgress variant="determinate" value={(duration % 60) * (100/60)} sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Take over call">
            <IconButton size="small" onClick={onTransfer}>
              <TransferWithinAStation />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CallCard;
