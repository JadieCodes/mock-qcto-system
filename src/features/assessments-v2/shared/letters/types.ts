export type LetterKind = 'acknowledgement' | 'outcome' | 'approval';

export interface LetterData {
  qpName: string;
  qualificationTitle: string;
  saqaId?: string;
  nqfLevel?: string;
  date: string;
  signatoryName?: string;
  signatoryTitle?: string;
  notes?: string;
}

export interface GeneratedLetter {
  id: string;
  kind: LetterKind;
  recordId: string;
  generatedAt: string;
  data: LetterData;
  body: string;
}
