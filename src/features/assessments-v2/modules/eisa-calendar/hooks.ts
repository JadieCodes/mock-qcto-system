import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addSitting,
  deleteSitting,
  editBatchDates,
  editSitting,
  listBatches,
  listEligibleQualifications,
  listPublishedSittings,
  listSittingIdsWithRegistrations,
  listSittings,
  performBatchAction,
  proposeBulkSittingBatches,
  proposeSittingBatch,
  registeredLearnerNames,
  resubmitBatch,
} from './api';
import { changeRequestKindLabel, listChangeRequests, performChangeRequestAction, raiseChangeRequest } from './changeRequests';
import type { AddSittingInput, EditSittingInput, ProposeSittingBatchInput, RaiseChangeRequestInput } from './types';

const BATCHES_KEY = ['eisa-calendar', 'batches'] as const;
const SITTINGS_KEY = ['eisa-calendar', 'sittings'] as const;
const PUBLISHED_KEY = ['eisa-calendar', 'sittings', 'published'] as const;
const ELIGIBLE_KEY = ['eisa-calendar', 'eligible-qualifications'] as const;
const REQUESTS_KEY = ['eisa-calendar', 'change-requests'] as const;

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

export function useSittingIdsWithRegistrations() {
  return useQuery({ queryKey: ['eisa-calendar', 'sitting-ids-with-registrations'] as const, queryFn: listSittingIdsWithRegistrations });
}

function useInvalidateCalendar() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: BATCHES_KEY });
    queryClient.invalidateQueries({ queryKey: SITTINGS_KEY });
    queryClient.invalidateQueries({ queryKey: PUBLISHED_KEY });
    queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
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

// QCTO feedback 3.4: one proposal batch per qualification and year from the uploaded file.
export function useProposeBulkSittingBatches() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (inputs: ProposeSittingBatchInput[]) => proposeBulkSittingBatches(inputs),
    onSuccess: (batches) => {
      invalidate();
      toast.success(`${batches.length} proposal batch${batches.length === 1 ? '' : 'es'} submitted for QCTO review.`);
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

export function useResubmitBatch() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: resubmitBatch,
    onSuccess: () => {
      invalidate();
      toast.success('Corrected dates resubmitted for QCTO review.');
    },
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

export function useEditBatch() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: editBatchDates,
    onSuccess: () => {
      invalidate();
      toast.success('Dates updated and sent for QCTO review.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

// QCTO feedback 2.4: postponement and cancellation requests.
export function useChangeRequests() {
  return useQuery({ queryKey: REQUESTS_KEY, queryFn: listChangeRequests });
}

export function useRegisteredLearnerNames(sittingId: string | null) {
  return useQuery({
    queryKey: ['eisa-calendar', 'registered-learners', sittingId] as const,
    queryFn: () => (sittingId ? registeredLearnerNames(sittingId) : Promise.resolve([])),
    enabled: !!sittingId,
  });
}

export function useRaiseChangeRequest() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (input: RaiseChangeRequestInput) => raiseChangeRequest(input),
    onSuccess: (request) => {
      invalidate();
      toast.success(`${changeRequestKindLabel(request.kind)} request sent to the DD.`);
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useChangeRequestAction() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: performChangeRequestAction,
    onSuccess: () => {
      invalidate();
      toast.success('Request updated.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}
