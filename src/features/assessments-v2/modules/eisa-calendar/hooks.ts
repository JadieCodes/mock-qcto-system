import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addSitting,
  deleteSitting,
  editSitting,
  listBatches,
  listEligibleQualifications,
  listPublishedSittings,
  listSittings,
  performBatchAction,
  performSittingLifecycleAction,
  proposeSittingBatch,
} from './api';
import type { AddSittingInput, EditSittingInput, ProposeSittingBatchInput } from './types';

const BATCHES_KEY = ['eisa-calendar', 'batches'] as const;
const SITTINGS_KEY = ['eisa-calendar', 'sittings'] as const;
const PUBLISHED_KEY = ['eisa-calendar', 'sittings', 'published'] as const;
const ELIGIBLE_KEY = ['eisa-calendar', 'eligible-qualifications'] as const;

export function useEisaSittingBatches() {
  return useQuery({ queryKey: BATCHES_KEY, queryFn: listBatches });
}

export function useEisaSittings() {
  return useQuery({ queryKey: SITTINGS_KEY, queryFn: listSittings });
}

export function usePublishedEisaSittings() {
  return useQuery({ queryKey: PUBLISHED_KEY, queryFn: listPublishedSittings });
}

export function useEligibleQualifications() {
  return useQuery({ queryKey: ELIGIBLE_KEY, queryFn: listEligibleQualifications });
}

function useInvalidateCalendar() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: BATCHES_KEY });
    queryClient.invalidateQueries({ queryKey: SITTINGS_KEY });
    queryClient.invalidateQueries({ queryKey: PUBLISHED_KEY });
  };
}

export function useProposeSittingBatch() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (input: ProposeSittingBatchInput) => proposeSittingBatch(input),
    onSuccess: () => {
      invalidate();
      toast.success('Sitting dates submitted for QCTO review.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useBatchAction() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: performBatchAction,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useAddSitting() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (input: AddSittingInput) => addSitting(input),
    onSuccess: () => {
      invalidate();
      toast.success('Sitting added to the calendar.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useEditSitting() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (args: { id: string; patch: EditSittingInput; actorId: string; actorName: string }) =>
      editSitting(args.id, args.patch, args.actorId, args.actorName),
    onSuccess: () => {
      invalidate();
      toast.success('Sitting updated.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useDeleteSitting() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (args: { id: string; actorId: string; actorName: string }) => deleteSitting(args.id, args.actorId, args.actorName),
    onSuccess: () => {
      invalidate();
      toast.success('Sitting deleted.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useSittingLifecycleAction() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: performSittingLifecycleAction,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}
