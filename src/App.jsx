import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Preloader from './components/Preloader';

import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';

const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const CallLogs = React.lazy(() => import('./pages/CallLogs'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const DoctorManagement = React.lazy(() => import('./pages/DoctorManagement'));
const AdminUserRegistration = React.lazy(() => import('./pages/AdminUserRegistration'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Availability = React.lazy(() => import('./pages/Availability'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Landing = React.lazy(() => import('./pages/Landing'));
const News = React.lazy(() => import('./pages/News'));
const Ambulance = React.lazy(() => import('./pages/Ambulance'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const CallConsole = React.lazy(() => import('./pages/CallConsole'));
const StaffManagement = React.lazy(() => import('./pages/StaffManagement'));
const AdminManage = React.lazy(() => import('./pages/AdminManage'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32 }}>
          <h2>Something went wrong on this page.</h2>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Suspense fallback={<Preloader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute><Layout><Appointments /></Layout></ProtectedRoute>} />
              <Route path="/availability" element={<ProtectedRoute roles={['Admin','Doctor']}><Layout><Availability /></Layout></ProtectedRoute>} />
              <Route path="/call-logs" element={<ProtectedRoute><Layout><CallLogs /></Layout></ProtectedRoute>} />
              <Route path="/call-console" element={<ProtectedRoute roles={['Admin','Receptionist']}><Layout><CallConsole /></Layout></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute roles={['Admin']}><Layout><Analytics /></Layout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute roles={['Admin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute roles={['Admin']}>
                    <Layout>
                      <ErrorBoundary>
                        <StaffManagement />
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/register-user" element={<ProtectedRoute roles={['Admin']}><Layout><AdminUserRegistration /></Layout></ProtectedRoute>} />
              <Route path="/doctors" element={<ProtectedRoute><Layout><DoctorManagement /></Layout></ProtectedRoute>} />
              <Route path="/admin-manage" element={<ProtectedRoute roles={['Admin']}><Layout><AdminManage /></Layout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute roles={['Admin']}><Layout><Settings /></Layout></ProtectedRoute>} />
              <Route path="/news" element={<ProtectedRoute><Layout><News /></Layout></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
              <Route path="/ambulance" element={<ProtectedRoute><Layout><Ambulance /></Layout></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <ToastContainer position="top-right" autoClose={3000} />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
