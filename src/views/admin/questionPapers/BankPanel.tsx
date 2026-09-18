import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { Badge, EmptyState, ErrorState, Icon, LoadingRows, Modal, btnGhost, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import {
  BankFilter,
  BankQuestion,
  BlueprintSection,
  CLASS_LEVELS,
  DIFFICULTIES,
  EMPTY_FILTER,
  PAPER_LANGUAGES,
  QUESTION_TYPES,
  QuestionPaper,
  SUBJECTS,
  chaptersFor,
  filterBank,
  paperQuestions,
} from '../../../data/questionPapers';
import { questionPaperService, useQpgState } from '../../../services/questionPaperService';
import { AiBadge, DifficultyBadge, Gate, QuestionBody, QuestionEditor, QuestionPreview, QuestionStatusBadge } from './qpgUi';

const PAGE = 20;

/** Which blueprint sections a question may go into. */
export const sectionsFor = (q: BankQuestion, paper: QuestionPaper) =>
  paper.blueprint.filter(s => s.type === q.type && q.classLevel === paper.details.classLevel && q.subject === paper.details.subject);

/**
 * QPG-001: search, filter and maintain the bank. In "pick" mode it also adds questions to a paper.
 */
export const BankPanel: React.FC<{
  paper?: QuestionPaper;
  editable?: boolean;
  onAdd?: (q: BankQuestion, section: BlueprintSection) => void;
  lockSection?: BlueprintSection;
  initialFilter?: Partial<BankFilter>;
}> = ({ paper, editable = true, onAdd, lockSection, initialFilter }) => {
  const { addToast } = useApp();
  const g = useGrants();
  const { bank } = useQpgState();
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter] = useState<BankFilter>(() => ({
    ...EMPTY_FILTER,
    ...(paper ? { classLevel: paper.details.classLevel, subject: paper.details.subject } : {}),
    ...(lockSection ? { type: lockSection.type } : {}),
    ...initialFilter,
  }));
  const [shown, setShown] = useState(PAGE);
  const [preview, setPreview] = useState<BankQuestion | null>(null);
  const [editing, setEditing] = useState<BankQuestion | null>(null);
  const [picking, setPicking] = useState<BankQuestion | null>(null);

  const fetch = () => {
    setLoad('loading');
    questionPaperService.listQuestions().then(
      () => setLoad('ready'),
      () => setLoad('error')
    );
  };
  useEffect(fetch, []);

  const set = <K extends keyof BankFilter>(key: K, value: BankFilter[K]) => {
    setFilter(f => ({ ...f, [key]: value, ...(key === 'subject' || key === 'classLevel' ? { chapter: 'All', topic: 'All' } : key === 'chapter' ? { topic: 'All' } : {}) }));
    setShown(PAGE);
  };

  const rows = useMemo(() => filterBank(bank, filter), [bank, filter]);
  const chapters = filter.subject !== 'All' && filter.classLevel !== 'All' ? chaptersFor(filter.subject, filter.classLevel) : [...new Set(bank.map(q => q.chapter))];
  const topics = [...new Set(bank.filter(q => filter.chapter === 'All' || q.chapter === filter.chapter).map(q => q.topic))].sort();
  const marks = [...new Set(bank.map(q => q.marks))].sort((a, b) => a - b);
  const inPaper = new Set(paper ? paperQuestions(paper.content).map(q => q.questionId) : []);

  const canCreate = g.can('QPG-001', 'C');
  const canUpdate = g.can('QPG-001', 'U');

  const add = (q: BankQuestion) => {
    if (!paper || !onAdd) return;
    const options = lockSection ? [lockSection] : sectionsFor(q, paper);
    if (!options.length) return addToast('No section of this paper takes this question type', 'warning', `Add a ${q.type} section to the blueprint first.`);
    if (options.length === 1) return onAdd(q, options[0]);
    setPicking(q);
  };

  const duplicate = async (q: BankQuestion) => {
    try {
      const copy = await questionPaperService.duplicateQuestion(q.id);
      addToast(`Duplicated as ${copy.id}`, 'success', 'The copy is a draft until you approve it.');
    } catch (e) {
      addToast('Could not duplicate the question', 'error', (e as Error).message);
    }
  };

  const saveEdit = async (q: BankQuestion) => {
    try {
      await questionPaperService.saveQuestion(q);
      addToast(`${q.id} saved`, 'success');
      setEditing(null);
    } catch (e) {
      addToast('Could not save the question', 'error', (e as Error).message);
    }
  };

  const clear = () => {
    setFilter({ ...EMPTY_FILTER, ...(paper ? { classLevel: paper.details.classLevel, subject: paper.details.subject } : {}), ...(lockSection ? { type: lockSection.type } : {}) });
    setShown(PAGE);
  };

  const Actions: React.FC<{ q: BankQuestion }> = ({ q }) => (
    <div className="flex flex-wrap gap-1 justify-end">
      {paper && onAdd && (
        <Gate allowed={editable} why="This paper is locked for editing">
          <button onClick={() => add(q)} disabled={inPaper.has(q.id) || q.status !== 'Approved'} className={btnPrimary} aria-label={`Add ${q.id} to paper`}>
            {inPaper.has(q.id) ? 'In paper' : 'Add to paper'}
          </button>
        </Gate>
      )}
      <button onClick={() => setPreview(q)} className={btnSoft} aria-label={`Preview ${q.id}`}>
        Preview
      </button>
      <Gate allowed={canUpdate} why={g.why('QPG-001', 'U')}>
        <button onClick={() => setEditing(q)} className={btnSoft} aria-label={`Edit ${q.id}`}>
          Edit
        </button>
      </Gate>
      <Gate allowed={canCreate} why={g.why('QPG-001', 'C')}>
        <button onClick={() => duplicate(q)} className={btnSoft} aria-label={`Duplicate ${q.id}`}>
          Duplicate
        </button>
      </Gate>
    </div>
  );

  return (
    <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
      <div className="p-3 bg-subtle border-b border-line space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Icon name="search" className="absolute left-2 top-1/2 -translate-y-1/2 text-base text-ink-muted" />
            <input
              value={filter.query}
              onChange={e => set('query', e.target.value)}
              placeholder="Search question, topic, chapter or tag"
              className={`${inputCls} w-full pl-8`}
              aria-label="Search question bank"
            />
          </div>
          <span className="text-xs text-ink-soft" aria-live="polite">
            {rows.length} question(s)
          </span>
          <button onClick={clear} className={btnGhost}>
            Clear filters
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          <select value={String(filter.classLevel)} onChange={e => set('classLevel', e.target.value === 'All' ? 'All' : Number(e.target.value))} className={inputCls} aria-label="Filter class">
            <option value="All">All classes</option>
            {CLASS_LEVELS.map(c => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
          <select value={filter.subject} onChange={e => set('subject', e.target.value)} className={inputCls} aria-label="Filter subject">
            <option value="All">All subjects</option>
            {SUBJECTS.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={filter.chapter} onChange={e => set('chapter', e.target.value)} className={inputCls} aria-label="Filter chapter">
            <option value="All">All chapters</option>
            {chapters.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={filter.topic} onChange={e => set('topic', e.target.value)} className={inputCls} aria-label="Filter topic">
            <option value="All">All topics</option>
            {topics.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={filter.type} onChange={e => set('type', e.target.value as BankFilter['type'])} disabled={Boolean(lockSection)} className={inputCls} aria-label="Filter question type">
            <option value="All">All types</option>
            {QUESTION_TYPES.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={filter.difficulty} onChange={e => set('difficulty', e.target.value as BankFilter['difficulty'])} className={inputCls} aria-label="Filter difficulty">
            <option value="All">Any difficulty</option>
            {DIFFICULTIES.map(d => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select value={String(filter.marks)} onChange={e => set('marks', e.target.value === 'All' ? 'All' : Number(e.target.value))} className={inputCls} aria-label="Filter marks">
            <option value="All">Any marks</option>
            {marks.map(m => (
              <option key={m} value={m}>
                {m} mark(s)
              </option>
            ))}
          </select>
          <select value={filter.language} onChange={e => set('language', e.target.value as BankFilter['language'])} className={inputCls} aria-label="Filter language">
            <option value="All">Any language</option>
            {PAPER_LANGUAGES.map(l => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select value={filter.usage} onChange={e => set('usage', e.target.value as BankFilter['usage'])} className={inputCls} aria-label="Filter usage">
            <option value="All">Used and unused</option>
            <option value="Used">Used before</option>
            <option value="Unused">Never used</option>
          </select>
        </div>
      </div>

      {load === 'loading' && <LoadingRows rows={6} label="Loading question bank" />}
      {load === 'error' && <ErrorState onRetry={fetch} />}
      {load === 'ready' && rows.length === 0 && <EmptyState icon="search_off" title="No data available." text="No question matches these filters. Clear a filter or generate questions with AI." action={<button onClick={clear} className={btnSoft}>Clear filters</button>} />}
      {load === 'ready' && rows.length > 0 && (
        <>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-ink-soft">
                <tr>
                  {['ID', 'Question', 'Type', 'Marks', 'Difficulty', 'Chapter · topic', 'Used', 'Status', ''].map(h => (
                    <th key={h} className="p-2.5 text-left font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {rows.slice(0, shown).map(q => (
                  <tr key={q.id} className={inPaper.has(q.id) ? 'bg-emerald-50/40' : 'hover:bg-wash'} data-question={q.id}>
                    <td className="p-2.5 font-mono text-[11px] text-brand whitespace-nowrap">{q.id}</td>
                    <td className="p-2.5 max-w-[360px]">
                      <QuestionBody q={q} language={paper?.details.language} compact />
                      {q.source === 'AI generated' && <AiBadge />}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">{q.type}</td>
                    <td className="p-2.5 text-center">{q.marks}</td>
                    <td className="p-2.5">
                      <DifficultyBadge value={q.difficulty} />
                    </td>
                    <td className="p-2.5">
                      <span className="block">{q.chapter}</span>
                      <span className="block text-[10px] text-ink-muted">{q.topic}</span>
                    </td>
                    <td className="p-2.5 text-center">{q.usageCount}</td>
                    <td className="p-2.5">
                      <QuestionStatusBadge value={q.status} />
                    </td>
                    <td className="p-2.5">
                      <Actions q={q} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="lg:hidden divide-y divide-subtle">
            {rows.slice(0, shown).map(q => (
              <li key={q.id} className="p-3 space-y-2" data-question={q.id}>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-mono text-[11px] text-brand mr-1">{q.id}</span>
                  <Badge tone="blue">{q.type}</Badge>
                  <Badge>{q.marks} mark(s)</Badge>
                  <DifficultyBadge value={q.difficulty} />
                  <QuestionStatusBadge value={q.status} />
                  {q.source === 'AI generated' && <AiBadge />}
                </div>
                <div className="text-xs">
                  <QuestionBody q={q} language={paper?.details.language} compact />
                </div>
                <p className="text-[10px] text-ink-muted">
                  {q.chapter} · {q.topic} · used {q.usageCount} time(s)
                </p>
                <Actions q={q} />
              </li>
            ))}
          </ul>
          {rows.length > shown && (
            <div className="p-3 border-t border-subtle text-center">
              <button onClick={() => setShown(n => n + PAGE)} className={btnSoft}>
                Show {Math.min(PAGE, rows.length - shown)} more
              </button>
            </div>
          )}
        </>
      )}

      <QuestionPreview q={preview} onClose={() => setPreview(null)} language={paper?.details.language} />
      <QuestionEditor question={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      <Modal open={Boolean(picking)} onClose={() => setPicking(null)} title="Add to which section?">
        {picking &&
          paper &&
          sectionsFor(picking, paper).map(s => (
            <button
              key={s.id}
              onClick={() => {
                onAdd?.(picking, s);
                setPicking(null);
              }}
              className="w-full text-left rounded-xl border border-line-soft p-3 hover:border-brand"
            >
              <span className="block font-semibold">{s.title}</span>
              <span className="block text-[11px] text-ink-soft">
                {s.count} × {s.type} · {s.marksEach} mark(s) each
              </span>
            </button>
          ))}
      </Modal>
    </div>
  );
};
