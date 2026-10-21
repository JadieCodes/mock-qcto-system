import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addLearner,
  flagLearnerSor,
  getRecord,
  listEnrollableLearners,
  listRecords,
  listRegistrableSittings,
  performRegistrationAction,
  setLearnerRplArpl,
  startRegistration,
  uploadLearnerSor,
  uploadSupportingDocument,
} from './api';
import type { EisaRegistrationRecord, NewRegistrationInput } from './types';

const LIST_KEY = ['eisa-registration', 'records'] as const;
const detailKey = (id: string) => ['eisa-registration', 'records', id] as const;
const SITTINGS_KEY = ['eisa-registration', 'registrable-sittings'] as const;
const enrollableKey = (sdpName: string) => ['eisa-registration', 'enrollable-learners', sdpName] as const;

export function useRegistrationRecords() {
  return useQuery({ queryKey: LIST_KEY, queryFn: listRecords });
}

export function useRegistrationRecord(id: string | null) {
  return useQuery({ queryKey: detailKey(id ?? 'none'), queryFn: () => getRecord(id as string), enabled: !!id });
}

export function useRegistrableSittings() {
  return useQuery({ queryKey: SITTINGS_KEY, queryFn: listRegistrableSittings });
}

export function useEnrollableLearners(sdpName: string | null) {
  return useQuery({
    queryKey: enrollableKey(sdpName ?? 'none'),
    queryFn: () => listEnrollableLearners(sdpName as string),
    enabled: !!sdpName,
  });
}

function useRegistrationMutation<TArgs>(mutationFn: (args: TArgs) => Promise<EisaRegistrationRecord>) {
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

export function useStartRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewRegistrationInput) => startRegistration(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success('Registration started.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useAddLearner() {
  return useRegistrationMutation((args: { registrationId: string; learnerId: string }) => addLearner(args.registrationId, args.learnerId));
}

export function useSetLearnerRplArpl() {
  return useRegistrationMutation((args: { registrationId: string; learnerId: string; rplArpl: boolean }) =>
    setLearnerRplArpl(args.registrationId, args.learnerId, args.rplArpl),
  );
}

export function useUploadLearnerSor() {
  return useRegistrationMutation((args: { registrationId: string; learnerId: string; file: { fileName: string; fileSize: number } }) =>
    uploadLearnerSor(args.registrationId, args.learnerId, args.file),
  );
}

export function useUploadSupportingDocument() {
  return useRegistrationMutation((args: { registrationId: string; file: { fileName: string; fileSize: number } }) =>
    uploadSupportingDocument(args.registrationId, args.file),
  );
}

export function useFlagLearnerSor() {
  return useRegistrationMutation((args: { registrationId: string; learnerId: string; reason: string; actorName: string }) =>
    flagLearnerSor(args.registrationId, args.learnerId, args.reason, args.actorName),
  );
}

export function useRegistrationAction() {
  return useRegistrationMutation(performRegistrationAction);
}
