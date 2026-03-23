import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Calendar, Phone, Settings, User, Ambulance, Menu, X, Users, BarChart3 } from 'lucide-react'
import useAuth from '../hooks/useAuth'

const Item = ({to, icon: Icon, children}) => (
  <NavLink to={to} className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-medical-primary text-white shadow-lg' : 'text-slate-700 hover:bg-slate-100'}`}>
    <Icon className="w-5 h-5" />
    <span className="font-medium">{children}</span>
  </NavLink>
)

export default function Sidebar(){
  const [open, setOpen] = React.useState(true)
  const { user, staffUser } = useAuth()
  
  // Determine if user is admin
  const userRole = staffUser?.staffType || user?.role || 'guest'
  const isAdmin = userRole === 'admin'

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={()=>setOpen(!open)}
        className="md:hidden fixed bottom-6 right-6 z-40 p-3 rounded-full bg-medical-primary text-white shadow-lg"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className={`${open ? 'block' : 'hidden'} fixed md:relative md:block w-56 md:w-64 bg-white border-r border-slate-200 h-screen md:h-auto overflow-y-auto z-30`}>
        <div className="p-4 space-y-2">
          <div className="px-4 py-3 mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menu</h3>
          </div>
          
          <Item to="/" icon={Home}>Dashboard</Item>
          <Item to="/appointments" icon={Calendar}>Appointments</Item>
          <Item to="/calls" icon={Phone}>Call Console</Item>
          <Item to="/ambulance" icon={Ambulance}>Emergency</Item>
          
          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="px-4 py-3 mt-6 mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Administration</h3>
              </div>
              <Item to="/staff" icon={Users}>Staff Management</Item>
              <Item to="/analytics" icon={BarChart3}>Analytics</Item>
              <Item to="/admin" icon={Settings}>Settings</Item>
            </>
          )}
          
          <Item to="/profile" icon={User}>Profile</Item>
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500 text-center">
            <div className="font-semibold">AI Hospital</div>
            <div className="capitalize">{userRole} • v1.0</div>
            <div className="text-health-green">● Active 24/7</div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-20"
          onClick={()=>setOpen(false)}
        ></div>
      )}
    </>
  )
}
