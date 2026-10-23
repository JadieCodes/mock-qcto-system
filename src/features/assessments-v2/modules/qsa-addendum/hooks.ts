import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSection } from '../../shared/checklist/types';
import {
  createApplication,
  getApplication,
  listApplications,
  performAckAction,
  performApprovalLetterAction,
  performEvaluationAction,
  performOutcomeAction,
  saveApprovalLetterDraft,
  saveDdReviewChecklist,
  saveEvaluationReport,
  saveIacPresentation,
  saveQsaChecklist,
} from './api';
import type { ApprovalLetterDraft, EvaluationReport, NewApplicationInput, QsaAddendumApplication } from './types';

const LIST_KEY = ['qsa-addendum', 'applications'] as const;
const detailKey = (id: string) => ['qsa-addendum', 'applications', id] as const;

export function useQsaAddendumApplications() {
  return useQuery({ queryKey: LIST_KEY, queryFn: listApplications });
}

export function useQsaAddendumApplication(id: string | null) {
  return useQuery({
    queryKey: detailKey(id ?? 'none'),
    queryFn: () => getApplication(id as string),
    enabled: !!id,
  });
}

// Every mutation here changes a QsaAddendumApplication and returns the updated record —
// one helper keeps the cache-update/error-toast logic in a single place instead of repeating
// it for every action.
function useQsaAddendumMutation<TArgs>(mutationFn: (args: TArgs) => Promise<QsaAddendumApplication>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Something went wrong.');
    },
  });
}

export function useCreateQsaAddendumApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewApplicationInput) => createApplication(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success('QSA Addendum application submitted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Something went wrong.');
    },
  });
}

export function useAckAction() {
  return useQsaAddendumMutation(performAckAction);
}

export function useEvaluationAction() {
  return useQsaAddendumMutation(performEvaluationAction);
}

export function useOutcomeAction() {
  return useQsaAddendumMutation(performOutcomeAction);
}

export function useApprovalLetterAction() {
  return useQsaAddendumMutation(performApprovalLetterAction);
}

export function useSaveQsaChecklist() {
  return useQsaAddendumMutation((args: { applicationId: string; sections: ChecklistSection[] }) =>
    saveQsaChecklist(args.applicationId, args.sections),
  );
}

export function useSaveDdReviewChecklist() {
  return useQsaAddendumMutation((args: { applicationId: string; sections: ChecklistSection[] }) =>
    saveDdReviewChecklist(args.applicationId, args.sections),
  );
}

export function useSaveEvaluationReport() {
  return useQsaAddendumMutation((args: { applicationId: string; report: EvaluationReport }) =>
    saveEvaluationReport(args.applicationId, args.report),
  );
}

export function useSaveIacPresentation() {
  return useQsaAddendumMutation((args: { applicationId: string; fileName: string }) =>
    saveIacPresentation(args.applicationId, args.fileName),
  );
}

export function useSaveApprovalLetterDraft() {
  return useQsaAddendumMutation((args: { applicationId: string; draft: ApprovalLetterDraft }) =>
    saveApprovalLetterDraft(args.applicationId, args.draft),
  );
}
