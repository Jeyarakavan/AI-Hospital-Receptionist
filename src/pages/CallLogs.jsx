import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Collapse,
  IconButton,
  Chip,
  Skeleton,
} from '@mui/material';
import { Search, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const TranscriptViewer = ({ transcript }) => (
  <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
    {(Array.isArray(transcript) ? transcript : []).map((item, index) => (
      <Box key={index} sx={{ mb: 1.5 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 'bold' }}
        >
          {item.speaker === 'ai' ? 'AI Assistant' : 'Caller'}
        </Typography>
        <Typography variant="body2">{item.text}</Typography>
      </Box>
    ))}
  </Box>
);

const CallLogRow = ({ log }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{log.created_at || log.timestamp ? format(new Date(log.created_at || log.timestamp), 'PPpp') : 'N/A'}</TableCell>
        <TableCell>{log.caller_number || 'N/A'}</TableCell>
        <TableCell>{log.duration}s</TableCell>
        <TableCell>
          <Chip label={log.intent || 'N/A'} size="small" />
        </TableCell>
        <TableCell>
          <Chip
            label={log.outcome}
            size="small"
            color={
              log.outcome === 'completed' ? 'success' :
              log.outcome === 'human-transfer' ? 'warning' : 'default'
            }
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <TranscriptViewer transcript={log.transcript} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const CallLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await callLogsAPI.getAll();
        setLogs(data.logs || []);
      } catch (error) {
        toast.error('Failed to load call logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => {
    if (!log) return false;
    const q = filter.toLowerCase();
    return (
      (log.caller_number || '').toLowerCase().includes(q) ||
      (log.intent || '').toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Call History
        </Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by phone number or intent..."
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Date & Time</TableCell>
                <TableCell>Caller</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Intent</TableCell>
                <TableCell>Outcome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(rowsPerPage)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6}>
                      <Skeleton animation="wave" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log, i) => <CallLogRow key={log.call_sid || log._id || i} log={log} />)
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CallLogs;
