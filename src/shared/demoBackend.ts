// Demo backend shared by the parent and teacher apps.
// It stands in for the API: state lives in localStorage so two apps open in the same browser
// see each other's writes (the `storage` event syncs other tabs). Without storage it falls back
// to memory and still works in a single tab.
import { useSyncExternalStore } from 'react';
import { INITIAL_LEAVES, INITIAL_REGISTER, LeaveRequest, Mark, markKey, StatusCode } from '../data/attendance';
import { INITIAL_THREADS, Thread } from '../data/messaging';
import { Payment } from '../data/fees';
import {
  APP_TODAY,
  ClassAnnouncement,
  ConsentRow,
  Homework,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CONSENT,
  INITIAL_HOMEWORK,
} from './schoolData';
import type { Channel } from '../data/messaging';
import type { Language } from '../data/messaging';

export interface ServerMark extends Mark {
  /** Revision of this register cell; the seeded register is revision 1 */
  rev: number;
  source: 'Teacher app' | 'Office' | 'Register';
}

export interface MarkHistory {
  key: string;
  rev: number;
  code: StatusCode;
  by: string;
  at: string;
  source: ServerMark['source'];
  note?: string;
}

export interface ParentPrefs {
  language: Language;
  lowData: boolean;
  studentMode: boolean;
  quietHours: boolean;
  channels: Record<'attendance' | 'fees' | 'notices', Channel[]>;
}

export const DEFAULT_PREFS: ParentPrefs = {
  language: 'en',
  lowData: false,
  studentMode: false,
  quietHours: true,
  channels: { attendance: ['Push', 'WhatsApp', 'SMS'], fees: ['In-app', 'WhatsApp'], notices: ['In-app', 'Push'] },
};

export interface MarksSheet {
  values: Record<string, string>;
  status: 'Draft' | 'Submitted';
  savedBy?: string;
  savedAt?: string;
}

export interface BackendState {
  schema: number;
  marks: Record<string, ServerMark>;
  markHistory: MarkHistory[];
  leaves: LeaveRequest[];
  homework: Homework[];
  homeworkDone: Record<string, string[]>;
  threads: Thread[];
  payments: Payment[];
  consent: ConsentRow[];
  prefs: Record<string, ParentPrefs>;
  acks: Record<string, string[]>;
  announcements: ClassAnnouncement[];
  marksSheets: Record<string, MarksSheet>;
}

const KEY = 'lumen-demo-backend';
const SCHEMA = 1;

/** The front office corrected one of today's 10-A marks after teachers' devices last synced. */
const OFFICE_CORRECTION_KEY = markKey('ros-03', APP_TODAY);

export const seedState = (): BackendState => ({
  schema: SCHEMA,
  marks: {
    [OFFICE_CORRECTION_KEY]: {
      code: 'LV',
      reason: 'Leave letter handed in at the front office',
      markedBy: 'Mrs. Kavitha Raman (Office)',
      markedAt: '09:40',
      rev: 2,
      source: 'Office',
    },
  },
  markHistory: [
    { key: OFFICE_CORRECTION_KEY, rev: 1, code: INITIAL_REGISTER[OFFICE_CORRECTION_KEY]?.code ?? 'A', by: 'Mrs. Malini Iyer', at: '09:02', source: 'Register' },
    { key: OFFICE_CORRECTION_KEY, rev: 2, code: 'LV', by: 'Mrs. Kavitha Raman (Office)', at: '09:40', source: 'Office', note: 'Leave letter handed in at the front office' },
  ],
  leaves: INITIAL_LEAVES,
  homework: INITIAL_HOMEWORK,
  homeworkDone: { 'HW-101': ['ros-02'], 'HW-102': ['ros-01', 'ros-02'] },
  threads: INITIAL_THREADS,
  payments: [],
  consent: INITIAL_CONSENT,
  prefs: {},
  acks: {},
  announcements: INITIAL_ANNOUNCEMENTS,
  marksSheets: {},
});

const read = (): BackendState => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BackendState;
      if (parsed.schema === SCHEMA) return parsed;
    }
  } catch {
    // Storage blocked or corrupt: start from the seed
  }
  return seedState();
};

let state: BackendState = typeof window === 'undefined' ? seedState() : read();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(l => l());

const persist = () => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Memory-only mode
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === KEY) {
      state = read();
      emit();
    }
  });
}

export const getBackend = () => state;

export const updateBackend = (fn: (s: BackendState) => BackendState) => {
  state = fn(state);
  persist();
  emit();
};

export const resetBackend = () => {
  state = seedState();
  persist();
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useBackend = () => useSyncExternalStore(subscribe, getBackend, getBackend);

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** Register as the server sees it: seeded history plus every later write. */
export const serverMark = (s: BackendState, key: string): ServerMark | undefined => {
  const override = s.marks[key];
  if (override) return override;
  const base = INITIAL_REGISTER[key];
  return base ? { ...base, rev: 1, source: 'Register' } : undefined;
};

export const fullRegister = (s: BackendState) => {
  const out: Record<string, Mark> = { ...INITIAL_REGISTER };
  Object.entries(s.marks).forEach(([k, m]) => {
    out[k] = m;
  });
  return out;
};

export const prefsFor = (s: BackendState, guardianId: string) => s.prefs[guardianId] ?? DEFAULT_PREFS;

export const nowStamp = () => {
  const d = new Date();
  return `${APP_TODAY} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
