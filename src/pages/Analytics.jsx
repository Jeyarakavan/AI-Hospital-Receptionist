import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { BarChart3, TrendingUp, Users, Calendar, Phone, Activity, Download, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Analytics(){
  const [stats, setStats] = useState(null)
  const [period, setPeriod] = useState('month') // week, month, year
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      const [staffRes, appointmentsRes, callsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/staff-stats`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/calls`)
      ])

      const staffData = await staffRes.json()
      const appointmentsData = await appointmentsRes.json() || []
      const callsData = await callsRes.json() || []

      setStats({
        totalStaff: staffData.total || 0,
        totalAppointments: appointmentsData.length || 0,
        totalCalls: callsData.length || 0,
        staffBreakdown: staffData,
        appointmentsTrend: calculateTrend(appointmentsData),
        callsTrend: calculateTrend(callsData),
        avgCallDuration: calculateAvgCallDuration(callsData),
        appointmentCompletionRate: calculateCompletionRate(appointmentsData)
      })
    } catch(e) {
      toast.error('Failed to fetch analytics')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrend = (data) => {
    // Mock trend calculation - returns random percentage
    return Math.floor(Math.random() * 40) - 20
  }

  const calculateAvgCallDuration = (calls) => {
    if(!calls.length) return 0
    const total = calls.reduce((sum, c) => sum + (c.duration || 300), 0)
    return Math.floor(total / calls.length / 60) // in minutes
  }

  const calculateCompletionRate = (appointments) => {
    if(!appointments.length) return 0
    const completed = appointments.filter(a => a.status === 'completed').length
    return Math.round((completed / appointments.length) * 100)
  }

  const exportData = () => {
    const dataStr = JSON.stringify(stats, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    toast.success('Analytics exported')
  }

  if(loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-600">Loading analytics...</p>
        </div>
        <Footer />
      </div>
    )
  }

  const primaryColor = localStorage.getItem('primary_color') || '#0ea5a4'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                  <BarChart3 className="w-10 h-10" style={{color: primaryColor}} />
                  Analytics & Reports
                </h1>
                <p className="text-slate-600">Comprehensive hospital statistics and performance metrics</p>
              </div>
              <button 
                onClick={exportData}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>

            {/* Period Filter */}
            <div className="flex gap-2 mb-6">
              {['week', 'month', 'year'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    period === p
                      ? 'bg-medical-primary text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-medical-primary'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { 
                title: 'Total Staff', 
                value: stats?.totalStaff || 0, 
                icon: Users,
                trend: '+5%',
                color: 'from-blue-500 to-blue-600'
              },
              { 
                title: 'Appointments', 
                value: stats?.totalAppointments || 0, 
                icon: Calendar,
                trend: `${stats?.appointmentsTrend > 0 ? '+' : ''}${stats?.appointmentsTrend}%`,
                color: 'from-green-500 to-green-600'
              },
              { 
                title: 'Total Calls', 
                value: stats?.totalCalls || 0, 
                icon: Phone,
                trend: '+12%',
                color: 'from-purple-500 to-purple-600'
              },
              { 
                title: 'Avg Call Duration', 
                value: `${stats?.avgCallDuration}m`, 
                icon: Activity,
                trend: '-2min',
                color: 'from-orange-500 to-orange-600'
              }
            ].map((metric, i) => {
              const Icon = metric.icon
              return (
                <div key={i} className={`bg-gradient-to-br ${metric.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <Icon className="w-8 h-8 opacity-70" />
                    <span className={`text-xs font-bold px-2 py-1 rounded ${metric.trend.includes('-') ? 'bg-red-400/30 text-red-100' : 'bg-green-400/30 text-green-100'}`}>
                      {metric.trend}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm font-medium">{metric.title}</p>
                  <p className="text-3xl font-bold mt-2">{metric.value}</p>
                </div>
              )
            })}
          </div>

          {/* Staff Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Staff Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" style={{color: primaryColor}} />
                Staff Breakdown
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Doctors', value: stats?.staffBreakdown?.doctors || 0, color: 'bg-blue-500' },
                  { label: 'Nurses', value: stats?.staffBreakdown?.nurses || 0, color: 'bg-pink-500' },
                  { label: 'Receptionists', value: stats?.staffBreakdown?.receptionists || 0, color: 'bg-green-500' },
                  { label: 'Paramedics', value: stats?.staffBreakdown?.paramedics || 0, color: 'bg-orange-500' },
                  { label: 'Technicians', value: stats?.staffBreakdown?.technicians || 0, color: 'bg-purple-500' },
                  { label: 'Admin', value: stats?.staffBreakdown?.admin || 0, color: 'bg-red-500' }
                ].map((staff, i) => {
                  const maxValue = Math.max(...[
                    stats?.staffBreakdown?.doctors || 0,
                    stats?.staffBreakdown?.nurses || 0,
                    stats?.staffBreakdown?.receptionists || 0,
                    stats?.staffBreakdown?.paramedics || 0,
                    stats?.staffBreakdown?.technicians || 0,
                    stats?.staffBreakdown?.admin || 0
                  ])
                  const percentage = maxValue ? (staff.value / maxValue) * 100 : 0

                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">{staff.label}</span>
                        <span className="text-sm font-bold text-slate-800">{staff.value}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className={`${staff.color} h-2 rounded-full transition-all`} style={{width: `${percentage}%`}}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{color: primaryColor}} />
                Performance Metrics
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Appointment Completion Rate</span>
                    <span className="text-lg font-bold" style={{color: primaryColor}}>{stats?.appointmentCompletionRate || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-medical-primary to-health-green h-3 rounded-full transition-all" style={{width: `${stats?.appointmentCompletionRate || 0}%`}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">System Uptime</span>
                    <span className="text-lg font-bold text-health-green">99.8%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-health-green h-3 rounded-full" style={{width: '99.8%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Staff Availability</span>
                    <span className="text-lg font-bold text-health-green">92%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-health-green h-3 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Patient Satisfaction</span>
                    <span className="text-lg font-bold text-health-green">96%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-health-green h-3 rounded-full" style={{width: '96%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[
                { type: 'appointment', message: 'New appointment booked with Dr. Sarah', time: '2 hours ago', icon: '📅' },
                { type: 'call', message: 'Incoming call from patient registered', time: '4 hours ago', icon: '☎️' },
                { type: 'staff', message: 'Staff member joined the system', time: '1 day ago', icon: '👤' },
                { type: 'system', message: 'System backup completed successfully', time: '2 days ago', icon: '💾' }
              ].map((activity, i) => (
                <div key={i} className="flex gap-4 pb-3 border-b border-slate-200 last:border-b-0">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{activity.message}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
