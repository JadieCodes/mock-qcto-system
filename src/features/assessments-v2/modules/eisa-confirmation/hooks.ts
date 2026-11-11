import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listAccreditedAssessmentCentres, listAssessmentCentresByName } from '../../mock/api/accreditation';
import { acceptConfirmation, getRecord, listRecords, listUpcomingShares, returnConfirmationToQp, saveConfirmationDraft, submitConfirmation } from './api';
import type { EisaConfirmationRecord } from './types';

const LIST_KEY = ['eisa-confirmation', 'records'] as const;
const detailKey = (id: string) => ['eisa-confirmation', 'records', id] as const;
const UPCOMING_KEY = ['eisa-confirmation', 'upcoming-shares'] as const;

export function useConfirmationRecords() {
  return useQuery({ queryKey: LIST_KEY, queryFn: listRecords });
}

export function useConfirmationRecord(id: string | null) {
  return useQuery({ queryKey: detailKey(id ?? 'none'), queryFn: () => getRecord(id as string), enabled: !!id });
}

export function useUpcomingShares() {
  return useQuery({ queryKey: UPCOMING_KEY, queryFn: listUpcomingShares });
}

function useConfirmationMutation<TArgs>(mutationFn: (args: TArgs) => Promise<EisaConfirmationRecord>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success(successMessage);
    },
    onError: (error: Error) => toast.error(error.message || 'Something went wrong.'),
  });
}

export function useSaveConfirmationDraft() {
  return useConfirmationMutation(saveConfirmationDraft, 'Draft saved.');
}

export function useSubmitConfirmation() {
  return useConfirmationMutation(submitConfirmation, 'EISA Confirmation submitted to the ASD.');
}

export function useAcceptConfirmation() {
  return useConfirmationMutation(acceptConfirmation, 'EISA Confirmation accepted.');
}

export function useReturnConfirmation() {
  return useConfirmationMutation(returnConfirmationToQp, 'EISA Confirmation returned to the QP.');
}

// 29.21: the assessment centres accredited for one qualification.
// The centres a record names, with their coordinates, for the read-only map.
export function useCentresByName(names: string[]) {
  return useQuery({
    queryKey: ['eisa-confirmation', 'centres-by-name', names],
    queryFn: () => listAssessmentCentresByName(names),
  });
}

export function useAccreditedCentres(qualificationTitle: string | null) {
  return useQuery({
    queryKey: ['eisa-confirmation', 'accredited-centres', qualificationTitle ?? 'none'],
    queryFn: () => listAccreditedAssessmentCentres(qualificationTitle as string),
    enabled: !!qualificationTitle,
  });
}
