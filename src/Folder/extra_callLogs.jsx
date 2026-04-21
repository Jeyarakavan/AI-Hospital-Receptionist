/**
 * High-performance, Premium AI Call Log Interface
 * This redesigned page provides a card-based live-feed of patient interactions.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Search,
  Phone,
  CalendarToday,
  PlayArrow,
  SmartToy,
  Warning,
  CheckCircle,
  AccountCircle,
} from '@mui/icons-material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';

const INTENT_COLORS = {
  booking: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  emergency: 'linear-gradient(135deg, #e11d48, #fb7185)',
  cancellation: 'linear-gradient(135deg, #64748b, #94a3b8)',
  inquiry: 'linear-gradient(135deg, #10b981, #34d399)',
  greeting: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
  unknown: 'linear-gradient(135deg, #cbd5e1, #e2e8f0)',
};

const CallCard = ({ log }) => {
  const gradient = INTENT_COLORS[log.intent] || INTENT_COLORS.unknown;
  
  return (
    <Paper sx={{
      p: 2.5, mb: 2, borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
        background: 'rgba(255,255,255,0.05)',
      }
    }}>
      {/* Intent color strip */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: gradient }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Phone />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                {log.caller_number || 'Internal Caller'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)' }}>
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Chip 
            label={log.intent?.toUpperCase() || 'UNKNOWN'} 
            size="small"
            icon={log.intent === 'emergency' ? <Warning sx={{ color: '#fff !important' }} /> : <SmartToy sx={{ color: '#fff !important' }} />}
            sx={{ 
              background: gradient, 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.05em'
            }} 
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 1.5, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.4 }}>
              " {log.response} "
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await callLogsAPI.getAll();
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    (l.caller_number || '').includes(search) || 
    (l.intent || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a1128 0%, #001f3f 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 0.5 }}>
              AI Receptionist Feed
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem' }}>
              Monitoring 24/7 patient interactions and assistant logs.
            </Typography>
          </Box>
          
          <TextField
            placeholder="Search by phone or intent..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ color: 'white', py: 5, textAlign: 'center' }}>Updating live feed...</Box>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, i) => (
            <CallCard key={i} log={log} />
          ))
        ) : (
          <Box sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.01)',
            borderRadius: '24px',
            border: '2px dashed rgba(255,255,255,0.05)'
          }}>
            <Phone sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>No logs found for this filter.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
/**
 * High-performance, Premium AI Call Log Interface
 * This redesigned page provides a card-based live-feed of patient interactions.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Search,
  Phone,
  CalendarToday,
  PlayArrow,
  SmartToy,
  Warning,
  CheckCircle,
  AccountCircle,
} from '@mui/icons-material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';

const INTENT_COLORS = {
  booking: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  emergency: 'linear-gradient(135deg, #e11d48, #fb7185)',
  cancellation: 'linear-gradient(135deg, #64748b, #94a3b8)',
  inquiry: 'linear-gradient(135deg, #10b981, #34d399)',
  greeting: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
  unknown: 'linear-gradient(135deg, #cbd5e1, #e2e8f0)',
};

const CallCard = ({ log }) => {
  const gradient = INTENT_COLORS[log.intent] || INTENT_COLORS.unknown;
  
  return (
    <Paper sx={{
      p: 2.5, mb: 2, borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
        background: 'rgba(255,255,255,0.05)',
      }
    }}>
      {/* Intent color strip */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: gradient }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Phone />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                {log.caller_number || 'Internal Caller'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)' }}>
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Chip 
            label={log.intent?.toUpperCase() || 'UNKNOWN'} 
            size="small"
            icon={log.intent === 'emergency' ? <Warning sx={{ color: '#fff !important' }} /> : <SmartToy sx={{ color: '#fff !important' }} />}
            sx={{ 
              background: gradient, 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.05em'
            }} 
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 1.5, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.4 }}>
              " {log.response} "
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await callLogsAPI.getAll();
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    (l.caller_number || '').includes(search) || 
    (l.intent || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a1128 0%, #001f3f 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 0.5 }}>
              AI Receptionist Feed
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem' }}>
              Monitoring 24/7 patient interactions and assistant logs.
            </Typography>
          </Box>
          
          <TextField
            placeholder="Search by phone or intent..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ color: 'white', py: 5, textAlign: 'center' }}>Updating live feed...</Box>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, i) => (
            <CallCard key={i} log={log} />
          ))
        ) : (
          <Box sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.01)',
            borderRadius: '24px',
            border: '2px dashed rgba(255,255,255,0.05)'
          }}>
            <Phone sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>No logs found for this filter.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
