import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { Heart, Lock, Mail, User, Phone, ArrowRight, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import hospitalBanner from '../assets/hospital-banner.svg'

export default function Login(){
  const nav = useNavigate()
  const { signInDemo, setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [staffUsername, setStaffUsername] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [activeTab, setActiveTab] = useState('demo') // demo, email, gmail, staff
  const [isFlipped, setIsFlipped] = useState(false)
  const [staffLoading, setStaffLoading] = useState(false)

  const onDemo = (role)=>{
    signInDemo(role)
    setTimeout(()=> nav('/'), 100)
  }

  const handleEmailSign = async (e) => {
    e.preventDefault()
    if(!import.meta.env.VITE_FIREBASE_API_KEY){
      alert('Firebase not configured. Use demo sign-in.')
      return
    }
    try{
      const { signInWithEmail } = await import('../services/authService')
      const r = await signInWithEmail(email, password)
      setUser({ name: r.user.displayName || r.user.email, uid: r.user.uid })
      nav('/')
    } catch(e){ alert(e.message || 'Sign-in failed') }
  }

  const handleGoogle = async () => {
    if(!import.meta.env.VITE_FIREBASE_API_KEY){ alert('Firebase not configured. Use demo sign-in.'); return }
    try{
      const { signInWithGoogle } = await import('../services/authService')
      const r = await signInWithGoogle()
      setUser({ name: r.user.displayName || r.user.email, uid: r.user.uid })
      nav('/')
    }catch(e){ alert(e.message || 'Google sign-in failed') }
  }

  const handleStaffLogin = async (e) => {
    e.preventDefault()
    if(!staffUsername || !staffPassword) {
      toast.error('Please enter username and password')
      return
    }

    setStaffLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: staffUsername, password: staffPassword })
      })

      const data = await res.json()
      if(!res.ok) {
        toast.error(data.error || 'Login failed')
        return
      }

      // Store staff login data
      localStorage.setItem('staff_token', data.token)
      localStorage.setItem('staff_user', JSON.stringify(data.staff))
      
      toast.success(`Welcome, ${data.staff.firstName}!`)
      nav('/')
    } catch(e) {
      toast.error('Login failed: ' + e.message)
      console.error(e)
    } finally {
      setStaffLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-light flex flex-col">
      {/* Hospital Banner / Hero Section */}
      <div 
        className="relative bg-gradient-medical h-64 md:h-80 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url('${localStorage.getItem('hospital_banner') || hospitalBanner}')`
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/4 translate-y-1/4"></div>
        </div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-white z-10">
          {/* Logo / Hospital Icon */}
          <div className="mb-4 bg-white rounded-full p-4 shadow-lg animate-float">
            <Heart className="w-12 h-12 text-medical-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center">{localStorage.getItem('hospital_name') || 'AI Hospital Receptionist'}</h1>
          <p className="text-lg md:text-xl text-slate-100 mt-2">24/7 Intelligent Appointment Booking System</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Welcome Message */}
          <div className="text-center mb-8 animate-fadeIn">
            <h2 className="text-3xl font-bold text-medical-dark mb-2">Welcome Back</h2>
            <p className="text-slate-600">Sign in to manage appointments and patient care seamlessly</p>
          </div>

          {/* Login Card */}
          <div 
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${isFlipped ? 'shadow-3xl' : ''}`}
            style={{ perspective: '1200px' }}
          >
            <div className="p-8 md:p-12">
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
                <button
                  onClick={()=>setActiveTab('demo')}
                  className={`py-3 px-2 font-semibold transition-colors whitespace-nowrap ${activeTab==='demo' ? 'text-medical-primary border-b-2 border-medical-primary' : 'text-slate-600'}`}
                >
                  <User className="w-4 h-4 inline mr-2" /> Demo
                </button>
                <button
                  onClick={()=>setActiveTab('staff')}
                  className={`py-3 px-2 font-semibold transition-colors whitespace-nowrap ${activeTab==='staff' ? 'text-medical-primary border-b-2 border-medical-primary' : 'text-slate-600'}`}
                >
                  <Lock className="w-4 h-4 inline mr-2" /> Staff Login
                </button>
                <button
                  onClick={()=>setActiveTab('email')}
                  className={`py-3 px-2 font-semibold transition-colors whitespace-nowrap ${activeTab==='email' ? 'text-medical-primary border-b-2 border-medical-primary' : 'text-slate-600'}`}
                >
                  <Mail className="w-4 h-4 inline mr-2" /> Email
                </button>
                <button
                  onClick={()=>setActiveTab('gmail')}
                  className={`py-3 px-2 font-semibold transition-colors whitespace-nowrap ${activeTab==='gmail' ? 'text-medical-primary border-b-2 border-medical-primary' : 'text-slate-600'}`}
                >
                  <Phone className="w-4 h-4 inline mr-2" /> Google
                </button>
              </div>

              {/* Demo Sign-In Tab */}
              {activeTab === 'demo' && (
                <div className="space-y-3 animate-slideInLeft">
                  <p className="text-slate-600 mb-4">Choose a role to continue with demo account:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { role: 'receptionist', icon: '📞', label: 'Receptionist', desc: 'Manage calls & bookings' },
                      { role: 'doctor', icon: '👨‍⚕️', label: 'Doctor', desc: 'View appointments' },
                      { role: 'admin', icon: '⚙️', label: 'Admin', desc: 'Full system access' }
                    ].map(opt=> (
                      <button
                        key={opt.role}
                        onClick={()=>onDemo(opt.role)}
                        className="p-4 rounded-lg border-2 border-slate-200 hover:border-medical-primary hover:bg-medical-primary/10 transition-all group"
                      >
                        <div className="text-4xl mb-2">{opt.icon}</div>
                        <div className="font-semibold text-slate-900 group-hover:text-medical-primary">{opt.label}</div>
                        <div className="text-sm text-slate-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff Sign-In Tab */}
              {activeTab === 'staff' && (
                <form onSubmit={handleStaffLogin} className="space-y-4 animate-slideInLeft">
                  <p className="text-slate-600 mb-4">Login with your staff credentials</p>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-medical-primary" />
                      <input 
                        value={staffUsername} 
                        onChange={(e)=>setStaffUsername(e.target.value)} 
                        type="text"
                        placeholder="your.username" 
                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-medical-primary focus:outline-none transition-colors" 
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-medical-primary" />
                      <input 
                        value={staffPassword} 
                        type="password" 
                        onChange={(e)=>setStaffPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-medical-primary focus:outline-none transition-colors" 
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={staffLoading} className="w-full py-3 rounded-lg bg-gradient-medical text-white font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2 disabled:opacity-50">
                    {staffLoading && <Loader className="w-4 h-4 animate-spin" />}
                    {staffLoading ? 'Signing in...' : 'Staff Sign In'} {!staffLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <p className="text-xs text-slate-500 text-center mt-3">
                    Demo credentials: username=<strong>admin</strong> password=<strong>admin123</strong>
                  </p>
                </form>
              )}

              {/* Email Sign-In Tab */}
              {activeTab === 'email' && (
                <form onSubmit={handleEmailSign} className="space-y-4 animate-slideInLeft">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-medical-primary" />
                      <input 
                        value={email} 
                        onChange={(e)=>setEmail(e.target.value)} 
                        type="email"
                        placeholder="your@email.com" 
                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-medical-primary focus:outline-none transition-colors" 
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-medical-primary" />
                      <input 
                        value={password} 
                        type="password" 
                        onChange={(e)=>setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-medical-primary focus:outline-none transition-colors" 
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 rounded-lg bg-gradient-medical text-white font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Google Sign-In Tab */}
              {activeTab === 'gmail' && (
                <div className="space-y-4 animate-slideInLeft text-center">
                  <p className="text-slate-600 mb-4">Sign in securely with your Google account</p>
                  <button 
                    onClick={handleGoogle} 
                    className="w-full py-3 rounded-lg border-2 border-slate-300 text-slate-900 font-semibold hover:border-medical-primary hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg>
                    Continue with Google
                  </button>
                  <p className="text-xs text-slate-500 mt-4">Firebase authentication required</p>
                </div>
              )}

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-sm text-slate-500">OR</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* Footer Links */}
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-600">No account? <span className="text-medical-primary font-semibold cursor-pointer">Create one</span></p>
                <p className="text-xs text-slate-500">Use demo sign-in if authentication is not configured</p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { icon: '🔒', label: 'Secure', desc: 'HIPAA Compliant' },
              { icon: '⚡', label: 'Fast', desc: '24/7 Available' },
              { icon: '✅', label: 'Reliable', desc: 'AI + Human Support' }
            ].map((badge, i)=> (
              <div key={i} className="animate-slideInRight" style={{animationDelay: `${i*0.1}s`}}>
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="font-semibold text-slate-900">{badge.label}</div>
                <div className="text-sm text-slate-500">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
