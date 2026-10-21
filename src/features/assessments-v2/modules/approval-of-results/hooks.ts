import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSection } from '../../shared/checklist/types';
import {
  createPemVisitForBatch,
  getBatch,
  listBatches,
  listMarkingModerationVisitsForSitting,
  listSittingsAwaitingSubmission,
  performResultsAction,
  saveComplianceChecklist,
  saveComplianceReviewNotes,
  saveEvidenceEvaluationNotes,
  submitResultsBatch,
  uploadEvidenceDocument,
} from './api';
import type { NewResultsBatchInput, ResultsBatch } from './types';

const LIST_KEY = ['approval-of-results', 'batches'] as const;
const detailKey = (id: string) => ['approval-of-results', 'batches', id] as const;
const AWAITING_KEY = ['approval-of-results', 'awaiting-submission'] as const;
const mmKey = (sittingId: string) => ['approval-of-results', 'marking-moderation', sittingId] as const;

export function useResultsBatches() {
  return useQuery({ queryKey: LIST_KEY, queryFn: listBatches });
}

export function useResultsBatch(id: string | null) {
  return useQuery({ queryKey: detailKey(id ?? 'none'), queryFn: () => getBatch(id as string), enabled: !!id });
}

export function useSittingsAwaitingSubmission() {
  return useQuery({ queryKey: AWAITING_KEY, queryFn: listSittingsAwaitingSubmission });
}

export function useMarkingModerationStatus(sittingId: string | null) {
  return useQuery({
    queryKey: mmKey(sittingId ?? 'none'),
    queryFn: () => listMarkingModerationVisitsForSitting(sittingId as string),
    enabled: !!sittingId,
  });
}

function useResultsBatchMutation<TArgs>(mutationFn: (args: TArgs) => Promise<ResultsBatch>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: AWAITING_KEY });
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useSubmitResultsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewResultsBatchInput) => submitResultsBatch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: AWAITING_KEY });
      toast.success('Results batch submitted.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useSaveComplianceChecklist() {
  return useResultsBatchMutation((args: { id: string; sections: ChecklistSection[] }) => saveComplianceChecklist(args.id, args.sections));
}

export function useSaveComplianceReviewNotes() {
  return useResultsBatchMutation((args: { id: string; notes: string }) => saveComplianceReviewNotes(args.id, args.notes));
}

export function useSaveEvidenceEvaluationNotes() {
  return useResultsBatchMutation((args: { id: string; notes: string }) => saveEvidenceEvaluationNotes(args.id, args.notes));
}

export function useUploadEvidenceDocument() {
  return useResultsBatchMutation((args: { id: string; file: { fileName: string; fileSize: number } }) => uploadEvidenceDocument(args.id, args.file));
}

export function useResultsAction() {
  return useResultsBatchMutation(performResultsAction);
}

export function useCreatePemVisitForBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { batchId: string; actorName: string }) => createPemVisitForBatch(args.batchId, args.actorName),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ['site-visits', 'visits'] });
      toast.success('Post-EISA Monitoring visit created.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}
