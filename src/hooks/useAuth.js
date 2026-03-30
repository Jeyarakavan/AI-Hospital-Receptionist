import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook to access the Auth context.
 * This is separated into its own file to maintain HMR compatibility with Vite.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default useAuth;
