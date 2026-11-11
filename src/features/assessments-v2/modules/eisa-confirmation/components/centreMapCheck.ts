import { ASSESSMENT_CENTRES } from '../../../mock/data/assessmentCentres';
import { ESWATINI, LESOTHO, SOUTH_AFRICA, pointInPolygon, project, type LonLat } from './southAfricaOutline';

const toPoints = (ring: LonLat[]) => ring.map(([lon, lat]) => project(lon, lat));

// Sanity check for the hand-drawn outline: every centre, projected, must fall inside South Africa
// and outside Lesotho and Eswatini. Returns the problems found (empty means all good).
// Run it by bundling this file with esbuild (see progress.md, Batch M map).
export function checkCentresInsideOutline(): string[] {
  const outline = toPoints(SOUTH_AFRICA);
  const lesotho = toPoints(LESOTHO);
  const eswatini = toPoints(ESWATINI);
  const problems: string[] = [];
  for (const c of ASSESSMENT_CENTRES) {
    const p = project(c.longitude, c.latitude);
    if (!pointInPolygon(p, outline)) problems.push(`${c.name} (${c.town}) is outside the South Africa outline`);
    if (pointInPolygon(p, lesotho)) problems.push(`${c.name} (${c.town}) is inside Lesotho`);
    if (pointInPolygon(p, eswatini)) problems.push(`${c.name} (${c.town}) is inside Eswatini`);
  }
  return problems;
}
