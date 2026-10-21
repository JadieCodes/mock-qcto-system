import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { acknowledgeConfirmation, confirmDetails, generateConfirmation, getRecord, listRecords, listSittingsReadyToConfirm } from './api';
import type { EisaConfirmationRecord } from './types';

const LIST_KEY = ['eisa-confirmation', 'records'] as const;
const detailKey = (id: string) => ['eisa-confirmation', 'records', id] as const;
const READY_KEY = ['eisa-confirmation', 'sittings-ready'] as const;

export function useConfirmationRecords() {
  return useQuery({ queryKey: LIST_KEY, queryFn: listRecords });
}

export function useConfirmationRecord(id: string | null) {
  return useQuery({ queryKey: detailKey(id ?? 'none'), queryFn: () => getRecord(id as string), enabled: !!id });
}

export function useSittingsReadyToConfirm() {
  return useQuery({ queryKey: READY_KEY, queryFn: listSittingsReadyToConfirm });
}

function useConfirmationMutation<TArgs>(mutationFn: (args: TArgs) => Promise<EisaConfirmationRecord>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useGenerateConfirmation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateConfirmation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: READY_KEY });
      toast.success('EISA Confirmation generated.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useAcknowledgeConfirmation() {
  return useConfirmationMutation((args: { recordId: string; actorName: string }) => acknowledgeConfirmation(args.recordId, args.actorName));
}

export function useConfirmDetails() {
  return useConfirmationMutation(confirmDetails);
}
