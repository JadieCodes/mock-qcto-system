import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  acceptLearnerSor,
  addLearner,
  applyFile4Upload,
  declineLearner,
  downloadFile4,
  flagLearnerSor,
  getRecord,
  getSdpMonitoringStatus,
  listEnrollableLearners,
  listRecords,
  listRegistrableSittings,
  markLearnerSorUnderReview,
  performRegistrationAction,
  previewFile4Upload,
  startRegistration,
  uploadLearnerSor,
  uploadSupportingDocument,
  withdrawRegistration,
} from './api';
import type { ReadinessInput } from './readiness';
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
  return useRegistrationMutation((args: { registrationId: string; learnerId: string; readiness: ReadinessInput }) =>
    addLearner(args.registrationId, args.learnerId, args.readiness),
  );
}

// Batch R2: File 4 (QCTO 29.15). The preview and the download change nothing.
export function useDownloadFile4() {
  return useMutation({
    mutationFn: (registrationId: string) => downloadFile4(registrationId),
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function usePreviewFile4() {
  return useMutation({
    mutationFn: (args: { registrationId: string; text: string }) => previewFile4Upload(args.registrationId, args.text),
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useApplyFile4() {
  return useRegistrationMutation(
    (args: { registrationId: string; fileName: string; text: string; actorId: string; actorName: string }) =>
      applyFile4Upload(args.registrationId, args.fileName, args.text, args.actorId, args.actorName),
  );
}

export function useUploadLearnerSor() {
  return useRegistrationMutation(
    (args: { registrationId: string; learnerId: string; file: { fileName: string; fileSize: number }; actorId: string; actorName: string }) =>
      uploadLearnerSor(args.registrationId, args.learnerId, args.file, args.actorId, args.actorName),
  );
}

export function useUploadSupportingDocument() {
  return useRegistrationMutation((args: { registrationId: string; file: { fileName: string; fileSize: number } }) =>
    uploadSupportingDocument(args.registrationId, args.file),
  );
}

export function useFlagLearnerSor() {
  return useRegistrationMutation(
    (args: { registrationId: string; learnerId: string; reason: string; actorId: string; actorName: string }) =>
      flagLearnerSor(args.registrationId, args.learnerId, args.reason, args.actorId, args.actorName),
  );
}

export function useDeclineLearner() {
  return useRegistrationMutation(
    (args: { registrationId: string; learnerId: string; reason: string; actorId: string; actorName: string }) =>
      declineLearner(args.registrationId, args.learnerId, args.reason, args.actorId, args.actorName),
  );
}

// Batch R1 (29.18): the SDP's QA monitoring status, shown on the ASD workspace and SDP detail.
export function useSdpMonitoringStatus(sdpName: string | null) {
  return useQuery({
    queryKey: ['eisa-registration', 'sdp-monitoring', sdpName ?? 'none'] as const,
    queryFn: () => getSdpMonitoringStatus(sdpName as string),
    enabled: !!sdpName,
  });
}

export function useMarkLearnerSorUnderReview() {
  return useRegistrationMutation((args: { registrationId: string; learnerId: string; actorId: string; actorName: string }) =>
    markLearnerSorUnderReview(args.registrationId, args.learnerId, args.actorId, args.actorName),
  );
}

export function useAcceptLearnerSor() {
  return useRegistrationMutation((args: { registrationId: string; learnerId: string; actorId: string; actorName: string }) =>
    acceptLearnerSor(args.registrationId, args.learnerId, args.actorId, args.actorName),
  );
}

export function useRegistrationAction() {
  return useRegistrationMutation(performRegistrationAction);
}

export function useWithdrawRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { registrationId: string; actorId: string; actorName: string }) =>
      withdrawRegistration(args.registrationId, args.actorId, args.actorName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success('Draft registration withdrawn.');
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}
