import { Fragment, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ASSESSMENT_COMPONENT_TYPE_LABELS } from '../../qsa-addendum/assessmentDetails';
import { calculateLearnerResult, EISA_OUTCOME_LABELS, reasonText, type EisaLearnerOutcome } from '../calculation';
import type { ResultsBatch } from '../types';

const OUTCOME_CLASS: Record<EisaLearnerOutcome, string> = {
  competent: 'text-emerald-700',
  'not-yet-competent': 'text-amber-700',
  absent: 'text-gray-500',
};

// QCTO feedback 29.31/29.32, Batch L1.1: per learner, the mark ("EISA Component Achievement
// Value"), component % and C/NYC per component (each component header shows its EISA date, highest
// and lowest mark and weighting), then the EISA Percentage Obtained (decimal and final), the pass
// % and the final result with its reason. Click a learner for the detail. Read-only, both portals.
export function EisaLearnerResultsTable({ batch }: { batch: ResultsBatch }) {
  const [openLearnerId, setOpenLearnerId] = useState<string | null>(null);
  const { components, addendumPassPercent } = batch;
  const columnCount = components.length + 5;

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Learner</TableHead>
            {components.map((c) => (
              <TableHead key={c.id} className="whitespace-nowrap align-bottom">
                <span className="block text-gray-700">{c.name}</span>
                <span className="block text-[11px] font-normal text-gray-500">
                  EISA date {c.eisaDate} · {c.weightingPercent}%
                </span>
                <span className="block text-[11px] font-normal text-gray-500">
                  Highest {c.highestMark}, lowest {c.lowestMark}
                </span>
              </TableHead>
            ))}
            <TableHead className="whitespace-nowrap align-bottom">
              EISA % obtained
              <span className="block text-[11px] font-normal text-gray-500">decimal / final</span>
            </TableHead>
            <TableHead className="whitespace-nowrap align-bottom">Pass %</TableHead>
            <TableHead className="whitespace-nowrap align-bottom">Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batch.learnerResults.map((learner) => {
            const calc = calculateLearnerResult(components, learner, addendumPassPercent);
            const open = openLearnerId === learner.learnerId;
            return (
              <Fragment key={learner.learnerId}>
                <TableRow>
                  <TableCell className="whitespace-nowrap">
                    <button
                      type="button"
                      className="text-left font-medium text-blue-700 underline-offset-2 hover:underline"
                      aria-expanded={open}
                      onClick={() => setOpenLearnerId(open ? null : learner.learnerId)}
                    >
                      {learner.fullName}
                    </button>
                    <span className="block font-mono text-xs text-gray-500">{learner.idNumber}</span>
                  </TableCell>
                  {calc.components.map((r) => (
                    <TableCell key={r.componentId} className="whitespace-nowrap">
                      {r.mark === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <>
                          <span className="font-medium">{r.mark}</span>{' '}
                          <span className="text-xs text-gray-500">({r.percent}%)</span>{' '}
                          <span className={cn('text-xs', r.competent ? 'text-emerald-700' : 'text-amber-700')}>{r.competent ? 'C' : 'NYC'}</span>
                        </>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="whitespace-nowrap">
                    {calc.eisaPercentDecimal === null ? '—' : `${calc.eisaPercentDecimal}% / ${calc.eisaPercentFinal}%`}
                  </TableCell>
                  <TableCell>{addendumPassPercent}%</TableCell>
                  <TableCell className={cn('font-medium', OUTCOME_CLASS[calc.outcome])}>
                    <span className="whitespace-nowrap">{EISA_OUTCOME_LABELS[calc.outcome]}</span>
                    {calc.reasons.length > 0 && <span className="block text-xs font-normal">{reasonText(calc)}</span>}
                  </TableCell>
                </TableRow>
                {open && (
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableCell colSpan={columnCount}>
                      <p className="mb-1 text-xs text-gray-600">
                        <span className="font-medium text-gray-700">{learner.fullName}</span> — ID number <span className="font-mono">{learner.idNumber}</span>
                      </p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {components.map((c, i) => {
                          const r = calc.components[i];
                          return (
                            <li key={c.id}>
                              <span className="font-medium text-gray-700">{c.name}</span> ({ASSESSMENT_COMPONENT_TYPE_LABELS[c.type]}) — EISA date {c.eisaDate}:{' '}
                              {r.mark === null
                                ? 'Absent'
                                : `EISA Component Achievement Value ${r.mark} of ${c.highestMark} = ${r.percent}%, weighted value ${r.weightedValue} (weighting ${c.weightingPercent}%), lowest mark ${c.lowestMark} — ${r.competent ? 'Competent' : 'Not yet competent'}`}
                            </li>
                          );
                        })}
                      </ul>
                      {calc.eisaPercentDecimal !== null && (
                        <p className="mt-2 text-xs text-gray-600">
                          EISA Percentage Obtained {calc.eisaPercentDecimal}% (final {calc.eisaPercentFinal}%), pass % {addendumPassPercent}% —{' '}
                          <span className={cn('font-medium', OUTCOME_CLASS[calc.outcome])}>{EISA_OUTCOME_LABELS[calc.outcome]}</span>
                          {calc.reasons.length > 0 && ` (${reasonText(calc)})`}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      <p className="border-t px-3 py-2 text-xs text-gray-500">
        Each mark is the EISA Component Achievement Value; the % beside it is mark ÷ highest mark. C = competent in the component (mark at least the lowest mark), NYC = not yet
        competent. EISA % obtained = the sum of each component % × weighting ÷ 100 (2 decimals, then rounded to a whole number). A learner is Competent when the final EISA %
        is at least the pass % ({addendumPassPercent}%) and the learner is competent in every component.
      </p>
    </div>
  );
}
