import { StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
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
    { label: 'Throughput rate', value: `${f.throughputRatePercent}%` },
  ];
  return (
    <div className="space-y-1.5">
      <StatTileGrid className="grid-cols-2 sm:grid-cols-4">
        {tiles.map((t) => (
          <StatTile key={t.label} label={t.label} value={t.value} />
        ))}
      </StatTileGrid>
      <p className="text-xs text-gray-500">Competency rate = competent ÷ wrote. Absenteeism = absent ÷ registered. Throughput rate = wrote ÷ registered.</p>
    </div>
  );
}
