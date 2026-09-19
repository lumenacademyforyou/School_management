// Mock Tamil Nadu EMIS portal client. Student records come from studentService (shared with Student 360),
// so fixing a number there updates this desk too. Swap the bodies for the state API later.
import { createStore, mockDelay, useStore } from '../lib/store';
import {
  ATTENDANCE_DUE,
  AttendanceUpload,
  Correction,
  EMIS_NOW,
  EMIS_TODAY,
  INITIAL_ATTENDANCE,
  Portal,
  UploadResult,
  applyUpload,
  lookupEmis,
  pendingChanges,
  remainingCorrections,
  seedPortal,
} from '../data/emis';
import { INITIAL_ROSTER, normaliseEmis } from '../data/students';
import { rosterStore, studentService } from './studentService';

export interface UploadLog {
  id: string;
  at: string;
  by: string;
  results: UploadResult[];
}

export interface EmisState {
  portal: Portal;
  corrections: Correction[];
  /** Latest portal answer per queued change id (rejections stay visible on the queue). */
  lastResult: Record<string, UploadResult>;
  uploads: UploadLog[];
  attendance: AttendanceUpload[];
  lastSync: string;
}

export const emisStore = createStore<EmisState>(() => ({
  portal: seedPortal(INITIAL_ROSTER),
  corrections: [],
  lastResult: {},
  uploads: [{ id: 'UP-0001', at: '2024-09-13 16:20', by: 'Ms. Priya Venkat', results: [] }],
  attendance: INITIAL_ATTENDANCE,
  lastSync: '2024-09-16 08:05',
}));
export const useEmisState = () => useStore(emisStore);

let failNext = false;
/** Makes the next call fail, so screens can show their error state. */
export const failNextEmisRequest = () => {
  failNext = true;
};

const respond = async <T>(value: () => T): Promise<T> => {
  if (failNext) {
    failNext = false;
    await mockDelay(null);
    throw new Error('The EMIS portal did not respond. Please try again.');
  }
  return mockDelay(value());
};

const stamp = () => EMIS_NOW;

const lateNote = (d: AttendanceUpload) =>
  d.status === 'Failed' ? `Re-sent after a failed attempt (${d.note ?? 'no reply'})` : stamp().slice(0, 10) > d.date || stamp().slice(11) > ATTENDANCE_DUE ? `Uploaded after the ${ATTENDANCE_DUE} AM cut-off` : undefined;

export const emisService = {
  load: () => respond(() => emisStore.get()),

  /** Refreshes the school's records from the portal (the mock portal only moves when the school uploads). */
  sync: () =>
    respond(() => {
      emisStore.set(s => ({ ...s, lastSync: stamp() }));
      return emisStore.get();
    }),

  lookup: (emis: string) => respond(() => lookupEmis(emis, rosterStore.get(), emisStore.get().portal)),

  /** Sends every queued change to the portal. */
  uploadPending: (by: string) =>
    respond(() => {
      const roster = rosterStore.get();
      const state = emisStore.get();
      const changes = pendingChanges(roster, state.portal, state.corrections);
      const { portal, results } = applyUpload(roster, state.portal, changes, state.corrections);
      const log: UploadLog = { id: `UP-${String(state.uploads.length + 1).padStart(4, '0')}`, at: stamp(), by, results };
      emisStore.set({
        ...state,
        portal,
        corrections: remainingCorrections(state.corrections, results),
        lastResult: { ...state.lastResult, ...Object.fromEntries(results.map(r => [r.id, r])) },
        uploads: [log, ...state.uploads],
        lastSync: stamp(),
      });
      return log;
    }),

  /** Queues the school's value of a field to overwrite the portal's. */
  requestCorrection: (correction: Omit<Correction, 'requestedOn'>) =>
    respond(() => {
      emisStore.set(s => ({
        ...s,
        corrections: [...s.corrections.filter(c => !(c.studentId === correction.studentId && c.field === correction.field)), { ...correction, requestedOn: EMIS_TODAY }],
      }));
      return emisStore.get().corrections;
    }),

  discardCorrection: (studentId: string, field: Correction['field']) =>
    respond(() => {
      emisStore.set(s => ({ ...s, corrections: s.corrections.filter(c => !(c.studentId === studentId && c.field === field)) }));
      return emisStore.get().corrections;
    }),

  /** Records an EMIS number found on the portal against a student (identifier rules still apply). */
  linkNumber: async (studentId: string, emis: string) => {
    const student = rosterStore.get().find(s => s.id === studentId);
    const current = student?.apaar ?? '';
    return studentService.updateIdentifiers(studentId, { emis: normaliseEmis(emis), apaar: current });
  },

  uploadAttendance: (date: string) =>
    respond(() => {
      emisStore.set(s => ({
        ...s,
        attendance: s.attendance.map(d => (d.date === date ? { ...d, status: 'Uploaded', at: stamp(), note: lateNote(d) } : d)),
      }));
      return emisStore.get().attendance.find(d => d.date === date)!;
    }),

  reset: () => emisStore.reset(),
};
