import React from 'react';
import { Badge, Field, Icon, btnDanger, btnSoft, inputCls } from '../../../components/common/ui';
import {
  ACADEMIC_YEARS,
  BOARDS,
  BankQuestion,
  BlueprintDifficulty,
  BlueprintSection,
  CLASS_LEVELS,
  DIFFICULTIES,
  DetailsErrors,
  EXAMS,
  EXAM_TYPES,
  ExamDetails,
  PAPER_LANGUAGES,
  PaperLanguage,
  QUESTION_TYPES,
  QuestionType,
  SUBJECTS,
  Subject,
  availableFor,
  blueprintTotals,
  chaptersFor,
  newSectionId,
  presetBlueprint,
  sectionMarks,
  totalState,
  validateBlueprint,
} from '../../../data/questionPapers';
import { EmptyNote } from '../../../components/common/EmptyNote';

// ---------------------------------------------------------------------------
// Step 1 — exam details
// ---------------------------------------------------------------------------

export const DetailsStep: React.FC<{ details: ExamDetails; errors: DetailsErrors; editable: boolean; onChange: (d: ExamDetails) => void }> = ({ details, errors, editable, onChange }) => {
  const set = (patch: Partial<ExamDetails>) => onChange({ ...details, ...patch });
  const dis = !editable;
  return (
    <section className="bg-surface rounded-2xl border border-line-soft shadow-sm p-4 space-y-3" aria-labelledby="details-h">
      <h2 id="details-h" className="text-sm font-bold text-ink">
        Exam details
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="Academic year">
          <select value={details.academicYear} disabled={dis} onChange={e => set({ academicYear: e.target.value })} className={`${inputCls} w-full`} aria-label="Academic year">
            {ACADEMIC_YEARS.map(y => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </Field>
        <Field label="Board" hint="Sets the default blueprint">
          <select value={details.board} disabled={dis} onChange={e => set({ board: e.target.value })} className={`${inputCls} w-full`} aria-label="Board">
            {BOARDS.map(b => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field label="Class">
          <select value={details.classLevel} disabled={dis} onChange={e => set({ classLevel: Number(e.target.value) })} className={`${inputCls} w-full`} aria-label="Class">
            {CLASS_LEVELS.map(c => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Section">
          <select value={details.section} disabled={dis} onChange={e => set({ section: e.target.value })} className={`${inputCls} w-full`} aria-label="Section">
            {['All sections', 'A', 'B'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Subject" hint={chaptersFor(details.subject, details.classLevel).length ? undefined : 'The demo bank has questions for Class 10 Maths and Science only.'}>
          <select value={details.subject} disabled={dis} onChange={e => set({ subject: e.target.value as Subject })} className={`${inputCls} w-full`} aria-label="Subject">
            {SUBJECTS.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Exam type">
          <select
            value={details.examType}
            disabled={dis}
            onChange={e => {
              const examType = e.target.value as ExamDetails['examType'];
              set({ examType, exam: EXAMS[examType][0] });
            }}
            className={`${inputCls} w-full`}
            aria-label="Exam type"
          >
            {EXAM_TYPES.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Exam" error={errors.exam}>
          <select value={details.exam} disabled={dis} onChange={e => set({ exam: e.target.value })} className={`${inputCls} w-full`} aria-label="Exam">
            {EXAMS[details.examType].map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Language" hint="QPG-018 multi-language papers">
          <select value={details.language} disabled={dis} onChange={e => set({ language: e.target.value as PaperLanguage })} className={`${inputCls} w-full`} aria-label="Language">
            {PAPER_LANGUAGES.map(l => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Exam date" error={errors.examDate}>
          <input type="date" value={details.examDate} disabled={dis} onChange={e => set({ examDate: e.target.value })} className={`${inputCls} w-full`} aria-label="Exam date" aria-invalid={Boolean(errors.examDate)} />
        </Field>
        <Field label="Duration (minutes)" error={errors.durationMinutes}>
          <input type="number" min={30} max={240} step={15} value={details.durationMinutes} disabled={dis} onChange={e => set({ durationMinutes: Number(e.target.value) })} className={`${inputCls} w-full`} aria-label="Duration" aria-invalid={Boolean(errors.durationMinutes)} />
        </Field>
        <Field label="Maximum marks" error={errors.maxMarks}>
          <input type="number" min={10} max={150} value={details.maxMarks} disabled={dis} onChange={e => set({ maxMarks: Number(e.target.value) })} className={`${inputCls} w-full`} aria-label="Maximum marks" aria-invalid={Boolean(errors.maxMarks)} />
        </Field>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Step 2 — blueprint designer (QPG-003, QPG-004)
// ---------------------------------------------------------------------------

const DEFAULT_MARKS: Record<QuestionType, number> = { MCQ: 1, 'Very short answer': 2, 'Short answer': 4, 'Long answer': 6, 'Case study': 8 };

export const BlueprintStep: React.FC<{ sections: BlueprintSection[]; details: ExamDetails; bank: BankQuestion[]; editable: boolean; onChange: (s: BlueprintSection[]) => void }> = ({ sections, details, bank, editable, onChange }) => {
  const totals = blueprintTotals(sections);
  const state = totalState(totals.marks, details.maxMarks);
  const issues = validateBlueprint(sections, details, bank);
  const chapters = chaptersFor(details.subject, details.classLevel);
  const update = (id: string, patch: Partial<BlueprintSection>) => onChange(sections.map(s => (s.id === id ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => {
    const letter = String.fromCharCode(65 + sections.length);
    onChange([...sections, { id: newSectionId(), title: `Section ${letter}`, type: 'Short answer', count: 1, marksEach: DEFAULT_MARKS['Short answer'], difficulty: 'Medium', chapter: 'Any', topic: 'Any' }]);
  };
  const stateStyle = { match: 'bg-emerald-50 border-emerald-200 text-emerald-800', under: 'bg-amber-50 border-amber-200 text-amber-900', over: 'bg-rose-50 border-rose-200 text-rose-800' }[state];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-ink">Blueprint</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onChange(presetBlueprint(details.board))} disabled={!editable} className={btnSoft}>
              <Icon name="restart_alt" className="text-sm" />
              Apply {details.board.split(' ')[0]} pattern
            </button>
            <button onClick={add} disabled={!editable} className={btnSoft}>
              <Icon name="add" className="text-sm" />
              Add Section
            </button>
          </div>
        </div>
        {sections.length === 0 && <EmptyNote>No sections yet. Add a section or apply the board pattern.</EmptyNote>}
        <ol className="space-y-3">
          {sections.map((s, i) => {
            const available = availableFor(bank, s, details).length;
            const short = available < s.count;
            const sectionIssues = issues.filter(x => x.sectionId === s.id);
            const topics = [...new Set(bank.filter(q => q.subject === details.subject && q.classLevel === details.classLevel && (s.chapter === 'Any' || q.chapter === s.chapter)).map(q => q.topic))].sort();
            return (
              <li key={s.id} className={`bg-white rounded-2xl border p-3 space-y-2 ${sectionIssues.some(x => x.level === 'error') ? 'border-rose-300' : 'border-line-soft'}`} data-section={s.title}>
                <div className="flex flex-wrap items-center gap-2">
                  <input value={s.title} disabled={!editable} onChange={e => update(s.id, { title: e.target.value })} className={`${inputCls} font-bold w-32`} aria-label={`Section ${i + 1} title`} />
                  <Badge tone={short ? 'amber' : 'green'}>
                    {available} in bank for {s.count}
                  </Badge>
                  <span className="ml-auto text-xs font-semibold text-ink">{sectionMarks(s)} marks</span>
                  <div className="flex gap-1">
                    <button onClick={() => move(i, -1)} disabled={!editable || i === 0} className={btnSoft} aria-label={`Move ${s.title} up`}>
                      <Icon name="arrow_upward" className="text-sm" />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={!editable || i === sections.length - 1} className={btnSoft} aria-label={`Move ${s.title} down`}>
                      <Icon name="arrow_downward" className="text-sm" />
                    </button>
                    <button onClick={() => onChange(sections.filter(x => x.id !== s.id))} disabled={!editable} className={btnDanger} aria-label={`Delete ${s.title}`}>
                      <Icon name="delete" className="text-sm" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <Field label="Question type">
                    <select
                      value={s.type}
                      disabled={!editable}
                      onChange={e => update(s.id, { type: e.target.value as QuestionType, marksEach: DEFAULT_MARKS[e.target.value as QuestionType] })}
                      className={`${inputCls} w-full`}
                      aria-label={`${s.title} question type`}
                    >
                      {QUESTION_TYPES.map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Questions">
                    <input type="number" min={1} max={50} value={s.count} disabled={!editable} onChange={e => update(s.id, { count: Math.max(0, Number(e.target.value)) })} className={`${inputCls} w-full`} aria-label={`${s.title} number of questions`} />
                  </Field>
                  <Field label="Marks each">
                    <input type="number" min={1} max={20} value={s.marksEach} disabled={!editable} onChange={e => update(s.id, { marksEach: Math.max(0, Number(e.target.value)) })} className={`${inputCls} w-full`} aria-label={`${s.title} marks each`} />
                  </Field>
                  <Field label="Difficulty">
                    <select value={s.difficulty} disabled={!editable} onChange={e => update(s.id, { difficulty: e.target.value as BlueprintDifficulty })} className={`${inputCls} w-full`} aria-label={`${s.title} difficulty`}>
                      {(['Mixed', ...DIFFICULTIES] as BlueprintDifficulty[]).map(d => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Chapter">
                    <select value={s.chapter} disabled={!editable} onChange={e => update(s.id, { chapter: e.target.value, topic: 'Any' })} className={`${inputCls} w-full`} aria-label={`${s.title} chapter`}>
                      <option value="Any">Any chapter</option>
                      {chapters.map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Topic">
                    <select value={s.topic} disabled={!editable} onChange={e => update(s.id, { topic: e.target.value })} className={`${inputCls} w-full`} aria-label={`${s.title} topic`}>
                      <option value="Any">Any topic</option>
                      {topics.map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                {sectionIssues.map(x => (
                  <p key={x.text} className={`text-[11px] ${x.level === 'error' ? 'text-rose-700' : 'text-amber-800'}`}>
                    {x.text}
                  </p>
                ))}
              </li>
            );
          })}
        </ol>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
        <div className={`rounded-2xl border p-4 ${stateStyle}`} aria-live="polite" data-testid="blueprint-total">
          <p className="text-[11px] font-semibold uppercase tracking-wider">Total marks</p>
          <p className="text-3xl font-bold">
            {totals.marks} / {details.maxMarks}
          </p>
          <p className="text-xs">
            {totals.questions} questions in {sections.length} section(s) ·{' '}
            {state === 'match' ? 'matches the maximum' : state === 'under' ? `${details.maxMarks - totals.marks} marks short` : `${totals.marks - details.maxMarks} marks over`}
          </p>
        </div>
        <div className="bg-surface rounded-2xl border border-line-soft p-4">
          <p className="text-xs font-bold text-ink mb-2">Marks by section</p>
          {sections.map(s => (
            <div key={s.id} className="py-1">
              <div className="flex justify-between text-[11px]">
                <span>
                  {s.title} · {s.type}
                </span>
                <span className="font-mono">{sectionMarks(s)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: `${Math.min(100, (sectionMarks(s) / Math.max(1, details.maxMarks)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        {issues.filter(x => !x.sectionId).length > 0 && (
          <ul className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800 space-y-1" role="alert">
            {issues
              .filter(x => !x.sectionId)
              .map(x => (
                <li key={x.text}>{x.text}</li>
              ))}
          </ul>
        )}
      </aside>
    </div>
  );
};
