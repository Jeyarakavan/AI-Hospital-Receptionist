import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const fetchAppointments = async ()=>{
  const {data} = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/appointments`)
  return data
}

export function useAppointments(){
  return useQuery(['appointments'], fetchAppointments, {enabled:false})
}
