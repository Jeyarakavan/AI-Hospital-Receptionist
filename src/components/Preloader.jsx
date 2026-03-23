import React from 'react';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Preloader = ({ message = "Loading..." }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'background.default',
        animation: `${fadeIn} 0.5s ease-in-out`,
      }}
    >
      <CircularProgress size={60} />
      <Typography
        variant="h6"
        sx={{ marginTop: 3, color: 'text.secondary' }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default Preloader;
