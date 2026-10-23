import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSection } from '../../shared/checklist/types';
import {
  createVisit,
  getVisit,
  listSchedulableSittings,
  listSdpsForSitting,
  listVisits,
  performPlanningAction,
  performReportAction,
  saveChecklist,
  saveCompletionDetails,
  saveFacilitatorAnswers,
  saveFreeTextNotes,
  saveLearnerAnswers,
  setResultsApprovedForSitting,
  updateVisitDetails,
} from './api';
import type { NewVisitInput, SiteVisit } from './types';

const LIST_KEY = ['site-visits', 'visits'] as const;
const detailKey = (id: string) => ['site-visits', 'visits', id] as const;
const SITTINGS_KEY = ['site-visits', 'schedulable-sittings'] as const;

export function useSiteVisits() {
  return useQuery({ queryKey: LIST_KEY, queryFn: listVisits });
}

export function useSiteVisit(id: string | null) {
  return useQuery({ queryKey: detailKey(id ?? 'none'), queryFn: () => getVisit(id as string), enabled: !!id });
}

export function useSchedulableSittings() {
  return useQuery({ queryKey: SITTINGS_KEY, queryFn: listSchedulableSittings });
}

// G-06: read-only information once a sitting is linked — never a picker.
export function useSdpsForSitting(sittingId: string | null) {
  return useQuery({
    queryKey: ['site-visits', 'sdps-for-sitting', sittingId ?? 'none'],
    queryFn: () => listSdpsForSitting(sittingId as string),
    enabled: !!sittingId,
  });
}

function useSiteVisitMutation<TArgs>(mutationFn: (args: TArgs) => Promise<SiteVisit>) {
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

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewVisitInput) => createVisit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success('Visit created.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useUpdateVisitDetails() {
  return useSiteVisitMutation((args: { id: string; patch: Parameters<typeof updateVisitDetails>[1] }) => updateVisitDetails(args.id, args.patch));
}

export function usePlanningAction() {
  return useSiteVisitMutation(performPlanningAction);
}

export function useReportAction() {
  return useSiteVisitMutation(performReportAction);
}

export function useSaveChecklist() {
  return useSiteVisitMutation((args: { id: string; sections: ChecklistSection[] }) => saveChecklist(args.id, args.sections));
}

export function useSaveFreeTextNotes() {
  return useSiteVisitMutation((args: { id: string; freeTextNotes: Record<string, string> }) => saveFreeTextNotes(args.id, args.freeTextNotes));
}

export function useSaveCompletionDetails() {
  return useSiteVisitMutation((args: { id: string; completedBy: string; completedDate: string }) =>
    saveCompletionDetails(args.id, args.completedBy, args.completedDate),
  );
}

export function useSaveFacilitatorAnswers() {
  return useSiteVisitMutation((args: { id: string; facilitatorAnswers: Record<string, string> }) => saveFacilitatorAnswers(args.id, args.facilitatorAnswers));
}

export function useSaveLearnerAnswers() {
  return useSiteVisitMutation((args: { id: string; learnerAnswers: Record<string, string> }) => saveLearnerAnswers(args.id, args.learnerAnswers));
}

export function useSetResultsApprovedForSitting() {
  return useSiteVisitMutation((args: { id: string; approved: boolean }) => setResultsApprovedForSitting(args.id, args.approved));
}
