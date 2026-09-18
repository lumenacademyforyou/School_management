// Every export is recorded (who, which list, how many rows, which format). The server will keep this log;
// for now it lives for the browser session and appears at the top of the Audit Log screen.
import { createStore, useStore } from '../lib/store';
import type { ExportFormat } from '../lib/exporters';

export interface ExportEvent {
  id: string;
  at: string;
  by: string;
  role: string;
  screen: string;
  list: string;
  rows: number;
  format: ExportFormat;
}

export const exportLogStore = createStore<ExportEvent[]>(() => []);
export const useExportLog = () => useStore(exportLogStore);

export const logExport = (e: Omit<ExportEvent, 'id' | 'at'>) => {
  const at = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  exportLogStore.set(list => [{ ...e, id: `exp-${list.length + 1}`, at }, ...list]);
};
