import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { Heart, LogOut, Menu, Settings, User as UserIcon, UserPlus } from 'lucide-react'

export default function Navbar(){
  const { user, staffUser, signOut } = useAuth()
  const nav = useNavigate()
  const [menuOpen, setMenuOpen] = React.useState(false)

  // Use staffUser if logged in as staff, otherwise use regular user
  const currentUser = staffUser || user
  const displayName = staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : (user?.name || 'Guest')
  const displayRole = staffUser ? staffUser.staffType : (user?.role || 'demo')
  const isAdmin = user?.role === 'Admin'

  const onSignOut = () => {
    signOut()
    nav('/login')
  }

  // Hospital branding from localStorage or defaults
  const hospitalLogo = localStorage.getItem('hospital_logo') || null
  const hospitalName = localStorage.getItem('hospital_name') || 'AI Hospital Receptionist'

  return (
    <nav className="bg-gradient-medical shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Logo & Hospital Name */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {hospitalLogo ? (
            <img src={hospitalLogo} alt="Hospital" className="h-12 w-12 rounded-full object-cover border-2 border-white" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
              <Heart className="w-6 h-6 text-medical-primary" />
            </div>
          )}
          <div className="hidden sm:block">
            <div className="text-lg font-bold text-white">{hospitalName}</div>
            <div className="text-xs text-slate-100">24/7 Receptionist</div>
          </div>
        </Link>

        {/* Right: User Info & Menu */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="hidden md:flex items-center gap-2 text-white">
            <UserIcon className="w-4 h-4" />
            <div className="text-sm">
              <div className="font-semibold">{displayName}</div>
              <div className="text-xs text-slate-200 capitalize">{displayRole}</div>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-2">
            {isAdmin && (
              <Link to="/register-user" className="px-3 py-2 text-white hover:bg-white/20 rounded transition-colors text-sm flex items-center gap-1" title="Register new user">
                <UserPlus className="w-4 h-4" /> Register User
              </Link>
            )}
            <Link to="/profile" className="px-3 py-2 text-white hover:bg-white/20 rounded transition-colors text-sm">Profile</Link>
            <button onClick={onSignOut} className="px-3 py-2 flex items-center gap-1 text-white hover:bg-red-500 rounded transition-colors text-sm">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={()=>setMenuOpen(!menuOpen)}
            className="lg:hidden text-white hover:bg-white/20 p-2 rounded transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-medical-secondary border-t border-white/20 p-4 space-y-2">
          <div className="text-white text-sm mb-3">
            <div className="font-semibold">{displayName}</div>
            <div className="text-xs text-slate-300 capitalize">{displayRole}</div>
          </div>
          {isAdmin && (
            <Link to="/register-user" className="block px-3 py-2 text-white hover:bg-white/20 rounded transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Register User
            </Link>
          )}
          <Link to="/profile" className="block px-3 py-2 text-white hover:bg-white/20 rounded transition-colors">Profile</Link>
          <button onClick={onSignOut} className="w-full text-left px-3 py-2 text-white hover:bg-red-500 rounded transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
