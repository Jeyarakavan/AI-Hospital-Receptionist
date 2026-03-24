import { useQuery } from '@tanstack/react-query';
import { patientHistoryAPI } from '../services/api';

export function usePatientsQuery(search) {
  return useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      const response = await patientHistoryAPI.getCases(search ? { search } : undefined);
      return response.data?.results || response.data || [];
    },
    staleTime: 30_000,
  });
}

export function usePatientFullHistory(patientId) {
  return useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: async () => {
      const response = await patientHistoryAPI.getFullHistory(patientId);
      return response.data;
    },
    enabled: !!patientId,
    staleTime: 30_000,
  });
}
