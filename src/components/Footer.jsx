import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';

export default function Footer() {
  const hospitalName = 'AI Hospital Receptionist';

  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', mt: 'auto', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>{hospitalName}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Delivering excellence in healthcare with innovative technology and compassionate service.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Quick Links</Typography>
            <Link href="/appointments" color="inherit" underline="hover" display="block" variant="body2" sx={{ mb: 0.5 }}>Appointments</Link>
            <Link href="/profile" color="inherit" underline="hover" display="block" variant="body2" sx={{ mb: 0.5 }}>Profile</Link>
            <Link href="/news" color="inherit" underline="hover" display="block" variant="body2">News</Link>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Contact</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Built by Northernknights</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Advancing Healthcare Technology</Typography>
          </Grid>
        </Grid>
        <Typography variant="body2" sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} {hospitalName}. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
