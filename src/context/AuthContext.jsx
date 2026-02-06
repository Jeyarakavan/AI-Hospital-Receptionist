import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChanged, signOut as firebaseSignOut } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('demo_user') || 'null')
    } catch (e) {
      return null
    }
  })

  const [staffUser, setStaffUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('staff_user') || 'null')
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem('demo_user', JSON.stringify(user))
    else localStorage.removeItem('demo_user')
  }, [user])

  useEffect(() => {
    if (staffUser) localStorage.setItem('staff_user', JSON.stringify(staffUser))
    else localStorage.removeItem('staff_user')
  }, [staffUser])

  useEffect(()=>{
    // If Firebase is configured, listen to auth state
    if(import.meta.env.VITE_FIREBASE_API_KEY){
      const unsub = onAuthChanged((fbUser)=>{
        if(fbUser){
          setUser({ name: fbUser.displayName || fbUser.email, uid: fbUser.uid, role: 'receptionist' })
        } else setUser(null)
      })
      return () => unsub()
    }
  },[])

  const signInDemo = (role = 'receptionist') => {
    const u = { name: 'Demo User', role }
    setUser(u)
    setStaffUser(null) // Clear staff login if switching to demo
  }

  const signOut = () => {
    if(import.meta.env.VITE_FIREBASE_API_KEY){
      firebaseSignOut().catch(()=>{})
    }
    setUser(null)
    setStaffUser(null)
    localStorage.removeItem('staff_token')
    localStorage.removeItem('staff_user')
  }

  return (
    <AuthContext.Provider value={{ user, staffUser, signInDemo, signOut, setUser, setStaffUser }}>{children}</AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}

export default AuthContext
