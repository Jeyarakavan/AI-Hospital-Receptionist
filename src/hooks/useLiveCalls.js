import { useEffect, useState } from 'react'
import socket from '../services/socket'

export default function useLiveCalls(){
  const [calls, setCalls] = useState([])
  useEffect(()=>{
    // fetch initial calls
    fetch(`${import.meta.env.VITE_API_BASE_URL}/calls`).then(r=>r.json()).then(setCalls).catch(()=>{})

    function onNew(call){ setCalls(prev => [call, ...prev]); import('react-hot-toast').then(t=>t.default.success(`New call from ${call.caller}`)) }
    function onTransferred(call){ setCalls(prev => prev.map(c=> c.id===call.id ? call : c)); import('react-hot-toast').then(t=>t.default(`Call transferred: ${call.caller}`)) }
    function onTranscription(payload){ setCalls(prev => prev.map(c=> c.id===payload.id ? {...c, transcription: payload.transcription} : c)) }

    socket.on('new_call', onNew)
    socket.on('call_transferred', onTransferred)
    socket.on('call_transcription', onTranscription)

    return ()=>{
      socket.off('new_call', onNew)
      socket.off('call_transferred', onTransferred)
      socket.off('call_transcription', onTranscription)
    }
  },[])

  return calls
}