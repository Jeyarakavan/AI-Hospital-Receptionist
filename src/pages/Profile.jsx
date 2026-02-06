import React from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

export default function Profile(){
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-semibold mb-4">Profile</h1>
          <div className="bg-white p-4 rounded shadow-sm">User profile and settings go here.</div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
