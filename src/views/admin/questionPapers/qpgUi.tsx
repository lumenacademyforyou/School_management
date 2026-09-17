import React, { useEffect, useState } from 'react';
import { Badge, Field, Modal, Tone, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import {
  BankQuestion,
  DIFFICULTIES,
  Difficulty,
  PaperLanguage,
  PaperStatus,
  QUESTION_TYPES,
  QuestionStatus,
  QuestionType,
  chaptersFor,
  hasTranslation,
  questionText,
} from '../../../data/questionPapers';

export const STATUS_TONE: Record<PaperStatus, Tone> = {
  Draft: 'grey',
  'Under review': 'amber',
  'Changes requested': 'violet',
  Approved: 'blue',
  Published: 'green',
  Rejected: 'red',
};

export const PaperStatusBadge: React.FC<{ status: PaperStatus }> = ({ status }) => <Badge tone={STATUS_TONE[status]}>{status}</Badge>;

const DIFF_TONE: Record<Difficulty, Tone> = { Easy: 'green', Medium: 'amber', Hard: 'red' };
export const DifficultyBadge: React.FC<{ value: Difficulty }> = ({ value }) => <Badge tone={DIFF_TONE[value]}>{value}</Badge>;

const Q_STATUS_TONE: Record<QuestionStatus, Tone> = { Approved: 'green', Draft: 'grey', Retired: 'red' };
export const QuestionStatusBadge: React.FC<{ value: QuestionStatus }> = ({ value }) => <Badge tone={Q_STATUS_TONE[value]}>{value}</Badge>;

export const AiBadge: React.FC = () => (
  <Badge tone="violet">
    <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
      auto_awesome
    </span>
    AI generated
  </Badge>
);

export const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const minutesLabel = (m: number) => (m % 60 === 0 ? `${m / 60} hour${m === 60 ? '' : 's'}` : `${Math.floor(m / 60)} h ${m % 60} min`);

export const QuestionBody: React.FC<{ q: BankQuestion; language?: PaperLanguage; compact?: boolean }> = ({ q, language = 'English', compact }) => (
  <div className="space-y-1">
    <p className={`text-[#082b3d] ${compact ? 'line-clamp-2' : ''}`}>{questionText(q, language)}</p>
    {language !== 'English' && !hasTranslation(q, language) && <p className="text-[10px] text-amber-700">No {language} version yet; shown in English.</p>}
    {q.options && !compact && (
      <ol className="grid sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[#464555]">
        {q.options.map((o, i) => (
          <li key={o + i}>
            ({'abcd'[i]}) {o}
          </li>
        ))}
      </ol>
    )}
    {q.hasDiagram && !compact && <p className="text-[10px] text-[#777587]">Includes a diagram (QPG-017).</p>}
  </div>
);

export const QuestionPreview: React.FC<{ q: BankQuestion | null; onClose: () => void; language?: PaperLanguage }> = ({ q, onClose, language }) => (
  <Modal open={Boolean(q)} onClose={onClose} title={q ? `Preview · ${q.id}` : 'Preview'}>
    {q && (
      <>
        <div className="flex flex-wrap gap-1">
          <Badge tone="blue">{q.type}</Badge>
          <DifficultyBadge value={q.difficulty} />
          <Badge>{q.marks} mark(s)</Badge>
          <QuestionStatusBadge value={q.status} />
          {q.source === 'AI generated' && <AiBadge />}
        </div>
        <div className="rounded-xl border border-[#e0ecf4] p-3">
          <QuestionBody q={q} language={language} />
        </div>
        <dl className="grid grid-cols-2 gap-2">
          {[
            ['Class & subject', `Class ${q.classLevel} · ${q.subject}`],
            ['Chapter', q.chapter],
            ['Topic', q.topic],
            ['Used in papers', String(q.usageCount)],
            ['Answer', q.answer],
            ['Author', q.author],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] text-[#777587]">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div>
          <p className="text-[10px] text-[#777587]">Marking scheme</p>
          <p>{q.markingScheme}</p>
        </div>
      </>
    )}
  </Modal>
);

const DEFAULT_MARKS: Record<QuestionType, number> = { MCQ: 1, 'Very short answer': 2, 'Short answer': 4, 'Long answer': 6, 'Case study': 8 };

export const validateQuestion = (q: BankQuestion): string[] => {
  const errors: string[] = [];
  if (q.text.trim().length < 10) errors.push('Write the question (at least 10 characters).');
  if (!q.topic.trim()) errors.push('Add a topic.');
  if (q.marks < 1 || q.marks > 20) errors.push('Marks must be between 1 and 20.');
  if (q.type === 'MCQ') {
    const opts = q.options ?? [];
    if (opts.length !== 4 || opts.some(o => !o.trim())) errors.push('An MCQ needs four options.');
    else if (!opts.includes(q.answer)) errors.push('The answer must be one of the options.');
  } else if (!q.answer.trim()) errors.push('Add the expected answer.');
  return errors;
};

/** Edit or create a bank question (QPG-001, QPG-002, QPG-007). */
export const QuestionEditor: React.FC<{ question: BankQuestion | null; onClose: () => void; onSave: (q: BankQuestion) => Promise<void> | void; title?: string }> = ({ question, onClose, onSave, title }) => {
  const [draft, setDraft] = useState<BankQuestion | null>(question);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setDraft(question);
    setErrors([]);
  }, [question]);
  if (!draft) return null;
  const set = (patch: Partial<BankQuestion>) => setDraft(d => (d ? { ...d, ...patch } : d));
  const chapters = chaptersFor(draft.subject, draft.classLevel);
  const save = async () => {
    const e = validateQuestion(draft);
    setErrors(e);
    if (e.length) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open={Boolean(question)}
      onClose={onClose}
      title={title ?? `Edit ${draft.id}`}
      wide
      footer={
        <>
          <button onClick={onClose} className={btnSoft}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className={btnPrimary}>
            {saving ? 'Saving…' : 'Save question'}
          </button>
        </>
      }
    >
      <Field label="Question">
        <textarea value={draft.text} onChange={e => set({ text: e.target.value })} rows={3} className={`${inputCls} w-full`} aria-label="Question text" />
      </Field>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Field label="Type">
          <select
            value={draft.type}
            onChange={e => {
              const type = e.target.value as QuestionType;
              set({ type, marks: DEFAULT_MARKS[type], options: type === 'MCQ' ? (draft.options ?? ['', '', '', '']) : undefined });
            }}
            className={`${inputCls} w-full`}
            aria-label="Question type"
          >
            {QUESTION_TYPES.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Marks">
          <input type="number" min={1} max={20} value={draft.marks} onChange={e => set({ marks: Number(e.target.value) })} className={`${inputCls} w-full`} aria-label="Question marks" />
        </Field>
        <Field label="Difficulty">
          <select value={draft.difficulty} onChange={e => set({ difficulty: e.target.value as Difficulty })} className={`${inputCls} w-full`} aria-label="Question difficulty">
            {DIFFICULTIES.map(d => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={e => set({ status: e.target.value as QuestionStatus })} className={`${inputCls} w-full`} aria-label="Question status">
            {(['Approved', 'Draft', 'Retired'] as QuestionStatus[]).map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Chapter" className="col-span-2">
          <select value={draft.chapter} onChange={e => set({ chapter: e.target.value })} className={`${inputCls} w-full`} aria-label="Question chapter">
            {[...new Set([draft.chapter, ...chapters])].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Topic" className="col-span-2">
          <input value={draft.topic} onChange={e => set({ topic: e.target.value })} className={`${inputCls} w-full`} aria-label="Question topic" />
        </Field>
      </div>
      {draft.type === 'MCQ' && (
        <div className="grid sm:grid-cols-2 gap-2">
          {(draft.options ?? ['', '', '', '']).map((o, i) => (
            <Field key={i} label={`Option ${'ABCD'[i]}`}>
              <input
                value={o}
                onChange={e => {
                  const options = [...(draft.options ?? ['', '', '', ''])];
                  const wasAnswer = draft.answer === options[i];
                  options[i] = e.target.value;
                  set({ options, ...(wasAnswer ? { answer: e.target.value } : {}) });
                }}
                className={`${inputCls} w-full`}
                aria-label={`Option ${'ABCD'[i]}`}
              />
            </Field>
          ))}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label={draft.type === 'MCQ' ? 'Correct option' : 'Expected answer'}>
          {draft.type === 'MCQ' ? (
            <select value={draft.answer} onChange={e => set({ answer: e.target.value })} className={`${inputCls} w-full`} aria-label="Correct answer">
              <option value="">Choose…</option>
              {(draft.options ?? []).filter(Boolean).map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input value={draft.answer} onChange={e => set({ answer: e.target.value })} className={`${inputCls} w-full`} aria-label="Correct answer" />
          )}
        </Field>
        <Field label="Marking scheme">
          <input value={draft.markingScheme} onChange={e => set({ markingScheme: e.target.value })} className={`${inputCls} w-full`} aria-label="Marking scheme" />
        </Field>
      </div>
      {errors.length > 0 && (
        <ul className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-rose-800 list-disc list-inside" role="alert">
          {errors.map(e => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

/** Wraps a control that the signed-in role may not use and says why on hover. */
export const Gate: React.FC<{ allowed: boolean; why?: string; children: React.ReactElement<{ disabled?: boolean; title?: string }> }> = ({ allowed, why, children }) =>
  allowed ? children : React.cloneElement(children, { disabled: true, title: why ?? 'Not available for your role' });
