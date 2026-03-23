import React from 'react'

export default function Preloader(){
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-white to-slate-50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary animate-spin-slow" style={{borderTop:'4px solid rgba(255,255,255,0.4)'}}></div>
        <div className="text-gray-600">Loading…</div>
      </div>
    </div>
  )
}
