import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { EmptyState, Icon, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import { PaperSet, QuestionPaper, answerKey, answerKeyText, buildSets, paperStats, questionText, setOverlap, validateContent } from '../../../data/questionPapers';
import { questionPaperService, useQpgState } from '../../../services/questionPaperService';
import { PaperHeader } from './BuilderStep';
import { Gate, PaperStatusBadge } from './qpgUi';

const download = (fileName: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const setsOrDefault = (paper: QuestionPaper): PaperSet[] => (paper.sets.length ? paper.sets : paper.content.length ? [{ label: 'Set A', sections: paper.content, status: 'Draft' }] : []);

// ---------------------------------------------------------------------------
// Step 6 — multiple sets (QPG-008)
// ---------------------------------------------------------------------------

export const SetsStep: React.FC<{ paper: QuestionPaper; editable: boolean; onChange: (p: QuestionPaper) => void }> = ({ paper, editable, onChange }) => {
  const { addToast } = useApp();
  const g = useGrants();
  const { bank } = useQpgState();
  const [count, setCount] = useState(Math.max(2, paper.sets.length || 4));
  const sets = setsOrDefault(paper);
  const [view, setView] = useState(sets[0]?.label ?? 'Set A');
  const blocking = validateContent(paper).filter(i => i.level === 'error');
  const current = sets.find(s => s.label === view) ?? sets[0];

  const generate = () => {
    const next = buildSets(paper, bank, count);
    onChange({ ...paper, sets: next });
    setView('Set A');
    addToast(`${next.length} sets generated`, 'success', 'Each set reorders the questions and swaps some for equivalent ones.');
  };

  if (!paper.content.length) return <EmptyState icon="library_books" title="No questions in the paper yet." text="Build the paper first; sets are made from it." />;

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 flex flex-wrap items-end gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#082b3d]">Multiple sets</h2>
          <p className="text-[11px] text-[#464555]">Give neighbouring candidates different papers of the same weight.</p>
        </div>
        <label className="text-[11px] font-semibold text-[#464555] ml-auto">
          Number of sets
          <select value={count} onChange={e => setCount(Number(e.target.value))} disabled={!editable} className={`${inputCls} ml-2`} aria-label="Number of sets">
            {[2, 3, 4].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Gate allowed={editable && g.can('QPG-008', 'C')} why={editable ? g.why('QPG-008', 'C') : 'This paper is locked for editing'}>
          <button onClick={generate} disabled={blocking.length > 0} title={blocking[0]?.text} className={btnPrimary}>
            <Icon name="content_copy" className="text-sm" />
            Generate sets
          </button>
        </Gate>
      </section>
      {blocking.length > 0 && <p className="text-xs text-rose-700">{blocking[0].text} Fix the paper before making sets.</p>}

      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-x-auto">
        <table className="w-full text-xs" aria-label="Set comparison">
          <thead className="bg-slate-50 text-[#464555]">
            <tr>
              {['Set', 'Questions', 'Marks', 'Easy / Medium / Hard', 'Same as Set A', 'Status', ''].map(h => (
                <th key={h} className={`p-2.5 font-semibold ${['Questions', 'Marks', 'Same as Set A'].includes(h) ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f7fb]">
            {sets.map(s => {
              const st = paperStats(s.sections, bank);
              return (
                <tr key={s.label} className={s.label === view ? 'bg-[#f0f7fb]' : ''}>
                  <td className="p-2.5 font-bold">{s.label}</td>
                  <td className="p-2.5 text-right">{st.questions}</td>
                  <td className="p-2.5 text-right">{st.marks}</td>
                  <td className="p-2.5">
                    {st.easy} / {st.medium} / {st.hard}
                  </td>
                  <td className="p-2.5 text-right">{s.label === 'Set A' ? '—' : `${setOverlap(sets[0], s)}%`}</td>
                  <td className="p-2.5">
                    <PaperStatusBadge status={s.status} />
                  </td>
                  <td className="p-2.5 text-right">
                    <button onClick={() => setView(s.label)} className={btnSoft} aria-label={`View ${s.label}`}>
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sets.length < 2 && <p className="p-3 text-[11px] text-[#777587]">Only Set A exists. Generate sets to compare them.</p>}
      </div>

      {current && (
        <article className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 md:p-6 space-y-3" aria-label={`${current.label} preview`}>
          <PaperHeader paper={paper} setLabel={current.label} />
          <SetQuestions paper={paper} set={current} />
        </article>
      )}
    </div>
  );
};

const SetQuestions: React.FC<{ paper: QuestionPaper; set: PaperSet }> = ({ paper, set }) => {
  const { bank } = useQpgState();
  const byId = new Map(bank.map(q => [q.id, q]));
  let n = 0;
  return (
    <>
      {set.sections.map(c => (
        <section key={c.sectionId} className="text-xs space-y-1">
          <h3 className="font-bold">{paper.blueprint.find(b => b.id === c.sectionId)?.title}</h3>
          <ol className="space-y-1">
            {c.questions.map(pq => {
              n += 1;
              const q = byId.get(pq.questionId);
              return (
                <li key={pq.key} className="flex gap-2">
                  <span className="w-7 font-semibold">Q{n}.</span>
                  <span className="flex-1">{q ? questionText(q, paper.details.language) : pq.questionId}</span>
                  <span>[{pq.marks}]</span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// Step 7 — answer key and marking scheme (QPG-009, QPG-010)
// ---------------------------------------------------------------------------

export const AnswerKeyStep: React.FC<{ paper: QuestionPaper }> = ({ paper }) => {
  const { addToast } = useApp();
  const g = useGrants();
  const { bank } = useQpgState();
  const sets = setsOrDefault(paper);
  const [label, setLabel] = useState(sets[0]?.label ?? 'Set A');
  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const set = sets.find(s => s.label === label) ?? sets[0];
  const approved = paper.status === 'Approved' || paper.status === 'Published';

  if (!set) return <EmptyState icon="key" title="No questions in the paper yet." text="The answer key is built from the paper’s questions." />;
  const rows = answerKey(paper, set.sections, bank);

  const exportDoc = async (kind: 'Question paper' | 'Answer key') => {
    setExporting(kind);
    try {
      const r = await questionPaperService.exportDocument(paper.id, kind, set.label);
      if (kind === 'Answer key') download(r.fileName, answerKeyText(paper, set, bank));
      addToast(`${kind} export queued`, 'success', `The school server will produce the branded PDF (QPG-010, QPG-011). A text preview was saved as ${r.fileName}.`);
    } catch (e) {
      addToast('Export failed', 'error', (e as Error).message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 flex flex-wrap items-end gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#082b3d]">Answer key</h2>
          <p className="text-[11px] text-[#464555]">Correct answers and the marking scheme for the evaluation team.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select value={label} onChange={e => setLabel(e.target.value)} className={inputCls} aria-label="Answer key set">
            {sets.map(s => (
              <option key={s.label}>{s.label}</option>
            ))}
          </select>
          <button onClick={() => setPreview(p => !p)} className={btnSoft} aria-pressed={preview}>
            <Icon name={preview ? 'table_rows' : 'visibility'} className="text-sm" />
            {preview ? 'Table view' : 'Answer Key Preview'}
          </button>
          <Gate allowed={g.can('QPG-009', 'E')} why={g.why('QPG-009', 'E')}>
            <button onClick={() => exportDoc('Answer key')} disabled={exporting !== null} className={btnPrimary}>
              <Icon name="download" className="text-sm" />
              {exporting === 'Answer key' ? 'Preparing…' : 'Download / Export'}
            </button>
          </Gate>
          <Gate allowed={g.can('QPG-010', 'E') && approved} why={approved ? g.why('QPG-010', 'E') : 'Papers can be printed only after approval'}>
            <button onClick={() => exportDoc('Question paper')} disabled={exporting !== null} className={btnSoft}>
              <Icon name="print" className="text-sm" />
              {exporting === 'Question paper' ? 'Preparing…' : 'Export paper PDF'}
            </button>
          </Gate>
        </div>
      </section>

      {preview ? (
        <article className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 md:p-8 space-y-3" aria-label="Answer Key Preview">
          <PaperHeader paper={paper} setLabel={set.label} subtitle="Answer key and marking scheme" />
          <p className="text-center text-[10px] font-bold text-rose-700 tracking-widest">CONFIDENTIAL · FOR EVALUATORS ONLY</p>
          <ol className="space-y-2 text-xs">
            {rows.map(r => (
              <li key={r.number} className="border-b border-dashed border-[#e0ecf4] pb-2">
                <p>
                  <span className="font-bold">Q{r.number}.</span> <span className="font-semibold text-emerald-800">{r.correctAnswer}</span> <span className="text-[#777587]">[{r.marks}]</span>
                </p>
                <p className="text-[#464555]">{r.markingScheme}</p>
              </li>
            ))}
          </ol>
        </article>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-x-auto">
          <table className="w-full text-xs" aria-label="Answer key">
            <thead className="bg-slate-50 text-[#464555]">
              <tr>
                {['Q', 'Question', 'Correct answer', 'Marks', 'Expected answer / marking scheme'].map(h => (
                  <th key={h} className="p-2.5 text-left font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {rows.map(r => (
                <tr key={r.number}>
                  <td className="p-2.5 font-bold align-top">
                    {r.number}
                    <span className="block text-[9px] font-normal text-[#777587]">{r.section}</span>
                  </td>
                  <td className="p-2.5 max-w-[320px] align-top">{r.question}</td>
                  <td className="p-2.5 font-semibold text-emerald-800 align-top">{r.correctAnswer}</td>
                  <td className="p-2.5 text-center align-top">{r.marks}</td>
                  <td className="p-2.5 text-[#464555] align-top">{r.markingScheme}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
