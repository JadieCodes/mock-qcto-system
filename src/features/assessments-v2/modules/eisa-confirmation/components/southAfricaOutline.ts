// Hand-drawn, approximate South Africa for the centre map (QCTO 29.21): [longitude, latitude]
// points, projected by `project` below. Not survey data; the real system will use a GIS map.
export type LonLat = [number, number];
export type Point = [number, number];

export const MAP_WIDTH = 700;
export const MAP_HEIGHT = 520;
const LON_MIN = 16;
const LON_MAX = 33.5;
const LAT_MAX = -22;
const LAT_MIN = -35;

// Equirectangular: longitude and latitude map straight onto x and y (40 px per degree).
export function project(longitude: number, latitude: number): Point {
  return [((longitude - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_WIDTH, ((LAT_MAX - latitude) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT];
}

// Clockwise from the Orange River mouth: Namibia, Botswana and Zimbabwe borders, the Limpopo,
// Mozambique, round the Eswatini inlet, then the coast back round to the start.
export const SOUTH_AFRICA: LonLat[] = [
  [16.45, -28.62], [17.7, -28.78], [19.1, -28.95], [20.0, -28.5],
  [20.0, -24.77], [20.5, -26.0], [20.7, -26.8], [22.5, -26.2], [23.5, -25.85], [24.6, -25.75], [25.6, -25.6],
  [26.3, -24.6], [27.1, -23.9], [27.9, -23.0], [28.9, -22.4], [29.4, -22.15], [30.0, -22.3], [31.3, -22.4],
  [31.55, -23.2], [31.95, -24.6], [31.98, -25.35],
  [31.95, -25.98], [31.3, -25.74], [30.8, -26.3], [30.9, -26.9], [31.3, -27.3], [32.0, -27.3], [32.1, -26.85], [32.9, -26.85],
  [32.85, -28.0], [32.4, -28.4], [32.1, -28.8], [31.0, -29.9], [30.4, -30.75], [29.5, -31.65], [28.5, -32.5], [27.9, -33.05],
  [26.5, -33.75], [25.6, -34.05], [24.0, -34.15], [22.0, -34.15], [20.0, -34.82], [18.85, -34.4], [18.47, -34.35], [18.4, -33.9],
  [18.0, -33.1], [18.3, -32.0], [17.3, -30.3], [16.87, -29.25],
];

// Lesotho sits inside South Africa; Eswatini sits in the Mpumalanga and KwaZulu-Natal border.
export const LESOTHO: LonLat[] = [
  [27.0, -29.6], [27.45, -29.0], [28.4, -28.6], [29.0, -28.9], [29.4, -29.4], [28.9, -30.1], [28.3, -30.65], [27.6, -30.5], [27.2, -30.1],
];
export const ESWATINI: LonLat[] = [
  [31.3, -25.74], [31.95, -25.98], [32.1, -26.85], [32.0, -27.3], [31.3, -27.3], [30.9, -26.9], [30.8, -26.3],
];

export const PROVINCE_LABELS: { name: string; at: LonLat }[] = [
  { name: 'Western Cape', at: [21.5, -33.2] },
  { name: 'Northern Cape', at: [21.5, -29.8] },
  { name: 'Eastern Cape', at: [26.5, -32.3] },
  { name: 'Free State', at: [26.0, -28.6] },
  { name: 'KwaZulu-Natal', at: [30.7, -28.9] },
  { name: 'North West', at: [24.8, -26.5] },
  { name: 'Gauteng', at: [28.0, -26.1] },
  { name: 'Mpumalanga', at: [29.9, -25.4] },
  { name: 'Limpopo', at: [28.0, -23.3] },
];

export function toPath(points: LonLat[]): string {
  return `${points.map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${project(lon, lat).map((n) => n.toFixed(1)).join(' ')}`).join(' ')} Z`;
}

export function pointInPolygon([x, y]: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
