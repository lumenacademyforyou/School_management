import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags, PhaseNotice, downloadCsv } from '../../components/common/FeatureTags';
import { AttendanceView } from './AttendanceView';
import { INITIAL_ROSTER } from '../../data/students';
import {
  ALERT_SEND_TIME,
  ATTENDANCE_AS_OF,
  AY_END,
  CORRECTION_WINDOW_DAYS,
  DEFAULT_STATUS_CODES,
  HOLIDAYS,
  Holiday,
  INITIAL_LEAVES,
  INITIAL_REGISTER,
  LeaveRequest,
  MARKING_CUTOFF,
  Mark,
  REGISTER_FROM,
  Register,
  SECTION_CONFIG,
  SectionConfig,
  StatusCode,
  StatusDef,
  addDays,
  attendancePct,
  chronicAbsence,
  classifyDay,
  dateRange,
  daysNeeded,
  lateCount,
  markKey,
  markingStatus,
  plannedAbsence,
  studentsInSection,
  workingDays,
} from '../../data/attendance';

type Tab = 'roll' | 'mark' | 'compliance' | 'register' | 'insights' | 'leave' | 'settings';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'roll', label: 'Live Roll Call · 10-A', icon: 'how_to_reg', ids: ['ATT-002', 'ATT-010'] },
  { id: 'mark', label: 'Mark & Correct', icon: 'edit_calendar', ids: ['ATT-002', 'ATT-003', 'ATT-004', 'ATT-009', 'ATT-010', 'ATT-012', 'ATT-013', 'ATT-015'] },
  { id: 'compliance', label: 'Marking Compliance', icon: 'task_alt', ids: ['ATT-014'] },
  { id: 'register', label: 'Monthly Register', icon: 'calendar_view_month', ids: ['ATT-016', 'ATT-017', 'ATT-020', 'ATT-023'] },
  { id: 'insights', label: 'Shortfall & Alerts', icon: 'crisis_alert', ids: ['ATT-009', 'ATT-018', 'ATT-019', 'ATT-021'] },
  { id: 'leave', label: 'Leave', icon: 'event_busy', ids: ['ATT-011', 'ATT-012'] },
  { id: 'settings', label: 'Settings', icon: 'settings', ids: ['ATT-001', 'ATT-003', 'ATT-015'] },
];

const MONTHS = [
  { key: '2024-08', label: 'August 2024' },
  { key: '2024-09', label: 'September 2024' },
];

const fmt = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const nowTime = () => new Date().toTimeString().slice(0, 5);

const inputCls = 'text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white';
const btn = 'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40';
const btnPrimary = `${btn} bg-[#0e5d84] text-white hover:bg-[#083a4f]`;
const btnSoft = `${btn} bg-slate-100 hover:bg-slate-200 text-[#082b3d]`;

const Panel: React.FC<{ title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, actions, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden ${className}`}>
    <div className="p-3 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-bold text-[#082b3d]">{title}</span>
      {actions}
    </div>
    {children}
  </div>
);

const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${className}`}>{children}</span>
);

interface Draft {
  code: StatusCode;
  reason: string;
  arrivedAt: string;
}

interface Correction {
  id: string;
  studentId: string;
  date: string;
  before: string;
  after: Mark;
  reason: string;
  requestedBy: string;
  status: 'Applied' | 'Pending approval' | 'Rejected';
}

