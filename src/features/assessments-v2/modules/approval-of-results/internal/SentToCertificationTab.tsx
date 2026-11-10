import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { batchFiguresOf } from '../calculation';
import { useFisaResultsBatches, useResultsBatches } from '../hooks';
import { downloadLetterModel, eisaRecommendationLetter, fisaRecommendationLetter, lastEisaDateOf, lastFisaDateOf, type LetterModel } from '../outcomeLetters';
import { fisaFiguresOf } from '../workflow';
import { verificationCodeOf } from '../verificationCode';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { OutcomeLetterView } from '../components/OutcomeLetterView';

interface SentRow {
  id: string;
  track: 'EISA' | 'FISA';
  batch: string;
  sentOn: string;
  lastAssessmentDate: string;
  counts: string;
  verificationCode: string;
  letter: LetterModel;
}

// Batch N1 (05.20): the simulated Certification view. Every recommendation letter sent at a final
// approval is listed here, internal only (the QP and the SDP never see it).
export function SentToCertificationTab() {
  const { data: eisaBatches = [] } = useResultsBatches();
  const { data: fisaBatches = [] } = useFisaResultsBatches();
  const [openId, setOpenId] = useState<string | null>(null);

  const eisaRows = eisaBatches.flatMap((b): SentRow[] => {
    const letter = eisaRecommendationLetter(b);
    if (!letter || !b.finalDecision || !b.recommendation) return [];
    const f = batchFiguresOf(b);
    return [
      {
        id: b.id,
        track: 'EISA',
        batch: `${b.qualificationTitle} — ${b.qpName}`,
        sentOn: b.recommendation.recommendedAt.slice(0, 10),
        lastAssessmentDate: lastEisaDateOf(b),
        counts: `${f.competent} competent of ${f.registered} registered`,
        verificationCode: verificationCodeOf(b),
        letter,
      },
    ];
  });
  const fisaRows = fisaBatches.flatMap((b): SentRow[] => {
    const letter = fisaRecommendationLetter(b);
    if (!letter || !b.finalDecision || !b.recommendation) return [];
    const f = fisaFiguresOf(b);
    return [
      {
        id: b.id,
        track: 'FISA',
        batch: `${b.skillsProgrammeTitle} — ${b.sdpName}`,
        sentOn: b.recommendation.recommendedAt.slice(0, 10),
        lastAssessmentDate: lastFisaDateOf(b),
        counts: `${f.competent} competent of ${f.enrolled} enrolled`,
        verificationCode: verificationCodeOf(b),
        letter,
      },
    ];
  });
  const rows = [...eisaRows, ...fisaRows].sort((a, b) => b.sentOn.localeCompare(a.sentOn));
  const open = rows.find((r) => r.id === openId);

  return (
    <div className="space-y-6">
      <SectionCard title="Recommendation Letters Received by Certification">
        {rows.length === 0 ? (
          <EmptyState title="No recommendation letters sent yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Track', 'Batch', 'Sent', 'Last assessment', 'Counts', 'Verification code', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.track}-${r.id}`} className="cursor-pointer hover:bg-gray-50" onClick={() => setOpenId(r.id)}>
                    <TableCell>{r.track}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{r.batch}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.sentOn}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.lastAssessmentDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.counts}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{r.verificationCode}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        aria-label={`Download recommendation letter for ${r.batch}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadLetterModel(r.letter);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
      {open && <OutcomeLetterView model={open.letter} />}
    </div>
  );
}
