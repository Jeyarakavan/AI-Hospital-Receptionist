import { useEffect, useState } from 'react'
import socket from '../services/socket'

export default function useSocket(event){
  const [data, setData] = useState(null)
  useEffect(()=>{
    function handler(payload){ setData(payload) }
    socket.on(event, handler)
    return ()=> socket.off(event, handler)
  },[event])
  return data
}
