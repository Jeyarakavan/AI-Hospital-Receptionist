import React from 'react';
import { Button } from '@mui/material';

export default function AnimatedButton({ children, ...props }) {
  return (
    <Button
      variant="contained"
      sx={{
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.05)' },
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
