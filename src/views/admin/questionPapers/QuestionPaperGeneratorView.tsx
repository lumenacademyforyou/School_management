import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { FeatureTags, PhaseNotice } from '../../../components/common/FeatureTags';
import { EmptyState, ErrorState, Icon, LoadingRows, PageHeader, Panel, Skeleton, StatCard, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import { ACADEMIC_YEARS, CLASS_LEVELS, PaperStatus, QPG_TODAY, QuestionPaper, SUBJECTS, paperCounts, paperTitle } from '../../../data/questionPapers';
import { questionPaperService, statsOf, useQpgState } from '../../../services/questionPaperService';
import { BankPanel } from './BankPanel';
import { PaperWizard, WizardStep, newPaperDraft } from './PaperWizard';
import { Gate, PaperStatusBadge, fmtDate } from './qpgUi';
import { TeacherRequestsPanel, useTeacherDecisionSync } from './TeacherRequests';
import { usePaperRequests } from '../../../services/paperRequestService';

type Tab = 'dashboard' | 'bank' | 'archive';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { id: 'bank', label: 'Question Bank', icon: 'database' },
  { id: 'archive', label: 'Paper Archive', icon: 'inventory_2' },
];

const STATUSES: PaperStatus[] = ['Draft', 'Under review', 'Changes requested', 'Approved', 'Published', 'Rejected'];

