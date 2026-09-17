import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { Badge, ConfirmDialog, Icon, Modal, btnDanger, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import {
  BankQuestion,
  BlueprintSection,
  QuestionPaper,
  addQuestion,
  alternativesFor,
  autoFill,
  moveQuestion,
  moveQuestionTo,
  paperStats,
  questionText,
  recentlyUsedFor,
  removeQuestion,
  replaceQuestion,
  setQuestionMarks,
  validateContent,
} from '../../../data/questionPapers';
import { questionPaperService, useQpgState } from '../../../services/questionPaperService';
import { BankPanel } from './BankPanel';
import { DifficultyBadge, Gate, QuestionEditor, minutesLabel, fmtDate } from './qpgUi';

/** The printable top of a paper, shared by the builder, sets and answer key previews. */
export const PaperHeader: React.FC<{ paper: QuestionPaper; setLabel?: string; subtitle?: string }> = ({ paper, setLabel, subtitle }) => {
  const d = paper.details;
  return (
    <header className="text-center border-b-2 border-[#082b3d] pb-3 space-y-1">
      <div className="flex items-center justify-center gap-2">
        <img src="/lumen-academy-logo.png" alt="" className="w-10 h-10 object-contain" />
        <div>
          <p className="text-base font-bold tracking-wide text-[#082b3d]">LUMEN ACADEMY, CHENNAI</p>
          <p className="text-[10px] text-[#464555]">Affiliated to {d.board} · Academic year {d.academicYear}</p>
        </div>
      </div>
      <p className="text-sm font-bold uppercase">
        {d.exam} · {subtitle ?? 'Question paper'}
        {setLabel ? ` · ${setLabel}` : ''}
      </p>
      <div className="flex flex-wrap justify-center gap-x-4 text-[11px] text-[#082b3d]">
        <span>Class {d.classLevel}{d.section !== 'All sections' ? `-${d.section}` : ''}</span>
        <span>Subject: {d.subject}</span>
        <span>Date: {fmtDate(d.examDate)}</span>
        <span>Time: {minutesLabel(d.durationMinutes)}</span>
        <span>Maximum marks: {d.maxMarks}</span>
        {d.language !== 'English' && <span>Medium: {d.language}</span>}
      </div>
    </header>
  );
};

export const BuilderStep: React.FC<{ paper: QuestionPaper; editable: boolean; onChange: (p: QuestionPaper) => void }> = ({ paper, editable, onChange }) => {
  const { addToast } = useApp();
  const g = useGrants();
  const { bank, papers } = useQpgState();
  const byId = new Map(bank.map(q => [q.id, q]));
  const [removing, setRemoving] = useState<string | null>(null);
  const [replacing, setReplacing] = useState<{ key: string; section: BlueprintSection } | null>(null);
  const [adding, setAdding] = useState<BlueprintSection | null>(null);
  const [editing, setEditing] = useState<BankQuestion | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [allowRepeats, setAllowRepeats] = useState(false);
  const [newInstruction, setNewInstruction] = useState('');

  const content = paper.content;
  const setContent = (c: QuestionPaper['content']) => onChange({ ...paper, content: c, sets: [] });
  const stats = paperStats(content, bank);
  const issues = validateContent(paper);
  let number = 0;

  const fill = () => {
    const { content: next, shortfall } = autoFill(paper.blueprint, paper.details, bank, {
      seed: `${paper.id}-${Date.now()}`,
      recentlyUsed: recentlyUsedFor(papers, paper.details),
      allowRepeats,
      keep: content,
    });
    setContent(next);
    if (shortfall.length) addToast('Some sections could not be filled', 'warning', shortfall.map(s => `${paper.blueprint.find(b => b.id === s.sectionId)?.title}: ${s.missing} short`).join(' · '));
    else addToast('Empty slots filled from the bank', 'success', allowRepeats ? 'Recently used questions were allowed.' : 'Questions from the last paper were skipped (QPG-014).');
  };

  const add = (q: BankQuestion, section: BlueprintSection) => {
    const before = content;
    const next = addQuestion(content, section.id, q.id, section.marksEach);
    if (next === before) return addToast('That question is already in the paper', 'warning');
    setContent(next);
    addToast(`${q.id} added to ${section.title}`, 'success');
  };

  const saveBankEdit = async (q: BankQuestion) => {
    try {
      await questionPaperService.saveQuestion(q);
      setEditing(null);
      addToast(`${q.id} updated`, 'success', 'The change applies wherever this question is used.');
    } catch (e) {
      addToast('Could not save the question', 'error', (e as Error).message);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      <div className="xl:col-span-3 bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 md:p-8 space-y-5" aria-label="Question Paper Preview">
        <p className="text-[11px] font-semibold text-[#777587] uppercase tracking-wider">Question paper preview</p>
        <PaperHeader paper={paper} />
        <div className="text-xs space-y-1">
          <p className="font-bold">General instructions</p>
          <ol className="list-decimal list-inside space-y-0.5">
            {paper.instructions.map((ins, i) => (
              <li key={ins + i} className="group">
                {ins}
                {editable && (
                  <button onClick={() => onChange({ ...paper, instructions: paper.instructions.filter((_, j) => j !== i) })} className="ml-2 text-rose-600 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Remove instruction ${i + 1}`}>
                    ×
                  </button>
                )}
              </li>
            ))}
          </ol>
          {editable && (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!newInstruction.trim()) return;
                onChange({ ...paper, instructions: [...paper.instructions, newInstruction.trim()] });
                setNewInstruction('');
              }}
              className="flex gap-2 pt-1 print:hidden"
            >
              <input value={newInstruction} onChange={e => setNewInstruction(e.target.value)} placeholder="Add an instruction" className={`${inputCls} flex-1`} aria-label="New instruction" />
              <button className={btnSoft}>Add</button>
            </form>
          )}
        </div>

        {paper.blueprint.map(section => {
          const rows = content.find(c => c.sectionId === section.id)?.questions ?? [];
          const marks = rows.reduce((n, q) => n + q.marks, 0);
          return (
            <section key={section.id} className="space-y-2" aria-label={section.title}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0ecf4] pb-1">
                <h3 className="text-sm font-bold text-[#082b3d]">
                  {section.title} <span className="font-normal text-[#464555]">· {section.type}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <Badge tone={rows.length === section.count ? 'green' : 'amber'}>
                    {rows.length}/{section.count} questions · {marks} marks
                  </Badge>
                  {editable && (
                    <button onClick={() => setAdding(section)} className={btnSoft} aria-label={`Add question to ${section.title}`}>
                      <Icon name="add" className="text-sm" />
                      Add question
                    </button>
                  )}
                </div>
              </div>
              {rows.length === 0 && <p className="text-xs text-[#777587] italic">No questions yet. Use “Auto-fill” or add questions from the bank.</p>}
              <ol className="space-y-1">
                {rows.map((pq, idx) => {
                  number += 1;
                  const q = byId.get(pq.questionId);
                  return (
                    <li
                      key={pq.key}
                      draggable={editable}
                      onDragStart={() => setDragKey(pq.key)}
                      onDragOver={e => editable && dragKey && e.preventDefault()}
                      onDrop={() => {
                        if (dragKey) setContent(moveQuestionTo(content, dragKey, pq.key));
                        setDragKey(null);
                      }}
                      onDragEnd={() => setDragKey(null)}
                      className={`group flex gap-2 rounded-lg p-2 text-xs ${dragKey === pq.key ? 'opacity-50 bg-[#f0f7fb]' : 'hover:bg-[#f8f9ff]'} ${editable ? 'cursor-grab' : ''}`}
                      data-paper-question={pq.questionId}
                    >
                      <span className="w-7 shrink-0 font-bold text-[#082b3d]">Q{number}.</span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p>{q ? questionText(q, paper.details.language) : <em>Question {pq.questionId} is no longer in the bank.</em>}</p>
                        {q?.options && (
                          <ol className="grid sm:grid-cols-2 gap-x-4 text-[#464555]">
                            {q.options.map((o, i) => (
                              <li key={o + i}>
                                ({'abcd'[i]}) {o}
                              </li>
                            ))}
                          </ol>
                        )}
                        {editable && (
                          <div className="flex flex-wrap items-center gap-1 pt-1 print:hidden">
                            {q && <DifficultyBadge value={q.difficulty} />}
                            <span className="text-[10px] text-[#777587] mr-1">{q?.chapter}</span>
                            <button onClick={() => setContent(moveQuestion(content, pq.key, -1))} disabled={idx === 0} className={btnSoft} aria-label={`Move Q${number} up`}>
                              <Icon name="arrow_upward" className="text-sm" />
                            </button>
                            <button onClick={() => setContent(moveQuestion(content, pq.key, 1))} disabled={idx === rows.length - 1} className={btnSoft} aria-label={`Move Q${number} down`}>
                              <Icon name="arrow_downward" className="text-sm" />
                            </button>
                            <button onClick={() => setReplacing({ key: pq.key, section })} className={btnSoft} aria-label={`Replace Q${number}`}>
                              Replace
                            </button>
                            <Gate allowed={g.can('QPG-001', 'U')} why={g.why('QPG-001', 'U')}>
                              <button onClick={() => q && setEditing(q)} disabled={!q} className={btnSoft} aria-label={`Edit Q${number}`}>
                                Edit
                              </button>
                            </Gate>
                            <button onClick={() => setRemoving(pq.key)} className={btnDanger} aria-label={`Remove Q${number}`}>
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                      <label className="shrink-0 flex items-start gap-1">
                        <span className="sr-only">Marks for Q{number}</span>
                        {editable ? (
                          <input type="number" min={1} max={20} value={pq.marks} onChange={e => setContent(setQuestionMarks(content, pq.key, Number(e.target.value)))} className={`${inputCls} w-14 text-right`} aria-label={`Marks for Q${number}`} />
                        ) : (
                          <span className="font-semibold">[{pq.marks}]</span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
        <p className="text-center text-[11px] text-[#777587] pt-4 border-t border-[#e0ecf4]">— End of question paper —</p>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
        <div className="bg-white rounded-2xl border border-[#e0ecf4] p-4 space-y-2" aria-live="polite" data-testid="paper-summary">
          <p className="text-xs font-bold text-[#082b3d]">Paper summary</p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-[#777587]">Questions</dt>
              <dd className="text-xl font-bold">{stats.questions}</dd>
            </div>
            <div>
              <dt className="text-[#777587]">Total marks</dt>
              <dd className={`text-xl font-bold ${stats.marks === paper.details.maxMarks ? 'text-emerald-700' : 'text-rose-700'}`}>
                {stats.marks} / {paper.details.maxMarks}
              </dd>
            </div>
            <div>
              <dt className="text-[#777587]">Easy</dt>
              <dd className="font-semibold">{stats.easy}</dd>
            </div>
            <div>
              <dt className="text-[#777587]">Medium</dt>
              <dd className="font-semibold">{stats.medium}</dd>
            </div>
            <div>
              <dt className="text-[#777587]">Hard</dt>
              <dd className="font-semibold">{stats.hard}</dd>
            </div>
          </dl>
          {stats.questions > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden" aria-hidden="true">
              <span className="bg-emerald-500" style={{ width: `${(stats.easy / stats.questions) * 100}%` }} />
              <span className="bg-amber-400" style={{ width: `${(stats.medium / stats.questions) * 100}%` }} />
              <span className="bg-rose-500" style={{ width: `${(stats.hard / stats.questions) * 100}%` }} />
            </div>
          )}
        </div>
        {editable && (
          <div className="bg-white rounded-2xl border border-[#e0ecf4] p-4 space-y-2">
            <p className="text-xs font-bold text-[#082b3d]">Automatic generation</p>
            <p className="text-[11px] text-[#464555]">Fills empty slots from the bank using the blueprint. Least-used questions come first.</p>
            <label className="flex items-center gap-2 text-[11px]">
              <input type="checkbox" checked={allowRepeats} onChange={e => setAllowRepeats(e.target.checked)} className="accent-[#0e5d84]" />
              Allow questions from the last paper (QPG-014)
            </label>
            <Gate allowed={g.can('QPG-005', 'C')} why={g.why('QPG-005', 'C')}>
              <button onClick={fill} className={`${btnPrimary} w-full`}>
                <Icon name="auto_mode" className="text-sm" />
                Auto-fill empty slots
              </button>
            </Gate>
            <button onClick={() => setContent([])} disabled={!content.length} className={`${btnSoft} w-full`}>
              Clear all questions
            </button>
          </div>
        )}
        <div className={`rounded-2xl border p-3 text-[11px] space-y-1 ${issues.length ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {issues.length ? issues.map(i => <p key={i.text}>{i.text}</p>) : <p>The paper matches its blueprint.</p>}
        </div>
      </aside>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this question?"
        body="It goes back to the bank and can be added again later."
        confirmLabel="Remove"
        danger
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) setContent(removeQuestion(content, removing));
          setRemoving(null);
          addToast('Question removed', 'info');
        }}
      />

      <Modal open={Boolean(replacing)} onClose={() => setReplacing(null)} title="Replace question" wide>
        {replacing &&
          (() => {
            const options = alternativesFor(content, replacing.section, paper.details, bank);
            if (!options.length) return <p className="text-[#464555]">No other question in the bank fits {replacing.section.title}. Loosen the section’s chapter or difficulty, or generate more with AI.</p>;
            return options.slice(0, 12).map(q => (
              <button
                key={q.id}
                onClick={() => {
                  setContent(replaceQuestion(content, replacing.key, q.id));
                  setReplacing(null);
                  addToast(`Replaced with ${q.id}`, 'success');
                }}
                className="w-full text-left rounded-xl border border-[#e0ecf4] p-3 hover:border-[#0e5d84] space-y-1"
              >
                <span className="flex flex-wrap items-center gap-1">
                  <span className="font-mono text-[10px] text-[#0e5d84]">{q.id}</span>
                  <DifficultyBadge value={q.difficulty} />
                  <span className="text-[10px] text-[#777587]">
                    {q.chapter} · used {q.usageCount}×
                  </span>
                </span>
                <span className="block">{questionText(q, paper.details.language)}</span>
              </button>
            ));
          })()}
      </Modal>

      <Modal open={Boolean(adding)} onClose={() => setAdding(null)} title={adding ? `Add a question to ${adding.title}` : 'Add question'} wide>
        {adding && <BankPanel paper={paper} editable={editable} lockSection={adding} onAdd={add} />}
      </Modal>

      <QuestionEditor question={editing} onClose={() => setEditing(null)} onSave={saveBankEdit} />
    </div>
  );
};
