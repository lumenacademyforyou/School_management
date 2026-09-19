import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { viewMeta } from '../../data/adminNav';
import { ROLE_LABEL, canExportView } from '../../data/staffAccess';
import { EmptyNote } from '../common/EmptyNote';
import { ExportFormat, FORMAT_LABEL, exportData, tableData, tableTitle } from '../../lib/exporters';
import { logExport } from '../../services/exportLog';

interface Found {
  el: HTMLTableElement;
  title: string;
  rows: number;
}

const FORMAT_ICON: Record<ExportFormat, string> = { xlsx: 'table_view', csv: 'description', print: 'print' };

/**
 * Header "Export": exports any list on the current screen, as the user sees it (search and filters applied), to
 * Excel, CSV or print / PDF. Every export is recorded in the audit log.
 */
export const ExportMenu: React.FC = () => {
  const { adminView, currentUser, addToast } = useApp();
  const [open, setOpen] = useState(false);
  const [found, setFound] = useState<Found[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const allowed = canExportView(currentUser.staffRole, adminView);
  const screen = viewMeta(adminView).label;

  const scan = () => {
    const tables = [...document.querySelectorAll<HTMLTableElement>('main table')].filter(t => t.offsetParent !== null && t.tHead && t.tBodies.length);
    setFound(
      tables.map((el, i) => ({
        el,
        title: tableTitle(el, tables.length > 1 ? `${screen} list ${i + 1}` : screen),
        rows: [...el.tBodies].reduce((n, b) => n + [...b.rows].filter(r => r.cells.length === (el.tHead?.rows[0]?.cells.length ?? 0)).length, 0),
      }))
    );
  };

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  useEffect(() => setOpen(false), [adminView]);

  const run = (f: Found, format: ExportFormat) => {
    const data = tableData(f.el, f.title);
    if (!data.rows.length) {
      addToast('Nothing to export', 'warning', 'This list is empty with the current search and filters. Clear them and try again.');
      return;
    }
    exportData(data, format, undefined);
    logExport({ by: currentUser.name, role: ROLE_LABEL[currentUser.staffRole], screen, list: f.title, rows: data.rows.length, format });
    addToast(format === 'print' ? `Opening print for ${f.title}` : `Exported ${data.rows.length} rows to ${FORMAT_LABEL[format]}`, 'success', 'Recorded in the audit log.');
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          if (!allowed) return;
          scan();
          setOpen(o => !o);
        }}
        aria-disabled={!allowed}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={allowed ? 'Export a list on this screen to Excel, CSV or PDF' : `${ROLE_LABEL[currentUser.staffRole]} can view this screen but not take its data out of the system. Ask the Principal if you need an export.`}
        className={`flex items-center gap-1.5 border border-line bg-surface text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors ${allowed ? 'text-ink hover:bg-subtle' : 'text-slate-400 cursor-not-allowed'}`}
        data-export-menu
      >
        <span className="material-symbols-outlined text-base">download</span>
        <span className="hidden sm:inline">Export</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-80 bg-surface rounded-xl shadow-xl border border-line-soft p-3 z-50 animate-dropdown space-y-2" role="dialog" aria-label="Export">
          <p className="text-xs font-semibold text-ink">Export from {screen}</p>
          <p className="text-[11px] text-ink-muted">Exactly what is on screen, with your search and filters. Recorded in the audit log.</p>
          {found.length === 0 ? (
            <EmptyNote>There is no list on this screen to export. Open a tab with a table first.</EmptyNote>
          ) : (
            <ul className="space-y-2">
              {found.map((f, i) => (
                <li key={i} className="rounded-lg border border-line-soft p-2" data-export-list={f.title}>
                  <p className="text-xs font-semibold text-ink">
                    {f.title} <span className="font-normal text-ink-muted">· {f.rows} row{f.rows === 1 ? '' : 's'}</span>
                  </p>
                  <div className="mt-1.5 grid grid-cols-3 gap-1">
                    {(['xlsx', 'csv', 'print'] as ExportFormat[]).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => run(f, fmt)}
                        className="flex flex-col items-center gap-0.5 rounded-md border border-line bg-wash px-1 py-1.5 text-[10px] font-semibold text-ink hover:bg-subtle"
                        aria-label={`${f.title}: ${FORMAT_LABEL[fmt]}`}
                      >
                        <span className="material-symbols-outlined text-base text-ink-soft">{FORMAT_ICON[fmt]}</span>
                        {fmt === 'xlsx' ? 'Excel' : fmt === 'csv' ? 'CSV' : 'Print / PDF'}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