/** Admin → Academics → Question Paper Generator (QPG-001 … QPG-018). */
export const QuestionPaperGeneratorView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'dashboard' }) => {
  const { currentUser } = useApp();
  const g = useGrants();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [open, setOpen] = useState<{ paper: QuestionPaper; step: WizardStep } | null>(null);
  const canCreate = g.can('QPG-003', 'C');
  useTeacherDecisionSync();

  const create = () => setOpen({ paper: newPaperDraft(currentUser.name), step: 'details' });
  const openPaper = (paper: QuestionPaper) =>
    setOpen({ paper, step: paper.status === 'Under review' || paper.status === 'Approved' || paper.status === 'Rejected' ? 'approval' : paper.status === 'Published' ? 'key' : paper.content.length ? 'builder' : 'blueprint' });
  const duplicate = (paper: QuestionPaper) =>
    setOpen({
      paper: { ...paper, id: '', status: 'Draft', createdBy: currentUser.name, createdOn: QPG_TODAY, reviewedBy: undefined, reviewedOn: undefined, history: [], sets: [], summary: undefined, details: { ...paper.details, academicYear: '2024–25' } },
      step: 'details',
    });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto pb-20">
      <PageHeader
        eyebrow="Academics · Examinations"
        icon="quiz"
        title="Question Paper Generator"
        subtitle="Create, review and manage examination question papers."
        actions={
          !open && (
            <>
              <Gate allowed={canCreate} why={g.why('QPG-003', 'C')}>
                <button onClick={create} className={btnPrimary}>
                  <Icon name="add" className="text-sm" />
                  Create Question Paper
                </button>
              </Gate>
              <button onClick={() => setTab('bank')} className={btnSoft}>
                <Icon name="database" className="text-sm" />
                Question Bank
              </button>
              <button onClick={() => setTab('archive')} className={btnSoft}>
                <Icon name="inventory_2" className="text-sm" />
                Paper Archive
              </button>
            </>
          )
        }
      >
        <FeatureTags ids={['QPG-001', 'QPG-002', 'QPG-003', 'QPG-004', 'QPG-005', 'QPG-006', 'QPG-007', 'QPG-008', 'QPG-009', 'QPG-010', 'QPG-011', 'QPG-012', 'QPG-013', 'QPG-014', 'QPG-017', 'QPG-018']} className="mt-2" />
      </PageHeader>

      {open ? (
        <PaperWizard key={open.paper.id || 'new'} initial={open.paper} initialStep={open.step} onExit={() => setOpen(null)} />
      ) : (
        <>
          <div className="flex gap-1 border-b border-line-soft overflow-x-auto" role="tablist" aria-label="Question paper views">
            {TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap ${tab === t.id ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                <Icon name={t.icon} className="text-base" />
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'dashboard' && <Dashboard onOpen={openPaper} onCreate={create} onArchive={() => setTab('archive')} />}
          {tab === 'bank' && <BankPanel />}
          {tab === 'archive' && <Archive onOpen={openPaper} onDuplicate={duplicate} />}
        </>
      )}
      <PhaseNotice ids={['QPG-015', 'QPG-016']} phase="Phase 4" note="Difficulty analytics from answer-script scores and bulk bank import arrive with the analytics release." />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

const Dashboard: React.FC<{ onOpen: (p: QuestionPaper) => void; onCreate: () => void; onArchive: () => void }> = ({ onOpen, onCreate, onArchive }) => {
  const { currentUser } = useApp();
  const g = useGrants();
  const state = useQpgState();
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const fetch = () => {
    setLoad('loading');
    questionPaperService.loadDashboard().then(
      () => setLoad('ready'),
      () => setLoad('error')
    );
  };
  useEffect(fetch, []);
  const stats = statsOf(state);
  const reviewer = g.can('QPG-012', 'A');
  // Papers a teacher asked for are reviewed by that teacher, not the Principal.
  const teacherReviewed = new Set(usePaperRequests().flatMap(r => (r.paperId && r.status !== 'Declined' ? [r.paperId] : [])));
  const attention = state.papers.filter(p =>
    reviewer
      ? p.status === 'Under review' && p.createdBy !== currentUser.name && !teacherReviewed.has(p.id)
      : p.createdBy === currentUser.name && (p.status === 'Draft' || p.status === 'Changes requested' || p.status === 'Approved')
  );
  const recent = [...state.papers].sort((a, b) => b.createdOn.localeCompare(a.createdOn) || b.id.localeCompare(a.id)).slice(0, 6);

  if (load === 'error') return <Panel title="Dashboard"><ErrorState onRetry={fetch} /></Panel>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3" aria-busy={load === 'loading'}>
        {load === 'loading'
          ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[84px] rounded-2xl" />)
          : [
              { label: 'Total Question Bank', value: stats.bank, icon: 'database', hint: 'Approved and draft questions' },
              { label: 'Papers Created', value: stats.papers, icon: 'description', hint: 'All years' },
              { label: 'Draft Papers', value: stats.drafts, icon: 'edit_note', hint: 'Including sent back', tone: 'grey' as const },
              { label: 'Pending Approval', value: stats.pending, icon: 'pending_actions', hint: 'Waiting for the Principal', tone: 'amber' as const },
              { label: 'Approved Papers', value: stats.approved, icon: 'task_alt', hint: 'Approved or published', tone: 'green' as const },
            ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <TeacherRequestsPanel onOpen={onOpen} />
        <Panel title={reviewer ? 'Waiting for your review' : 'Needs your attention'} className="xl:col-span-1">
          {load === 'loading' ? (
            <LoadingRows rows={3} />
          ) : attention.length === 0 ? (
            <EmptyState icon="task_alt" title="Nothing waiting." text={reviewer ? 'No paper is waiting for review.' : 'No drafts or sent-back papers.'} />
          ) : (
            <ul className="divide-y divide-subtle">
              {attention.map(p => (
                <li key={p.id} className="p-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{p.title}</p>
                    <p className="text-[10px] text-ink-muted">
                      {p.id} · exam {fmtDate(p.details.examDate)}
                    </p>
                  </div>
                  <PaperStatusBadge status={p.status} />
                  <button onClick={() => onOpen(p)} className={btnSoft} aria-label={`Open ${p.id}`}>
                    {reviewer ? 'Review' : 'Open'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent papers" className="xl:col-span-2" actions={<button onClick={onArchive} className="text-xs font-semibold text-brand">View archive →</button>}>
          {load === 'loading' ? (
            <LoadingRows rows={5} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon="description"
              title="No data available."
              text="No question papers yet."
              action={
                <Gate allowed={g.can('QPG-003', 'C')} why={g.why('QPG-003', 'C')}>
                  <button onClick={onCreate} className={btnPrimary}>
                    Create Question Paper
                  </button>
                </Gate>
              }
            />
          ) : (
            <PaperTable papers={recent} onOpen={onOpen} />
          )}
        </Panel>
      </div>
    </div>
  );
};

const PaperTable: React.FC<{ papers: QuestionPaper[]; onOpen: (p: QuestionPaper) => void; onDuplicate?: (p: QuestionPaper) => void }> = ({ papers, onOpen, onDuplicate }) => {
  const g = useGrants();
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-ink-soft">
            <tr>
              {['Paper ID', 'Exam', 'Class', 'Subject', 'Created by', 'Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="p-2.5 text-left font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {papers.map(p => {
              const c = paperCounts(p);
              return (
                <tr key={p.id} className="hover:bg-wash" data-paper={p.id}>
                  <td className="p-2.5 font-mono text-[11px] text-brand whitespace-nowrap">{p.id}</td>
                  <td className="p-2.5">
                    <span className="block font-semibold">{p.details.exam}</span>
                    <span className="block text-[10px] text-ink-muted">
                      {p.details.academicYear} · {c.questions} q · {c.marks} marks
                    </span>
                  </td>
                  <td className="p-2.5">Class {p.details.classLevel}</td>
                  <td className="p-2.5">{p.details.subject}</td>
                  <td className="p-2.5">{p.createdBy}</td>
                  <td className="p-2.5 whitespace-nowrap">{fmtDate(p.details.examDate)}</td>
                  <td className="p-2.5">
                    <PaperStatusBadge status={p.status} />
                  </td>
                  <td className="p-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => onOpen(p)} className={btnSoft} aria-label={`Open ${p.id}`}>
                        Open
                      </button>
                      {onDuplicate && (
                        <Gate allowed={g.can('QPG-003', 'C')} why={g.why('QPG-003', 'C')}>
                          <button onClick={() => onDuplicate(p)} className={btnSoft} aria-label={`Reuse ${p.id}`}>
                            Reuse
                          </button>
                        </Gate>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden divide-y divide-subtle">
        {papers.map(p => (
          <li key={p.id} className="p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-brand">{p.id}</span>
              <PaperStatusBadge status={p.status} />
            </div>
            <p className="text-xs font-semibold">{paperTitle(p.details)}</p>
            <p className="text-[10px] text-ink-muted">
              {p.createdBy} · {fmtDate(p.details.examDate)}
            </p>
            <button onClick={() => onOpen(p)} className={btnSoft}>
              Open
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

// ---------------------------------------------------------------------------
// Archive (QPG-013)
// ---------------------------------------------------------------------------

const Archive: React.FC<{ onOpen: (p: QuestionPaper) => void; onDuplicate: (p: QuestionPaper) => void }> = ({ onOpen, onDuplicate }) => {
  const { papers } = useQpgState();
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [f, setF] = useState({ query: '', year: 'All', classLevel: 'All', subject: 'All', exam: 'All', status: 'All', from: '', to: '' });
  const fetch = () => {
    setLoad('loading');
    questionPaperService.listPapers().then(
      () => setLoad('ready'),
      () => setLoad('error')
    );
  };
  useEffect(fetch, []);
  const set = (patch: Partial<typeof f>) => setF(x => ({ ...x, ...patch }));
  const exams = [...new Set(papers.map(p => p.details.exam))].sort();
  const rows = useMemo(() => {
    const q = f.query.trim().toLowerCase();
    return papers
      .filter(
        p =>
          (!q || `${p.id} ${p.title} ${p.createdBy}`.toLowerCase().includes(q)) &&
          (f.year === 'All' || p.details.academicYear === f.year) &&
          (f.classLevel === 'All' || String(p.details.classLevel) === f.classLevel) &&
          (f.subject === 'All' || p.details.subject === f.subject) &&
          (f.exam === 'All' || p.details.exam === f.exam) &&
          (f.status === 'All' || p.status === f.status) &&
          (!f.from || p.details.examDate >= f.from) &&
          (!f.to || p.details.examDate <= f.to)
      )
      .sort((a, b) => b.details.examDate.localeCompare(a.details.examDate));
  }, [papers, f]);

  return (
    <Panel title="Question Paper Archive" actions={<span className="text-xs text-ink-soft" aria-live="polite">{rows.length} paper(s)</span>}>
      <div className="p-3 border-b border-subtle grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        <input value={f.query} onChange={e => set({ query: e.target.value })} placeholder="Search ID, title or author" className={`${inputCls} col-span-2`} aria-label="Search archive" />
        <select value={f.year} onChange={e => set({ year: e.target.value })} className={inputCls} aria-label="Archive academic year">
          <option value="All">All years</option>
          {ACADEMIC_YEARS.map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <select value={f.classLevel} onChange={e => set({ classLevel: e.target.value })} className={inputCls} aria-label="Archive class">
          <option value="All">All classes</option>
          {CLASS_LEVELS.map(c => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>
        <select value={f.subject} onChange={e => set({ subject: e.target.value })} className={inputCls} aria-label="Archive subject">
          <option value="All">All subjects</option>
          {SUBJECTS.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={f.exam} onChange={e => set({ exam: e.target.value })} className={inputCls} aria-label="Archive exam">
          <option value="All">All exams</option>
          {exams.map(x => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={f.status} onChange={e => set({ status: e.target.value })} className={inputCls} aria-label="Archive status">
          <option value="All">All statuses</option>
          {STATUSES.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="flex gap-1 col-span-2 md:col-span-1 xl:col-span-1">
          <input type="date" value={f.from} onChange={e => set({ from: e.target.value })} className={`${inputCls} w-1/2`} aria-label="Exam date from" />
          <input type="date" value={f.to} onChange={e => set({ to: e.target.value })} className={`${inputCls} w-1/2`} aria-label="Exam date to" />
        </div>
      </div>
      {load === 'loading' && <LoadingRows rows={6} label="Loading archive" />}
      {load === 'error' && <ErrorState onRetry={fetch} />}
      {load === 'ready' && rows.length === 0 && <EmptyState icon="inventory_2" title="No data available." text="No paper matches these filters." />}
      {load === 'ready' && rows.length > 0 && <PaperTable papers={rows} onOpen={onOpen} onDuplicate={onDuplicate} />}
    </Panel>
  );
};
