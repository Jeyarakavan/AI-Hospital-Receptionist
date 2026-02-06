import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import AppointmentCard from '../components/AppointmentCard'
import Modal from '../components/Modal'
import { useForm } from 'react-hook-form'

export default function Appointments(){
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  useEffect(()=>{
    fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments`).then(r=>r.json()).then(setAppointments).catch(()=>{})
    fetch(`${import.meta.env.VITE_API_BASE_URL}/doctors`).then(r=>r.json()).then(setDoctors).catch(()=>{})

    import('../services/socket').then(({ default: socket })=>{
      function onAppt(a){ setAppointments(prev => [a, ...prev]); import('react-hot-toast').then(t=>t.default.success(`New appointment: ${a.patientName}`)) }
      socket.on('appointment_created', onAppt)
      return ()=> socket.off('appointment_created', onAppt)
    })
  },[])

  const onSubmit = async (data) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
    })
    const appt = await res.json()
    setAppointments(prev => [appt, ...prev])
    reset()
    setOpen(false)
    alert(`Appointment booked. Reference: ${appt.reference}`)
  }

  const suggestDoctor = (problem) => {
    if(!doctors.length) return null
    const match = doctors.find(d => problem.toLowerCase().includes(d.specialization.toLowerCase()))
    return match ? match.id : doctors[0].id
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Appointments</h1>
            <button onClick={()=>setOpen(true)} className="px-3 py-2 rounded bg-primary text-white">New Appointment</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map(a=> <AppointmentCard key={a.id} appointment={a} />)}
          </div>
        </main>
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title="New Appointment">
        <form onSubmit={handleSubmit((d)=> onSubmit({ ...d, doctorId: d.doctorId || suggestDoctor(d.problem) }))} className="space-y-3">
          <input {...register('patientName')} placeholder="Patient name" className="w-full p-2 border rounded" required />
          <input {...register('mobile')} placeholder="Mobile" className="w-full p-2 border rounded" required />
          <input {...register('problem')} placeholder="Medical problem" className="w-full p-2 border rounded" required />
          <input {...register('time')} type="datetime-local" className="w-full p-2 border rounded" required />
          <select {...register('doctorId')} className="w-full p-2 border rounded">
            <option value="">Auto-assign</option>
            {doctors.map(d=> <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
          </select>
          <div className="flex justify-end"><button type="submit" className="px-4 py-2 rounded bg-accent text-white">Book</button></div>
        </form>
      </Modal>
      <Footer />
    </div>
  )
}
