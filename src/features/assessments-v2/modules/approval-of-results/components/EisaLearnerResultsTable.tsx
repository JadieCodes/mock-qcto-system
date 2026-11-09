import { Fragment, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ASSESSMENT_COMPONENT_TYPE_LABELS } from '../../qsa-addendum/assessmentDetails';
import { calculateLearnerResult, EISA_OUTCOME_LABELS, type EisaLearnerOutcome } from '../calculation';
import type { ResultsBatch } from '../types';

const OUTCOME_CLASS: Record<EisaLearnerOutcome, string> = {
  competent: 'text-emerald-700',
  'not-yet-competent': 'text-amber-700',
  absent: 'text-gray-500',
};

// QCTO feedback 29.31/29.32: per learner, the mark and result per component (each component
// header shows its EISA date, total and pass mark), the weighted score and the final result.
// Click a learner for the detail: each component with its EISA date. Read-only, both portals.
export function EisaLearnerResultsTable({ batch }: { batch: ResultsBatch }) {
  const [openLearnerId, setOpenLearnerId] = useState<string | null>(null);
  const { components } = batch;
  const columnCount = components.length + 3;

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
                  Out of {c.totalMarks}, pass {c.passMark}
                </span>
              </TableHead>
            ))}
            <TableHead className="whitespace-nowrap">Weighted score</TableHead>
            <TableHead className="whitespace-nowrap">Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batch.learnerResults.map((learner) => {
            const calc = calculateLearnerResult(components, learner);
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
                          <span className={cn('text-xs', r.competent ? 'text-emerald-700' : 'text-amber-700')}>{r.competent ? 'C' : 'NYC'}</span>
                        </>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>{calc.weightedScorePercent === null ? '—' : `${calc.weightedScorePercent}%`}</TableCell>
                  <TableCell className={cn('whitespace-nowrap font-medium', OUTCOME_CLASS[calc.outcome])}>{EISA_OUTCOME_LABELS[calc.outcome]}</TableCell>
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
                                : `${r.mark} of ${c.totalMarks} (pass mark ${c.passMark}) — ${r.competent ? 'Competent' : 'Not yet competent'}`}
                            </li>
                          );
                        })}
                      </ul>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      <p className="border-t px-3 py-2 text-xs text-gray-500">
        C = competent in the component (mark at least the pass mark), NYC = not yet competent. A learner is Competent only when competent in every
        component.
      </p>
    </div>
  );
}
