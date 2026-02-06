import React from 'react'

export default function AppointmentCard({appointment}){
  return (
    <div className="p-4 bg-white rounded shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{appointment.patientName || 'John Doe'}</div>
          <div className="text-sm text-slate-500">{appointment.problem || 'General checkup'}</div>
        </div>
        <div className="text-sm text-slate-600">{appointment.time || '10:30 AM'}</div>
      </div>
    </div>
  )
}
