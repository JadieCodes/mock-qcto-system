import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AssessmentCentre } from '../../../mock/data/assessmentCentres';
import { ESWATINI, LESOTHO, MAP_HEIGHT, MAP_WIDTH, PROVINCE_LABELS, SOUTH_AFRICA, project, toPath } from './southAfricaOutline';

interface Props {
  centres: AssessmentCentre[];
  selectedIds: string[];
  // Without it the map is read only.
  onToggle?: (centreId: string) => void;
}

const SOUTH_AFRICA_PATH = toPath(SOUTH_AFRICA);
const LESOTHO_PATH = toPath(LESOTHO);
const ESWATINI_PATH = toPath(ESWATINI);
const ASPECT_STYLE = { aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` };

// 29.21: the accredited assessment centres on a simplified map. Pure SVG, no tiles or network;
// the dots are real buttons laid over it so they work with the keyboard.
export function CentreMap({ centres, selectedIds, onToggle }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  return (
    <figure className="space-y-2">
      <div className="relative mx-auto w-full max-w-xl rounded-xl border bg-card" style={ASPECT_STYLE}>
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Simplified map of South Africa">
          <path d={SOUTH_AFRICA_PATH} className="fill-muted stroke-border" strokeWidth={1.5} strokeLinejoin="round" />
          <path d={LESOTHO_PATH} className="fill-card stroke-border" strokeWidth={1.5} strokeLinejoin="round" />
          <path d={ESWATINI_PATH} className="fill-card stroke-border" strokeWidth={1.5} strokeLinejoin="round" />
          {PROVINCE_LABELS.map((p) => {
            const [x, y] = project(...p.at);
            return (
              <text key={p.name} x={x} y={y} textAnchor="middle" className="fill-muted-foreground" fontSize={11} opacity={0.7}>
                {p.name}
              </text>
            );
          })}
        </svg>
        {centres.map((c) => {
          const [x, y] = project(c.longitude, c.latitude);
          const selected = selectedIds.includes(c.centreId);
          const label = `${c.name}, ${c.town}${onToggle ? (selected ? ', selected' : ', not selected') : ''}`;
          return (
            <div
              key={c.centreId}
              className={cn('absolute -translate-x-1/2 -translate-y-1/2', activeId === c.centreId && 'z-10')}
              style={{ left: `${(x / MAP_WIDTH) * 100}%`, top: `${(y / MAP_HEIGHT) * 100}%` }}
            >
              <button
                type="button"
                aria-label={label}
                aria-pressed={onToggle ? selected : undefined}
                onClick={onToggle ? () => onToggle(c.centreId) : undefined}
                onMouseEnter={() => setActiveId(c.centreId)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(c.centreId)}
                onBlur={() => setActiveId(null)}
                className={cn('flex h-7 w-7 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', !onToggle && 'cursor-default')}
              >
                <span className={cn('block h-4 w-4 rounded-full border-2 border-primary', selected ? 'bg-primary' : 'bg-background')} />
              </button>
              {activeId === c.centreId && (
                <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow">
                  <span className="font-medium">{c.name}</span> · {c.town}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <figcaption className="text-xs text-muted-foreground">Simplified map for the wireframe. The real system will use a GIS map from the Accreditation data.</figcaption>
    </figure>
  );
}