/**
 * High-performance, Premium AI Call Log Interface
 * This redesigned page provides a card-based live-feed of patient interactions.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Search,
  Phone,
  CalendarToday,
  PlayArrow,
  SmartToy,
  Warning,
  CheckCircle,
  AccountCircle,
} from '@mui/icons-material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';

const INTENT_COLORS = {
  booking: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  emergency: 'linear-gradient(135deg, #e11d48, #fb7185)',
  cancellation: 'linear-gradient(135deg, #64748b, #94a3b8)',
  inquiry: 'linear-gradient(135deg, #10b981, #34d399)',
  greeting: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
  unknown: 'linear-gradient(135deg, #cbd5e1, #e2e8f0)',
};

const CallCard = ({ log }) => {
  const gradient = INTENT_COLORS[log.intent] || INTENT_COLORS.unknown;
  
  return (
    <Paper sx={{
      p: 2.5, mb: 2, borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
        background: 'rgba(255,255,255,0.05)',
      }
    }}>
      {/* Intent color strip */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: gradient }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Phone />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                {log.caller_number || 'Internal Caller'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)' }}>
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Chip 
            label={log.intent?.toUpperCase() || 'UNKNOWN'} 
            size="small"
            icon={log.intent === 'emergency' ? <Warning sx={{ color: '#fff !important' }} /> : <SmartToy sx={{ color: '#fff !important' }} />}
            sx={{ 
              background: gradient, 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.05em'
            }} 
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 1.5, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.4 }}>
              " {log.response} "
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await callLogsAPI.getAll();
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    (l.caller_number || '').includes(search) || 
    (l.intent || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a1128 0%, #001f3f 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 0.5 }}>
              AI Receptionist Feed
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem' }}>
              Monitoring 24/7 patient interactions and assistant logs.
            </Typography>
          </Box>
          
          <TextField
            placeholder="Search by phone or intent..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ color: 'white', py: 5, textAlign: 'center' }}>Updating live feed...</Box>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, i) => (
            <CallCard key={i} log={log} />
          ))
        ) : (
          <Box sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.01)',
            borderRadius: '24px',
            border: '2px dashed rgba(255,255,255,0.05)'
          }}>
            <Phone sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>No logs found for this filter.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
