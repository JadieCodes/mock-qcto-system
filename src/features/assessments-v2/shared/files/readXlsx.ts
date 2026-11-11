import { normaliseHeading } from '../csv/csv';

// QCTO feedback 29.11: an upload may be an Excel .xlsx file as well as a .csv. No spreadsheet
// package is installed, so this reads the file itself: an .xlsx is a zip, so it finds the zip
// central directory, inflates the entries it needs with the browser's DecompressionStream
// ('deflate-raw'; stored entries are read as they are), and reads the first sheet with DOMParser.
// Returns rows of strings, like the CSV reader.

export const XLSX_UNREADABLE_MESSAGE = 'Save the file as .xlsx or .csv and upload it again.';

export type XlsxResult = { ok: true; rows: string[][] } | { ok: false; error: string };

const FAILED: XlsxResult = { ok: false, error: XLSX_UNREADABLE_MESSAGE };
const RELATIONSHIPS_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const OLD_EXCEL_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0]; // .xls (and any other OLE2 file)

interface ZipEntry {
  method: number;
  compressedSize: number;
  localOffset: number;
}

function readZipEntries(bytes: Uint8Array): Map<string, ZipEntry> | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = view.getUint16(eocd + 10, true);
  let pos = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map<string, ZipEntry>();
  for (let i = 0; i < count; i++) {
    if (pos + 46 > bytes.length || view.getUint32(pos, true) !== CENTRAL_SIGNATURE) return null;
    const nameLength = view.getUint16(pos + 28, true);
    const extraLength = view.getUint16(pos + 30, true);
    const commentLength = view.getUint16(pos + 32, true);
    const name = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLength));
    entries.set(name, { method: view.getUint16(pos + 10, true), compressedSize: view.getUint32(pos + 20, true), localOffset: view.getUint32(pos + 42, true) });
    pos += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readEntryText(bytes: Uint8Array, entries: Map<string, ZipEntry>, name: string): Promise<string | null> {
  const entry = entries.get(name);
  if (!entry) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(entry.localOffset, true) !== LOCAL_SIGNATURE) return null;
  const start = entry.localOffset + 30 + view.getUint16(entry.localOffset + 26, true) + view.getUint16(entry.localOffset + 28, true);
  const raw = bytes.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return new TextDecoder().decode(raw);
  if (entry.method === 8) return new TextDecoder().decode(await inflateRaw(raw));
  return null;
}

function parseXml(text: string): Element | null {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const root = doc.documentElement;
  return root && root.localName !== 'parsererror' && doc.getElementsByTagName('parsererror').length === 0 ? root : null;
}

function localNameOf(element: Element): string {
  return element.localName ?? element.tagName.split(':').pop() ?? '';
}

// Matching on the local name, so a file that prefixes its tags (x:row) reads the same.
function descendants(root: Element, name: string): Element[] {
  const found: Element[] = [];
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (localNameOf(child) === name) found.push(child);
      walk(child);
    }
  };
  walk(root);
  return found;
}

function childrenNamed(node: Element, name: string): Element[] {
  return Array.from(node.children).filter((c) => localNameOf(c) === name);
}

// Text of a string item: the plain text and rich-text runs, never the phonetic hints (rPh).
function stringItemText(item: Element): string {
  return Array.from(item.children)
    .flatMap((child) => {
      const name = localNameOf(child);
      if (name === 't') return [child.textContent ?? ''];
      if (name === 'r') return childrenNamed(child, 't').map((t) => t.textContent ?? '');
      return [];
    })
    .join('');
}

function columnIndex(cellRef: string): number {
  const letters = /^[A-Za-z]+/.exec(cellRef)?.[0].toUpperCase() ?? '';
  let index = 0;
  for (const ch of letters) index = index * 26 + (ch.charCodeAt(0) - 64);
  return index - 1;
}

// Excel's 1900 date system: serial 1 is 1900-01-01, and serial 61 is 1900-03-01 because Excel
// counts a 29 Feb 1900 that never existed, so day 0 for every real date is 1899-12-30.
export function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1) return null;
  const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000);
  return date.toISOString().slice(0, 10);
}

function targetPath(target: string): string {
  return target.startsWith('/') ? target.slice(1) : `xl/${target}`;
}

export async function readXlsx(data: ArrayBuffer | Uint8Array, options: { dateHeading?: string } = {}): Promise<XlsxResult> {
  try {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (OLD_EXCEL_SIGNATURE.every((b, i) => bytes[i] === b)) return FAILED;
    const entries = readZipEntries(bytes);
    if (!entries) return FAILED;

    const workbookXml = await readEntryText(bytes, entries, 'xl/workbook.xml');
    const relsXml = await readEntryText(bytes, entries, 'xl/_rels/workbook.xml.rels');
    if (!workbookXml || !relsXml) return FAILED;
    const workbook = parseXml(workbookXml);
    const rels = parseXml(relsXml);
    if (!workbook || !rels) return FAILED;

    const firstSheet = descendants(workbook, 'sheet')[0];
    const relationshipId = firstSheet?.getAttributeNS(RELATIONSHIPS_NS, 'id') || firstSheet?.getAttribute('r:id');
    const target = descendants(rels, 'Relationship').find((r) => r.getAttribute('Id') === relationshipId)?.getAttribute('Target');
    if (!target) return FAILED;

    const sharedXml = await readEntryText(bytes, entries, 'xl/sharedStrings.xml');
    const sharedRoot = sharedXml ? parseXml(sharedXml) : null;
    if (sharedXml && !sharedRoot) return FAILED;
    const shared = sharedRoot ? descendants(sharedRoot, 'si').map(stringItemText) : [];

    const sheetXml = await readEntryText(bytes, entries, targetPath(target));
    const sheet = sheetXml ? parseXml(sheetXml) : null;
    if (!sheet) return FAILED;

    const grid: { text: string; numeric: boolean }[][] = [];
    for (const row of descendants(sheet, 'row')) {
      const cells: { text: string; numeric: boolean }[] = [];
      let next = 0;
      for (const cell of childrenNamed(row, 'c')) {
        const ref = cell.getAttribute('r');
        const index = ref ? columnIndex(ref) : next;
        next = index + 1;
        const type = cell.getAttribute('t');
        const value = childrenNamed(cell, 'v')[0]?.textContent ?? '';
        let text = '';
        let numeric = false;
        if (type === 's') text = shared[Number(value)] ?? '';
        else if (type === 'inlineStr') text = childrenNamed(cell, 'is').map(stringItemText).join('');
        else if (type === 'str') text = value;
        else if (type === 'b') text = value === '1' ? 'TRUE' : 'FALSE';
        else if (type === 'e') text = '';
        else {
          text = value;
          numeric = value.trim() !== '' && Number.isFinite(Number(value));
        }
        while (cells.length < index) cells.push({ text: '', numeric: false });
        cells[index] = { text, numeric };
      }
      grid.push(cells);
    }

    const headerIndex = grid.findIndex((cells) => cells.some((c) => c.text.trim() !== ''));
    const dateColumn =
      options.dateHeading && headerIndex >= 0
        ? grid[headerIndex].findIndex((c) => normaliseHeading(c.text) === normaliseHeading(options.dateHeading ?? ''))
        : -1;
    const rows = grid.map((cells, rowIndex) =>
      cells.map((cell, col) => {
        if (rowIndex > headerIndex && col === dateColumn && cell.numeric) return excelSerialToIso(Number(cell.text)) ?? cell.text;
        return cell.text;
      }),
    );
    return { ok: true, rows };
  } catch {
    return FAILED;
  }
}
