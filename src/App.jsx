import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CircularProgress, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';

const Appointments = lazy(() => import('./pages/Appointments'));
const CallLogs = lazy(() => import('./pages/CallLogs'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const DoctorManagement = lazy(() => import('./pages/DoctorManagement'));
const AdminUserRegistration = lazy(() => import('./pages/AdminUserRegistration'));
const Profile = lazy(() => import('./pages/Profile'));
const Availability = lazy(() => import('./pages/Availability'));
const Settings = lazy(() => import('./pages/Settings'));
const Chat = lazy(() => import('./pages/Chat'));
const News = lazy(() => import('./pages/News'));
const Patients = lazy(() => import('./pages/Patients'));
const PatientDetails = lazy(() => import('./pages/PatientDetails'));
const AIChat = lazy(() => import('./pages/AIChat'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    primary: {
      main: '#0d9488',
    },
    secondary: {
      main: '#f97316',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

function AppLoader({ children }) {
  return (
    <Suspense
      fallback={(
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
          <CircularProgress />
        </Box>
      )}
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppLoader><Appointments /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/availability"
            element={
              <ProtectedRoute roles={['Admin', 'Doctor']}>
                <Layout>
                  <AppLoader><Availability /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/call-logs"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppLoader><CallLogs /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['Admin']}>
                <Layout>
                  <AppLoader><UserManagement /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-user"
            element={
              <ProtectedRoute roles={['Admin']}>
                <Layout>
                  <AppLoader><AdminUserRegistration /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppLoader><DoctorManagement /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppLoader><Profile /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={['Admin']}>
                <Layout>
                  <AppLoader><Settings /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppLoader><News /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppLoader><Chat /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute roles={['Admin', 'Doctor', 'Receptionist', 'Staff']}>
                <Layout>
                  <AppLoader><Patients /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute roles={['Admin', 'Doctor', 'Receptionist', 'Staff']}>
                <Layout>
                  <AppLoader><PatientDetails /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-terminal"
            element={
              <ProtectedRoute roles={['Admin', 'Receptionist']}>
                <Layout>
                  <AppLoader><AIChat /></AppLoader>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <AppLoader><ChangePassword /></AppLoader>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </ThemeProvider>
  );
}