/**
 * High-performance, Premium AI Call Log Interface
 * This redesigned page provides a card-based live-feed of patient interactions.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Search,
  Phone,
  CalendarToday,
  PlayArrow,
  SmartToy,
  Warning,
  CheckCircle,
  AccountCircle,
} from '@mui/icons-material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';

const INTENT_COLORS = {
  booking: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  emergency: 'linear-gradient(135deg, #e11d48, #fb7185)',
  cancellation: 'linear-gradient(135deg, #64748b, #94a3b8)',
  inquiry: 'linear-gradient(135deg, #10b981, #34d399)',
  greeting: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
  unknown: 'linear-gradient(135deg, #cbd5e1, #e2e8f0)',
};

const CallCard = ({ log }) => {
  const gradient = INTENT_COLORS[log.intent] || INTENT_COLORS.unknown;
  
  return (
    <Paper sx={{
      p: 2.5, mb: 2, borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
        background: 'rgba(255,255,255,0.05)',
      }
    }}>
      {/* Intent color strip */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: gradient }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Phone />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                {log.caller_number || 'Internal Caller'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)' }}>
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Chip 
            label={log.intent?.toUpperCase() || 'UNKNOWN'} 
            size="small"
            icon={log.intent === 'emergency' ? <Warning sx={{ color: '#fff !important' }} /> : <SmartToy sx={{ color: '#fff !important' }} />}
            sx={{ 
              background: gradient, 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.05em'
            }} 
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 1.5, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.4 }}>
              " {log.response} "
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await callLogsAPI.getAll();
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    (l.caller_number || '').includes(search) || 
    (l.intent || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a1128 0%, #001f3f 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 0.5 }}>
              AI Receptionist Feed
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem' }}>
              Monitoring 24/7 patient interactions and assistant logs.
            </Typography>
          </Box>
          
          <TextField
            placeholder="Search by phone or intent..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ color: 'white', py: 5, textAlign: 'center' }}>Updating live feed...</Box>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, i) => (
            <CallCard key={i} log={log} />
          ))
        ) : (
          <Box sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.01)',
            borderRadius: '24px',
            border: '2px dashed rgba(255,255,255,0.05)'
          }}>
            <Phone sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>No logs found for this filter.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
/**
 * High-performance, Premium AI Call Log Interface
 * This redesigned page provides a card-based live-feed of patient interactions.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Search,
  Phone,
  CalendarToday,
  PlayArrow,
  SmartToy,
  Warning,
  CheckCircle,
  AccountCircle,
} from '@mui/icons-material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';

const INTENT_COLORS = {
  booking: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  emergency: 'linear-gradient(135deg, #e11d48, #fb7185)',
  cancellation: 'linear-gradient(135deg, #64748b, #94a3b8)',
  inquiry: 'linear-gradient(135deg, #10b981, #34d399)',
  greeting: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
  unknown: 'linear-gradient(135deg, #cbd5e1, #e2e8f0)',
};

const CallCard = ({ log }) => {
  const gradient = INTENT_COLORS[log.intent] || INTENT_COLORS.unknown;
  
  return (
    <Paper sx={{
      p: 2.5, mb: 2, borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
        background: 'rgba(255,255,255,0.05)',
      }
    }}>
      {/* Intent color strip */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: gradient }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Phone />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                {log.caller_number || 'Internal Caller'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)' }}>
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Chip 
            label={log.intent?.toUpperCase() || 'UNKNOWN'} 
            size="small"
            icon={log.intent === 'emergency' ? <Warning sx={{ color: '#fff !important' }} /> : <SmartToy sx={{ color: '#fff !important' }} />}
            sx={{ 
              background: gradient, 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.05em'
            }} 
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 1.5, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.4 }}>
              " {log.response} "
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await callLogsAPI.getAll();
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    (l.caller_number || '').includes(search) || 
    (l.intent || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a1128 0%, #001f3f 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 0.5 }}>
              AI Receptionist Feed
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem' }}>
              Monitoring 24/7 patient interactions and assistant logs.
            </Typography>
          </Box>
          
          <TextField
            placeholder="Search by phone or intent..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ color: 'white', py: 5, textAlign: 'center' }}>Updating live feed...</Box>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, i) => (
            <CallCard key={i} log={log} />
          ))
        ) : (
          <Box sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.01)',
            borderRadius: '24px',
            border: '2px dashed rgba(255,255,255,0.05)'
          }}>
            <Phone sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>No logs found for this filter.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
