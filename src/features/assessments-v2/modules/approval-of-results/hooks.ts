import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSection } from '../../shared/checklist/types';
import type { Role } from '../../types';
import {
  createPemVisitForBatch,
  getBatch,
  getResultsDraft,
  listBatches,
  listCaptureLearners,
  listResultsDrafts,
  getResultsRulesForSitting,
  listMarkingModerationVisitsForSitting,
  listSittingsAwaitingSubmission,
  performResultsAction,
  saveComplianceChecklist,
  saveComplianceReviewNotes,
  saveEvidenceEvaluationNotes,
  saveResultsDraft,
  submitResultsBatch,
  uploadEvidenceDocument,
} from './api';
import {
  createFisaResultsBatch,
  getFisaResultsBatch,
  listFisaResultsBatches,
  listFisaStandardsForResults,
  listLearnersForSdp,
  performFisaResultsAction,
  saveFisaComplianceChecklist,
  saveFisaComplianceReviewNotes,
  saveFisaEvidenceEvaluationNotes,
  saveFisaResultsDraft,
  submitFisaResultsBatch,
  uploadFisaReviewEvidence,
} from './fisaApi';
import type { FisaResultsBatch, FisaResultsDraftPatch, NewFisaResultsBatchInput, NewResultsBatchInput, ResultsBatch } from './types';

const LIST_KEY = ['approval-of-results', 'batches'] as const;
const detailKey = (id: string) => ['approval-of-results', 'batches', id] as const;
const AWAITING_KEY = ['approval-of-results', 'awaiting-submission'] as const;
const DRAFTS_KEY_LIST = ['approval-of-results', 'drafts'] as const;
const draftKey = (sittingId: string) => ['approval-of-results', 'draft', sittingId] as const;
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

// QCTO feedback 29.31 / Batch L1.1: the approved QASA's components and Addendum pass % a new batch for this sitting would get.
export function useResultsRulesForSitting(sittingId: string | null) {
  return useQuery({
    queryKey: ['approval-of-results', 'components-for-sitting', sittingId ?? 'none'],
    queryFn: () => getResultsRulesForSitting(sittingId as string),
    enabled: !!sittingId,
  });
}

// QCTO feedback 05.24: the learners (with ID numbers) and the saved draft for the capture screen.
export function useCaptureLearners(sittingId: string | null) {
  return useQuery({
    queryKey: ['approval-of-results', 'capture-learners', sittingId ?? 'none'],
    queryFn: () => listCaptureLearners(sittingId as string),
    enabled: !!sittingId,
  });
}

export function useResultsDrafts() {
  return useQuery({ queryKey: DRAFTS_KEY_LIST, queryFn: listResultsDrafts });
}

export function useResultsDraft(sittingId: string | null) {
  return useQuery({ queryKey: draftKey(sittingId ?? 'none'), queryFn: () => getResultsDraft(sittingId as string), enabled: !!sittingId });
}

export function useSaveResultsDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveResultsDraft,
    onSuccess: (draft) => {
      queryClient.setQueryData(draftKey(draft.sittingId), draft);
      queryClient.invalidateQueries({ queryKey: DRAFTS_KEY_LIST });
      queryClient.invalidateQueries({ queryKey: AWAITING_KEY });
      toast.success('Draft saved. You can come back to finish it.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: performResultsAction,
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: AWAITING_KEY });
      // QCTO feedback 2.8: final approval may have created a Post-EISA Monitoring visit.
      if (updated.pemVisitId) queryClient.invalidateQueries({ queryKey: ['site-visits', 'visits'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

// ---------------------------------------------------------------------------
// QCTO feedback 3.14: FISA results batches (fisaApi.ts).
// ---------------------------------------------------------------------------

const FISA_LIST_KEY = ['approval-of-results', 'fisa-batches'] as const;
const fisaDetailKey = (id: string) => ['approval-of-results', 'fisa-batches', id] as const;

export function useFisaResultsBatches() {
  return useQuery({ queryKey: FISA_LIST_KEY, queryFn: listFisaResultsBatches });
}

export function useFisaResultsBatch(id: string | null) {
  return useQuery({ queryKey: fisaDetailKey(id ?? 'none'), queryFn: () => getFisaResultsBatch(id as string), enabled: !!id });
}

export function useFisaStandardsForResults() {
  return useQuery({ queryKey: ['approval-of-results', 'fisa-standards'], queryFn: listFisaStandardsForResults });
}

export function useLearnersForSdp(sdpName: string) {
  return useQuery({ queryKey: ['approval-of-results', 'sdp-learners', sdpName], queryFn: () => listLearnersForSdp(sdpName) });
}

function useFisaResultsBatchMutation<TArgs>(mutationFn: (args: TArgs) => Promise<FisaResultsBatch>, successMessage?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(fisaDetailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: FISA_LIST_KEY });
      if (successMessage) toast.success(successMessage);
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useCreateFisaResultsBatch() {
  return useFisaResultsBatchMutation((input: NewFisaResultsBatchInput) => createFisaResultsBatch(input), 'Results batch created.');
}

export function useSaveFisaResultsDraft() {
  return useFisaResultsBatchMutation((args: { id: string; sdpId: string; patch: FisaResultsDraftPatch }) =>
    saveFisaResultsDraft(args.id, args.sdpId, args.patch),
  );
}

export function useSubmitFisaResultsBatch() {
  return useFisaResultsBatchMutation(
    (args: { id: string; actor: { role: Role; id: string; name: string }; declarationAccepted: boolean }) =>
      submitFisaResultsBatch(args.id, args.actor, args.declarationAccepted),
    'Results batch submitted.',
  );
}

export function useSaveFisaComplianceChecklist() {
  return useFisaResultsBatchMutation((args: { id: string; sections: ChecklistSection[] }) => saveFisaComplianceChecklist(args.id, args.sections));
}

export function useSaveFisaComplianceReviewNotes() {
  return useFisaResultsBatchMutation((args: { id: string; notes: string }) => saveFisaComplianceReviewNotes(args.id, args.notes));
}

export function useSaveFisaEvidenceEvaluationNotes() {
  return useFisaResultsBatchMutation((args: { id: string; notes: string }) => saveFisaEvidenceEvaluationNotes(args.id, args.notes));
}

export function useUploadFisaReviewEvidence() {
  return useFisaResultsBatchMutation((args: { id: string; file: { fileName: string; fileSize: number; fileType: string } }) =>
    uploadFisaReviewEvidence(args.id, args.file),
  );
}

export function useFisaResultsAction() {
  return useFisaResultsBatchMutation(performFisaResultsAction);
}

export function useCreatePemVisitForBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { batchId: string; actorRole: Role; actorId: string; actorName: string }) =>
      createPemVisitForBatch(args.batchId, args.actorRole, args.actorId, args.actorName),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ['site-visits', 'visits'] });
      toast.success('Post-EISA Monitoring visit created.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}
