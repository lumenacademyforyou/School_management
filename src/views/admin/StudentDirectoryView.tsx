import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags, downloadCsv } from '../../components/common/FeatureTags';
import { AddStudentModal, EditIdentifiersModal, EmisDisplay, EmisStatusBadge, StudentStatusBadge } from '../../components/students/StudentIdentifiers';
import { useGrants } from '../../hooks/useGrants';
import { DensityToggle } from '../../components/common/ui';
import { rosterStore, useRoster } from '../../services/studentService';
import {
  AuditEntry,
  EXPORT_COLUMNS,
  ChangeRequest,
  FIELD_VISIBILITY,
  INITIAL_CHANGE_REQUESTS,
  RosterStudent,
  STATUS_EFFECTS,
  STATUS_TRANSITIONS,
  STUDENTS_AS_OF,
  StudentStatus,
  ViewerRole,
  canTransition,
  checkEmis,
  duplicatePairs,
  formatEmis,
  fieldValue,
  identifierIssues,
  matchesSearch,
  planPromotion,
  toProfile,
} from '../../data/students';
import { Figure } from '../../components/common/Figure';
import { EmptyNote } from '../../components/common/EmptyNote';

type Tab = 'directory' | 'quality' | 'requests' | 'promotion' | 'audit';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'directory', label: 'Directory', icon: 'groups', ids: ['STU-005', 'STU-006', 'STU-007', 'STU-008', 'STU-010', 'STU-011', 'STU-012', 'STU-021', 'STU-022', 'STU-023', 'STU-024'] },
  { id: 'quality', label: 'Identifiers & Duplicates', icon: 'rule', ids: ['STU-002', 'STU-003', 'STU-025', 'STU-026', 'STU-027'] },
  { id: 'requests', label: 'Change Requests', icon: 'edit_note', ids: ['STU-009'] },
  { id: 'promotion', label: 'Promotion', icon: 'upgrade', ids: ['STU-013'] },
  { id: 'audit', label: 'Audit Trail', icon: 'history', ids: ['AUD-001', 'AUD-003', 'AUD-004'] },
];

const STATUSES: StudentStatus[] = ['Active', 'On leave', 'Suspended', 'TC issued', 'Alumni', 'Struck off'];
const SECTIONS = ['A', 'B', 'C'];

const fmt = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const inputCls = 'text-xs border border-line rounded-lg px-2 py-1.5 bg-white';
const btn = 'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40';
const btnPrimary = `${btn} bg-brand text-white hover:bg-brand-strong`;
const btnSoft = `${btn} bg-slate-100 hover:bg-slate-200 text-ink`;


