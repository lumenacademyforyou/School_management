// Mock API for unit-test paper requests, shared by the teacher app and the admin console.
// Like the teacher and parent apps' demo backend, it keeps its records in localStorage so apps open on the same
// origin see each other's changes (`npm run dev:demo` serves all three on one origin); the `storage` event
// refreshes other tabs. Replace the bodies with HTTP calls and the screens stay the same.
import { useSyncExternalStore } from 'react';
import { mockDelay } from '../lib/store';
import {
  INITIAL_REQUESTS,
  NewRequest,
  PaperRequest,
  PaperSnapshot,
  createRequest,
  declineRequest,
  markConducted,
  requestProblems,
  sendForApproval,
  startPreparing,
  teacherApprove,
  teacherRequestChanges,
} from '../data/paperRequests';

interface RequestState {
  schema: number;
  requests: PaperRequest[];
}

const KEY = 'lumen-paper-requests';
const SCHEMA = 1;
const seed = (): RequestState => ({ schema: SCHEMA, requests: INITIAL_REQUESTS });

const read = (): RequestState => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RequestState;
      if (parsed.schema === SCHEMA) return parsed;
    }
  } catch {
    // Storage blocked or unreadable: start from the seed
  }
  return seed();
};

let state: RequestState = typeof window === 'undefined' ? seed() : read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

const write = (next: RequestState) => {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Memory only (private window, tests)
  }
  emit();
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === KEY) {
      state = read();
      emit();
    }
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const usePaperRequests = () => useSyncExternalStore(subscribe, () => state.requests, () => state.requests);
export const currentRequests = () => state.requests;

/** Applies a rule from data/paperRequests and saves the result, or rejects with the rule's message. */
const change = (id: string, apply: (r: PaperRequest) => PaperRequest | { error: string }) => {
  const r = state.requests.find(x => x.id === id);
  if (!r) return Promise.reject(new Error('This request no longer exists. Refresh and try again.'));
  const next = apply(r);
  if ('error' in next) return Promise.reject(new Error(next.error));
  write({ ...state, requests: state.requests.map(x => (x.id === id ? next : x)) });
  return mockDelay(next);
};

const nextId = () => {
  const n = state.requests.reduce((m, r) => Math.max(m, Number(r.id.split('-').pop()) || 0), 0) + 1;
  return `UTR-2024-${String(n).padStart(3, '0')}`;
};

export const paperRequestService = {
  /** Teacher: ask the exam coordinator for a unit-test paper. */
  submit: (input: NewRequest, teacher: { id: string; name: string }, today: string) => {
    const problems = Object.values(requestProblems(input, today));
    if (problems.length) return Promise.reject(new Error(problems[0]));
    const request = createRequest(nextId(), input, teacher, today);
    write({ ...state, requests: [request, ...state.requests] });
    return mockDelay(request);
  },
  /** Coordinator: link the paper being prepared. */
  start: (id: string, paperId: string, by: string, at: string) => change(id, r => startPreparing(r, paperId, by, at)),
  /** Coordinator: send the finished paper for the teacher's approval. */
  send: (id: string, paper: PaperSnapshot, by: string, at: string) => change(id, r => sendForApproval(r, paper, by, at)),
  decline: (id: string, by: string, reason: string, at: string) => change(id, r => declineRequest(r, by, reason, at)),
  /** Teacher decisions. */
  approve: (id: string, teacherId: string, at: string) => change(id, r => teacherApprove(r, teacherId, at)),
  requestChanges: (id: string, teacherId: string, comment: string, at: string) => change(id, r => teacherRequestChanges(r, teacherId, comment, at)),
  conducted: (id: string, teacherId: string, today: string) => change(id, r => markConducted(r, teacherId, today)),
  reset: () => write(seed()),
};
