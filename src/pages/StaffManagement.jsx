import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { Users, Plus, Edit2, Trash2, Eye, EyeOff, Copy, Loader } from 'lucide-react'
import Modal from '../components/Modal'
import { useFormValidation } from '../hooks/useFormValidation'
import toast from 'react-hot-toast'

const STAFF_TYPES = [
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', color: 'from-blue-500 to-blue-600' },
  { value: 'nurse', label: 'Nurse', icon: '👩‍⚕️', color: 'from-pink-500 to-pink-600' },
  { value: 'receptionist', label: 'Receptionist', icon: '🎯', color: 'from-green-500 to-green-600' },
  { value: 'paramedic', label: 'Paramedic', icon: '🚑', color: 'from-orange-500 to-orange-600' },
  { value: 'technician', label: 'Technician', icon: '🔧', color: 'from-purple-500 to-purple-600' },
  { value: 'admin', label: 'Admin', icon: '⚙️', color: 'from-red-500 to-red-600' }
]

export default function StaffManagement() {
  const [staff, setStaff] = useState([])
  const [filteredStaff, setFilteredStaff] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedStaffType, setSelectedStaffType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [generatedCreds, setGeneratedCreds] = useState(null)
  const [editingStaff, setEditingStaff] = useState(null)

  const { values, setValues, resetForm, handleChange } = useFormValidation({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    staffType: 'doctor',
    specialization: '',
    department: '',
    designation: '',
    nic: '',
    dob: '',
    joiningDate: new Date().toISOString().split('T')[0],
    address: '',
    city: '',
    phone: '',
    licenseNumber: ''
  })

  // Fetch staff
  useEffect(() => {
    fetchStaff()
  }, [])

  // Filter staff
  useEffect(() => {
    let filtered = staff
    if(selectedStaffType !== 'all') {
      filtered = filtered.filter(s => s.staffType === selectedStaffType)
    }
    if(searchTerm) {
      filtered = filtered.filter(s => 
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredStaff(filtered)
  }, [staff, selectedStaffType, searchTerm])

  async function fetchStaff() {
    try {
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/staff`)
      const data = await res.json()
      setStaff(data || [])
    } catch(e) {
      toast.error('Failed to fetch staff')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if(!values.firstName || !values.lastName || !values.email || !values.mobile) {
      toast.error('Please fill all required fields')
      return
    }

    setSubmitting(true)
    try {
      const method = editingStaff ? 'PUT' : 'POST'
      const url = editingStaff 
        ? `${import.meta.env.VITE_API_BASE_URL}/staff/${editingStaff.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/staff`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const data = await res.json()

      if(!res.ok) {
        toast.error(data.error || 'Failed to save staff')
        return
      }

      if(!editingStaff && data.credentials) {
        setGeneratedCreds(data.credentials)
        setShowCredentials(true)
      }

      toast.success(editingStaff ? 'Staff updated' : 'Staff registered successfully')
      await fetchStaff()
      setShowModal(false)
      resetForm()
      setEditingStaff(null)
    } catch(e) {
      toast.error('Error saving staff')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteStaff(id) {
    if(!confirm('Are you sure you want to delete this staff member?')) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/staff/${id}`, { method: 'DELETE' })
      if(res.ok) {
        toast.success('Staff deleted')
        await fetchStaff()
      } else {
        toast.error('Failed to delete staff')
      }
    } catch(e) {
      toast.error('Error deleting staff')
    }
  }

  function copyCredentials() {
    const text = `Username: ${generatedCreds.username}\nPassword: ${generatedCreds.tempPassword}\nEmail: ${generatedCreds.email}`
    navigator.clipboard.writeText(text)
    toast.success('Credentials copied to clipboard')
  }

  const getStaffTypeIcon = (type) => {
    return STAFF_TYPES.find(t => t.value === type)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 container-medical py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Users className="w-8 h-8 text-medical-primary" />
              Staff Management
            </h1>
            <p className="text-slate-600 mt-1">Manage doctors, nurses, receptionists and other staff</p>
          </div>
          <button
            onClick={() => { resetForm(); setEditingStaff(null); setShowModal(true) }}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            Register Staff
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-medical"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {[{ value: 'all', label: 'All Staff' }, ...STAFF_TYPES].map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedStaffType(type.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedStaffType === type.value
                    ? 'bg-medical-primary text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type.value === 'all' ? type.label : type.icon + ' ' + type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-medical-primary animate-spin" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No staff members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map(member => {
            const typeInfo = getStaffTypeIcon(member.staffType)
            return (
              <div key={member.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Type Badge */}
                <div className={`bg-gradient-to-r ${typeInfo.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">{typeInfo.label}</p>
                      <h3 className="text-xl font-bold">{member.firstName} {member.lastName}</h3>
                    </div>
                    <span className="text-3xl">{typeInfo.icon}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div className="text-sm">
                    <p className="text-slate-600">Email</p>
                    <p className="font-semibold break-all">{member.email}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-600">Mobile</p>
                    <p className="font-semibold">{member.mobile}</p>
                  </div>
                  {member.specialization && (
                    <div className="text-sm">
                      <p className="text-slate-600">Specialization</p>
                      <p className="font-semibold">{member.specialization}</p>
                    </div>
                  )}
                  {member.department && (
                    <div className="text-sm">
                      <p className="text-slate-600">Department</p>
                      <p className="font-semibold">{member.department}</p>
                    </div>
                  )}
                  {member.designation && (
                    <div className="text-sm">
                      <p className="text-slate-600">Designation</p>
                      <p className="font-semibold">{member.designation}</p>
                    </div>
                  )}
                  {member.joiningDate && (
                    <div className="text-sm">
                      <p className="text-slate-600">Joined</p>
                      <p className="font-semibold">{new Date(member.joiningDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="pt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      member.status === 'active' 
                        ? 'bg-health-green bg-opacity-20 text-health-green'
                        : 'bg-warning-red bg-opacity-20 text-warning-red'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 p-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingStaff(member)
                      setValues({
                        firstName: member.firstName,
                        lastName: member.lastName,
                        email: member.email,
                        mobile: member.mobile,
                        staffType: member.staffType,
                        specialization: member.specialization || '',
                        department: member.department || '',
                        designation: member.designation || '',
                        nic: member.nic || '',
                        dob: member.dob || '',
                        joiningDate: member.joiningDate || '',
                        address: member.address || '',
                        city: member.city || '',
                        phone: member.phone || '',
                        licenseNumber: member.licenseNumber || ''
                      })
                      setShowModal(true)
                    }}
                    className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteStaff(member.id)}
                    className="flex-1 btn-danger py-2 text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Registration Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingStaff(null); resetForm() }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">
            {editingStaff ? 'Edit Staff' : 'Register New Staff'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
            {/* Row 1: Names */}
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="First Name *" className="input-medical" name="firstName" value={values.firstName} onChange={handleChange} required />
              <input type="text" placeholder="Last Name *" className="input-medical" name="lastName" value={values.lastName} onChange={handleChange} required />
            </div>

            {/* Row 2: Email & Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <input type="email" placeholder="Email *" className="input-medical" name="email" value={values.email} onChange={handleChange} required />
              <input type="tel" placeholder="Mobile *" className="input-medical" name="mobile" value={values.mobile} onChange={handleChange} required />
            </div>

            {/* Row 3: Staff Type & Department */}
            <div className="grid grid-cols-2 gap-4">
              <select className="select-medical" name="staffType" value={values.staffType} onChange={handleChange}>
                {STAFF_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input type="text" placeholder="Department" className="input-medical" name="department" value={values.department} onChange={handleChange} />
            </div>

            {/* Row 4: Designation & Specialization */}
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Designation" className="input-medical" name="designation" value={values.designation} onChange={handleChange} />
              <input type="text" placeholder="Specialization (for doctors)" className="input-medical" name="specialization" value={values.specialization} onChange={handleChange} />
            </div>

            {/* Row 5: NIC & DOB */}
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="NIC" className="input-medical" name="nic" value={values.nic} onChange={handleChange} />
              <input type="date" className="input-medical" name="dob" value={values.dob} onChange={handleChange} />
            </div>

            {/* Row 6: Joining Date & License */}
            <div className="grid grid-cols-2 gap-4">
              <input type="date" placeholder="Joining Date" className="input-medical" name="joiningDate" value={values.joiningDate} onChange={handleChange} required />
              <input type="text" placeholder="License Number" className="input-medical" name="licenseNumber" value={values.licenseNumber} onChange={handleChange} />
            </div>

            {/* Row 7: Address & City */}
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Address" className="input-medical" name="address" value={values.address} onChange={handleChange} />
              <input type="text" placeholder="City" className="input-medical" name="city" value={values.city} onChange={handleChange} />
            </div>

            {/* Row 8: Phone */}
            <input type="tel" placeholder="Alternate Phone" className="input-medical" name="phone" value={values.phone} onChange={handleChange} />

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={submitting} className="flex-1 btn-primary">
                {submitting ? 'Saving...' : editingStaff ? 'Update Staff' : 'Register Staff'}
              </button>
              <button type="button" onClick={() => { setShowModal(false); setEditingStaff(null); resetForm() }} className="flex-1 btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Credentials Display Modal */}
      <Modal open={showCredentials} onClose={() => setShowCredentials(false)}>
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-medical-primary">Login Credentials Generated</h2>
          <div className="bg-slate-50 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Username</p>
              <p className="font-mono text-lg font-bold text-slate-800">{generatedCreds?.username}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Temporary Password</p>
              <p className="font-mono text-lg font-bold text-slate-800">{generatedCreds?.tempPassword}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Email</p>
              <p className="font-mono text-sm text-slate-800 break-all">{generatedCreds?.email}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-2">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Share these credentials with the staff member securely</li>
              <li>They should change their password on first login</li>
              <li>Do not share this via email or insecure channels</li>
            </ul>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={copyCredentials} className="flex-1 btn-primary flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" />
              Copy Credentials
            </button>
            <button onClick={() => setShowCredentials(false)} className="flex-1 btn-secondary">
              Done
            </button>
          </div>
        </div>
      </Modal>
        </main>
      </div>
      <Footer />
    </div>
  )
}
