import React from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { useForm } from 'react-hook-form'

export default function Ambulance(){
  const {register, handleSubmit} = useForm()
  const onSubmit = (d)=> console.log('ambulance', d)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-semibold mb-4">Emergency Ambulance</h1>
          <div className="bg-white p-4 rounded shadow-sm max-w-md">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <input {...register('name')} placeholder="Name" className="w-full p-2 border rounded" />
              <input {...register('mobile')} placeholder="Mobile" className="w-full p-2 border rounded" />
              <input {...register('location')} placeholder="Location" className="w-full p-2 border rounded" />
              <textarea {...register('condition')} placeholder="Condition" className="w-full p-2 border rounded" />
              <div className="flex justify-end"><button type="submit" className="px-4 py-2 rounded bg-accent text-white">Request Ambulance</button></div>
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
