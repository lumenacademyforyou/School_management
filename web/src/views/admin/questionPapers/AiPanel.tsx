import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { Badge, EmptyState, ErrorState, Field, Icon, Skeleton, btnDanger, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import {
  AiRequest,
  BankQuestion,
  BlueprintSection,
  DIFFICULTIES,
  Difficulty,
  PAPER_LANGUAGES,
  PaperLanguage,
  QUESTION_TYPES,
  QuestionPaper,
  QuestionType,
  chaptersFor,
} from '../../../data/questionPapers';
import { questionPaperService } from '../../../services/questionPaperService';
import { AiBadge, DifficultyBadge, Gate, QuestionBody, QuestionEditor } from './qpgUi';
import { sectionsFor } from './BankPanel';

type CardState = 'new' | 'accepted' | 'rejected';
interface Card {
  q: BankQuestion;
  state: CardState;
  index: number;
  busy?: boolean;
}

const DEFAULT_MARKS: Record<QuestionType, number> = { MCQ: 1, 'Very short answer': 2, 'Short answer': 4, 'Long answer': 6, 'Case study': 8 };

/** QPG-006: AI question generation. The prototype uses a deterministic mock instead of a model. */
export const AiPanel: React.FC<{ paper: QuestionPaper; editable: boolean; onAdd: (q: BankQuestion, section: BlueprintSection) => void }> = ({ paper, editable, onAdd }) => {
  const { addToast } = useApp();
  const g = useGrants();
  const chapters = chaptersFor(paper.details.subject, paper.details.classLevel);
  const [req, setReq] = useState<AiRequest>({
    subject: paper.details.subject,
    classLevel: paper.details.classLevel,
    chapter: chapters[0] ?? '',
    topic: '',
    type: 'MCQ',
    difficulty: 'Medium',
    marks: 1,
    language: paper.details.language,
    count: 3,
  });
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [cards, setCards] = useState<Card[]>([]);
  const [editing, setEditing] = useState<Card | null>(null);
  const allowed = g.can('QPG-006', 'C');
  const set = (patch: Partial<AiRequest>) => setReq(r => ({ ...r, ...patch }));
  const formError = !req.chapter ? 'Choose a chapter.' : req.count < 1 || req.count > 10 ? 'Ask for 1 to 10 questions.' : '';

  const generate = async () => {
    if (formError) return;
    const next = attempt + 1;
    setAttempt(next);
    setStatus('loading');
    try {
      const qs = await questionPaperService.generateQuestions(req, next);
      setCards(qs.map((q, index) => ({ q, state: 'new', index })));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  };

  const update = (index: number, patch: Partial<Card>) => setCards(cs => cs.map(c => (c.index === index ? { ...c, ...patch } : c)));

  const accept = async (card: Card) => {
    update(card.index, { busy: true });
    try {
      const saved = await questionPaperService.saveQuestion({ ...card.q, status: 'Approved', author: `${card.q.author.replace(' (review required)', '')}, reviewed` });
      update(card.index, { q: saved, state: 'accepted', busy: false });
      const target = sectionsFor(saved, paper)[0];
      if (target && editable) {
        onAdd(saved, target);
        addToast('Question accepted and added to the paper', 'success', `${saved.id} → ${target.title}`);
      } else {
        addToast('Question accepted into the bank', 'success', target ? 'The paper is locked, so it was not added.' : `No ${saved.type} section in this paper.`);
      }
    } catch (e) {
      update(card.index, { busy: false });
      addToast('Could not save the question', 'error', (e as Error).message);
    }
  };

  const regenerate = async (card: Card) => {
    update(card.index, { busy: true });
    try {
      const q = await questionPaperService.regenerateQuestion(req, attempt + 100 + card.index, card.index);
      update(card.index, { q, state: 'new', busy: false });
    } catch {
      update(card.index, { busy: false });
      addToast('Something went wrong. Please try again.', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <section className="bg-surface rounded-2xl border border-line-soft shadow-sm p-4 space-y-3 xl:self-start" aria-labelledby="ai-form">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
            <Icon name="auto_awesome" className="text-lg" />
          </span>
          <div>
            <h2 id="ai-form" className="text-sm font-bold text-ink">
              Generate questions with AI
            </h2>
            <p className="text-[11px] text-ink-soft">Drafts only. A teacher must accept each question before it enters the bank.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Subject">
            <input value={`${req.subject} · Class ${req.classLevel}`} disabled className={`${inputCls} w-full`} aria-label="AI subject" />
          </Field>
          <Field label="Chapter">
            <select value={req.chapter} onChange={e => set({ chapter: e.target.value })} className={`${inputCls} w-full`} aria-label="AI chapter">
              {chapters.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Topic" hint="Optional">
            <input value={req.topic} onChange={e => set({ topic: e.target.value })} placeholder="e.g. Section formula" className={`${inputCls} w-full`} aria-label="AI topic" />
          </Field>
          <Field label="Question type">
            <select value={req.type} onChange={e => set({ type: e.target.value as QuestionType, marks: DEFAULT_MARKS[e.target.value as QuestionType] })} className={`${inputCls} w-full`} aria-label="AI question type">
              {QUESTION_TYPES.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty">
            <select value={req.difficulty} onChange={e => set({ difficulty: e.target.value as Difficulty })} className={`${inputCls} w-full`} aria-label="AI difficulty">
              {DIFFICULTIES.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Marks">
            <input type="number" min={1} max={20} value={req.marks} onChange={e => set({ marks: Number(e.target.value) })} className={`${inputCls} w-full`} aria-label="AI marks" />
          </Field>
          <Field label="Language">
            <select value={req.language} onChange={e => set({ language: e.target.value as PaperLanguage })} className={`${inputCls} w-full`} aria-label="AI language">
              {PAPER_LANGUAGES.map(l => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Number of questions" error={req.count < 1 || req.count > 10 ? '1 to 10' : undefined}>
            <input type="number" min={1} max={10} value={req.count} onChange={e => set({ count: Number(e.target.value) })} className={`${inputCls} w-full`} aria-label="AI question count" />
          </Field>
        </div>
        <Gate allowed={allowed} why={g.why('QPG-006', 'C')}>
          <button onClick={generate} disabled={status === 'loading' || Boolean(formError)} className={`${btnPrimary} w-full !py-2`}>
            <Icon name="auto_awesome" className="text-sm" />
            {status === 'loading' ? 'Generating questions…' : 'Generate Questions'}
          </button>
        </Gate>
        <p className="text-[10px] text-ink-muted">Prototype: questions come from a built-in mock, not a live AI model. Nothing leaves this browser.</p>
      </section>

      <section className="xl:col-span-2 space-y-3" aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'idle' && (
          <div className="bg-white rounded-2xl border border-dashed border-line">
            <EmptyState icon="auto_awesome" title="No generated questions yet." text="Pick a chapter and question type, then generate. Accepted questions are added to the bank and, where a section fits, to this paper." />
          </div>
        )}
        {status === 'loading' && (
          <div className="space-y-3" role="status" aria-label="Generating questions">
            <p className="text-xs font-semibold text-violet-700 flex items-center gap-1">
              <Icon name="progress_activity" className="text-sm animate-spin" />
              Generating questions…
            </p>
            {Array.from({ length: Math.min(req.count, 3) }, (_, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-line-soft p-4 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        )}
        {status === 'error' && (
          <div className="bg-surface rounded-2xl border border-line-soft">
            <ErrorState onRetry={generate} />
          </div>
        )}
        {status === 'ready' &&
          cards.map(card => (
            <article
              key={`${card.index}-${card.q.id}`}
              className={`bg-white rounded-2xl border p-4 space-y-2 slide-in-from-bottom-2 ${card.state === 'accepted' ? 'border-emerald-300' : card.state === 'rejected' ? 'border-slate-200 opacity-60' : 'border-line-soft'}`}
              data-ai-card={card.index}
            >
              <div className="flex flex-wrap items-center gap-1">
                <AiBadge />
                <Badge>{card.q.type}</Badge>
                <DifficultyBadge value={card.q.difficulty} />
                <Badge>{card.q.marks} mark(s)</Badge>
                <Badge>{card.q.topic}</Badge>
                {card.state === 'accepted' && <Badge tone="green">Accepted · {card.q.id}</Badge>}
                {card.state === 'rejected' && <Badge tone="red">Rejected</Badge>}
              </div>
              <div className="text-xs">
                <QuestionBody q={card.q} language={req.language} />
              </div>
              {card.state === 'new' && (
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => accept(card)} disabled={card.busy} className={btnPrimary}>
                    Accept
                  </button>
                  <button onClick={() => setEditing(card)} disabled={card.busy} className={btnSoft}>
                    Edit
                  </button>
                  <button onClick={() => regenerate(card)} disabled={card.busy} className={btnSoft}>
                    {card.busy ? 'Working…' : 'Regenerate'}
                  </button>
                  <button onClick={() => update(card.index, { state: 'rejected' })} disabled={card.busy} className={btnDanger}>
                    Reject
                  </button>
                </div>
              )}
              {card.state === 'rejected' && (
                <button onClick={() => update(card.index, { state: 'new' })} className={btnSoft}>
                  Undo
                </button>
              )}
            </article>
          ))}
      </section>

      <QuestionEditor
        question={editing?.q ?? null}
        title="Edit generated question"
        onClose={() => setEditing(null)}
        onSave={q => {
          if (editing) update(editing.index, { q });
          setEditing(null);
        }}
      />
    </div>
  );
};