const Panel: React.FC<{ title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, actions, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-line-soft shadow-xs overflow-hidden ${className}`}>
    <div className="p-3 bg-subtle border-b border-line flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-bold text-ink">{title}</span>
      {actions}
    </div>
    {children}
  </div>
);

interface Filters {
  classLevel: string;
  section: string;
  gender: string;
  category: string;
  status: string;
  fee: string;
  transport: string;
  house: string;
  emis: string;
}

const EMPTY_FILTERS: Filters = { classLevel: 'All', section: 'All', gender: 'All', category: 'All', status: 'All', fee: 'All', transport: 'All', house: 'All', emis: 'All' };
const EMIS_FILTER: Record<string, string> = { Valid: 'valid', Missing: 'empty', Invalid: 'invalid', Duplicate: 'duplicate' };

export const StudentDirectoryView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'directory' }) => {
  const { addToast, currentUser, campuses, setStudent, setAdminView } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const roster = useRoster();
  const setRoster = rosterStore.set;
  const g = useGrants();
  const [showEmis, setShowEmis] = useState(true);
  const [editingIds, setEditingIds] = useState<RosterStudent | null>(null);
  const [adding, setAdding] = useState(false);
  const [requests, setRequests] = useState<ChangeRequest[]>(INITIAL_CHANGE_REQUESTS);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [transfers, setTransfers] = useState<{ studentId: string; from: string; to: string; effective: string; kind: 'Section' | 'Branch' }[]>([
    { studentId: 'ros-03', from: '10-B', to: '10-A', effective: '2024-07-01', kind: 'Section' },
  ]);
  const [viewer, setViewer] = useState<ViewerRole>('Principal');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [bulkSection, setBulkSection] = useState('A');
  const [bulkStatus, setBulkStatus] = useState<StudentStatus>('On leave');
  const [bulkMessage, setBulkMessage] = useState('');
  const [effective, setEffective] = useState(STUDENTS_AS_OF);
  const [exportCols, setExportCols] = useState<Set<string>>(new Set(['admissionNo', 'name', 'class', 'status']));
  const [promoClass, setPromoClass] = useState(8);
  const [promoted, setPromoted] = useState<Set<number>>(new Set());
  const [holdOverrides, setHoldOverrides] = useState<Record<string, string>>({});
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState<ChangeRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [drawerSection, setDrawerSection] = useState('A');
  const [drawerStatus, setDrawerStatus] = useState<StudentStatus | ''>('');
  const [drawerCampus, setDrawerCampus] = useState('');

  const visibility = FIELD_VISIBILITY[viewer];
  const byId = (id: string) => roster.find(s => s.id === id)!;
  const live = useMemo(() => roster.filter(s => !s.mergedInto), [roster]);

  const log = (studentId: string, action: string, before: string, after: string) =>
    setAudit(prev => [{ at: new Date().toLocaleString('en-IN'), actor: `${currentUser.name} (${viewer})`, action, studentId, before, after }, ...prev]);

  const patchStudent = (id: string, patch: Partial<RosterStudent>) => setRoster(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));

  const houses = Array.from(new Set(roster.map(s => s.house))).sort();
  const rows = useMemo(
    () =>
      live
        .filter(s => matchesSearch(s, query))
        .filter(
          s =>
            (filters.classLevel === 'All' || String(s.classLevel) === filters.classLevel) &&
            (filters.section === 'All' || s.section === filters.section) &&
            (filters.gender === 'All' || s.gender === filters.gender) &&
            (filters.category === 'All' || s.category === filters.category) &&
            (filters.status === 'All' || s.status === filters.status) &&
            (filters.fee === 'All' || s.feeStatus === filters.fee) &&
            (filters.transport === 'All' || (filters.transport === 'School bus') === Boolean(s.transportRoute)) &&
            (filters.house === 'All' || s.house === filters.house) &&
            (filters.emis === 'All' || checkEmis(s.emis, s.id, live).state === EMIS_FILTER[filters.emis])
        )
        .sort((a, b) => b.classLevel - a.classLevel || a.section.localeCompare(b.section) || a.rollNo - b.rollNo),
    [live, query, filters]
  );

  const toggle = (id: string) =>
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allSelected = rows.length > 0 && rows.every(r => selected.has(r.id));

  // -------------------------------------------------------------------------
  // Bulk operations (STU-023, STU-024)
  // -------------------------------------------------------------------------

  const chosen = () => roster.filter(s => selected.has(s.id) && !s.mergedInto);

  const bulkSectionChange = () => {
    const list = chosen();
    list.forEach(s => {
      if (s.section === bulkSection) return;
      log(s.id, 'Section change', `${s.classLevel}-${s.section}`, `${s.classLevel}-${bulkSection} from ${fmt(effective)}`);
    });
    const moved = list.filter(s => s.section !== bulkSection);
    setTransfers(prev => [...moved.map(s => ({ studentId: s.id, from: `${s.classLevel}-${s.section}`, to: `${s.classLevel}-${bulkSection}`, effective, kind: 'Section' as const })), ...prev]);
    setRoster(prev => prev.map(s => (moved.some(m => m.id === s.id) ? { ...s, section: bulkSection } : s)));
    addToast(`Moved ${moved.length} student(s) to section ${bulkSection}`, 'success', `Effective ${fmt(effective)} · history kept`);
  };

  const bulkStatusChange = () => {
    const list = chosen();
    const ok = list.filter(s => canTransition(s.status, bulkStatus));
    ok.forEach(s => log(s.id, 'Status change', s.status, bulkStatus));
    setRoster(prev => prev.map(s => (ok.some(o => o.id === s.id) ? { ...s, status: bulkStatus } : s)));
    addToast(`${ok.length} set to ${bulkStatus}`, ok.length === list.length ? 'success' : 'warning', list.length - ok.length ? `${list.length - ok.length} skipped: that change is not allowed from their current status` : STATUS_EFFECTS[bulkStatus]);
  };

  const bulkSend = () => {
    const list = chosen();
    if (!bulkMessage.trim()) {
      addToast('Type a message first', 'warning');
      return;
    }
    const reachable = list.filter(s => ['Active', 'On leave', 'Suspended'].includes(s.status));
    addToast(`Message queued for ${reachable.length} guardian(s)`, 'success', list.length - reachable.length ? `${list.length - reachable.length} skipped (TC issued, alumni or struck off)` : undefined);
    setBulkMessage('');
  };

  const exportSelected = () => {
    if (!visibility.export) {
      addToast(`${viewer} does not hold the Export permission`, 'error', 'RBAC-004');
      return;
    }
    const list = selected.size ? chosen() : rows;
    const cols = EXPORT_COLUMNS.filter(c => exportCols.has(c.key) && (!c.restricted || visibility[c.restricted]));
    downloadCsv(
      `Students_${STUDENTS_AS_OF}.csv`,
      cols.map(c => c.label),
      list.map(s => cols.map(c => c.value(s)))
    );
    log('—', 'Bulk export', '', `${list.length} rows · columns: ${cols.map(c => c.label).join(', ')}`);
    addToast(`Exported ${list.length} students`, 'success', 'Export event recorded in the audit trail');
  };

  // -------------------------------------------------------------------------
  // Drawer actions (STU-006, STU-008, STU-011, STU-012)
  // -------------------------------------------------------------------------

  const open = openId ? byId(openId) : null;

  const openDrawer = (s: RosterStudent) => {
    setOpenId(s.id);
    setDrawerSection(s.section);
    setDrawerStatus('');
    setDrawerCampus(s.campusId);
  };

  const moveContact = (s: RosterStudent, idx: number, dir: -1 | 1) => {
    const list = [...s.emergencyContacts];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    patchStudent(s.id, { emergencyContacts: list });
    log(s.id, 'Emergency contact order', s.emergencyContacts.map(c => c.name).join(' > '), list.map(c => c.name).join(' > '));
  };

  const applyStatus = (s: RosterStudent) => {
    if (!drawerStatus) return;
    if (!canTransition(s.status, drawerStatus)) {
      addToast(`Cannot move from ${s.status} to ${drawerStatus}`, 'error');
      return;
    }
    patchStudent(s.id, { status: drawerStatus });
    log(s.id, 'Status change', s.status, drawerStatus);
    addToast(`${s.name}: ${drawerStatus}`, 'success', STATUS_EFFECTS[drawerStatus]);
    setDrawerStatus('');
  };

  const applySection = (s: RosterStudent) => {
    if (drawerSection === s.section) return;
    setTransfers(prev => [{ studentId: s.id, from: `${s.classLevel}-${s.section}`, to: `${s.classLevel}-${drawerSection}`, effective, kind: 'Section' }, ...prev]);
    patchStudent(s.id, { section: drawerSection });
    log(s.id, 'Section change', `${s.classLevel}-${s.section}`, `${s.classLevel}-${drawerSection} from ${fmt(effective)}`);
    addToast(`${s.name} moved to ${s.classLevel}-${drawerSection}`, 'success', `Effective ${fmt(effective)}`);
  };

  const applyBranch = (s: RosterStudent) => {
    if (drawerCampus === s.campusId) return;
    const from = campuses.find(c => c.id === s.campusId)?.name ?? s.campusId;
    const to = campuses.find(c => c.id === drawerCampus)?.name ?? drawerCampus;
    setTransfers(prev => [{ studentId: s.id, from, to, effective, kind: 'Branch' }, ...prev]);
    patchStudent(s.id, { campusId: drawerCampus });
    log(s.id, 'Branch transfer', from, `${to} (admission no ${s.admissionNo} kept)`);
    addToast(`${s.name} transferred to ${to}`, 'success', 'Identifiers and history carried over');
  };

  const openProfile = (s: RosterStudent) => {
    setStudent(toProfile(s));
    setAdminView('student-360');
  };

  // -------------------------------------------------------------------------
  // Data quality (STU-003, STU-025)
  // -------------------------------------------------------------------------

  const issues = identifierIssues(roster);
  const dups = duplicatePairs(roster);

  const merge = (keep: RosterStudent, drop: RosterStudent) => {
    setRoster(prev => prev.map(s => (s.id === drop.id ? { ...s, mergedInto: keep.id } : s)));
    setTransfers(prev => prev.map(t => (t.studentId === drop.id ? { ...t, studentId: keep.id } : t)));
    log(keep.id, 'Merge duplicate', `${drop.admissionNo} (${drop.status})`, `merged into ${keep.admissionNo}; both histories kept`);
    addToast(`Merged ${drop.admissionNo} into ${keep.admissionNo}`, 'success', 'Both histories are kept under the surviving record');
  };

  // -------------------------------------------------------------------------
  // Change requests (STU-009)
  // -------------------------------------------------------------------------

  const approve = (r: ChangeRequest) => {
    const s = byId(r.studentId);
    const before = fieldValue(s, r.field);
    patchStudent(s.id, { [r.field]: r.after } as Partial<RosterStudent>);
    setRequests(prev => prev.map(x => (x.id === r.id ? { ...x, status: 'Approved' } : x)));
    log(s.id, `Profile change: ${r.label}`, before, r.after);
    addToast(`${r.label} updated for ${s.name}`, 'success');
  };

  const confirmReject = () => {
    if (!rejecting || !rejectReason.trim()) {
      addToast('A reason is required', 'warning');
      return;
    }
    setRequests(prev => prev.map(x => (x.id === rejecting.id ? { ...x, status: 'Rejected', reason: rejectReason.trim() } : x)));
    log(rejecting.studentId, `Profile change rejected: ${rejecting.label}`, '', rejectReason.trim());
    setRejecting(null);
    setRejectReason('');
  };

  // -------------------------------------------------------------------------
  // Promotion (STU-013)
  // -------------------------------------------------------------------------

  const alreadyMoved = roster.filter(s => s.classLevel === promoClass && promotedIds.has(s.id)).length;
  const plan = planPromotion(roster.filter(s => !promotedIds.has(s.id)), promoClass).map(l => (holdOverrides[l.student.id] ? { ...l, outcome: 'Hold' as const, toClass: promoClass, note: `Held: ${holdOverrides[l.student.id]}` } : l));

  const commitPromotion = () => {
    if (promoted.has(promoClass)) {
      addToast(`Class ${promoClass} has already been promoted this year`, 'warning');
      return;
    }
    const moving = plan.filter(l => l.outcome === 'Promote');
    setRoster(prev => prev.map(s => (moving.some(m => m.student.id === s.id) ? { ...s, classLevel: promoClass + 1, yearResult: 'Pass' } : s)));
    plan.forEach(l => log(l.student.id, `Year-end ${l.outcome.toLowerCase()}`, `Class ${promoClass}`, `Class ${l.toClass} · ${l.note}`));
    setPromoted(prev => new Set(prev).add(promoClass));
    setPromotedIds(prev => new Set([...prev, ...plan.map(l => l.student.id)]));
    addToast(`Class ${promoClass}: ${moving.length} promoted`, 'success', `${plan.filter(l => l.outcome === 'Detain').length} detained · ${plan.filter(l => l.outcome === 'Hold').length} held`);
  };

  const setFilter = (key: keyof Filters, value: string) => setFilters(prev => ({ ...prev, [key]: value }));
  const filterOptions: [keyof Filters, string, string[]][] = [
    ['classLevel', 'Class', ['All', '8', '9', '10', '11']],
    ['section', 'Section', ['All', ...SECTIONS]],
    ['gender', 'Gender', ['All', 'Female', 'Male']],
    ['category', 'Category', ['All', 'General', 'OBC', 'SC', 'ST', 'EWS']],
    ['status', 'Status', ['All', ...STATUSES]],
    ['fee', 'Fee', ['All', 'Paid', 'Due', 'Overdue']],
    ['transport', 'Transport', ['All', 'School bus', 'Own transport']],
    ['house', 'House', ['All', ...houses]],
    ['emis', 'EMIS', ['All', 'Valid', 'Missing', 'Invalid', 'Duplicate']],
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>Module 13 · Student 360 (STU)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">Students</h1>
          <p className="text-xs text-ink-soft mt-1">
            {live.length} records · {issues.length} identifier issue(s) · {dups.length} probable duplicate(s) · {requests.filter(r => r.status === 'Pending').length} pending change request(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setAdding(true)}
            disabled={!g.can('STU-001', 'C')}
            title={g.why('STU-001', 'C')}
            className={btnPrimary}
          >
            Add student
          </button>
        <label className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-ink-soft">Viewing as</span>
          <select value={viewer} onChange={e => setViewer(e.target.value as ViewerRole)} className={inputCls}>
            {(Object.keys(FIELD_VISIBILITY) as ViewerRole[]).map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line-soft">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <FeatureTags ids={TABS.find(t => t.id === tab)!.ids} />

      {tab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl border border-line-soft shadow-sm p-3 space-y-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name (typos allowed), admission no, guardian mobile, PEN, APAAR or EMIS"
              className={`${inputCls} w-full`}
              aria-label="Search students"
            />
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {filterOptions.map(([key, label, options]) => (
                <label key={key} className="block">
                  <span className="block text-[10px] font-semibold text-ink-soft">{label}</span>
                  <select value={filters[key]} onChange={e => setFilter(key, e.target.value)} className={`${inputCls} w-full`} aria-label={`Filter ${label}`}>
                    {options.map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>
                {rows.length} shown · {selected.size} selected
              </span>
              <span className="flex flex-wrap items-center gap-3">
                <DensityToggle />
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={showEmis} onChange={e => setShowEmis(e.target.checked)} className="accent-brand" aria-label="Show EMIS column" />
                  Show EMIS column
                </label>
                <button onClick={() => { setFilters(EMPTY_FILTERS); setQuery(''); }} className="font-semibold text-brand hover:underline">
                  Clear filters
                </button>
              </span>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="bg-subtle rounded-2xl border border-line p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-ink">Change section</p>
                <div className="flex gap-1">
                  <select value={bulkSection} onChange={e => setBulkSection(e.target.value)} className={inputCls} aria-label="Target section">
                    {SECTIONS.map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <input type="date" value={effective} onChange={e => setEffective(e.target.value)} className={inputCls} aria-label="Effective date" />
                  <button onClick={bulkSectionChange} className={btnPrimary}>
                    Move
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-ink">Change status</p>
                <div className="flex gap-1">
                  <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as StudentStatus)} className={inputCls} aria-label="Target status">
                    {STATUSES.map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button onClick={bulkStatusChange} className={btnPrimary}>
                    Apply
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-ink">Message guardians</p>
                <div className="flex gap-1">
                  <input value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} placeholder="Message" className={`${inputCls} flex-1 min-w-0`} aria-label="Bulk message" />
                  <button onClick={bulkSend} className={btnPrimary}>
                    Send
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-ink">Export</p>
                <button onClick={exportSelected} disabled={!visibility.export} title={visibility.export ? undefined : `${viewer} cannot export`} className={btnPrimary}>
                  Export {selected.size} selected
                </button>
                <button onClick={() => setSelected(new Set())} className={`${btnSoft} ml-1`}>
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className={`bg-white rounded-2xl border border-line-soft shadow-xs overflow-hidden ${open ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead className="bg-slate-50 text-ink-soft">
                    <tr>
                      <th className="cell w-8">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() =>
                            setSelected(prev => {
                              const n = new Set(prev);
                              rows.forEach(r => (allSelected ? n.delete(r.id) : n.add(r.id)));
                              return n;
                            })
                          }
                          className="accent-brand"
                          aria-label="Select all shown"
                        />
                      </th>
                      {['Student', 'Class', 'Admission no', ...(showEmis ? ['EMIS no'] : []), 'Guardian', 'Fee', 'Status'].map(h => (
                        <th key={h} className="text-left cell font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {rows.map(s => (
                      <tr key={s.id} className={`cursor-pointer ${openId === s.id ? 'bg-subtle' : 'hover:bg-wash'}`} onClick={() => openDrawer(s)}>
                        <td className="cell" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="accent-brand" aria-label={`Select ${s.name} ${s.admissionNo}`} />
                        </td>
                        <td className="cell">
                          <p className="font-semibold text-ink">{s.name}</p>
                          <p className="text-[10px] text-ink-muted">
                            {s.gender} · {s.house}
                            {s.transportRoute ? ` · ${s.transportRoute}` : ''}
                          </p>
                        </td>
                        <td className="cell whitespace-nowrap">
                          {s.classLevel}-{s.section} · #{s.rollNo}
                        </td>
                        <td className="cell font-mono whitespace-nowrap">{s.admissionNo}</td>
                        {showEmis && (
                          <td className="cell whitespace-nowrap" data-emis-cell={s.id}>
                            <p className="font-mono">{s.emis ? formatEmis(s.emis) : '—'}</p>
                            <EmisStatusBadge check={checkEmis(s.emis, s.id, live)} />
                          </td>
                        )}
                        <td className="cell">
                          <p>{s.guardianName}</p>
                          <p className="text-[10px] text-ink-muted font-mono">{s.guardianMobile}</p>
                        </td>
                        <td className={`cell ${s.feeStatus === 'Overdue' ? 'text-rose-600 font-semibold' : ''}`}>{s.feeStatus}</td>
                        <td className="cell">
                          <StudentStatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length === 0 && <EmptyNote>No students match.</EmptyNote>}
              </div>
            </div>

            {open && (
              <div className="bg-white rounded-2xl border border-line shadow-xs p-4 space-y-4 text-xs self-start">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-ink">{open.name}</p>
                    <p className="text-[11px] text-ink-muted">
                      {open.admissionNo} · Class {open.classLevel}-{open.section} · Roll {open.rollNo}
                    </p>
                    <StudentStatusBadge status={open.status} />
                  </div>
                  <button onClick={() => setOpenId(null)} className="text-ink-muted hover:text-ink" aria-label="Close details">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
                <button onClick={() => openProfile(open)} className={`${btnPrimary} w-full`}>
                  Open 360° profile
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['PEN', open.pen],
                    ['APAAR', open.apaar || 'Not generated'],
                    ['Date of birth', fmt(open.dob)],
                    ['Category', open.category],
                    ['Branch', campuses.find(c => c.id === open.campusId)?.name ?? open.campusId],
                    ['Batch', (() => { const y = open.admissionNo.match(/\d{4}/)?.[0]; return y ? `${y}–${String(Number(y) + 1).slice(-2)}` : '—'; })()],
                    ['School', campuses.find(c => c.id === open.campusId)?.name ?? 'Lumen Academy'],
                    ['Academic Year', campuses.find(c => c.id === open.campusId)?.academicYear ?? 'AY 2024–25'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[10px] text-ink-muted">{k}</p>
                      <p className="font-mono font-semibold text-ink break-all">{v}</p>
                    </div>
                  ))}
                </div>

                <EmisDisplay student={open} canEdit={g.can('STU-026', 'U')} editWhy={g.why('STU-026', 'U')} onEdit={() => setEditingIds(open)} />
                <button onClick={() => setEditingIds(open)} disabled={!g.can('STU-026', 'U')} title={g.why('STU-026', 'U')} className={`${btnSoft} w-full`}>
                  Edit identifiers
                </button>

                <div>
                  <p className="font-semibold text-ink mb-1">Guardian & siblings</p>
                  <p>
                    {open.guardianName} · <span className="font-mono">{open.guardianMobile}</span>
                  </p>
                  {live
                    .filter(x => x.id !== open.id && x.guardianMobile === open.guardianMobile)
                    .map(x => (
                      <button key={x.id} onClick={() => openDrawer(x)} className="block text-brand hover:underline">
                        Sibling: {x.name} ({x.classLevel}-{x.section}, {campuses.find(c => c.id === x.campusId)?.name})
                      </button>
                    ))}
                </div>

                <div>
                  <p className="font-semibold text-ink mb-1">Emergency contacts (call in this order)</p>
                  {open.emergencyContacts.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1 py-0.5">
                      <span className="w-4 font-mono text-ink-muted">{i + 1}.</span>
                      <span className="flex-1">
                        {c.name} · {c.relation} · <span className="font-mono">{c.phone}</span>
                      </span>
                      <button onClick={() => moveContact(open, i, -1)} disabled={i === 0} className="disabled:opacity-30" aria-label={`Move ${c.name} up`}>
                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                      </button>
                      <button onClick={() => moveContact(open, i, 1)} disabled={i === open.emergencyContacts.length - 1} className="disabled:opacity-30" aria-label={`Move ${c.name} down`}>
                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-2 rounded-lg bg-slate-50 space-y-1">
                  <p className="font-semibold text-ink">Restricted notes</p>
                  <p>
                    <span className="text-ink-muted">Health: </span>
                    {visibility.health ? open.healthNotes ?? 'None recorded' : <span className="italic text-ink-muted">Hidden for {viewer}</span>}
                  </p>
                  <p>
                    <span className="text-ink-muted">Discipline & counselling: </span>
                    {visibility.discipline ? open.disciplineNotes ?? 'None recorded' : <span className="italic text-ink-muted">Hidden for {viewer}</span>}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-ink">Change status</p>
                  <div className="flex gap-1">
                    <select value={drawerStatus} onChange={e => setDrawerStatus(e.target.value as StudentStatus)} className={`${inputCls} flex-1`} aria-label="New status">
                      <option value="">Choose…</option>
                      {STATUS_TRANSITIONS[open.status].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button onClick={() => applyStatus(open)} disabled={!drawerStatus} className={btnPrimary}>
                      Apply
                    </button>
                  </div>
                  {drawerStatus && <p className="text-[10px] text-amber-700">{STATUS_EFFECTS[drawerStatus]}</p>}
                  {STATUS_TRANSITIONS[open.status].length === 0 && <EmptyNote>No further status changes allowed.</EmptyNote>}
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-ink">Section transfer</p>
                  <div className="flex gap-1">
                    <select value={drawerSection} onChange={e => setDrawerSection(e.target.value)} className={inputCls} aria-label="New section">
                      {SECTIONS.map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <input type="date" value={effective} onChange={e => setEffective(e.target.value)} className={`${inputCls} flex-1`} aria-label="Transfer effective date" />
                    <button onClick={() => applySection(open)} disabled={drawerSection === open.section} className={btnPrimary}>
                      Move
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-ink">Branch transfer</p>
                  <div className="flex gap-1">
                    <select value={drawerCampus} onChange={e => setDrawerCampus(e.target.value)} className={`${inputCls} flex-1`} aria-label="New branch">
                      {campuses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => applyBranch(open)} disabled={drawerCampus === open.campusId} className={btnPrimary}>
                      Transfer
                    </button>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-ink mb-1">Transfer history</p>
                  {transfers.filter(t => t.studentId === open.id).length === 0 && <EmptyNote>No transfers.</EmptyNote>}
                  {transfers
                    .filter(t => t.studentId === open.id)
                    .map((t, i) => (
                      <p key={i}>
                        {t.kind}: {t.from} → {t.to} · from {fmt(t.effective)}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </div>

          <details className="bg-surface rounded-2xl border border-line-soft shadow-sm p-3 text-xs">
            <summary className="font-semibold text-ink cursor-pointer">Export columns & field visibility</summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="flex flex-wrap gap-2">
                {EXPORT_COLUMNS.map(c => {
                  const hidden = Boolean(c.restricted && !visibility[c.restricted]);
                  return (
                    <label key={c.key} className={`flex items-center gap-1 ${hidden ? 'opacity-40' : ''}`}>
                      <input
                        type="checkbox"
                        disabled={hidden}
                        checked={exportCols.has(c.key) && !hidden}
                        onChange={() =>
                          setExportCols(prev => {
                            const n = new Set(prev);
                            if (n.has(c.key)) n.delete(c.key);
                            else n.add(c.key);
                            return n;
                          })
                        }
                        className="accent-brand"
                      />
                      {c.label}
                    </label>
                  );
                })}
              </div>
              <table className="w-full">
                <thead className="text-ink-soft">
                  <tr>
                    <th className="text-left">Role</th>
                    <th>Health</th>
                    <th>Discipline</th>
                    <th>Export</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.entries(FIELD_VISIBILITY) as [ViewerRole, (typeof FIELD_VISIBILITY)[ViewerRole]][]).map(([role, v]) => (
                    <tr key={role} className={role === viewer ? 'font-bold' : ''}>
                      <td>{role}</td>
                      {[v.health, v.discipline, v.export].map((ok, i) => (
                        <td key={i} className={`text-center ${ok ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {ok ? '✓' : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {tab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title={`Identifier problems · ${issues.length}`}>
            <div className="divide-y divide-subtle">
              {issues.length === 0 && <EmptyNote>All PEN, APAAR and EMIS numbers are present and valid.</EmptyNote>}
              {issues.map((i, idx) => {
                const s = byId(i.studentId);
                return (
                  <div key={idx} className="p-3 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-ink">
                        {s.name} <span className="font-mono text-ink-muted">{s.admissionNo}</span>
                      </p>
                      <p className="text-rose-700">
                        <span className="font-bold">{i.field}:</span> {i.problem}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setTab('directory');
                        openDrawer(s);
                      }}
                      className={btnSoft}
                    >
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="p-3 text-[10px] text-ink-muted border-t border-subtle">
              Rules: PEN is 11 digits and APAAR is 12 digits, and each must be unique. A missing APAAR never blocks admission; it is only flagged here.
            </p>
          </Panel>

          <Panel title={`Probable duplicates · ${dups.length}`}>
            <div className="divide-y divide-subtle">
              {dups.length === 0 && <EmptyNote>No duplicates. Twins with different names are never flagged.</EmptyNote>}
              {dups.map(([a, b]) => {
                const keep = a.status === 'Active' ? a : b.status === 'Active' ? b : a;
                const drop = keep === a ? b : a;
                return (
                  <div key={`${a.id}-${b.id}`} className="p-3 text-xs space-y-2">
                    <p className="font-semibold text-ink">
                      {a.name} · born {fmt(a.dob)} · guardian {a.guardianMobile}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[a, b].map(s => (
                        <div key={s.id} className={`p-2 rounded-lg border ${s === keep ? 'border-emerald-300 bg-emerald-50' : 'border-line-soft'}`}>
                          <p className="font-mono">{s.admissionNo}</p>
                          <p>
                            Class {s.classLevel}-{s.section} · {s.status}
                          </p>
                          {s === keep && <p className="text-[10px] text-emerald-700 font-semibold">Will be kept</p>}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => merge(keep, drop)} className={btnPrimary}>
                      Merge into {keep.admissionNo}
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'requests' && (
        <Panel title="Profile changes requested by parents">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead className="bg-slate-50 text-ink-soft">
                <tr>
                  {['Student', 'Field', 'Current', 'Requested', 'From', 'Status', ''].map(h => (
                    <th key={h} className="text-left cell font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {requests.map(r => {
                  const s = byId(r.studentId);
                  return (
                    <tr key={r.id}>
                      <td className="cell font-semibold text-ink">{s.name}</td>
                      <td className="cell">{r.label}</td>
                      <td className="cell font-mono">{fieldValue(s, r.field)}</td>
                      <td className="cell font-mono text-brand">{r.after}</td>
                      <td className="cell">
                        {r.requestedBy}
                        <p className="text-[10px] text-ink-muted">{fmt(r.requestedOn)}</p>
                      </td>
                      <td className="cell">
                        {r.status}
                        {r.reason && <p className="text-[10px] text-ink-muted">{r.reason}</p>}
                      </td>
                      <td className="cell whitespace-nowrap text-right">
                        {r.status === 'Pending' && (
                          <span className="inline-flex gap-1">
                            <button onClick={() => setRejecting(r)} className={btnSoft}>
                              Reject
                            </button>
                            <button onClick={() => approve(r)} className={btnPrimary}>
                              Approve
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'promotion' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[8, 9, 10].map(c => (
              <button key={c} onClick={() => setPromoClass(c)} className={promoClass === c ? btnPrimary : btnSoft}>
                Class {c}
                {promoted.has(c) ? ' ✓' : ''}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={commitPromotion} disabled={promoted.has(promoClass) || plan.length === 0} className={btnPrimary}>
              Commit year-end promotion for Class {promoClass}
            </button>
          </div>
          <Panel title={`Class ${promoClass} · ${plan.filter(l => l.outcome === 'Promote').length} promote · ${plan.filter(l => l.outcome === 'Detain').length} detain · ${plan.filter(l => l.outcome === 'Hold').length} hold`}>
            <table className="data-table w-full">
              <thead className="bg-slate-50 text-ink-soft">
                <tr>
                  {['Student', 'Section', 'Outcome', 'Moves to', 'Note', 'Exception'].map(h => (
                    <th key={h} className="text-left cell font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {plan.map(l => (
                  <tr key={l.student.id}>
                    <td className="cell font-semibold text-ink">{l.student.name}</td>
                    <td className="cell">
                      {l.student.section} · #{l.student.rollNo}
                    </td>
                    <td className={`cell font-bold ${l.outcome === 'Promote' ? 'text-emerald-700' : l.outcome === 'Detain' ? 'text-rose-700' : 'text-amber-700'}`}>{l.outcome}</td>
                    <td className="cell">Class {l.toClass}</td>
                    <td className="cell text-ink-soft">{l.note}</td>
                    <td className="cell">
                      {l.student.yearResult === 'Pass' && !promoted.has(promoClass) && (
                        <select
                          value={holdOverrides[l.student.id] ?? ''}
                          onChange={e =>
                            setHoldOverrides(prev => {
                              const n = { ...prev };
                              if (e.target.value) n[l.student.id] = e.target.value;
                              else delete n[l.student.id];
                              return n;
                            })
                          }
                          className={inputCls}
                          aria-label={`Hold ${l.student.name}`}
                        >
                          <option value="">No exception</option>
                          <option>Attendance below <Figure value="75" suffix="%" /></option>
                          <option>Fee clearance pending</option>
                          <option>Parent requested repeat</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plan.length === 0 && <EmptyNote>No active students in this class are awaiting promotion.</EmptyNote>}
            {alreadyMoved > 0 && (
              <p className="px-3 pb-2 text-[11px] text-ink-soft">{alreadyMoved} student(s) promoted into this class earlier this year are excluded from this run.</p>
            )}
            <p className="p-3 text-[10px] text-ink-muted border-t border-subtle">
              A pass moves the student up a class. Detained students stay in their class. Compartment results are held until the supplementary exam. Each class can be promoted once per year, and every outcome is written to the audit trail.
            </p>
          </Panel>
        </div>
      )}

      {tab === 'audit' && (
        <Panel title={`Audit trail · ${audit.length} change(s) this session`}>
          {audit.length === 0 ? (
            <p className="p-4 text-xs text-ink-muted">No changes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead className="bg-slate-50 text-ink-soft">
                  <tr>
                    {['When', 'Who', 'Student', 'Action', 'Before', 'After'].map(h => (
                      <th key={h} className="text-left cell font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {audit.map((a, i) => (
                    <tr key={i}>
                      <td className="cell font-mono whitespace-nowrap">{a.at}</td>
                      <td className="cell">{a.actor}</td>
                      <td className="cell">{a.studentId === '—' ? '—' : byId(a.studentId).name}</td>
                      <td className="cell font-semibold">{a.action}</td>
                      <td className="cell text-ink-muted">{a.before}</td>
                      <td className="cell">{a.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]" onClick={() => setRejecting(null)}>
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-xs ring-1 ring-lumen-950/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ink">Reject change: {rejecting.label}</h3>
            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason shown to the parent" className={`${inputCls} w-full`} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejecting(null)} className={btnSoft}>
                Cancel
              </button>
              <button onClick={confirmReject} className={`${btn} bg-rose-600 text-white`}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      <EditIdentifiersModal student={editingIds} onClose={() => setEditingIds(null)} onSaved={saved => log(saved.id, 'Identifiers updated', '', `EMIS ${saved.emis ?? '—'} · APAAR ${saved.apaar || '—'}`)} />
      <AddStudentModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={created => {
          log(created.id, 'Student record created', '', `${created.admissionNo} · Class ${created.classLevel}-${created.section}`);
          openDrawer(created);
        }}
      />
    </div>
  );
};
