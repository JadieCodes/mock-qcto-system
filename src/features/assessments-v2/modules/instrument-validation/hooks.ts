import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSection } from '../../shared/checklist/types';
import {
  getRecord,
  listEligibleQsaAddenda,
  listRecords,
  performSchedulingAction,
  performValidationAction,
  savePrefilledFields,
  saveValidationChecklist,
  startValidation,
  uploadInstrument,
} from './api';
import type { InstrumentValidationRecord, NewValidationInput, PrefilledField } from './types';

const LIST_KEY = ['instrument-validation', 'records'] as const;
const detailKey = (id: string) => ['instrument-validation', 'records', id] as const;
const ELIGIBLE_KEY = ['instrument-validation', 'eligible-qsa-addenda'] as const;

export function useInstrumentValidationRecords() {
  return useQuery({ queryKey: LIST_KEY, queryFn: listRecords });
}

export function useInstrumentValidationRecord(id: string | null) {
  return useQuery({
    queryKey: detailKey(id ?? 'none'),
    queryFn: () => getRecord(id as string),
    enabled: !!id,
  });
}

export function useEligibleQsaAddenda() {
  return useQuery({ queryKey: ELIGIBLE_KEY, queryFn: listEligibleQsaAddenda });
}

function useInstrumentValidationMutation<TArgs>(mutationFn: (args: TArgs) => Promise<InstrumentValidationRecord>) {
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

export function useStartValidation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewValidationInput) => startValidation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ELIGIBLE_KEY });
      toast.success('Instrument validation started.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Something went wrong.');
    },
  });
}

export function useSchedulingAction() {
  return useInstrumentValidationMutation(performSchedulingAction);
}

export function useUploadInstrument() {
  return useInstrumentValidationMutation((args: { recordId: string; file: { fileName: string; fileSize: number } }) =>
    uploadInstrument(args.recordId, args.file),
  );
}

export function useSaveValidationChecklist() {
  return useInstrumentValidationMutation((args: { recordId: string; sections: ChecklistSection[] }) =>
    saveValidationChecklist(args.recordId, args.sections),
  );
}

export function useSavePrefilledFields() {
  return useInstrumentValidationMutation((args: { recordId: string; fields: PrefilledField[] }) =>
    savePrefilledFields(args.recordId, args.fields),
  );
}

export function useValidationAction() {
  return useInstrumentValidationMutation(performValidationAction);
}
