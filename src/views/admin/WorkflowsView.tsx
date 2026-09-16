import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags } from '../../components/common/FeatureTags';

type Role = 'AO' | 'BA' | 'PR' | 'AC' | 'CO' | 'HR';

interface StageDef {
  name: string;
  owner: Role;
  slaHours: number;
  requiredDocs: string[];
}

interface WorkflowDef {
  id: string;
  name: string;
  entity: string;
  phase: 'P1' | 'P2' | 'P3';
  version: number;
  mode: 'Sequential' | 'Parallel';
  quorum?: string;
  stages: StageDef[];
}

interface QueueItem {
  id: string;
  workflowId: string;
  reference: string;
  subject: string;
  submittedBy: string;
  submittedById: string;
  stageIndex: number;
  hoursInStage: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface HistoryEntry {
  id: string;
  itemId: string;
  at: string;
  actor: string;
  action: string;
  fromStage: string;
  toStage: string;
  comment: string;
}

const ROLE_NAMES: Record<Role, string> = {
  AO: 'Admissions Officer',
  BA: 'Branch Admin',
  PR: 'Principal',
  AC: 'Accountant',
  CO: 'Coordinator / HOD',
  HR: 'HR Officer',
};

const WORKFLOWS: WorkflowDef[] = [
  {
    id: 'wf-adm', name: 'Admission application', entity: 'Application', phase: 'P1', version: 3, mode: 'Sequential',
    stages: [
      { name: 'Document check', owner: 'AO', slaHours: 48, requiredDocs: ['Birth certificate', 'Address proof'] },
      { name: 'Decision', owner: 'PR', slaHours: 72, requiredDocs: [] },
    ],
  },
  {
    id: 'wf-doc', name: 'Document verification', entity: 'Document', phase: 'P1', version: 1, mode: 'Sequential',
    stages: [{ name: 'Verify', owner: 'AO', slaHours: 24, requiredDocs: [] }],
  },
  {
    id: 'wf-stu', name: 'Student profile change', entity: 'Student', phase: 'P1', version: 2, mode: 'Sequential',
    stages: [
      { name: 'Class teacher review', owner: 'CO', slaHours: 24, requiredDocs: [] },
      { name: 'Branch admin approval', owner: 'BA', slaHours: 48, requiredDocs: ['Supporting proof'] },
    ],
  },
  {
    id: 'wf-con', name: 'Fee concession / waiver', entity: 'Concession', phase: 'P1', version: 4, mode: 'Parallel', quorum: 'Accountant and Principal both approve',
    stages: [
      { name: 'Finance review', owner: 'AC', slaHours: 48, requiredDocs: ['Income certificate'] },
      { name: 'Principal sign-off', owner: 'PR', slaHours: 48, requiredDocs: [] },
    ],
  },
  {
    id: 'wf-ref', name: 'Fee refund', entity: 'Refund', phase: 'P2', version: 1, mode: 'Sequential',
    stages: [
      { name: 'Accounts check', owner: 'AC', slaHours: 72, requiredDocs: ['Original receipt'] },
      { name: 'Principal release', owner: 'PR', slaHours: 48, requiredDocs: [] },
    ],
  },
  {
    id: 'wf-tc', name: 'Transfer certificate', entity: 'TCRequest', phase: 'P2', version: 2, mode: 'Sequential',
    stages: [
      { name: 'Clearance (fee, library, hostel)', owner: 'BA', slaHours: 72, requiredDocs: [] },
      { name: 'Principal approval', owner: 'PR', slaHours: 24, requiredDocs: [] },
    ],
  },
  {
    id: 'wf-mod', name: 'Marks moderation', entity: 'MarkSheet', phase: 'P2', version: 1, mode: 'Sequential',
    stages: [{ name: 'HOD moderation', owner: 'CO', slaHours: 48, requiredDocs: [] }],
  },
];

const INITIAL_QUEUE: QueueItem[] = [
  { id: 'q1', workflowId: 'wf-adm', reference: 'APP-2025-0318', subject: 'Diya R. Krishnan · Class 1', submittedBy: 'Online portal', submittedById: 'portal', stageIndex: 1, hoursInStage: 81, status: 'Pending' },
  { id: 'q2', workflowId: 'wf-con', reference: 'CON-2024-0091', subject: 'Sibling concession 10% · Ananya S. Iyer', submittedBy: 'Mrs. Lakshmi Narayanan (Accounts)', submittedById: 'user-acc-lakshmi', stageIndex: 1, hoursInStage: 20, status: 'Pending' },
  { id: 'q3', workflowId: 'wf-con', reference: 'CON-2024-0094', subject: 'Staff ward waiver 50% · Ishaan A. Swaminathan', submittedBy: 'Dr. Arvind Swaminathan', submittedById: 'user-admin-arvind', stageIndex: 1, hoursInStage: 6, status: 'Pending' },
  { id: 'q4', workflowId: 'wf-tc', reference: 'TC-2024-0042', subject: 'Transfer certificate · Rohan P. Das (8-C)', submittedBy: 'Parent app', submittedById: 'parent-das', stageIndex: 1, hoursInStage: 30, status: 'Pending' },
  { id: 'q5', workflowId: 'wf-ref', reference: 'REF-2024-0017', subject: 'Transport fee refund ₹6,400 · Meera J. Pillai', submittedBy: 'Mrs. Lakshmi Narayanan (Accounts)', submittedById: 'user-acc-lakshmi', stageIndex: 1, hoursInStage: 12, status: 'Pending' },
  { id: 'q6', workflowId: 'wf-adm', reference: 'APP-2025-0321', subject: 'Kabir S. Menon · Class 6', submittedBy: 'Front desk (offline form)', submittedById: 'user-ao-front', stageIndex: 1, hoursInStage: 44, status: 'Pending' },
];

const INITIAL_HISTORY: HistoryEntry[] = [
  { id: 'h1', itemId: 'q1', at: '12 Sep 2024, 10:04', actor: 'Ms. Priya Venkat (AO)', action: 'Approved', fromStage: 'Document check', toStage: 'Decision', comment: 'All mandatory documents verified' },
  { id: 'h2', itemId: 'q2', at: '15 Sep 2024, 16:20', actor: 'Mrs. Lakshmi Narayanan (AC)', action: 'Approved', fromStage: 'Finance review', toStage: 'Principal sign-off', comment: 'Sibling enrolment confirmed' },
  { id: 'h3', itemId: 'q4', at: '15 Sep 2024, 06:10', actor: 'Mr. Joseph Antony (BA)', action: 'Approved', fromStage: 'Clearance (fee, library, hostel)', toStage: 'Principal approval', comment: 'No dues' },
  { id: 'h4', itemId: 'q6', at: '14 Sep 2024, 14:55', actor: 'Ms. Priya Venkat (AO)', action: 'Approved', fromStage: 'Document check', toStage: 'Decision', comment: 'Birth certificate verified' },
];

// Reason codes come from the reason-code master (MST-009)
const REJECT_REASONS = ['Incomplete documents', 'Eligibility criteria not met', 'Seat unavailable', 'Duplicate request', 'Policy exception not justified'];

// Historical average hours per stage for bottleneck analysis (WFL-011)
const STAGE_DURATIONS: { workflowId: string; stage: string; avgHours: number; completed: number }[] = [
  { workflowId: 'wf-adm', stage: 'Document check', avgHours: 31, completed: 212 },
  { workflowId: 'wf-adm', stage: 'Decision', avgHours: 58, completed: 187 },
  { workflowId: 'wf-con', stage: 'Finance review', avgHours: 22, completed: 64 },
  { workflowId: 'wf-con', stage: 'Principal sign-off', avgHours: 39, completed: 61 },
  { workflowId: 'wf-tc', stage: 'Clearance (fee, library, hostel)', avgHours: 50, completed: 38 },
  { workflowId: 'wf-tc', stage: 'Principal approval', avgHours: 11, completed: 38 },
  { workflowId: 'wf-stu', stage: 'Branch admin approval', avgHours: 27, completed: 96 },
];

type Tab = 'queue' | 'definitions' | 'history' | 'delegation' | 'analytics';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'queue', label: 'Approval Queue', icon: 'inbox', ids: ['WFL-003', 'WFL-004', 'WFL-008', 'RBAC-013'] },
  { id: 'definitions', label: 'Definitions', icon: 'account_tree', ids: ['WFL-001', 'WFL-002', 'WFL-005', 'WFL-010'] },
  { id: 'history', label: 'History', icon: 'history', ids: ['WFL-009'] },
  { id: 'delegation', label: 'Delegation & Escalation', icon: 'forward_to_inbox', ids: ['WFL-006', 'WFL-007'] },
  { id: 'analytics', label: 'Analytics', icon: 'monitoring', ids: ['WFL-011'] },
];

