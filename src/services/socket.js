import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const socket = io(URL, { autoConnect: true })

socket.on('connect', ()=> console.log('socket connected', socket.id))

export default socket
