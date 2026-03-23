import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { Settings, Image, Building2, Save, RotateCcw, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import hospitalLogo from '../assets/hospital-logo.svg'
import hospitalBanner from '../assets/hospital-banner.svg'

export default function AdminManage(){
  const [activeTab, setActiveTab] = useState('branding')
  const [loading, setLoading] = useState(false)

  // Branding State
  const [hospitalName, setHospitalName] = useState(() => localStorage.getItem('hospital_name') || 'AI Hospital Receptionist')
  const [hospitalLogoState, setHospitalLogoState] = useState(() => localStorage.getItem('hospital_logo') || hospitalLogo)
  const [hospitalBannerState, setHospitalBannerState] = useState(() => localStorage.getItem('hospital_banner') || hospitalBanner)
  const [hospitalMission, setHospitalMission] = useState(() => localStorage.getItem('hospital_mission') || 'Providing compassionate and professional healthcare services with advanced technology integration.')
  const [hospitalVision, setHospitalVision] = useState(() => localStorage.getItem('hospital_vision') || 'To be a leading healthcare institution delivering excellence in patient care through innovation and dedication.')
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('primary_color') || '#0ea5a4')
  const [secondaryColor, setSecondaryColor] = useState(() => localStorage.getItem('secondary_color') || '#0369a1')

  // Original values for reset
  const [originalValues] = useState({
    hospitalName,
    hospitalLogoState,
    hospitalBannerState,
    hospitalMission,
    hospitalVision,
    primaryColor,
    secondaryColor
  })

  // Save Branding
  const saveBranding = async () => {
    setLoading(true)
    try {
      localStorage.setItem('hospital_name', hospitalName)
      localStorage.setItem('hospital_logo', hospitalLogoState)
      localStorage.setItem('hospital_banner', hospitalBannerState)
      localStorage.setItem('hospital_mission', hospitalMission)
      localStorage.setItem('hospital_vision', hospitalVision)
      localStorage.setItem('primary_color', primaryColor)
      localStorage.setItem('secondary_color', secondaryColor)
      
      toast.success('Hospital branding updated successfully!')
      // Reload to reflect changes
      setTimeout(() => window.location.reload(), 500)
    } catch(e) {
      toast.error('Failed to save branding')
    } finally {
      setLoading(false)
    }
  }

  // Reset to Original
  const resetBranding = () => {
    if(confirm('Reset all settings to defaults?')) {
      setHospitalName(originalValues.hospitalName)
      setHospitalLogoState(originalValues.hospitalLogoState)
      setHospitalBannerState(originalValues.hospitalBannerState)
      setHospitalMission(originalValues.hospitalMission)
      setHospitalVision(originalValues.hospitalVision)
      setPrimaryColor(originalValues.primaryColor)
      setSecondaryColor(originalValues.secondaryColor)
      toast.success('Settings reset')
    }
  }

  // Handle Logo Upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if(file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setHospitalLogoState(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Banner Upload
  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0]
    if(file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setHospitalBannerState(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-medical-primary" />
              Hospital Management
            </h1>
            <p className="text-slate-600">Configure hospital branding, settings, and system preferences</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
            <div className="flex border-b border-slate-200">
              {[
                { id: 'branding', label: '🏥 Branding', icon: Building2 },
                { id: 'colors', label: '🎨 Colors', icon: Image },
                { id: 'system', label: '⚙️ System', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-medical-primary border-b-2 border-medical-primary'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* Hospital Name */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-medical-primary" />
                  Hospital Name
                </h2>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Hospital Name / Institution Name</label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g., City Medical Center"
                    className="input-medical w-full"
                  />
                  <p className="text-xs text-slate-500 mt-2">This name will appear in header and navbar</p>
                </div>
              </div>

              {/* Mission Statement */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-medical-primary" />
                  Hospital Mission
                </h2>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mission Statement</label>
                  <textarea
                    value={hospitalMission}
                    onChange={(e) => setHospitalMission(e.target.value)}
                    placeholder="e.g., Providing compassionate and professional healthcare services..."
                    className="textarea-medical w-full h-24"
                  />
                  <p className="text-xs text-slate-500 mt-2">Displayed in footer section</p>
                </div>
              </div>

              {/* Vision Statement */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-medical-primary" />
                  Hospital Vision
                </h2>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Vision Statement</label>
                  <textarea
                    value={hospitalVision}
                    onChange={(e) => setHospitalVision(e.target.value)}
                    placeholder="e.g., To be a leading healthcare institution..."
                    className="textarea-medical w-full h-24"
                  />
                  <p className="text-xs text-slate-500 mt-2">Displayed in footer section</p>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-medical-primary" />
                  Hospital Logo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upload Area */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Upload Logo (JPG, PNG)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-medical-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Image className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-semibold">Click to upload logo</p>
                        <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Recommended size: 200x200px</p>
                  </div>

                  {/* Logo Preview */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Logo Preview</label>
                    <div className="border-2 border-slate-200 rounded-xl p-6 flex items-center justify-center bg-slate-50 h-48">
                      {hospitalLogoState ? (
                        <img src={hospitalLogoState} alt="Hospital Logo" className="h-40 w-40 object-contain" />
                      ) : (
                        <p className="text-slate-400 text-sm">No logo uploaded</p>
                      )}
                    </div>
                    {hospitalLogoState && hospitalLogoState !== hospitalLogo && (
                      <button
                        onClick={() => setHospitalLogoState(hospitalLogo)}
                        className="mt-2 text-xs text-warning-red font-semibold hover:text-red-700"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-medical-primary" />
                  Login Page Banner/Background
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upload Area */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Upload Banner Image (JPG, PNG)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-medical-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label htmlFor="banner-upload" className="cursor-pointer">
                        <Image className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-semibold">Click to upload banner</p>
                        <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Recommended size: 1920x1080px or wider</p>
                  </div>

                  {/* Banner Preview */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Banner Preview</label>
                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50" style={{height: '200px'}}>
                      {hospitalBannerState ? (
                        <img src={hospitalBannerState} alt="Hospital Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-slate-400 text-sm">No banner uploaded</p>
                        </div>
                      )}
                    </div>
                    {hospitalBannerState && hospitalBannerState !== hospitalBanner && (
                      <button
                        onClick={() => setHospitalBannerState(hospitalBanner)}
                        className="mt-2 text-xs text-warning-red font-semibold hover:text-red-700"
                      >
                        Remove Banner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Color Theme</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Primary Color</label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-20 rounded-lg cursor-pointer border-2 border-slate-200"
                      />
                      <div>
                        <p className="text-sm text-slate-600 mb-2">{primaryColor}</p>
                        <p className="text-xs text-slate-500">Used for buttons, headers, highlights</p>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Secondary Color</label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-20 h-20 rounded-lg cursor-pointer border-2 border-slate-200"
                      />
                      <div>
                        <p className="text-sm text-slate-600 mb-2">{secondaryColor}</p>
                        <p className="text-xs text-slate-500">Used for accents and backgrounds</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="mt-8 p-6 rounded-xl border-2 border-slate-200 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700 mb-4">Color Preview</p>
                  <div className="flex gap-4">
                    <button style={{backgroundColor: primaryColor}} className="px-6 py-3 rounded-lg text-white font-semibold">
                      Primary Button
                    </button>
                    <button style={{backgroundColor: secondaryColor}} className="px-6 py-3 rounded-lg text-white font-semibold">
                      Secondary Button
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6">System Information</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">System Name</p>
                    <p className="text-lg font-semibold text-slate-800">AI Hospital Receptionist System</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Version</p>
                    <p className="text-lg font-semibold text-slate-800">1.0.0</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Last Updated</p>
                    <p className="text-lg font-semibold text-slate-800">February 6, 2026</p>
                  </div>
                  <div className="p-4 bg-health-green bg-opacity-10 rounded-lg border-l-4 border-health-green">
                    <p className="text-sm text-health-green font-semibold">✓ System Status: Operational</p>
                    <p className="text-xs text-health-green">All services running normally</p>
                  </div>
                </div>
              </div>

              {/* System Actions */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">System Actions</h2>
                <div className="space-y-3">
                  <button className="btn-outline w-full py-3">📊 View System Logs</button>
                  <button className="btn-outline w-full py-3">🔄 Sync Database</button>
                  <button className="btn-outline w-full py-3">📈 Generate Report</button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={saveBranding}
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-8 py-3"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={resetBranding}
              className="btn-outline flex items-center gap-2 px-8 py-3"
            >
              <RotateCcw className="w-5 h-5" />
              Reset to Defaults
            </button>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