export const AttendanceDeskView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'mark' }) => {
  const { addToast, currentUser } = useApp();
  const me = currentUser.name;
  const asOf = ATTENDANCE_AS_OF;
  const students = INITIAL_ROSTER;
  const nameOf = (id: string) => students.find(s => s.id === id)?.name ?? id;

  const [tab, setTab] = useState<Tab>(initialTab);
  const [register, setRegister] = useState<Register>(INITIAL_REGISTER);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [codes, setCodes] = useState<StatusDef[]>(DEFAULT_STATUS_CODES);
  const [sections, setSections] = useState<SectionConfig[]>(SECTION_CONFIG);
  const [holidays, setHolidays] = useState<Holiday[]>(HOLIDAYS);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [alertsSent, setAlertsSent] = useState<string[]>([]);
  const [nudged, setNudged] = useState<string[]>([]);

  const codeDef = (c: StatusCode) => codes.find(x => x.code === c)!;
  const days = useMemo(() => workingDays(REGISTER_FROM, asOf, holidays), [holidays, asOf]);
  const remaining = useMemo(() => workingDays(addDays(asOf, 1), AY_END, holidays).length, [holidays, asOf]);

  // -------------------------------------------------------------------------
  // Mark & correct
  // -------------------------------------------------------------------------
  const [markSection, setMarkSection] = useState('8-A');
  const [markDate, setMarkDate] = useState(asOf);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [correctionReason, setCorrectionReason] = useState('');

  const dayKind = classifyDay(markDate, holidays);
  const sectionStudents = studentsInSection(students, markSection);
  const isPast = markDate < asOf;
  const isFuture = markDate > asOf;
  const ageDays = Math.round((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${markDate}T00:00:00Z`)) / 86_400_000);
  const needsApproval = isPast && ageDays > CORRECTION_WINDOW_DAYS;

  const draftFor = (sid: string): Draft => {
    if (drafts[sid]) return drafts[sid];
    const saved = register[markKey(sid, markDate)];
    if (saved) return { code: saved.code, reason: saved.reason ?? '', arrivedAt: saved.arrivedAt ?? '' };
    const leave = plannedAbsence(leaves, sid, markDate);
    if (leave) return { code: 'LV', reason: `Approved leave ${leave.id}: ${leave.reason}`, arrivedAt: '' };
    return { code: 'P', reason: '', arrivedAt: '' };
  };
  const setDraft = (sid: string, patch: Partial<Draft>) => setDrafts(prev => ({ ...prev, [sid]: { ...draftFor(sid), ...patch } }));
  const resetDrafts = () => setDrafts({});

  const changed = sectionStudents.filter(s => {
    const saved = register[markKey(s.id, markDate)];
    const d = draftFor(s.id);
    return !saved || saved.code !== d.code || (saved.reason ?? '') !== d.reason || (saved.arrivedAt ?? '') !== d.arrivedAt;
  });
  const alreadyMarked = sectionStudents.some(s => register[markKey(s.id, markDate)]);

  const validationErrors = sectionStudents
    .map(s => {
      const d = draftFor(s.id);
      if (codeDef(d.code).reason === 'required' && !d.reason.trim()) return `${s.name}: ${codeDef(d.code).label} needs a reason`;
      if (d.code === 'L' && !/^\d{2}:\d{2}$/.test(d.arrivedAt)) return `${s.name}: enter the arrival time (HH:MM)`;
      return null;
    })
    .filter((e): e is string => Boolean(e));

  const save = () => {
    if (!dayKind.working) {
      addToast(`${fmt(markDate)} is not a working day (${dayKind.reason})`, 'warning');
      return;
    }
    if (isFuture) {
      addToast('Attendance cannot be marked for a future date', 'warning');
      return;
    }
    if (validationErrors.length) {
      addToast('Fix the highlighted rows first', 'error', validationErrors[0]);
      return;
    }
    const at = nowTime();
    const teacher = sections.find(c => c.key === markSection)?.classTeacher ?? me;
    if (isPast && alreadyMarked) {
      if (!correctionReason.trim()) {
        addToast('A correction reason is required for past dates', 'warning', 'ATT-013');
        return;
      }
      const newCorrections: Correction[] = changed.map((s, i) => {
        const d = draftFor(s.id);
        const before = register[markKey(s.id, markDate)];
        return {
          id: `COR-${String(corrections.length + i + 1).padStart(3, '0')}`,
          studentId: s.id,
          date: markDate,
          before: before ? codeDef(before.code).label : 'Not marked',
          after: { code: d.code, reason: d.reason || undefined, arrivedAt: d.arrivedAt || undefined, markedBy: me, markedAt: at },
          reason: correctionReason.trim(),
          requestedBy: me,
          status: needsApproval ? 'Pending approval' : 'Applied',
        };
      });
      setCorrections(prev => [...newCorrections, ...prev]);
      if (!needsApproval) setRegister(prev => ({ ...prev, ...Object.fromEntries(newCorrections.map(c => [markKey(c.studentId, c.date), c.after])) }));
      addToast(
        needsApproval ? `${newCorrections.length} correction(s) sent to the Principal` : `${newCorrections.length} correction(s) applied`,
        needsApproval ? 'info' : 'success',
        needsApproval ? `Older than ${CORRECTION_WINDOW_DAYS} days` : 'Before and after values are kept'
      );
      setCorrectionReason('');
      resetDrafts();
      return;
    }
    const entries = sectionStudents.map(s => {
      const d = draftFor(s.id);
      return [markKey(s.id, markDate), { code: d.code, reason: d.reason || undefined, arrivedAt: d.arrivedAt || undefined, markedBy: teacher, markedAt: at } as Mark] as const;
    });
    setRegister(prev => ({ ...prev, ...Object.fromEntries(entries) }));
    resetDrafts();
    addToast(`Attendance saved for ${markSection} · ${fmt(markDate)}`, 'success', `${entries.length} students`);
  };

  const decideCorrection = (c: Correction, approve: boolean) => {
    if (approve && c.requestedBy === me) {
      addToast('You requested this correction, so another user must approve it', 'error', 'RBAC-013');
      return;
    }
    setCorrections(prev => prev.map(x => (x.id === c.id ? { ...x, status: approve ? 'Applied' : 'Rejected' } : x)));
    if (approve) setRegister(prev => ({ ...prev, [markKey(c.studentId, c.date)]: c.after }));
  };

  // ATT-010: same-day alerts for unplanned absences
  const alertQueue = sectionStudents
    .filter(s => {
      const m = register[markKey(s.id, markDate)];
      return m && (m.code === 'A' || m.code === 'L') && !plannedAbsence(leaves, s.id, markDate);
    })
    .map(s => ({ student: s, mark: register[markKey(s.id, markDate)] }));

  const sendAlerts = () => {
    const keys = alertQueue.map(a => `${a.student.id}|${markDate}`).filter(k => !alertsSent.includes(k));
    setAlertsSent(prev => [...prev, ...keys]);
    addToast(`${keys.length} guardian alert(s) sent`, 'success', `Scheduled send time ${ALERT_SEND_TIME}; planned leave is excluded`);
  };

  // -------------------------------------------------------------------------
  // Register & heatmap
  // -------------------------------------------------------------------------
  const [regSection, setRegSection] = useState('9-A');
  const [regMonth, setRegMonth] = useState('2024-09');
  const monthDays = dateRange(`${regMonth}-01`, regMonth === '2024-09' ? asOf : `${regMonth}-31`);
  const regStudents = studentsInSection(students, regSection);
  const monthWorking = monthDays.filter(d => classifyDay(d, holidays).working);

  const exportRegister = () => {
    downloadCsv(
      `Attendance_Register_${regSection}_${regMonth}.csv`,
      ['Roll', 'Student', ...monthDays.map(d => d.slice(8)), 'Month %', 'Year %'],
      regStudents.map(s => [
        s.rollNo,
        s.name,
        ...monthDays.map(d => {
          const k = classifyDay(d, holidays);
          return k.working ? register[markKey(s.id, d)]?.code ?? '' : 'H';
        }),
        attendancePct(register, s.id, monthWorking, codes)?.pct ?? '',
        attendancePct(register, s.id, days, codes)?.pct ?? '',
      ])
    );
    addToast(`Register exported for ${regSection}`, 'success', 'Export event logged — AUD-003');
  };

  const sectionDayPct = (key: string, date: string) => {
    const list = studentsInSection(students, key);
    const marks = list.map(s => register[markKey(s.id, date)]).filter(Boolean);
    if (!marks.length) return null;
    return Math.round((marks.reduce((t, m) => t + codeDef(m.code).weight, 0) / marks.length) * 100);
  };

  const heatColour = (pct: number | null) =>
    pct === null ? 'bg-slate-100' : pct >= 95 ? 'bg-emerald-500' : pct >= 85 ? 'bg-emerald-300' : pct >= 75 ? 'bg-amber-300' : 'bg-rose-400';

  // -------------------------------------------------------------------------
  // Insights
  // -------------------------------------------------------------------------
  const [threshold, setThreshold] = useState(75);
  const live = students.filter(s => ['Active', 'On leave', 'Suspended'].includes(s.status) && !s.mergedInto);
  const shortfall = live
    .map(s => {
      const r = attendancePct(register, s.id, days, codes);
      if (!r) return null;
      return { s, ...r, need: daysNeeded(r.score, r.days, remaining, threshold) };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .filter(x => x.pct < threshold || x.need !== 0)
    .sort((a, b) => a.pct - b.pct);
  const chronic = live.map(s => ({ s, reasons: chronicAbsence(register, s.id, holidays, asOf) })).filter(x => x.reasons.length);
  const lateMonth = asOf.slice(0, 7);
  const lateList = live.map(s => ({ s, count: lateCount(register, s.id, lateMonth) + lateCount(register, s.id, '2024-08') })).filter(x => x.count >= 3).sort((a, b) => b.count - a.count);
  const comparison = sections.map(c => {
    const list = studentsInSection(students, c.key);
    const vals = list.map(s => attendancePct(register, s.id, days, codes)).filter((x): x is NonNullable<typeof x> => Boolean(x));
    const pct = vals.length ? Math.round((vals.reduce((t, v) => t + v.score, 0) / vals.reduce((t, v) => t + v.days, 0)) * 1000) / 10 : 0;
    return { key: c.key, pct, students: list.length };
  });

  // -------------------------------------------------------------------------
  // Leave
  // -------------------------------------------------------------------------
  const [leaveForm, setLeaveForm] = useState({ studentId: 'ros-04', from: '2024-09-23', to: '2024-09-24', reason: '', document: '' });

  const applyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      addToast('A reason is required for leave', 'warning');
      return;
    }
    if (leaveForm.to < leaveForm.from) {
      addToast('The end date is before the start date', 'warning');
      return;
    }
    const id = `LV-${String(44 + leaves.length - INITIAL_LEAVES.length).padStart(4, '0')}`;
    setLeaves(prev => [...prev, { id, studentId: leaveForm.studentId, from: leaveForm.from, to: leaveForm.to, reason: leaveForm.reason.trim(), document: leaveForm.document.trim() || undefined, appliedOn: asOf, status: 'Pending' }]);
    addToast(`${id} submitted to the class teacher`, 'success');
    setLeaveForm(prev => ({ ...prev, reason: '', document: '' }));
  };

  const decideLeave = (l: LeaveRequest, approve: boolean) => {
    setLeaves(prev => prev.map(x => (x.id === l.id ? { ...x, status: approve ? 'Approved' : 'Rejected', decidedBy: me } : x)));
    addToast(`${l.id} ${approve ? 'approved' : 'rejected'}`, approve ? 'success' : 'info', approve ? 'These dates are pre-filled as Leave and skipped for absence alerts' : undefined);
  };

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------
  const [newHoliday, setNewHoliday] = useState({ date: '2024-09-27', name: '' });
  const addHoliday = () => {
    if (!newHoliday.name.trim()) return;
    if (holidays.some(h => h.date === newHoliday.date)) {
      addToast('That date is already a holiday', 'warning');
      return;
    }
    const clashes = Object.keys(register).filter(k => k.endsWith(`|${newHoliday.date}`)).length;
    setHolidays(prev => [...prev, { date: newHoliday.date, name: newHoliday.name.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
    addToast(`${newHoliday.name.trim()} added`, clashes ? 'warning' : 'success', clashes ? `${clashes} marks already exist on that date and are excluded from percentages` : 'The day is skipped automatically');
    setNewHoliday({ date: newHoliday.date, name: '' });
  };

  // -------------------------------------------------------------------------
  // Compliance
  // -------------------------------------------------------------------------
  const compliance = sections.map(c => ({ c, ...markingStatus(register, students, c.key, asOf) }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">fact_check</span>
            <span>Module 18 · Attendance (ATT)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">Attendance Desk</h1>
          <p className="text-xs text-[#464555] mt-1">
            Monday {fmt(asOf)} · {days.length} working days since {fmt(REGISTER_FROM)} · {remaining} left this year
          </p>
        </div>
        <p className="text-[10px] text-[#777587] max-w-xs sm:text-right">ATT-013 to ATT-023 are built from the PDF feature names. Their rules should be checked against the catalogue text.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Sections not marked today', value: compliance.filter(x => x.state === 'Not marked').length, sub: `cut-off ${MARKING_CUTOFF}` },
          { label: 'Below threshold', value: shortfall.filter(x => x.pct < threshold).length, sub: `under ${threshold}%` },
          { label: 'Chronic absence alerts', value: chronic.length, sub: 'last 30 days' },
          { label: 'Leave awaiting approval', value: leaves.filter(l => l.status === 'Pending').length, sub: `${corrections.filter(c => c.status === 'Pending approval').length} correction(s) pending` },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#e0ecf4] p-3 shadow-xs">
            <p className="text-2xl font-bold text-[#082b3d]">{k.value}</p>
            <p className="text-[11px] font-semibold text-[#082b3d]">{k.label}</p>
            <p className="text-[10px] text-[#777587]">{k.sub}</p>
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

      {tab === 'roll' && (
        <div className="-mx-4 md:-mx-6">
          <AttendanceView />
        </div>
      )}

      {/* ------------------------------------------------------------ Mark */}
      {tab === 'mark' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel
            className="lg:col-span-2"
            title={
              <span>
                {markSection} · {fmt(markDate)} · {sections.find(c => c.key === markSection)?.mode} attendance
              </span>
            }
            actions={
              <div className="flex flex-wrap gap-1">
                <select value={markSection} onChange={e => { setMarkSection(e.target.value); resetDrafts(); }} className={inputCls} aria-label="Section">
                  {sections.map(c => (
                    <option key={c.key}>{c.key}</option>
                  ))}
                </select>
                <input type="date" value={markDate} max={asOf} onChange={e => { setMarkDate(e.target.value); resetDrafts(); }} className={inputCls} aria-label="Attendance date" />
              </div>
            }
          >
            {!dayKind.working ? (
              <div className="p-6 text-center text-xs">
                <span className="material-symbols-outlined text-3xl text-[#777587]">beach_access</span>
                <p className="font-semibold text-[#082b3d]">No attendance on this day — {dayKind.reason}</p>
                <p className="text-[#777587]">Holidays and weekly offs are skipped automatically and never count towards percentages.</p>
              </div>
            ) : (
              <>
                <div className="p-3 flex flex-wrap items-center gap-2 border-b border-[#f0f7fb] text-xs">
                  {alreadyMarked ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Marked · {markingStatus(register, students, markSection, markDate).at}</Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">Not marked yet — everyone starts as Present</Badge>
                  )}
                  {isPast && alreadyMarked && (
                    <Badge className={needsApproval ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-sky-50 text-sky-700 border-sky-200'}>
                      {needsApproval ? `Correction older than ${CORRECTION_WINDOW_DAYS} days — needs Principal approval` : 'Correction mode'}
                    </Badge>
                  )}
                  <div className="flex-1" />
                  <button onClick={() => sectionStudents.forEach(s => !plannedAbsence(leaves, s.id, markDate) && setDraft(s.id, { code: 'P', reason: '', arrivedAt: '' }))} className={btnSoft}>
                    All present
                  </button>
                </div>
                <div className="divide-y divide-[#f0f7fb]">
                  {sectionStudents.map(s => {
                    const d = draftFor(s.id);
                    const leave = plannedAbsence(leaves, s.id, markDate);
                    const def = codeDef(d.code);
                    const missingReason = def.reason === 'required' && !d.reason.trim();
                    return (
                      <div key={s.id} className="p-2.5 text-xs flex flex-col md:flex-row md:items-center gap-2">
                        <div className="md:w-48">
                          <p className="font-semibold text-[#082b3d]">
                            {s.rollNo}. {s.name}
                          </p>
                          {leave && <p className="text-[10px] text-sky-700">Planned leave {leave.id}</p>}
                          {s.status !== 'Active' && <p className="text-[10px] text-amber-700">{s.status}</p>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {codes.map(c => (
                            <button
                              key={c.code}
                              onClick={() => setDraft(s.id, { code: c.code })}
                              disabled={Boolean(leave) && c.code !== 'LV'}
                              title={c.label}
                              aria-label={`${s.name} ${c.label}`}
                              aria-pressed={d.code === c.code}
                              className={`w-9 py-1 rounded-md text-[10px] font-bold border disabled:opacity-30 ${d.code === c.code ? `${c.colour} text-white border-transparent` : 'bg-white text-[#464555] border-[#cbe0ec]'}`}
                            >
                              {c.code}
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 flex gap-1">
                          {d.code === 'L' && (
                            <input value={d.arrivedAt} onChange={e => setDraft(s.id, { arrivedAt: e.target.value })} placeholder="HH:MM" className={`${inputCls} w-20 font-mono`} aria-label={`${s.name} arrival time`} />
                          )}
                          {def.reason !== 'none' && (
                            <input
                              value={d.reason}
                              onChange={e => setDraft(s.id, { reason: e.target.value })}
                              placeholder={def.reason === 'required' ? 'Reason (required)' : 'Reason (optional)'}
                              className={`${inputCls} flex-1 ${missingReason ? 'border-rose-400 bg-rose-50' : ''}`}
                              aria-label={`${s.name} reason`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 border-t border-[#f0f7fb] flex flex-wrap items-center gap-2">
                  {isPast && alreadyMarked && (
                    <input value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} placeholder="Why is this being corrected?" className={`${inputCls} flex-1 min-w-[200px]`} aria-label="Correction reason" />
                  )}
                  <span className="text-[11px] text-[#777587]">{changed.length} change(s)</span>
                  <button onClick={save} disabled={!changed.length} className={btnPrimary}>
                    {isPast && alreadyMarked ? (needsApproval ? 'Request correction' : 'Apply correction') : 'Save attendance'}
                  </button>
                </div>
              </>
            )}
          </Panel>

          <div className="space-y-4">
            <Panel
              title={`Guardian alerts · send at ${ALERT_SEND_TIME}`}
              actions={
                <button onClick={sendAlerts} disabled={!alertQueue.some(a => !alertsSent.includes(`${a.student.id}|${markDate}`))} className={btnPrimary}>
                  Send
                </button>
              }
            >
              <div className="p-3 space-y-1 text-xs">
                {alertQueue.length === 0 && <p className="text-[#777587]">No unplanned absences or late arrivals saved for this day.</p>}
                {alertQueue.map(a => (
                  <p key={a.student.id} className="flex justify-between gap-2">
                    <span>
                      {a.student.name} · {codeDef(a.mark.code).label}
                      {a.mark.arrivedAt ? ` at ${a.mark.arrivedAt}` : ''} → {a.student.guardianMobile}
                    </span>
                    {alertsSent.includes(`${a.student.id}|${markDate}`) && <span className="text-emerald-700 font-semibold">Sent</span>}
                  </p>
                ))}
                <p className="text-[10px] text-[#777587] pt-1">Students on approved leave are left out.</p>
              </div>
            </Panel>

            <Panel title="Corrections">
              <div className="divide-y divide-[#f0f7fb]">
                {corrections.length === 0 && <p className="p-3 text-xs text-[#777587]">None yet. Open a past date to correct it.</p>}
                {corrections.map(c => (
                  <div key={c.id} className="p-2.5 text-xs space-y-1">
                    <p>
                      <span className="font-mono">{c.id}</span> · {nameOf(c.studentId)} · {fmt(c.date)}
                    </p>
                    <p>
                      {c.before} → <span className="font-semibold">{codeDef(c.after.code).label}</span> · “{c.reason}” · {c.requestedBy}
                    </p>
                    {c.status === 'Pending approval' ? (
                      <span className="flex items-center gap-1">
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">Awaiting Principal approval</Badge>
                        <button onClick={() => decideCorrection(c, false)} className={btnSoft}>
                          Reject
                        </button>
                        <button onClick={() => decideCorrection(c, true)} className={btnPrimary}>
                          Approve
                        </button>
                      </span>
                    ) : (
                      <Badge className={c.status === 'Applied' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>{c.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ Compliance */}
      {tab === 'compliance' && (
        <Panel title={`Today’s marking · cut-off ${MARKING_CUTOFF}`}>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[#464555]">
              <tr>
                {['Section', 'Class teacher', 'Mode', 'Status', 'Marked at', ''].map(h => (
                  <th key={h} className="text-left p-2.5 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {compliance.map(x => (
                <tr key={x.c.key}>
                  <td className="p-2.5 font-semibold">{x.c.key}</td>
                  <td className="p-2.5">{x.c.classTeacher}</td>
                  <td className="p-2.5">{x.c.mode}</td>
                  <td className="p-2.5">
                    <Badge
                      className={
                        x.state === 'On time' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : x.state === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }
                    >
                      {x.state}
                    </Badge>
                  </td>
                  <td className="p-2.5 font-mono">{x.at ?? '—'}</td>
                  <td className="p-2.5 text-right whitespace-nowrap">
                    {x.state === 'Not marked' && (
                      <span className="inline-flex gap-1">
                        <button
                          onClick={() => {
                            setNudged(prev => [...prev, x.c.key]);
                            addToast(`Reminder sent to ${x.c.classTeacher}`, 'info');
                          }}
                          disabled={nudged.includes(x.c.key)}
                          className={btnSoft}
                        >
                          {nudged.includes(x.c.key) ? 'Reminded' : 'Remind teacher'}
                        </button>
                        <button
                          onClick={() => {
                            setMarkSection(x.c.key);
                            setMarkDate(asOf);
                            resetDrafts();
                            setTab('mark');
                          }}
                          className={btnPrimary}
                        >
                          Mark now
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {/* -------------------------------------------------------- Register */}
      {tab === 'register' && (
        <div className="space-y-6">
          <Panel
            title="Monthly attendance register"
            actions={
              <div className="flex flex-wrap gap-1">
                <select value={regSection} onChange={e => setRegSection(e.target.value)} className={inputCls} aria-label="Register section">
                  {sections.map(c => (
                    <option key={c.key}>{c.key}</option>
                  ))}
                </select>
                <select value={regMonth} onChange={e => setRegMonth(e.target.value)} className={inputCls} aria-label="Register month">
                  {MONTHS.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button onClick={exportRegister} className={btnSoft}>
                  Export CSV
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[#464555]">
                    <th className="p-1.5 text-left sticky left-0 bg-slate-50 min-w-[150px]">Student</th>
                    {monthDays.map(d => {
                      const k = classifyDay(d, holidays);
                      return (
                        <th key={d} className={`p-1 font-mono w-7 ${k.working ? '' : 'text-slate-400'}`} title={k.working ? d : `${d} · ${k.reason}`}>
                          {d.slice(8)}
                        </th>
                      );
                    })}
                    <th className="p-1.5">Month</th>
                    <th className="p-1.5">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {regStudents.map(s => {
                    const m = attendancePct(register, s.id, monthWorking, codes);
                    const y = attendancePct(register, s.id, days, codes);
                    return (
                      <tr key={s.id} className="border-t border-[#f0f7fb]">
                        <td className="p-1.5 sticky left-0 bg-white font-semibold whitespace-nowrap">
                          {s.rollNo}. {s.name}
                        </td>
                        {monthDays.map(d => {
                          const k = classifyDay(d, holidays);
                          const mark = register[markKey(s.id, d)];
                          return (
                            <td key={d} className={`text-center font-mono ${k.working ? '' : 'bg-slate-100 text-slate-400'}`} title={mark?.reason ?? (k.working ? '' : k.reason)}>
                              {k.working ? (
                                mark ? (
                                  <span className={`inline-block w-6 rounded text-white ${codeDef(mark.code).colour}`}>{mark.code}</span>
                                ) : (
                                  <span className="text-slate-300">·</span>
                                )
                              ) : (
                                'H'
                              )}
                            </td>
                          );
                        })}
                        <td className={`p-1.5 text-right font-mono ${m && m.pct < threshold ? 'text-rose-600 font-bold' : ''}`}>{m ? `${m.pct}%` : '—'}</td>
                        <td className={`p-1.5 text-right font-mono ${y && y.pct < threshold ? 'text-rose-600 font-bold' : ''}`}>{y ? `${y.pct}%` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 flex flex-wrap gap-2 text-[10px] text-[#464555] border-t border-[#f0f7fb]">
              {codes.map(c => (
                <span key={c.code} className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded ${c.colour}`} /> {c.code} {c.label} (counts {c.weight})
                </span>
              ))}
              <span>H = holiday or weekly off</span>
            </div>
          </Panel>

          <Panel title={`Daily attendance heatmap · ${MONTHS.find(m => m.key === regMonth)?.label}`}>
            <div className="p-3 overflow-x-auto">
              <table className="text-[10px]">
                <thead>
                  <tr>
                    <th className="pr-2 text-left">Section</th>
                    {monthDays.map(d => (
                      <th key={d} className="font-mono font-normal text-[#777587] w-6">
                        {d.slice(8)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sections.map(c => (
                    <tr key={c.key}>
                      <td className="pr-2 font-semibold">{c.key}</td>
                      {monthDays.map(d => {
                        const k = classifyDay(d, holidays);
                        const pct = k.working ? sectionDayPct(c.key, d) : null;
                        return (
                          <td key={d} className="p-0.5">
                            <div className={`w-5 h-5 rounded ${k.working ? heatColour(pct) : 'bg-white border border-dashed border-slate-200'}`} title={k.working ? `${c.key} ${d}: ${pct === null ? 'not marked' : `${pct}%`}` : k.reason} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-[#777587] mt-2">Green ≥ 95% · light green ≥ 85% · amber ≥ 75% · red below 75% · grey not marked · dashed = no school</p>
            </div>
          </Panel>
        </div>
      )}

      {/* -------------------------------------------------------- Insights */}
      {tab === 'insights' && (
        <div className="space-y-6">
          <Panel
            title={`Shortfall against ${threshold}% · ${remaining} working days left this year`}
            actions={
              <label className="flex items-center gap-1 text-xs">
                Threshold
                <input
                  value={threshold}
                  onChange={e => {
                    const n = Number(e.target.value);
                    if (Number.isInteger(n) && n > 0 && n <= 100) setThreshold(n);
                  }}
                  inputMode="numeric"
                  className={`${inputCls} w-14 font-mono`}
                  aria-label="Attendance threshold"
                />
                %
              </label>
            }
          >
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[#464555]">
                <tr>
                  {['Student', 'Class', 'Attendance', 'Days counted', 'Full days needed from here'].map(h => (
                    <th key={h} className="text-left p-2.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f7fb]">
                {shortfall.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-[#777587]">
                      Everyone is on track.
                    </td>
                  </tr>
                )}
                {shortfall.map(x => (
                  <tr key={x.s.id}>
                    <td className="p-2.5 font-semibold">{x.s.name}</td>
                    <td className="p-2.5">
                      {x.s.classLevel}-{x.s.section} · {x.s.status}
                    </td>
                    <td className={`p-2.5 font-mono ${x.pct < threshold ? 'text-rose-600 font-bold' : ''}`}>{x.pct}%</td>
                    <td className="p-2.5 font-mono">
                      {x.score} / {x.days}
                    </td>
                    <td className="p-2.5">{x.need === null ? <span className="text-rose-700 font-semibold">Cannot reach {threshold}% this year</span> : `${x.need} of ${remaining}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel title="Chronic absence alerts">
              <div className="p-3 space-y-2 text-xs">
                {chronic.length === 0 && <p className="text-[#777587]">No alerts.</p>}
                {chronic.map(x => (
                  <div key={x.s.id} className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <p className="font-semibold text-rose-800">
                      {x.s.name} · {x.s.classLevel}-{x.s.section}
                    </p>
                    <p className="text-rose-700">{x.reasons.join(' · ')}</p>
                    <p className="text-[10px] text-[#464555]">Guardian {x.s.guardianMobile} · class teacher {sections.find(c => c.key === `${x.s.classLevel}-${x.s.section}`)?.classTeacher}</p>
                  </div>
                ))}
                <p className="text-[10px] text-[#777587]">Rule: 3 or more absences in a row, or 4 or more in the last 30 days. Medical leave and approved leave are not counted.</p>
              </div>
            </Panel>

            <Panel title="Repeated lateness (3+ since August)">
              <div className="p-3 space-y-1 text-xs">
                {lateList.length === 0 && <p className="text-[#777587]">No repeat late-comers.</p>}
                {lateList.map(x => (
                  <p key={x.s.id} className="flex justify-between">
                    <span>
                      {x.s.name} · {x.s.classLevel}-{x.s.section}
                    </span>
                    <span className="font-mono font-bold">{x.count}</span>
                  </p>
                ))}
              </div>
            </Panel>

            <Panel title="Class comparison (year to date)">
              <div className="p-3 space-y-2 text-xs">
                {comparison.map(c => (
                  <div key={c.key}>
                    <div className="flex justify-between mb-0.5">
                      <span>
                        {c.key} · {c.students} students
                      </span>
                      <span className="font-mono">{c.pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className={`h-full ${c.pct >= threshold ? 'bg-[#0e5d84]' : 'bg-rose-500'}`} style={{ width: `${c.pct}%` }} />
                      <div className="absolute top-0 h-full w-0.5 bg-rose-600" style={{ left: `${threshold}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- Leave */}
      {tab === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Apply for leave (parent app)">
            <form onSubmit={applyLeave} className="p-3 space-y-2 text-xs">
              <select value={leaveForm.studentId} onChange={e => setLeaveForm({ ...leaveForm, studentId: e.target.value })} className={`${inputCls} w-full`} aria-label="Leave student">
                {live.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.classLevel}-{s.section}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={leaveForm.from} onChange={e => setLeaveForm({ ...leaveForm, from: e.target.value })} className={inputCls} aria-label="Leave from" />
                <input type="date" value={leaveForm.to} onChange={e => setLeaveForm({ ...leaveForm, to: e.target.value })} className={inputCls} aria-label="Leave to" />
              </div>
              <p className="text-[10px] text-[#777587]">{workingDays(leaveForm.from, leaveForm.to < leaveForm.from ? leaveForm.from : leaveForm.to, holidays).length} working day(s)</p>
              <input value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Reason" className={`${inputCls} w-full`} aria-label="Leave reason" />
              <input value={leaveForm.document} onChange={e => setLeaveForm({ ...leaveForm, document: e.target.value })} placeholder="Supporting document name (optional)" className={`${inputCls} w-full`} aria-label="Leave document" />
              <button type="submit" className={`${btnPrimary} w-full`}>
                Submit to class teacher
              </button>
            </form>
          </Panel>
          <Panel className="lg:col-span-2" title="Leave requests">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[#464555]">
                <tr>
                  {['Id', 'Student', 'Dates', 'Reason', 'Status', ''].map(h => (
                    <th key={h} className="text-left p-2.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f7fb]">
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td className="p-2.5 font-mono">{l.id}</td>
                    <td className="p-2.5 font-semibold">{nameOf(l.studentId)}</td>
                    <td className="p-2.5 whitespace-nowrap">
                      {fmt(l.from)}
                      {l.to !== l.from ? ` – ${fmt(l.to)}` : ''}
                    </td>
                    <td className="p-2.5">
                      {l.reason}
                      {l.document && <span className="block text-[10px] text-[#777587]">📎 {l.document}</span>}
                    </td>
                    <td className="p-2.5">
                      {l.status}
                      {l.decidedBy && <span className="block text-[10px] text-[#777587]">by {l.decidedBy}</span>}
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      {l.status === 'Pending' && (
                        <span className="inline-flex gap-1">
                          <button onClick={() => decideLeave(l, false)} className={btnSoft}>
                            Reject
                          </button>
                          <button onClick={() => decideLeave(l, true)} className={btnPrimary}>
                            Approve
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* -------------------------------------------------------- Settings */}
      {tab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Marking mode per section">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#f0f7fb]">
                  {sections.map(c => (
                    <tr key={c.key}>
                      <td className="p-2.5 font-semibold">{c.key}</td>
                      <td className="p-2.5">{c.classTeacher}</td>
                      <td className="p-2.5 text-right">
                        <select
                          value={c.mode}
                          onChange={e => setSections(prev => prev.map(x => (x.key === c.key ? { ...x, mode: e.target.value as SectionConfig['mode'] } : x)))}
                          className={inputCls}
                          aria-label={`${c.key} mode`}
                        >
                          <option>Daily</option>
                          <option>Period-wise</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="p-3 text-[10px] text-[#777587]">Period-wise sections record the first period for the daily register. Per-period marking comes from the teacher app.</p>
            </Panel>

            <Panel title="Status codes">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[#464555]">
                  <tr>
                    <th className="text-left p-2.5">Code</th>
                    <th className="text-left p-2.5">Label</th>
                    <th className="text-left p-2.5">Counts as</th>
                    <th className="text-left p-2.5">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f7fb]">
                  {codes.map(c => (
                    <tr key={c.code}>
                      <td className="p-2.5">
                        <span className={`inline-block w-8 text-center rounded text-white text-[10px] font-bold ${c.colour}`}>{c.code}</span>
                      </td>
                      <td className="p-2.5">{c.label}</td>
                      <td className="p-2.5">
                        <select
                          value={c.weight}
                          onChange={e => setCodes(prev => prev.map(x => (x.code === c.code ? { ...x, weight: Number(e.target.value) } : x)))}
                          disabled={c.code === 'P' || c.code === 'A'}
                          className={inputCls}
                          aria-label={`${c.label} weight`}
                        >
                          <option value={1}>Present (1)</option>
                          <option value={0.5}>Half (0.5)</option>
                          <option value={0}>Absent (0)</option>
                        </select>
                      </td>
                      <td className="p-2.5 capitalize">{c.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>

          <Panel title="Holidays (automatically skipped) · second Saturdays and Sundays are weekly offs">
            <div className="p-3 flex flex-wrap gap-2 border-b border-[#f0f7fb] text-xs">
              <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })} className={inputCls} aria-label="Holiday date" />
              <input value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} placeholder="Holiday name" className={inputCls} aria-label="Holiday name" />
              <button onClick={addHoliday} disabled={!newHoliday.name.trim()} className={btnPrimary}>
                Add holiday
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {holidays.map(h => (
                <p key={h.date}>
                  <span className="font-mono">{fmt(h.date)}</span> · {h.name}
                </p>
              ))}
            </div>
          </Panel>

          <PhaseNotice
            ids={['ATT-005', 'ATT-006', 'ATT-007', 'ATT-008', 'ATT-022']}
            phase="Phase 3"
            note="Offline marking with conflict resolution, biometric/RFID and gate events, and staff attendance ship with the operations and offline release."
          />
        </div>
      )}
    </div>
  );
};
