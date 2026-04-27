/**
 * Premium AI Chat Console - Browser-based AI receptionist testing
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Send,
  SmartToy,
  AccountCircle,
  Phone,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function AIChat() {
  const { user } = useAuth();
  const [callId] = useState(() => {
    const key = `ai_chat_call_id_${user?.id || 'guest'}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = `browser_session_${user?.id || 'guest'}_${Date.now()}`;
    localStorage.setItem(key, created);
    return created;
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('ai/chat-history/', { params: { call_id: callId, limit: 300 } });
        const history = res?.data?.history || [];
        const mapped = history
          .map((row) => {
            const role = row?.metadata?.role;
            if (role === 'user') return { role: 'user', content: row.input_data || '' };
            if (role === 'ai') return { role: 'ai', content: row.output_data || '' };
            return null;
          })
          .filter((m) => m && m.content);
        if (mapped.length > 0) {
          setMessages(mapped);
        } else {
          setMessages([
            { role: 'ai', content: "Hello! I'm your AI Hospital Receptionist. You can test my booking and triage logic here without needing a phone call. How can I help you today?" }
          ]);
        }
      } catch {
        setMessages([
          { role: 'ai', content: "Hello! I'm your AI Hospital Receptionist. You can test my booking and triage logic here without needing a phone call. How can I help you today?" }
        ]);
      } finally {
        setBootstrapped(true);
      }
    };
    loadHistory();
  }, [callId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Use the shared 'api' instance which has the VITE_API_BASE_URL and JWT token
      const res = await api.post('ai/call/', {
        text: userMsg,
        call_id: callId,
      });

      setMessages(prev => [...prev, { role: 'ai', content: res.data.response_text }]);
    } catch (err) {
      const errorText =
        err?.response?.data?.response_text ||
        err?.response?.data?.error ||
        "I'm sorry, I'm experiencing some connectivity issues with my core logic. Please ensure the backend is running and you are logged in.";
      setMessages(prev => [...prev, { role: 'ai', content: errorText }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: 4,
      p: 3,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48, boxShadow: '0 4px 12px rgba(99,179,237,0.3)' }}>
          <SmartToy />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 800 }}>AI Chat Console</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>Live NLP Reasoning Engine Testing</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{
        flexGrow: 1,
        mb: 2,
        p: 2,
        overflowY: 'auto',
        bgcolor: 'rgba(255,255,255,0.02)',
        borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }} ref={scrollRef}>
        {messages.map((m, i) => (
          <Box key={i} sx={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            display: 'flex',
            gap: 1.5,
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
          }}>
            <Avatar sx={{ 
              width: 32, height: 32, 
              bgcolor: m.role === 'user' ? 'primary.main' : 'secondary.main',
              fontSize: '0.8rem'
            }}>
              {m.role === 'user' ? <AccountCircle /> : <SmartToy />}
            </Avatar>
            <Paper sx={{
              p: 2,
              borderRadius: m.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
              bgcolor: m.role === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              boxShadow: m.role === 'user' ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
              border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}>
              <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                {m.content}
              </Typography>
            </Paper>
          </Box>
        ))}
        {loading && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', ml: 5 }}>AI is thinking...</Typography>
        )}
        {!bootstrapped && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', ml: 5 }}>Loading chat history...</Typography>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Type your message to test AI logic (e.g., 'Book an appointment' or 'I have chest pain')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: 3,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            }
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{
            width: 56, height: 56,
            bgcolor: 'primary.main',
            color: '#fff',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.15)' }
          }}
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
}
