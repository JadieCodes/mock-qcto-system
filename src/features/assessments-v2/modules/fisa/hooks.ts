import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSection } from '../../shared/checklist/types';
import {
  createFisaStandard,
  getFisaStandard,
  getFisaValidation,
  listEligibleFisaStandards,
  listFisaStandards,
  listFisaValidations,
  performFisaValidationAction,
  performStandardAction,
  saveFisaStandardChecklist,
  saveFisaStandardEvaluationReport,
  saveFisaValidationChecklist,
  startFisaValidation,
  uploadFisaInstrument,
} from './api';
import type {
  FisaStandardRecord,
  FisaValidationRecord,
  NewFisaStandardInput,
  NewFisaValidationInput,
  StandardEvaluationReport,
} from './types';

// ---------------------------------------------------------------------------
// Stage 1 — FISA Standards
// ---------------------------------------------------------------------------

const STANDARDS_LIST_KEY = ['fisa', 'standards'] as const;
const standardDetailKey = (id: string) => ['fisa', 'standards', id] as const;

export function useFisaStandards() {
  return useQuery({ queryKey: STANDARDS_LIST_KEY, queryFn: listFisaStandards });
}

export function useFisaStandard(id: string | null) {
  return useQuery({ queryKey: standardDetailKey(id ?? 'none'), queryFn: () => getFisaStandard(id as string), enabled: !!id });
}

function useStandardMutation<TArgs>(mutationFn: (args: TArgs) => Promise<FisaStandardRecord>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(standardDetailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: STANDARDS_LIST_KEY });
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useCreateFisaStandard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewFisaStandardInput) => createFisaStandard(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STANDARDS_LIST_KEY });
      toast.success('FISA Standard created — open it and send it to the ASD when ready.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useSaveFisaStandardChecklist() {
  return useStandardMutation((args: { standardId: string; sections: ChecklistSection[] }) =>
    saveFisaStandardChecklist(args.standardId, args.sections),
  );
}

export function useSaveFisaStandardEvaluationReport() {
  return useStandardMutation((args: { standardId: string; report: StandardEvaluationReport }) =>
    saveFisaStandardEvaluationReport(args.standardId, args.report),
  );
}

export function useStandardAction() {
  return useStandardMutation(performStandardAction);
}

// ---------------------------------------------------------------------------
// Stage 2 & 3 — Instrument development + FISA Instrument Validation
// ---------------------------------------------------------------------------

const VALIDATION_LIST_KEY = ['fisa', 'validations'] as const;
const validationDetailKey = (id: string) => ['fisa', 'validations', id] as const;
const ELIGIBLE_STANDARDS_KEY = ['fisa', 'eligible-standards'] as const;

export function useFisaValidations() {
  return useQuery({ queryKey: VALIDATION_LIST_KEY, queryFn: listFisaValidations });
}

export function useFisaValidation(id: string | null) {
  return useQuery({ queryKey: validationDetailKey(id ?? 'none'), queryFn: () => getFisaValidation(id as string), enabled: !!id });
}

export function useEligibleFisaStandards() {
  return useQuery({ queryKey: ELIGIBLE_STANDARDS_KEY, queryFn: listEligibleFisaStandards });
}

function useValidationMutation<TArgs>(mutationFn: (args: TArgs) => Promise<FisaValidationRecord>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(validationDetailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: VALIDATION_LIST_KEY });
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useStartFisaValidation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewFisaValidationInput) => startFisaValidation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VALIDATION_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ELIGIBLE_STANDARDS_KEY });
      toast.success('FISA instrument development started.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useUploadFisaInstrument() {
  return useValidationMutation((args: { recordId: string; file: { fileName: string; fileSize: number } }) =>
    uploadFisaInstrument(args.recordId, args.file),
  );
}

export function useSaveFisaValidationChecklist() {
  return useValidationMutation((args: { recordId: string; sections: ChecklistSection[] }) =>
    saveFisaValidationChecklist(args.recordId, args.sections),
  );
}

export function useFisaValidationAction() {
  return useValidationMutation(performFisaValidationAction);
}
