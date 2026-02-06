import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Preloader from './components/Preloader'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import CallConsole from './pages/CallConsole'
import AdminManage from './pages/AdminManage'
import StaffManagement from './pages/StaffManagement'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Ambulance from './pages/Ambulance'
import ProtectedRoute from './routes/ProtectedRoute'

export default function App(){
  return (
    <Suspense fallback={<Preloader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/calls" element={<ProtectedRoute><CallConsole /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminManage /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute roles={["admin"]}><StaffManagement /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={["admin"]}><Analytics /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/ambulance" element={<ProtectedRoute><Ambulance /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}