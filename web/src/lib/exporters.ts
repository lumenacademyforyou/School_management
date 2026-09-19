// Export helpers shared by the console and the web apps: Excel (.xlsx), CSV (with a UTF-8 marker so Excel shows
// ₹ and Tamil correctly) and print / save as PDF. Plus reading a rendered <table> so any list can be exported.
import { XlsxCell, toXlsx } from './xlsx';

export type ExportFormat = 'xlsx' | 'csv' | 'print';

export const FORMAT_LABEL: Record<ExportFormat, string> = { xlsx: 'Excel (.xlsx)', csv: 'CSV', print: 'Print or save as PDF' };

export interface ExportData {
  title: string;
  headers: string[];
  rows: XlsxCell[][];
}

/** "Fees ledger" + date -> fees-ledger-2024-09-16 */
export const fileStem = (title: string, date = new Date().toISOString().slice(0, 10)) =>
  `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export'}-${date}`;

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const plain = (c: XlsxCell) => (c === null || c === undefined ? '' : typeof c === 'object' ? (c.fmt === 'percent' ? `${Math.round(c.v * 1000) / 10}%` : String(c.v)) : String(c));

export const toCsv = (headers: string[], rows: XlsxCell[][]) => {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return '﻿' + [headers, ...rows.map(r => r.map(plain))].map(r => r.map(c => esc(String(c))).join(',')).join('\r\n');
};

const printHtml = ({ title, headers, rows }: ExportData) => {
  const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const right = (c: XlsxCell) => typeof c === 'number' || (typeof c === 'object' && c !== null);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(title)}</title><style>
    body{font-family:Inter,Arial,sans-serif;color:#0c3147;margin:24px}h1{font-size:18px;margin:0 0 4px}p{margin:0 0 16px;color:#5b6e78;font-size:12px}
    table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #ddd4bf;padding:5px 7px;text-align:left;vertical-align:top}
    th{background:#f3eee2}td.n{text-align:right;font-variant-numeric:tabular-nums}@page{margin:12mm}</style></head><body>
    <h1>Lumen Academy · ${e(title)}</h1><p>${rows.length} rows · printed ${new Date().toLocaleString('en-IN')}</p>
    <table><thead><tr>${headers.map(h => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(r => `<tr>${headers.map((_, i) => `<td${right(r[i]) ? ' class="n"' : ''}>${e(plain(r[i]))}</td>`).join('')}</tr>`).join('')}
    </tbody></table></body></html>`;
};

/** Saves the data in the chosen format (print opens the browser's print dialog, where "Save as PDF" is offered). */
export const exportData = (data: ExportData, format: ExportFormat, stem = fileStem(data.title)) => {
  if (format === 'xlsx') download(new Blob([toXlsx(data.title, data.headers, data.rows)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${stem}.xlsx`);
  else if (format === 'csv') download(new Blob([toCsv(data.headers, data.rows)], { type: 'text/csv;charset=utf-8' }), `${stem}.csv`);
  else {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(printHtml(data));
    doc.close();
    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1000);
    }, 50);
  }
};

// ---- reading a rendered table ----

/** "₹1,23,456" -> money, "94.6%" -> percent, "1,234" -> number; anything else stays text. */
export const parseCell = (raw: string): XlsxCell => {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const neg = /^[-−]/.test(s);
  const body = s.replace(/^[-−+]\s?/, '');
  if (/^₹\s?\d[\d,]*(\.\d+)?$/.test(body)) return { v: (neg ? -1 : 1) * Number(body.replace(/[₹,\s]/g, '')), fmt: 'money' };
  if (/^\d[\d,]*(\.\d+)?\s?%$/.test(body)) return { v: (neg ? -1 : 1) * Number(body.replace(/[%,\s]/g, '')) / 100, fmt: 'percent' };
  if (/^\d{1,3}(,\d{2,3})*(\.\d+)?$/.test(body) && body.includes(',')) return (neg ? -1 : 1) * Number(body.replace(/,/g, ''));
  if (/^\d+(\.\d+)?$/.test(body) && !/^0\d/.test(body) && body.length < 12) return (neg ? -1 : 1) * Number(body);
  return s;
};

const SKIP_HEADERS = /^(action|actions|select|)$/i;

/** Visible text with a space between separate pieces, so "INV-0011" + "Paid" never runs together as "INV-0011Paid". */
const spacedText = (el: Element) => {
  const parts: string[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) parts.push(n.textContent ?? '');
    else if (n instanceof Element && !n.matches('button, input, select, textarea, svg, .material-symbols-outlined, [aria-hidden="true"], .sr-only')) {
      // A unit (₹, %) belongs to its number, so no space is added around it
      const glue = n.classList.contains('unit');
      if (!glue) parts.push(' ');
      n.childNodes.forEach(walk);
      if (!glue) parts.push(' ');
    }
  };
  el.childNodes.forEach(walk);
  return parts.join('').replace(/\s+/g, ' ').trim();
};

const cellText = (cell: Element) => spacedText(cell);

/** Reads a table as the user sees it: skips action and checkbox columns, and expanded detail rows. */
export const tableData = (table: HTMLTableElement, title: string): ExportData => {
  const headCells = [...(table.tHead?.rows[0]?.cells ?? [])];
  const keep = headCells.map((th, i) => ({ i, label: cellText(th) })).filter(h => !SKIP_HEADERS.test(h.label) && !headCells[h.i].querySelector('input[type="checkbox"]'));
  const rows = [...table.tBodies].flatMap(b => [...b.rows]).filter(r => r.cells.length === headCells.length);
  return {
    title,
    headers: keep.map(h => h.label),
    rows: rows.map(r => keep.map(h => parseCell(cellText(r.cells[h.i])))),
  };
};

/** A readable name for a table: data-export-title, then the nearest heading in its panel or section. */
export const tableTitle = (table: HTMLTableElement, fallback: string) => {
  const own = table.closest('[data-export-title]')?.getAttribute('data-export-title');
  if (own) return own;
  let node: Element | null = table;
  while (node && node.tagName !== 'MAIN') {
    const heading = node.querySelector(':scope > * h2, :scope > h2, :scope > * h3, :scope > h3, :scope > div > span.font-bold, :scope > div > span.text-xs.font-bold');
    if (heading && !heading.contains(table)) return spacedText(heading).replace(/\(\d+\)$/, '').trim() || fallback;
    node = node.parentElement;
  }
  return fallback;
};