/**
 * High-performance, Premium AI Call Log Interface
 * This redesigned page provides a card-based live-feed of patient interactions.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Search,
  Phone,
  CalendarToday,
  PlayArrow,
  SmartToy,
  Warning,
  CheckCircle,
  AccountCircle,
} from '@mui/icons-material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';

const INTENT_COLORS = {
  booking: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  emergency: 'linear-gradient(135deg, #e11d48, #fb7185)',
  cancellation: 'linear-gradient(135deg, #64748b, #94a3b8)',
  inquiry: 'linear-gradient(135deg, #10b981, #34d399)',
  greeting: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
  unknown: 'linear-gradient(135deg, #cbd5e1, #e2e8f0)',
};

const CallCard = ({ log }) => {
  const gradient = INTENT_COLORS[log.intent] || INTENT_COLORS.unknown;
  
  return (
    <Paper sx={{
      p: 2.5, mb: 2, borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
        background: 'rgba(255,255,255,0.05)',
      }
    }}>
      {/* Intent color strip */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: gradient }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Phone />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                {log.caller_number || 'Internal Caller'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)' }}>
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Chip 
            label={log.intent?.toUpperCase() || 'UNKNOWN'} 
            size="small"
            icon={log.intent === 'emergency' ? <Warning sx={{ color: '#fff !important' }} /> : <SmartToy sx={{ color: '#fff !important' }} />}
            sx={{ 
              background: gradient, 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.05em'
            }} 
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 1.5, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.4 }}>
              " {log.response} "
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await callLogsAPI.getAll();
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    (l.caller_number || '').includes(search) || 
    (l.intent || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a1128 0%, #001f3f 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 0.5 }}>
              AI Receptionist Feed
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem' }}>
              Monitoring 24/7 patient interactions and assistant logs.
            </Typography>
          </Box>
          
          <TextField
            placeholder="Search by phone or intent..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ color: 'white', py: 5, textAlign: 'center' }}>Updating live feed...</Box>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, i) => (
            <CallCard key={i} log={log} />
          ))
        ) : (
          <Box sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.01)',
            borderRadius: '24px',
            border: '2px dashed rgba(255,255,255,0.05)'
          }}>
            <Phone sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>No logs found for this filter.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
/**
 * High-performance, Premium AI Call Log Interface
 * This redesigned page provides a card-based live-feed of patient interactions.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Search,
  Phone,
  CalendarToday,
  PlayArrow,
  SmartToy,
  Warning,
  CheckCircle,
  AccountCircle,
} from '@mui/icons-material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';

const INTENT_COLORS = {
  booking: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  emergency: 'linear-gradient(135deg, #e11d48, #fb7185)',
  cancellation: 'linear-gradient(135deg, #64748b, #94a3b8)',
  inquiry: 'linear-gradient(135deg, #10b981, #34d399)',
  greeting: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
  unknown: 'linear-gradient(135deg, #cbd5e1, #e2e8f0)',
};

const CallCard = ({ log }) => {
  const gradient = INTENT_COLORS[log.intent] || INTENT_COLORS.unknown;
  
  return (
    <Paper sx={{
      p: 2.5, mb: 2, borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
        background: 'rgba(255,255,255,0.05)',
      }
    }}>
      {/* Intent color strip */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: gradient }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ background: gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Phone />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                {log.caller_number || 'Internal Caller'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)' }}>
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Chip 
            label={log.intent?.toUpperCase() || 'UNKNOWN'} 
            size="small"
            icon={log.intent === 'emergency' ? <Warning sx={{ color: '#fff !important' }} /> : <SmartToy sx={{ color: '#fff !important' }} />}
            sx={{ 
              background: gradient, 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.05em'
            }} 
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 1.5, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.4 }}>
              " {log.response} "
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await callLogsAPI.getAll();
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    (l.caller_number || '').includes(search) || 
    (l.intent || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 96px)',
      background: 'linear-gradient(135deg, #0a1128 0%, #001f3f 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 0.5 }}>
              AI Receptionist Feed
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem' }}>
              Monitoring 24/7 patient interactions and assistant logs.
            </Typography>
          </Box>
          
          <TextField
            placeholder="Search by phone or intent..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ color: 'white', py: 5, textAlign: 'center' }}>Updating live feed...</Box>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, i) => (
            <CallCard key={i} log={log} />
          ))
        ) : (
          <Box sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.01)',
            borderRadius: '24px',
            border: '2px dashed rgba(255,255,255,0.05)'
          }}>
            <Phone sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>No logs found for this filter.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
