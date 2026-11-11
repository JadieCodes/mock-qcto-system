import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSection } from '../../shared/checklist/types';
import {
  addInstruments,
  getRecord,
  listInstrumentSittings,
  listEligibleQsaAddenda,
  listRecords,
  performSchedulingAction,
  performValidationAction,
  removeInstrument,
  savePrefilledFields,
  saveValidationChecklist,
  setInstrumentSitting,
  setProposedExemplar,
  startValidation,
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

export function useAddInstruments() {
  return useInstrumentValidationMutation((args: { recordId: string; files: { fileName: string; fileSize: number }[] }) =>
    addInstruments(args.recordId, args.files),
  );
}

export function useSetInstrumentSitting() {
  return useInstrumentValidationMutation((args: { recordId: string; instrumentId: string; sittingId: string | null }) =>
    setInstrumentSitting(args.recordId, args.instrumentId, args.sittingId),
  );
}

export function useSetProposedExemplar() {
  return useInstrumentValidationMutation((args: { recordId: string; instrumentId: string | null }) =>
    setProposedExemplar(args.recordId, args.instrumentId),
  );
}

export function useRemoveInstrument() {
  return useInstrumentValidationMutation((args: { recordId: string; instrumentId: string }) => removeInstrument(args.recordId, args.instrumentId));
}

export function useInstrumentSittings(qualificationTitle: string) {
  return useQuery({ queryKey: ['instrument-validation', 'sittings', qualificationTitle], queryFn: () => listInstrumentSittings(qualificationTitle) });
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
