// Mock question paper API. Every call returns a Promise so a real HTTP client can replace this
// module without touching the screens. The browser demo keeps records in localStorage, matching
// the teacher-request service, so a refresh or another app tab sees the same papers and bank.
import { createStore, mockDelay, Store, useStore } from '../lib/store';
import {
  AiRequest,
  BankQuestion,
  INITIAL_BANK,
  INITIAL_PAPERS,
  PaperAction,
  QPG_TODAY,
  QuestionPaper,
  mockGenerate,
  mockGenerateOne,
  paperQuestions,
  transitionPaper,
} from '../data/questionPapers';

interface QpgState {
  bank: BankQuestion[];
  papers: QuestionPaper[];
}

const STORAGE_KEY = 'lumen-question-papers';
const STORAGE_SCHEMA = 1;

interface StoredQpgState extends QpgState {
  schema: number;
}

const seed = (): QpgState => ({ bank: INITIAL_BANK, papers: INITIAL_PAPERS });

const read = (): QpgState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as StoredQpgState;
      if (stored.schema === STORAGE_SCHEMA && Array.isArray(stored.bank) && Array.isArray(stored.papers)) {
        return { bank: stored.bank, papers: stored.papers };
      }
    }
  } catch {
    // Storage is unavailable or stale. The demo can still operate from its seed data.
  }
  return seed();
};

const memoryStore = createStore<QpgState>(() => (typeof window === 'undefined' ? seed() : read()));

const persist = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: STORAGE_SCHEMA, ...memoryStore.get() }));
  } catch {
    // Private windows and tests may not allow storage; retain the in-memory session instead.
  }
};

/** Observable question-paper state, persisted for the single-origin demo and synced between tabs. */
export const qpgStore: Store<QpgState> = {
  get: memoryStore.get,
  set: next => {
    memoryStore.set(next);
    persist();
  },
  subscribe: memoryStore.subscribe,
  reset: () => {
    memoryStore.set(seed());
    persist();
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) memoryStore.set(read());
  });
}

export const useQpgState = () => useStore(qpgStore);

/** Makes the next call fail, so screens can show their error state (used by tests and the demo). */
let failNext = false;
export const failNextRequest = () => {
  failNext = true;
};

const respond = async <T>(value: T | (() => T)): Promise<T> => {
  if (failNext) {
    failNext = false;
    await mockDelay(null);
    throw new Error('Something went wrong. Please try again.');
  }
  const v = typeof value === 'function' ? (value as () => T)() : value;
  return mockDelay(v);
};

export interface QpgStats {
  bank: number;
  papers: number;
  drafts: number;
  pending: number;
  approved: number;
}

export const statsOf = ({ bank, papers }: QpgState): QpgStats => ({
  bank: bank.filter(q => q.status !== 'Retired').length,
  papers: papers.length,
  drafts: papers.filter(p => p.status === 'Draft' || p.status === 'Changes requested').length,
  pending: papers.filter(p => p.status === 'Under review').length,
  approved: papers.filter(p => p.status === 'Approved' || p.status === 'Published').length,
});

/** Continue after the highest saved demo paper ID, including after a browser refresh. */
const nextPaperId = (papers: QuestionPaper[]) => {
  const highest = papers.reduce((max, paper) => {
    const match = /^QP-2024-(\d+)$/.exec(paper.id);
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0);
  return `QP-2024-${String(highest + 1).padStart(3, '0')}`;
};

export const questionPaperService = {
  loadDashboard: () => respond(() => statsOf(qpgStore.get())),
  listPapers: () => respond(() => qpgStore.get().papers),
  listQuestions: () => respond(() => qpgStore.get().bank),

  createPaper: (draft: Omit<QuestionPaper, 'id'>) =>
    respond(() => {
      const current = qpgStore.get();
      const paper = { ...draft, id: nextPaperId(current.papers) };
      qpgStore.set({ ...current, papers: [paper, ...current.papers] });
      return paper;
    }),

  savePaper: (paper: QuestionPaper) =>
    respond(() => {
      qpgStore.set(s => ({ ...s, papers: s.papers.map(p => (p.id === paper.id ? paper : p)) }));
      return paper;
    }),

  /** QPG-012: moves a paper through the review workflow. Rejects with the rule that was broken. */
  transition: (paperId: string, action: PaperAction, actor: string, comment = '') =>
    respond(() => {
      const paper = qpgStore.get().papers.find(p => p.id === paperId);
      if (!paper) throw new Error('Paper not found.');
      const next = transitionPaper(paper, action, actor, QPG_TODAY, comment);
      if ('error' in next) throw new Error(next.error);
      const printed = next.sets.length ? next.sets.flatMap(set => paperQuestions(set.sections)) : paperQuestions(next.content);
      const used = action === 'publish' ? new Set(printed.map(q => q.questionId)) : new Set<string>();
      qpgStore.set(s => ({
        bank: used.size ? s.bank.map(q => (used.has(q.id) ? { ...q, usageCount: q.usageCount + 1, lastUsedIn: paperId } : q)) : s.bank,
        papers: s.papers.map(p => (p.id === paperId ? next : p)),
      }));
      return next;
    }),

  /**
   * A teacher-requested unit test is reviewed by the requesting teacher in the teacher app. Their decision is
   * applied here with the same rules as any review (reviewer is not the author; sending back needs a comment).
   */
  applyTeacherDecision: (paperId: string, action: 'approve' | 'requestChanges', teacher: string, comment: string) => {
    const paper = qpgStore.get().papers.find(p => p.id === paperId);
    if (!paper) return;
    const next = transitionPaper(paper, action, teacher, QPG_TODAY, comment);
    if ('error' in next) return;
    qpgStore.set(s => ({ ...s, papers: s.papers.map(p => (p.id === paperId ? next : p)) }));
  },

  saveQuestion: (q: BankQuestion) =>
    respond(() => {
      qpgStore.set(s => ({ ...s, bank: s.bank.some(x => x.id === q.id) ? s.bank.map(x => (x.id === q.id ? q : x)) : [q, ...s.bank] }));
      return q;
    }),

  duplicateQuestion: (id: string) =>
    respond(() => {
      const src = qpgStore.get().bank.find(q => q.id === id);
      if (!src) throw new Error('Question not found.');
      const copies = qpgStore.get().bank.filter(q => q.id.startsWith(`${id}-C`)).length;
      const copy: BankQuestion = { ...src, id: `${id}-C${copies + 1}`, usageCount: 0, lastUsedIn: undefined, status: 'Draft', source: 'Teacher' };
      qpgStore.set(s => ({ ...s, bank: [copy, ...s.bank] }));
      return copy;
    }),

  /** QPG-006: stands in for the AI model; returns draft questions for a teacher to review. */
  generateQuestions: (req: AiRequest, attempt: number) => respond(() => mockGenerate(req, attempt)),
  regenerateQuestion: (req: AiRequest, attempt: number, index: number) => respond(() => mockGenerateOne(req, attempt, index)),

  /** QPG-010: the server will render the PDF; the prototype hands back a text preview. */
  exportDocument: (paperId: string, kind: 'Question paper' | 'Answer key', setLabel: string) =>
    respond(() => ({ fileName: `${paperId}-${setLabel.replace(' ', '')}-${kind === 'Answer key' ? 'answer-key' : 'paper'}.txt`, queuedAt: QPG_TODAY })),

  reset: () => {
    qpgStore.reset();
  },
};
