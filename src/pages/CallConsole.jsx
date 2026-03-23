import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import CallCard from '../components/CallCard'
import useLiveCalls from '../hooks/useLiveCalls'
export default function CallConsole(){
  const calls = useLiveCalls()
  const onPlay = (c) => { if(c.recordingUrl) window.open(c.recordingUrl, '_blank'); else alert('No recording available') }
  const transfer = async (c) => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/calls/${c.id}/transfer`, { method: 'POST' })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-semibold mb-4">Call Console</h1>
          <div className="mb-4 flex items-center gap-2">
            <button onClick={async ()=>{
              await fetch(`${import.meta.env.VITE_API_BASE_URL}/twilio/webhook`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({From: 'DemoCaller', TranscriptionText: 'I have a fever and headache'})})
            }} className="px-3 py-2 rounded bg-accent text-white">Simulate Incoming Call</button>
            <div className="text-sm text-slate-500">Use this to simulate Twilio webhook during development.</div>
          </div>

          <div className="space-y-3">
            {calls.map((c)=> (
              <div key={c.id}>
                <CallCard call={c} onPlay={()=>onPlay(c)} onTransfer={()=>transfer(c)} />
              </div>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
