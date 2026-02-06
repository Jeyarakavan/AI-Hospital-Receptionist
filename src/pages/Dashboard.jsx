import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import useAuth from '../hooks/useAuth'
import { Calendar, Phone, Users, Heart, Clock, CheckCircle, AlertCircle, Briefcase, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard(){
  const { staffUser, user } = useAuth()
  const currentUser = staffUser || user
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Use staff type to determine which dashboard to show
  const staffType = staffUser?.staffType || currentUser?.role

  useEffect(()=>{
    fetchStats()
  },[])

  async function fetchStats() {
    try {
      const [appts, calls, docs, staffStats] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments`).then(r=>r.json()).catch(()=>[]),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/calls`).then(r=>r.json()).catch(()=>[]),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/doctors`).then(r=>r.json()).catch(()=>[]),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/staff-stats`).then(r=>r.json()).catch(()=>({}))
      ])
      setStats({ 
        appointments: appts?.length || 0, 
        calls: calls?.length || 0, 
        doctors: docs?.length || 0,
        staffStats 
      })
    } catch(e) {
      console.error('Stats fetch failed', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loader className="w-8 h-8 text-medical-primary animate-spin" />
            </div>
          ) : staffType === 'doctor' ? (
            <DoctorDashboard stats={stats} />
          ) : staffType === 'nurse' ? (
            <NurseDashboard stats={stats} />
          ) : staffType === 'receptionist' ? (
            <ReceptionistDashboard stats={stats} />
          ) : staffType === 'admin' ? (
            <AdminDashboard stats={stats} />
          ) : (
            <GenericDashboard stats={stats} user={currentUser} />
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}

function DoctorDashboard({ stats }) {
  return (
    <div className="container-medical py-8">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">Doctor Dashboard</h1>
      <p className="text-slate-600 mb-8">Manage your appointments and patient care</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Calendar, label: 'Appointments Today', value: stats?.appointments || 0, color: 'from-blue-500' },
          { icon: Users, label: 'Total Patients', value: 24, color: 'from-green-500' },
          { icon: Clock, label: 'Next Appointment', value: 'In 2h', color: 'from-purple-500' }
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${card.color} to-opacity-90 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-semibold text-sm">{card.label}</p>
                  <p className="text-3xl font-bold mt-3">{card.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Today's Appointments</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-l-4 border-medical-primary pl-4 py-3 bg-slate-50 rounded flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-800">Patient {i}</p>
                <p className="text-sm text-slate-600">10:{20 + i*30} AM • Checkup</p>
              </div>
              <span className="px-3 py-1 bg-health-green bg-opacity-20 text-health-green text-sm font-semibold rounded-full">Scheduled</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NurseDashboard({ stats }) {
  return (
    <div className="container-medical py-8">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">Nurse Dashboard</h1>
      <p className="text-slate-600 mb-8">Track patient care activities and tasks</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Heart, label: 'Patients Under Care', value: 8, color: 'from-pink-500' },
          { icon: CheckCircle, label: 'Tasks Completed', value: 12, color: 'from-green-500' },
          { icon: Clock, label: 'Pending Tasks', value: 5, color: 'from-amber-500' }
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${card.color} to-opacity-90 rounded-xl p-6 text-white shadow-lg`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-semibold text-sm">{card.label}</p>
                  <p className="text-3xl font-bold mt-3">{card.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Daily Care Tasks</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded">
              <CheckCircle className="w-5 h-5 text-health-green" />
              <span className="flex-1 text-slate-700">Patient {i} - Vital signs check</span>
              <span className="text-xs text-slate-500">10:{i*10} AM</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReceptionistDashboard({ stats }) {
  return (
    <div className="container-medical py-8">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">Receptionist Dashboard</h1>
      <p className="text-slate-600 mb-8">Manage appointments and incoming calls</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Calendar, label: 'Today\'s Appointments', value: stats?.appointments || 0, color: 'from-cyan-500' },
          { icon: Phone, label: 'Incoming Calls', value: 5, color: 'from-blue-500' },
          { icon: AlertCircle, label: 'Pending Confirmations', value: 3, color: 'from-orange-500' }
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${card.color} to-opacity-90 rounded-xl p-6 text-white shadow-lg`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-semibold text-sm">{card.label}</p>
                  <p className="text-3xl font-bold mt-3">{card.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button className="btn-primary py-3 flex items-center justify-center gap-2">
            <Users className="w-5 h-5" /> Book New Appointment
          </button>
          <button className="btn-secondary py-3 flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" /> Answer Call
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ stats }) {
  return (
    <div className="container-medical py-8">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
      <p className="text-slate-600 mb-8">Hospital system management and oversight</p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { icon: Users, label: 'Total Staff', value: stats?.staffStats?.total || 0, color: 'from-blue-500' },
          { icon: Briefcase, label: 'Doctors', value: stats?.staffStats?.doctors || 0, color: 'from-green-500' },
          { icon: Heart, label: 'Nurses', value: stats?.staffStats?.nurses || 0, color: 'from-pink-500' },
          { icon: Calendar, label: 'Appointments', value: stats?.appointments || 0, color: 'from-amber-500' }
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${card.color} to-opacity-90 rounded-xl p-6 text-white shadow-lg`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-semibold text-sm">{card.label}</p>
                  <p className="text-3xl font-bold mt-3">{card.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Administration Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a href="/staff" className="btn-primary py-3 text-center">Manage Staff</a>
          <button className="btn-secondary py-3">View Reports</button>
          <button className="btn-outline py-3">System Settings</button>
        </div>
      </div>
    </div>
  )
}

function GenericDashboard({ stats, user }) {
  return (
    <div className="container-medical py-8">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">Welcome to Dashboard</h1>
      <p className="text-slate-600 mb-8">Hospital Receptionist System</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Calendar, label: 'Appointments', value: stats?.appointments || 0, color: 'from-blue-500' },
          { icon: Phone, label: 'Calls', value: stats?.calls || 0, color: 'from-red-500' },
          { icon: Users, label: 'Doctors', value: stats?.doctors || 0, color: 'from-green-500' }
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${card.color} to-opacity-90 rounded-xl p-6 text-white shadow-lg`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-semibold text-sm">{card.label}</p>
                  <p className="text-3xl font-bold mt-3">{card.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

