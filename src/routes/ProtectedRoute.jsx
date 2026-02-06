import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute({children, roles}){
  const {user, staffUser} = useAuth()
  
  // Check if user is logged in (either demo or staff)
  const isAuthenticated = user || staffUser
  if(!isAuthenticated) return <Navigate to="/login" replace />
  
  // Check roles if specified
  if(roles) {
    const userRole = staffUser?.staffType || user?.role
    if(!roles.includes(userRole)) return <Navigate to="/" replace />
  }
  
  return children
}
