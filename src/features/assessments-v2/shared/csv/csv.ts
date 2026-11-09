// Shared CSV reading and writing (moved out of the EISA Calendar bulk upload for the File 3
// results upload, QCTO feedback 05.24). No spreadsheet library is installed, so files are CSV.
//
// Batch L2.1: Excel on South African settings uses ";" as the list separator and "," as the
// decimal mark, so a plain comma file opens as one column and a re-saved file comes back with
// semicolons. Templates therefore start with a byte-order mark and a "sep=," line, and the
// reader works out the delimiter from the heading row.
export const EXCEL_UPLOAD_TIP =
  'Tip: in Excel use File > Save As > CSV UTF-8 (Comma delimited). The leading 0 in ID numbers is restored automatically.';

export const EXCEL_FORMAT_MESSAGE =
  "Excel may have changed the file's format. Download the template again, fill it in and save it as 'CSV UTF-8 (Comma delimited)'. Do not split or rename the columns.";

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
const SEP_LINE = /^sep=(.)[ \t]*(?:\r\n|\n|\r|$)/i;
const CANDIDATE_DELIMITERS = [',', ';'];

export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// What every downloaded template starts with: a BOM (Excel reads the file as UTF-8) and "sep=,"
// (Excel splits on commas whatever the regional list separator is).
export function withExcelPrefix(csv: string): string {
  return `${BYTE_ORDER_MARK}sep=,\r\n${csv}`;
}

// Heading comparison ignores case, extra spaces and a leading byte-order mark.
export function normaliseHeading(heading: string): string {
  return heading.replace(new RegExp(`^${BYTE_ORDER_MARK}`), '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// Handles quoted fields ("a, b"), doubled quotes, CRLF and a leading byte-order mark.
export function parseCsv(text: string, delimiter = ','): string[][] {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export type CsvTableResult = { ok: true; rows: string[][]; delimiter: string } | { ok: false; error: string };

// Reads a template-based upload. A "sep=" first line is skipped and its delimiter tried first;
// otherwise "," or ";" is chosen by which one splits the heading row into the expected columns.
// Blank lines are dropped. A file where neither works gets the Excel message.
export function parseCsvTable(text: string, expectedHeadings: string[]): CsvTableResult {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const sep = SEP_LINE.exec(withoutBom);
  const body = sep ? withoutBom.slice(sep[0].length) : withoutBom;
  const expected = expectedHeadings.map(normaliseHeading);

  const candidates = sep ? [sep[1], ...CANDIDATE_DELIMITERS.filter((d) => d !== sep[1])] : CANDIDATE_DELIMITERS;
  for (const delimiter of candidates) {
    const rows = parseCsv(body, delimiter).filter((cells) => cells.some((c) => c.trim() !== ''));
    if (rows.length === 0) continue;
    const header = rows[0].map(normaliseHeading);
    if (expected.every((h) => header.includes(h))) return { ok: true, rows, delimiter };
  }
  if (body.trim() === '') return { ok: false, error: 'The file is empty. Download the template and fill it in.' };
  return { ok: false, error: EXCEL_FORMAT_MESSAGE };
}

// Browser download of a CSV the page just built (nothing is stored or sent anywhere).
export function downloadCsvFile(fileName: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
