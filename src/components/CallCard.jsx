import React from 'react'

export default function CallCard({call, onPlay, onTransfer}){
  return (
    <div className="p-3 bg-white rounded flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow animate-float">
      <div>
        <div className="font-medium">{call.caller || 'Unknown Caller'}</div>
        <div className="text-sm text-slate-500">{call.problem || 'No details'}</div>
        {call.transcription && <div className="mt-2 text-sm text-slate-600">🔊 {call.transcription}</div>}
        <div className="text-xs text-slate-400">{new Date(call.receivedAt || Date.now()).toLocaleString()}</div>
      </div>
      <div className="flex items-center gap-2">
        <button aria-label="Play recording" onClick={onPlay} className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Play</button>
        <button aria-label="Transfer call" onClick={onTransfer} className="px-3 py-1 rounded bg-primary text-white">Transfer</button>
      </div>
    </div>
  )
}
