import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Tabs, Tab, TextField, Button,
  Grid, CircularProgress, Switch, FormControlLabel,
} from '@mui/material';
import { Settings, Save, Refresh } from '@mui/icons-material';
import { siteSettingsAPI } from '../services/api';
import { toast } from 'react-toastify';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ p: 3 }}>{children}</Box> : null;
}

export default function AdminManage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name: '',
    footer_text: '',
    services_text: '',
    vision_text: '',
    mission_text: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await siteSettingsAPI.get();
      setSettings(res.data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setSettings((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await siteSettingsAPI.update(settings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings color="primary" />
        <Typography variant="h4" fontWeight="bold">Hospital Management</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure hospital branding, settings, and system preferences
      </Typography>

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Branding" />
          <Tab label="Content" />
          <Tab label="System" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Hospital Name" value={settings.site_name || ''} onChange={handleChange('site_name')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Footer Text" value={settings.footer_text || ''} onChange={handleChange('footer_text')} multiline rows={2} helperText="Use {year} for current year" />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Services Text" value={settings.services_text || ''} onChange={handleChange('services_text')} multiline rows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Vision Text" value={settings.vision_text || ''} onChange={handleChange('vision_text')} multiline rows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Mission Text" value={settings.mission_text || ''} onChange={handleChange('mission_text')} multiline rows={3} />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography variant="body2" color="text.secondary">
            System settings will be available in a future update.
          </Typography>
        </TabPanel>

        <Box sx={{ p: 3, display: 'flex', gap: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadSettings}>
            Reset
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
