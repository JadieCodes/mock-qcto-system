import { useQuery } from '@tanstack/react-query';
import { listFisaStandardStatusRows } from './api';

export function useFisaStandardStatusRows() {
  return useQuery({ queryKey: ['fisa-status', 'standards'], queryFn: listFisaStandardStatusRows });
}
