import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSection } from '../../shared/checklist/types';
import {
  createRplToolkitApplication,
  getRplToolkitApplication,
  listRplToolkitApplications,
  performRplEvaluationAction,
  performRplOutcomeAction,
  saveRplEvaluationReport,
  saveRplToolkitChecklist,
} from './api';
import type { NewRplToolkitInput, RplEvaluationReport, RplToolkitApplication } from './types';

const LIST_KEY = ['rpl-toolkit', 'applications'] as const;
const detailKey = (id: string) => ['rpl-toolkit', 'applications', id] as const;

export function useRplToolkitApplications() {
  return useQuery({ queryKey: LIST_KEY, queryFn: listRplToolkitApplications });
}

export function useRplToolkitApplication(id: string | null) {
  return useQuery({ queryKey: detailKey(id ?? 'none'), queryFn: () => getRplToolkitApplication(id as string), enabled: !!id });
}

function useRplToolkitMutation<TArgs>(mutationFn: (args: TArgs) => Promise<RplToolkitApplication>) {
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

export function useCreateRplToolkitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewRplToolkitInput) => createRplToolkitApplication(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success('RPL Toolkit submitted.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useSaveRplToolkitChecklist() {
  return useRplToolkitMutation((args: { applicationId: string; sections: ChecklistSection[] }) =>
    saveRplToolkitChecklist(args.applicationId, args.sections),
  );
}

export function useSaveRplEvaluationReport() {
  return useRplToolkitMutation((args: { applicationId: string; report: RplEvaluationReport }) =>
    saveRplEvaluationReport(args.applicationId, args.report),
  );
}

export function useRplEvaluationAction() {
  return useRplToolkitMutation(performRplEvaluationAction);
}

export function useRplOutcomeAction() {
  return useRplToolkitMutation(performRplOutcomeAction);
}
