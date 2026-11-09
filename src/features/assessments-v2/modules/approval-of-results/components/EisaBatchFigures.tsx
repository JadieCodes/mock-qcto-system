import { batchFiguresOf } from '../calculation';
import type { ResultsBatch } from '../types';

// QCTO feedback 29.31: the batch figures, on the internal workspace and the QP's batch detail.
export function EisaBatchFigures({ batch }: { batch: Pick<ResultsBatch, 'components' | 'addendumPassPercent' | 'learnerResults'> }) {
  const f = batchFiguresOf(batch);
  const tiles: { label: string; value: string }[] = [
    { label: 'Registered', value: String(f.registered) },
    { label: 'Wrote', value: String(f.wrote) },
    { label: 'Absent', value: String(f.absent) },
    { label: 'Competent', value: String(f.competent) },
    { label: 'Not yet competent', value: String(f.notYetCompetent) },
    { label: 'Competency rate', value: `${f.competenceRatePercent}%` },
    { label: 'Absenteeism', value: `${f.absenteeismPercent}%` },
  ];
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border bg-gray-50 px-3 py-2">
            <p className="text-lg font-bold text-gray-900">{t.value}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{t.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">Competency rate = competent ÷ wrote. Absenteeism = absent ÷ registered.</p>
    </div>
  );
}

