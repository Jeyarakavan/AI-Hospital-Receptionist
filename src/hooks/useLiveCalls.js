import { useSocket } from '../context/SocketContext'

/**
 * Thin wrapper around SocketContext that returns activeCalls.
 * Components that need the transfer queue should use useSocket() directly.
 */
export default function useLiveCalls() {
  const { activeCalls } = useSocket()
  return activeCalls
}