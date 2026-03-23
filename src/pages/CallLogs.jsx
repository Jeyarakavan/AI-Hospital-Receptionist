/**
 * Call Logs Page
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { callLogsAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function CallLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await callLogsAPI.getAll();
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load call logs');
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Call Logs
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Caller Number</TableCell>
              <TableCell>Intent</TableCell>
              <TableCell>Response</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>{log.caller_number}</TableCell>
                <TableCell>{log.intent}</TableCell>
                <TableCell>{log.response}</TableCell>
                <TableCell>{log.status}</TableCell>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