const nowStamp = () =>
  new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

export const WorkflowsView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'queue' }) => {
  const { addToast, currentUser } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [workflows, setWorkflows] = useState(WORKFLOWS);
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkComment, setBulkComment] = useState('');
  const [rejecting, setRejecting] = useState<QueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectComment, setRejectComment] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [delegation, setDelegation] = useState<{ to: string; from: string; until: string } | null>(null);
  const [delegateTo, setDelegateTo] = useState('Mrs. Kavitha Raman (Vice Principal)');
  const [delegateFrom, setDelegateFrom] = useState('2024-09-20');
  const [delegateUntil, setDelegateUntil] = useState('2024-09-27');

  const wf = (id: string) => workflows.find(w => w.id === id)!;
  const stageOf = (item: QueueItem) => wf(item.workflowId).stages[item.stageIndex];
  const isBreached = (item: QueueItem) => item.status === 'Pending' && item.hoursInStage > stageOf(item).slaHours;
  const isOwnItem = (item: QueueItem) => item.submittedById === currentUser.id;

  const pending = queue.filter(q => q.status === 'Pending' && (workflowFilter === 'all' || q.workflowId === workflowFilter));
  const breached = queue.filter(isBreached);

  const record = (item: QueueItem, action: string, toStage: string, comment: string) => {
    setHistory(prev => [
      {
        id: `h-${prev.length + 1}-${item.id}`,
        itemId: item.id,
        at: nowStamp(),
        actor: `${currentUser.name}${delegation ? ` (acting for ${delegation.to})` : ''}`,
        action,
        fromStage: stageOf(item).name,
        toStage,
        comment,
      },
      ...prev,
    ]);
  };

  const approve = (item: QueueItem, comment: string): boolean => {
    if (isOwnItem(item)) {
      addToast(`Blocked: you created ${item.reference}`, 'error', 'Segregation of duties — another approver must act (RBAC-013)');
      return false;
    }
    const def = wf(item.workflowId);
    const isFinal = item.stageIndex === def.stages.length - 1;
    const toStage = isFinal ? 'Approved' : def.stages[item.stageIndex + 1].name;
    record(item, 'Approved', toStage, comment);
    setQueue(prev =>
      prev.map(q => (q.id === item.id ? { ...q, stageIndex: isFinal ? q.stageIndex : q.stageIndex + 1, hoursInStage: isFinal ? q.hoursInStage : 0, status: isFinal ? 'Approved' : 'Pending' } : q))
    );
    return true;
  };

  const confirmReject = () => {
    if (!rejecting) return;
    if (!rejectComment.trim()) {
      addToast('A comment is mandatory when rejecting', 'warning', 'WFL-004');
      return;
    }
    if (isOwnItem(rejecting)) {
      addToast(`Blocked: you created ${rejecting.reference}`, 'error', 'RBAC-013');
      return;
    }
    record(rejecting, `Rejected — ${rejectReason}`, 'Rejected', rejectComment.trim());
    setQueue(prev => prev.map(q => (q.id === rejecting.id ? { ...q, status: 'Rejected' } : q)));
    addToast(`${rejecting.reference} rejected`, 'info', rejectReason);
    setRejecting(null);
    setRejectComment('');
  };

  const bulkApprove = () => {
    if (!bulkComment.trim()) {
      addToast('Add a shared comment for the bulk action', 'warning');
      return;
    }
    const items = queue.filter(q => selected.has(q.id) && q.status === 'Pending');
    const done = items.filter(item => approve(item, bulkComment.trim())).length;
    setSelected(new Set());
    setBulkComment('');
    addToast(`Bulk approval: ${done} approved, ${items.length - done} blocked`, done ? 'success' : 'warning');
  };

  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateSla = (workflowId: string, stageIdx: number, hours: number) => {
    if (!Number.isFinite(hours) || hours < 1) return;
    setWorkflows(prev =>
      prev.map(w => (w.id === workflowId ? { ...w, stages: w.stages.map((s, i) => (i === stageIdx ? { ...s, slaHours: hours } : s)) } : w))
    );
  };

  const saveDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (delegateUntil < delegateFrom) {
      addToast('End date must be on or after start date', 'error');
      return;
    }
    setDelegation({ to: delegateTo, from: delegateFrom, until: delegateUntil });
    addToast(`Approvals delegated to ${delegateTo}`, 'success', `${delegateFrom} → ${delegateUntil}`);
  };

  const escalateAll = () => {
    breached.forEach(item => record(item, 'Escalated', stageOf(item).name, `SLA of ${stageOf(item).slaHours}h breached — escalated to Principal`));
    addToast(`${breached.length} item(s) escalated to Principal`, 'warning');
  };

  const bottlenecks = useMemo(() => {
    return STAGE_DURATIONS.map(d => {
      const def = workflows.find(w => w.id === d.workflowId)!;
      const sla = def.stages.find(s => s.name === d.stage)?.slaHours ?? 0;
      return { ...d, workflow: def.name, sla, ratio: sla ? d.avgHours / sla : 0 };
    }).sort((a, b) => b.ratio - a.ratio);
  }, [workflows]);

  const throughput = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(h => {
      counts[h.actor] = (counts[h.actor] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [history]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-sm">account_tree</span>
          <span>Module 5 · Workflow & Approvals (WFL)</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">Approval Workflows</h1>
        <p className="text-xs text-[#464555] mt-1">
          Signed in as {currentUser.name} · {currentUser.roleTitle}
          {delegation && ` · delegating to ${delegation.to} until ${delegation.until}`}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Awaiting action', value: queue.filter(q => q.status === 'Pending').length, icon: 'inbox' },
          { label: 'SLA breached', value: breached.length, icon: 'timer_off' },
          { label: 'Active workflows', value: workflows.length, icon: 'account_tree' },
          { label: 'Transitions logged', value: history.length, icon: 'history' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#e0ecf4] p-4 shadow-xs">
            <span className="material-symbols-outlined text-[#0e5d84] text-lg">{k.icon}</span>
            <p className="text-2xl font-bold text-[#082b3d] mt-1">{k.value}</p>
            <p className="text-[11px] text-[#777587]">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#e0ecf4]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-[#0e5d84] text-[#0e5d84]' : 'border-transparent text-[#777587] hover:text-[#082b3d]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <FeatureTags ids={TABS.find(t => t.id === tab)!.ids} />

      {tab === 'queue' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center gap-2">
            <select value={workflowFilter} onChange={e => setWorkflowFilter(e.target.value)} className="text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white">
              <option value="all">All workflows</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <div className="flex-1" />
            <input
              value={bulkComment}
              onChange={e => setBulkComment(e.target.value)}
              placeholder="Shared comment for bulk approval"
              className="text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5 min-w-0 w-full sm:w-64"
            />
            <button
              onClick={bulkApprove}
              disabled={selected.size === 0}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0e5d84] text-white hover:bg-[#083a4f] disabled:opacity-50"
            >
              Approve selected ({selected.size})
            </button>
          </div>
          {pending.length === 0 && <p className="p-6 text-center text-xs text-[#777587]">Nothing awaiting your action.</p>}
          <div className="divide-y divide-[#f0f7fb]">
            {pending.map(item => {
              const stage = stageOf(item);
              const def = wf(item.workflowId);
              const own = isOwnItem(item);
              return (
                <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 text-xs">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    className="accent-[#0e5d84] self-start md:self-center"
                    aria-label={`Select ${item.reference}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[#0e5d84]">{item.reference}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-[#464555]">{def.name}</span>
                      {isBreached(item) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">SLA breached</span>}
                      {own && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Created by you</span>}
                    </div>
                    <p className="font-semibold text-[#082b3d] mt-1">{item.subject}</p>
                    <p className="text-[11px] text-[#777587]">
                      Stage {item.stageIndex + 1}/{def.stages.length}: {stage.name} · owner {ROLE_NAMES[stage.owner]} · {item.hoursInStage}h of {stage.slaHours}h SLA · from {item.submittedBy}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setRejecting(item)} disabled={own} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold disabled:opacity-40">
                      Reject
                    </button>
                    <button
                      onClick={() => approve(item, 'Approved from queue') && addToast(`${item.reference} approved`, 'success')}
                      disabled={own}
                      title={own ? 'You cannot approve a request you created' : undefined}
                      className="px-3 py-1.5 rounded-lg bg-[#0e5d84] hover:bg-[#083a4f] text-white font-semibold disabled:opacity-40"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'definitions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map(w => (
            <div key={w.id} className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#082b3d]">{w.name}</p>
                  <p className="text-[11px] text-[#777587]">
                    Entity {w.entity} · v{w.version} · {w.mode}
                    {w.quorum && ` · ${w.quorum}`}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f7fb] text-[#0e5d84] border border-[#cbe0ec]">{w.phase}</span>
              </div>
              <ol className="space-y-2">
                {w.stages.map((s, i) => (
                  <li key={s.name} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-50">
                    <span className="w-5 h-5 rounded-full bg-[#0e5d84] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#082b3d]">{s.name}</p>
                      <p className="text-[10px] text-[#777587]">
                        {ROLE_NAMES[s.owner]}
                        {s.requiredDocs.length > 0 && ` · needs ${s.requiredDocs.join(', ')}`}
                      </p>
                    </div>
                    <label className="flex items-center gap-1 text-[10px] text-[#464555]">
                      SLA
                      <input
                        type="number"
                        min={1}
                        value={s.slaHours}
                        onChange={e => updateSla(w.id, i, Number(e.target.value))}
                        className="w-14 border border-[#cbe0ec] rounded px-1 py-0.5 text-right font-mono"
                        aria-label={`${w.name} ${s.name} SLA hours`}
                      />
                      h
                    </label>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[#464555]">
              <tr>
                {['When', 'Reference', 'Actor', 'Action', 'Transition', 'Comment'].map(h => (
                  <th key={h} className="text-left p-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {history.map(h => (
                <tr key={h.id}>
                  <td className="p-3 font-mono whitespace-nowrap">{h.at}</td>
                  <td className="p-3 font-mono text-[#0e5d84]">{queue.find(q => q.id === h.itemId)?.reference}</td>
                  <td className="p-3">{h.actor}</td>
                  <td className="p-3 font-semibold">{h.action}</td>
                  <td className="p-3 text-[#464555]">
                    {h.fromStage} → {h.toStage}
                  </td>
                  <td className="p-3 text-[#464555]">{h.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'delegation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={saveDelegation} className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3 text-xs">
            <p className="font-bold text-[#082b3d]">Delegate my approvals during leave</p>
            <label className="block">
              <span className="block font-semibold text-[#464555] mb-1">Delegate to</span>
              <select value={delegateTo} onChange={e => setDelegateTo(e.target.value)} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5">
                <option>Mrs. Kavitha Raman (Vice Principal)</option>
                <option>Mr. Joseph Antony (Branch Admin)</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block font-semibold text-[#464555] mb-1">From</span>
                <input type="date" value={delegateFrom} onChange={e => setDelegateFrom(e.target.value)} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5" />
              </label>
              <label className="block">
                <span className="block font-semibold text-[#464555] mb-1">Until</span>
                <input type="date" value={delegateUntil} onChange={e => setDelegateUntil(e.target.value)} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5" />
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="font-semibold px-3 py-1.5 rounded-lg bg-[#0e5d84] text-white hover:bg-[#083a4f]">
                Save delegation
              </button>
              {delegation && (
                <button
                  type="button"
                  onClick={() => {
                    setDelegation(null);
                    addToast('Delegation revoked', 'info');
                  }}
                  className="font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  Revoke
                </button>
              )}
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
              <span className="text-xs font-bold text-[#082b3d]">SLA breaches → escalate to Principal</span>
              <button
                onClick={escalateAll}
                disabled={breached.length === 0}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Escalate ({breached.length})
              </button>
            </div>
            {breached.length === 0 && <p className="p-4 text-xs text-[#777587]">No items past their SLA.</p>}
            {breached.map(item => (
              <div key={item.id} className="p-3 text-xs border-b border-[#f0f7fb]">
                <p className="font-semibold text-[#082b3d]">
                  {item.reference} · {item.subject}
                </p>
                <p className="text-[11px] text-rose-700">
                  {item.hoursInStage}h in “{stageOf(item).name}” against {stageOf(item).slaHours}h SLA
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-x-auto">
            <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] text-xs font-bold text-[#082b3d]">Time in stage vs SLA (bottlenecks first)</div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[#464555]">
                <tr>
                  {['Workflow', 'Stage', 'Avg hours', 'SLA', 'Load', 'Completed'].map(h => (
                    <th key={h} className="text-left p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f7fb]">
                {bottlenecks.map(b => (
                  <tr key={`${b.workflowId}-${b.stage}`}>
                    <td className="p-3">{b.workflow}</td>
                    <td className="p-3 font-semibold text-[#082b3d]">{b.stage}</td>
                    <td className="p-3 font-mono">{b.avgHours}</td>
                    <td className="p-3 font-mono">{b.sla}</td>
                    <td className="p-3 w-32">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${b.ratio > 0.8 ? 'bg-rose-500' : b.ratio > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(b.ratio * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono">{Math.round(b.ratio * 100)}%</span>
                    </td>
                    <td className="p-3 font-mono">{b.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-2">
            <p className="text-xs font-bold text-[#082b3d]">Approver throughput (logged transitions)</p>
            {throughput.map(([actor, count]) => (
              <div key={actor} className="flex justify-between text-xs p-2 rounded-lg bg-slate-50">
                <span className="truncate pr-2">{actor}</span>
                <span className="font-mono font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRejecting(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl text-xs" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-[#082b3d]">Reject {rejecting.reference}</h3>
            <label className="block">
              <span className="block font-semibold text-[#464555] mb-1">Reason code</span>
              <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5">
                {REJECT_REASONS.map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block font-semibold text-[#464555] mb-1">Comment (required)</span>
              <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} rows={3} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5" />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejecting(null)} className="font-semibold px-3 py-1.5 rounded-lg bg-slate-100">
                Cancel
              </button>
              <button onClick={confirmReject} className="font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
