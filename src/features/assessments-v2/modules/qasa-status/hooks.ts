import { useQuery } from '@tanstack/react-query';
import type { Portal } from '../../types';
import { listApprovedInstruments, listQasaStatusRows } from './api';

export function useQasaStatusRows() {
  return useQuery({ queryKey: ['qasa-status', 'qasa'], queryFn: listQasaStatusRows });
}

export function useApprovedInstruments(portal: Portal) {
  return useQuery({ queryKey: ['qasa-status', 'approved-instruments', portal], queryFn: () => listApprovedInstruments(portal) });
}
