// Batch Z1 (11.7): writes a real .xlsx file with no package. An .xlsx is a zip of XML parts, so this
// builds the zip itself with stored (uncompressed) entries and a CRC32 per entry, the same way
// readXlsx.ts reads one. One worksheet, text as inline strings, a bold frozen header row, sensible
// column widths, dates as Excel serial numbers shown as yyyy/mm/dd (QCTO's register format).

export interface XlsxDate {
  // YYYY-MM-DD
  date: string;
}

// Text, a number, or a date; null leaves the cell empty.
export type XlsxCell = string | number | XlsxDate | null;

export interface XlsxSheet {
  sheetName: string;
  headings: string[];
  rows: XlsxCell[][];
}

export const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const XLSX_DATE_FORMAT = 'yyyy/mm/dd';

const STYLE_DEFAULT = 0;
const STYLE_HEADER = 1;
const STYLE_DATE = 2;
const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 50;
const DATE_COLUMN_WIDTH = 12;

// Excel's 1900 date system, as in readXlsx.ts excelSerialToIso(): day 0 for every real date is 1899-12-30.
export function isoToExcelSerial(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(ms);
  if (date.getUTCFullYear() !== Number(match[1]) || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[3])) return null;
  return Math.round((ms - Date.UTC(1899, 11, 30)) / 86_400_000);
}

function isDateCell(cell: XlsxCell): cell is XlsxDate {
  return typeof cell === 'object' && cell !== null;
}

// ----- zip -----

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// 1 Jan 1980 00:00, the earliest time a zip can hold, so the same data always gives the same file.
const DOS_TIME = 0;
const DOS_DATE = (1 << 5) | 1;
const UTF8_NAME_FLAG = 0x0800;

interface ZipPart {
  name: string;
  data: Uint8Array;
}

export function zipStored(parts: ZipPart[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const part of parts) {
    const name = encoder.encode(part.name);
    const crc = crc32(part.data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, UTF8_NAME_FLAG, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, DOS_TIME, true);
    lv.setUint16(12, DOS_DATE, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, part.data.length, true);
    lv.setUint32(22, part.data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);

    const entry = new Uint8Array(46 + name.length);
    const cv = new DataView(entry.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, UTF8_NAME_FLAG, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, DOS_TIME, true);
    cv.setUint16(14, DOS_DATE, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, part.data.length, true);
    cv.setUint32(24, part.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    entry.set(name, 46);

    chunks.push(local, part.data);
    central.push(entry);
    offset += local.length + part.data.length;
  }

  const centralSize = central.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, parts.length, true);
  ev.setUint16(10, parts.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const all = [...chunks, ...central, end];
  const out = new Uint8Array(all.reduce((sum, c) => sum + c.length, 0));
  let pos = 0;
  for (const chunk of all) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

// ----- sheet XML -----

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

function escapeXml(text: string): string {
  // Control characters other than tab, line feed and carriage return are not allowed in XML 1.0.
  // eslint-disable-next-line no-control-regex
  const clean = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return clean.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// A, B, ... Z, AA, AB ...
export function columnLetters(index: number): string {
  let letters = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return letters;
}

function textCell(ref: string, text: string, style: number): string {
  return `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function cellXml(ref: string, cell: XlsxCell): string {
  if (cell === null || cell === '') return '';
  if (typeof cell === 'number') return Number.isFinite(cell) ? `<c r="${ref}"><v>${cell}</v></c>` : '';
  if (isDateCell(cell)) {
    const serial = isoToExcelSerial(cell.date);
    return serial === null ? textCell(ref, cell.date, STYLE_DEFAULT) : `<c r="${ref}" s="${STYLE_DATE}"><v>${serial}</v></c>`;
  }
  return textCell(ref, cell, STYLE_DEFAULT);
}

function columnWidths(sheet: XlsxSheet): number[] {
  return sheet.headings.map((heading, col) => {
    const lengths = sheet.rows.map((row) => {
      const cell = row[col] ?? null;
      if (typeof cell === 'string') return cell.length;
      if (typeof cell === 'number') return String(cell).length;
      return isDateCell(cell) ? DATE_COLUMN_WIDTH : 0;
    });
    return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, heading.length, ...lengths) + 2);
  });
}

function worksheetXml(sheet: XlsxSheet): string {
  const cols = columnWidths(sheet)
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');
  const header = sheet.headings.map((h, c) => textCell(`${columnLetters(c)}1`, h, STYLE_HEADER)).join('');
  const body = sheet.rows
    .map((row, r) => {
      const cells = sheet.headings.map((_, c) => cellXml(`${columnLetters(c)}${r + 2}`, row[c] ?? null)).join('');
      return `<row r="${r + 2}">${cells}</row>`;
    })
    .join('');
  return (
    `${XML_HEADER}<worksheet xmlns="${MAIN_NS}" xmlns:r="${REL_NS}">` +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>' +
    `<sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols>` +
    `<sheetData><row r="1">${header}</row>${body}</sheetData></worksheet>`
  );
}

const STYLES_XML =
  `${XML_HEADER}<styleSheet xmlns="${MAIN_NS}">` +
  `<numFmts count="1"><numFmt numFmtId="164" formatCode="${XLSX_DATE_FORMAT}"/></numFmts>` +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="3">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

// A sheet name is at most 31 characters and has none of  \ / ? * [ ] :
function safeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet1';
}

export function writeXlsx(sheet: XlsxSheet): Uint8Array {
  const encoder = new TextEncoder();
  const part = (name: string, xml: string): ZipPart => ({ name, data: encoder.encode(xml) });
  return zipStored([
    part(
      '[Content_Types].xml',
      `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
    ),
    part(
      '_rels/.rels',
      `${XML_HEADER}<Relationships xmlns="${PACKAGE_REL_NS}">` +
        `<Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    part(
      'xl/workbook.xml',
      `${XML_HEADER}<workbook xmlns="${MAIN_NS}" xmlns:r="${REL_NS}"><sheets>` +
        `<sheet name="${escapeXml(safeSheetName(sheet.sheetName))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    part(
      'xl/_rels/workbook.xml.rels',
      `${XML_HEADER}<Relationships xmlns="${PACKAGE_REL_NS}">` +
        `<Relationship Id="rId1" Type="${REL_NS}/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="${REL_NS}/styles" Target="styles.xml"/></Relationships>`,
    ),
    part('xl/styles.xml', STYLES_XML),
    part('xl/worksheets/sheet1.xml', worksheetXml(sheet)),
  ]);
}

export function downloadXlsxFile(fileName: string, bytes: Uint8Array): void {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: XLSX_MIME_TYPE }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
