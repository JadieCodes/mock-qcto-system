import { useQuery } from '@tanstack/react-query';
import { listApprovedInstruments, listQasaStatusRows } from './api';

export function useQasaStatusRows() {
  return useQuery({ queryKey: ['qasa-status', 'qasa'], queryFn: listQasaStatusRows });
}

export function useApprovedInstruments() {
  return useQuery({ queryKey: ['qasa-status', 'approved-instruments'], queryFn: listApprovedInstruments });
}
