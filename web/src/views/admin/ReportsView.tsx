import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags, PhaseNotice, downloadCsv } from '../../components/common/FeatureTags';
import { Figure } from '../../components/common/Figure';

type DashboardRole = 'Principal' | 'Branch Admin' | 'Teacher' | 'Accountant' | 'Admissions Officer' | 'Parent';

// Widgets per role, as specified in LMN-SMS-FEAT-001 §9 "Dashboards by role" (RPT-001)
const ROLE_WIDGETS: Record<DashboardRole, string[]> = {
  Principal: ['Attendance trend', 'Fee collection vs target', 'Admissions funnel', 'Staff absence', 'Alerts'],
  'Branch Admin': ['Approval queue', 'Document backlog', 'Enrolment by class', 'Message spend'],
  Teacher: ['My classes today', 'Attendance pending', 'Marks entry pending', 'Homework due'],
  Accountant: ['Collection today/MTD', 'Outstanding ageing', 'Reconciliation exceptions', 'Refunds pending'],
  'Admissions Officer': ['Enquiries by source', 'Stage funnel', 'Follow-ups due', 'Conversion rate'],
  Parent: ['Child’s attendance', 'Upcoming fee', 'Recent marks', 'Notices', 'Homework'],
};

// Export is a separate verb (RBAC-004): which dashboard roles hold E on reports
const EXPORT_GRANTED: Record<DashboardRole, boolean> = {
  Principal: true,
  'Branch Admin': true,
  Teacher: false,
  Accountant: true,
  'Admissions Officer': false,
  Parent: false,
};

// Monthly metrics for the active branch, AY 2024–25
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const ATTENDANCE_TREND = [95.1, 93.8, 94.9, 95.6, 94.2, 94.6];
const COLLECTION_TREND_LAKH = [142.0, 38.5, 64.2, 118.7, 41.3, 72.9];
const COLLECTION_TARGET_LAKH = [150, 40, 60, 120, 45, 80];
const ENROLMENT_TREND = [2431, 2440, 2462, 2475, 2481, 2486];

// Per-branch metrics keyed by campus id (RPT-008, RPT-013)
const BRANCH_METRICS: Record<string, { attendancePct: number; collectionPct: number; admissions: number }> = {
  'chennai-main': { attendancePct: 94.6, collectionPct: 88.2, admissions: 126 },
  'kallakurichi-campus': { attendancePct: 92.1, collectionPct: 81.5, admissions: 74 },
  'villupuram-campus': { attendancePct: 90.8, collectionPct: 76.9, admissions: 58 },
  'salem-campus': { attendancePct: 93.4, collectionPct: 84.0, admissions: 49 },
};

const ENROLMENT_BY_CLASS = [
  { cls: 'Pre-primary', count: 212 },
  { cls: 'Class 1–5', count: 804 },
  { cls: 'Class 6–8', count: 588 },
  { cls: 'Class 9–10', count: 446 },
  { cls: 'Class 11–12', count: 436 },
];

const FUNNEL = [
  { stage: 'Enquiry', count: 612 },
  { stage: 'Application', count: 348 },
  { stage: 'Document check', count: 281 },
  { stage: 'Decision', count: 204 },
  { stage: 'Offer', count: 168 },
  { stage: 'Enrolment', count: 126 },
];

// Report library: only reports named by a feature ID elsewhere in the catalogue.
// The full ~60-report inventory lives in Appendix C (RPT-003).
const REPORT_LIBRARY = [
  { id: 'r-funnel', name: 'Admissions funnel by class and source', source: 'ADM-061', module: 'Admissions' },
  { id: 'r-roi', name: 'Admissions source ROI', source: 'ADM-062', module: 'Admissions' },
  { id: 'r-loss', name: 'Admissions loss analysis', source: 'ADM-065', module: 'Admissions' },
  { id: 'r-late', name: 'Repeated-lateness report', source: 'ATT-009', module: 'Attendance' },
  { id: 'r-load', name: 'Teacher workload report', source: 'TTB-009', module: 'Timetable' },
  { id: 'r-result', name: 'Result analytics', source: 'EXM-024', module: 'Examinations' },
  { id: 'r-msg', name: 'Message ledger & cost report', source: 'NOT-011', module: 'Notifications' },
  { id: 'r-recon', name: 'Post-migration reconciliation', source: 'MIG-016', module: 'Migration' },
  { id: 'r-consent', name: 'Consent ledger export', source: 'CNS-016', module: 'Consent' },
];

const CLASSES = ['All', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SECTIONS = ['All', 'A', 'B', 'C'];
const CATEGORIES = ['All', 'General', 'OBC', 'SC', 'ST', 'EWS'];
const STATUSES = ['All', 'Active', 'On leave', 'TC issued'];

interface Filters {
  year: string;
  branch: string;
  cls: string;
  section: string;
  from: string;
  to: string;
  category: string;
  status: string;
}

interface SavedView {
  name: string;
  filters: Filters;
}

interface ExportEvent {
  at: string;
  report: string;
  format: string;
  rows: number;
  by: string;
  purpose: string;
}

interface Schedule {
  id: string;
  report: string;
  cadence: string;
  channel: string;
  recipient: string;
}

type Drill = 'enrolment' | 'attendance' | 'outstanding' | 'funnel' | null;
type Tab = 'dashboard' | 'library' | 'branches' | 'schedules';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'dashboard', label: 'Role Dashboard', icon: 'dashboard', ids: ['RPT-001', 'RPT-002', 'RPT-009', 'RPT-010'] },
  { id: 'library', label: 'Report Library', icon: 'summarize', ids: ['RPT-003', 'RPT-004', 'RPT-005', 'RPT-007'] },
  { id: 'branches', label: 'Branch Comparison', icon: 'compare', ids: ['RPT-008', 'RPT-013'] },
  { id: 'schedules', label: 'Scheduled Reports', icon: 'schedule_send', ids: ['RPT-006', 'RPT-011', 'RPT-012'] },
];

const formatLakh = (v: number) => `₹${v.toFixed(1)}L`;

const LineChart: React.FC<{ series: { label: string; values: number[]; color: string }[]; labels: string[]; unit?: string }> = ({ series, labels, unit = '' }) => {
  const W = 320;
  const H = 120;
  const all = series.flatMap(s => s.values);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => 16 + (i * (W - 32)) / (labels.length - 1);
  const y = (v: number) => H - 18 - ((v - min) / span) * (H - 36);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32" role="img" aria-label={series.map(s => s.label).join(', ')}>
      {series.map(s => (
        <g key={s.label}>
          <polyline fill="none" stroke={s.color} strokeWidth={2} points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          {s.values.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={s.color}>
              <title>{`${s.label} ${labels[i]}: ${v}${unit}`}</title>
            </circle>
          ))}
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={l} x={x(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="#5b6e78">
          {l}
        </text>
      ))}
    </svg>
  );
};

export const ReportsView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'dashboard' }) => {
  const { addToast, currentUser, campuses, selectedCampus, invoices, attendanceRecords } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [dashRole, setDashRole] = useState<DashboardRole>('Principal');
  const [drill, setDrill] = useState<Drill>(null);
  const [filters, setFilters] = useState<Filters>({
    year: 'AY 2024–25',
    branch: selectedCampus.id,
    cls: 'All',
    section: 'All',
    from: '2024-04-01',
    to: '2024-09-30',
    category: 'All',
    status: 'All',
  });
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    { name: 'Class 10 — active students', filters: { year: 'AY 2024–25', branch: 'chennai-main', cls: 'Class 10', section: 'All', from: '2024-04-01', to: '2024-09-30', category: 'All', status: 'Active' } },
  ]);
  const [viewName, setViewName] = useState('');
  const [exportLog, setExportLog] = useState<ExportEvent[]>([]);
  const [exportPurpose, setExportPurpose] = useState('Monthly management review');
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: 'sc-1', report: 'Admissions funnel by class and source', cadence: 'Weekly · Monday 08:00', channel: 'Email', recipient: 'Principal' },
    { id: 'sc-2', report: 'Repeated-lateness report', cadence: 'Monthly · 1st 09:00', channel: 'WhatsApp', recipient: 'Coordinator / HOD' },
  ]);
  const [newSchedule, setNewSchedule] = useState({ report: REPORT_LIBRARY[0].name, cadence: 'Weekly · Monday 08:00', channel: 'Email', recipient: 'Principal' });
  const [branchMetric, setBranchMetric] = useState<'enrolment' | 'attendancePct' | 'collectionPct' | 'admissions'>('enrolment');
  const [branchDrill, setBranchDrill] = useState<string | null>(null);

  const canExport = EXPORT_GRANTED[dashRole];

  const outstanding = invoices.filter(i => i.status === 'Due' || i.status === 'Overdue' || i.status === 'Partial');
  const outstandingTotal = outstanding.reduce((s, i) => s + (i.balance ?? i.amount), 0);
  const absentOrLate = attendanceRecords.filter(r => r.status !== 'P');
  const presentPct = attendanceRecords.length
    ? Math.round((attendanceRecords.filter(r => r.status === 'P' || r.status === 'L').length / attendanceRecords.length) * 1000) / 10
    : 0;
  const collectedYtd = COLLECTION_TREND_LAKH.reduce((s, v) => s + v, 0);
  const targetYtd = COLLECTION_TARGET_LAKH.reduce((s, v) => s + v, 0);
  const conversion = Math.round((FUNNEL[FUNNEL.length - 1].count / FUNNEL[0].count) * 1000) / 10;

  const kpis: { id: Exclude<Drill, null>; label: string; value: string; sub: string; icon: string }[] = [
    { id: 'enrolment', label: 'Enrolment', value: ENROLMENT_TREND[ENROLMENT_TREND.length - 1].toLocaleString('en-IN'), sub: `+${ENROLMENT_TREND[5] - ENROLMENT_TREND[0]} since April`, icon: 'groups' },
    { id: 'attendance', label: 'Attendance today · 10-A', value: `${presentPct}%`, sub: `${absentOrLate.length} not present on time`, icon: 'fact_check' },
    { id: 'outstanding', label: 'Fee outstanding', value: `₹${outstandingTotal.toLocaleString('en-IN')}`, sub: `${outstanding.length} invoices · YTD ${formatLakh(collectedYtd)} of ${formatLakh(targetYtd)}`, icon: 'payments' },
    { id: 'funnel', label: 'Admissions conversion', value: `${conversion}%`, sub: `${FUNNEL[5].count} enrolled of ${FUNNEL[0].count} enquiries`, icon: 'how_to_reg' },
  ];

  const libraryRows = useMemo(
    () =>
      ENROLMENT_BY_CLASS.map(r => [r.cls, r.count, filters.year, campuses.find(c => c.id === filters.branch)?.name ?? filters.branch]),
    [filters, campuses]
  );

  const logExport = (report: string, format: string, rows: number) => {
    setExportLog(prev => [
      { at: new Date().toLocaleString('en-IN'), report, format, rows, by: `${currentUser.name} as ${dashRole}`, purpose: exportPurpose },
      ...prev,
    ]);
  };

  const exportReport = (reportName: string, format: 'CSV' | 'PDF') => {
    if (!canExport) {
      addToast(`${dashRole} does not hold the Export permission`, 'error', 'RBAC-004 — export is granted separately from read');
      return;
    }
    if (!exportPurpose.trim()) {
      addToast('State a purpose before exporting', 'warning', 'AUD-003');
      return;
    }
    if (format === 'CSV') {
      downloadCsv(`${reportName.replace(/\W+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`, ['Class band', 'Students', 'Academic year', 'Branch'], libraryRows);
    } else {
      window.print();
    }
    logExport(reportName, format, libraryRows.length);
    addToast(`${reportName} exported (${format})`, 'success', `${libraryRows.length} rows · export event logged`);
  };

  const saveView = () => {
    const name = viewName.trim();
    if (!name) return;
    if (savedViews.some(v => v.name === name)) {
      addToast('A saved view with that name already exists', 'warning');
      return;
    }
    setSavedViews(prev => [...prev, { name, filters }]);
    setViewName('');
    addToast(`Saved view “${name}”`, 'success');
  };

  const addSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setSchedules(prev => [...prev, { id: `sc-${prev.length + 1}-${Date.now()}`, ...newSchedule }]);
    addToast(`Scheduled “${newSchedule.report}”`, 'success', `${newSchedule.cadence} via ${newSchedule.channel}`);
  };

  const branchRows = campuses.map(c => {
    const m = BRANCH_METRICS[c.id];
    return {
      id: c.id,
      name: c.name,
      code: c.code,
      enrolment: c.studentsCount,
      attendancePct: m?.attendancePct ?? null,
      collectionPct: m?.collectionPct ?? null,
      admissions: m?.admissions ?? null,
    };
  });
  const metricMax = Math.max(1, ...branchRows.map(r => (r[branchMetric] as number | null) ?? 0));
  const metricLabel = { enrolment: 'Enrolment', attendancePct: 'Attendance %', collectionPct: 'Fee collection %', admissions: 'Admissions this cycle' }[branchMetric];

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">analytics</span>
            <span>Module 9 · Reporting & Analytics (RPT)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">Reports & Analytics</h1>
          <p className="text-xs text-ink-soft mt-1">
            {selectedCampus.name} · AY 2024–25 · viewing as {dashRole} · export {canExport ? 'granted' : 'not granted'}
          </p>
        </div>
        <select value={dashRole} onChange={e => setDashRole(e.target.value as DashboardRole)} className="text-xs border border-line rounded-lg px-2 py-1.5 bg-white self-start sm:self-auto">
          {(Object.keys(ROLE_WIDGETS) as DashboardRole[]).map(r => (
            <option key={r}>{r}</option>
          ))}
        </select>
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

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-1">
            <span className="text-[11px] font-semibold text-ink-soft mr-1">{dashRole} widgets:</span>
            {ROLE_WIDGETS[dashRole].map(w => (
              <span key={w} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-line text-ink">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map(k => (
              <button
                key={k.id}
                onClick={() => setDrill(drill === k.id ? null : k.id)}
                className={`text-left bg-white rounded-2xl border p-4 shadow-xs transition-colors ${drill === k.id ? 'border-brand ring-2 ring-brand/20' : 'border-line-soft hover:border-line'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-brand text-lg">{k.icon}</span>
                  <span className="text-[10px] text-ink-muted">{drill === k.id ? 'Hide records' : 'View records'}</span>
                </div>
                <p className="text-2xl font-bold text-ink mt-1">{k.value}</p>
                <p className="text-[11px] font-semibold text-ink">{k.label}</p>
                <p className="text-[10px] text-ink-muted">{k.sub}</p>
              </button>
            ))}
          </div>

          {drill && (
            <div className="bg-white rounded-2xl border border-brand/30 shadow-xs overflow-x-auto">
              <div className="p-3 bg-subtle border-b border-line text-xs font-bold text-ink">Records behind “{kpis.find(k => k.id === drill)!.label}”</div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-subtle">
                  {drill === 'enrolment' &&
                    ENROLMENT_BY_CLASS.map(r => (
                      <tr key={r.cls}>
                        <td className="p-3">{r.cls}</td>
                        <td className="p-3 text-right font-mono">{r.count}</td>
                      </tr>
                    ))}
                  {drill === 'attendance' &&
                    absentOrLate.map(r => (
                      <tr key={r.studentId}>
                        <td className="p-3 font-mono">{r.rollNo}</td>
                        <td className="p-3">{r.name}</td>
                        <td className="p-3 font-bold">{r.status}</td>
                        <td className="p-3 text-ink-soft">{r.notes ?? r.telemetrySource}</td>
                      </tr>
                    ))}
                  {drill === 'outstanding' &&
                    outstanding.map(i => (
                      <tr key={i.id}>
                        <td className="p-3 font-mono">{i.invoiceNo}</td>
                        <td className="p-3">
                          {i.studentName} · {i.studentClass}
                        </td>
                        <td className="p-3">{i.dueDate}</td>
                        <td className="p-3 font-bold">{i.status}</td>
                        <td className="p-3 text-right font-mono"><Figure prefix="₹" value={(i.balance ?? i.amount).toLocaleString('en-IN')} /></td>
                      </tr>
                    ))}
                  {drill === 'funnel' &&
                    FUNNEL.map((f, idx) => (
                      <tr key={f.stage}>
                        <td className="p-3">{f.stage}</td>
                        <td className="p-3 text-right font-mono">{f.count}</td>
                        <td className="p-3 text-right text-ink-muted">{idx === 0 ? '—' : `${Math.round((f.count / FUNNEL[idx - 1].count) * 100)}% of previous stage`}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-surface rounded-2xl border border-line-soft shadow-sm p-4">
              <p className="text-xs font-bold text-ink">Attendance % by month</p>
              <LineChart labels={MONTHS} series={[{ label: 'Attendance', values: ATTENDANCE_TREND, color: '#17667d' }]} unit="%" />
            </div>
            <div className="bg-surface rounded-2xl border border-line-soft shadow-sm p-4">
              <p className="text-xs font-bold text-ink">Fee collected vs target (₹ lakh)</p>
              <LineChart
                labels={MONTHS}
                series={[
                  { label: 'Collected', values: COLLECTION_TREND_LAKH, color: '#17667d' },
                  { label: 'Target', values: COLLECTION_TARGET_LAKH, color: '#dea02d' },
                ]}
              />
              <div className="flex gap-3 text-[10px] text-ink-soft">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand" />Collected</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Target</span>
              </div>
            </div>
            <div className="bg-surface rounded-2xl border border-line-soft shadow-sm p-4">
              <p className="text-xs font-bold text-ink">Enrolment by month</p>
              <LineChart labels={MONTHS} series={[{ label: 'Enrolment', values: ENROLMENT_TREND, color: '#059669' }]} />
            </div>
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-line-soft shadow-sm p-4 space-y-3">
            <p className="text-xs font-bold text-ink">Filters (the same on every report)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <label className="block">
                <span className="block text-[10px] font-semibold text-ink-soft mb-0.5">Academic year</span>
                <select value={filters.year} onChange={e => setFilter('year', e.target.value)} className="w-full border border-line rounded-lg px-2 py-1">
                  <option>AY 2024–25</option>
                  <option>AY 2023–24</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[10px] font-semibold text-ink-soft mb-0.5">Branch</span>
                <select value={filters.branch} onChange={e => setFilter('branch', e.target.value)} className="w-full border border-line rounded-lg px-2 py-1">
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {([
                ['cls', 'Class', CLASSES],
                ['section', 'Section', SECTIONS],
                ['category', 'Category', CATEGORIES],
                ['status', 'Status', STATUSES],
              ] as const).map(([key, label, options]) => (
                <label key={key} className="block">
                  <span className="block text-[10px] font-semibold text-ink-soft mb-0.5">{label}</span>
                  <select value={filters[key]} onChange={e => setFilter(key, e.target.value)} className="w-full border border-line rounded-lg px-2 py-1">
                    {options.map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="block">
                <span className="block text-[10px] font-semibold text-ink-soft mb-0.5">From</span>
                <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)} className="w-full border border-line rounded-lg px-2 py-1" />
              </label>
              <label className="block">
                <span className="block text-[10px] font-semibold text-ink-soft mb-0.5">To</span>
                <input type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)} className="w-full border border-line rounded-lg px-2 py-1" />
              </label>
            </div>
            {filters.to < filters.from && <p className="text-[11px] text-rose-600">The end date is before the start date.</p>}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input value={viewName} onChange={e => setViewName(e.target.value)} placeholder="Name this filter set" className="text-xs border border-line rounded-lg px-2 py-1" />
              <button onClick={saveView} disabled={!viewName.trim()} className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50">
                Save view
              </button>
              {savedViews.map(v => (
                <button key={v.name} onClick={() => setFilters(v.filters)} className="text-[10px] px-2 py-1 rounded-full bg-subtle border border-line text-brand font-semibold">
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
            <div className="p-4 bg-subtle border-b border-line flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-ink">Standard reports</span>
              <label className="flex items-center gap-1 text-[11px] text-ink-soft">
                Export purpose
                <input value={exportPurpose} onChange={e => setExportPurpose(e.target.value)} className="border border-line rounded-lg px-2 py-1 text-xs" />
              </label>
            </div>
            <div className="divide-y divide-subtle">
              {REPORT_LIBRARY.map(r => (
                <div key={r.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                  <div className="flex-1">
                    <p className="font-semibold text-ink">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-ink-muted">{r.module}</span>
                      <FeatureTags ids={[r.source]} />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(['CSV', 'PDF'] as const).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => exportReport(r.name, fmt)}
                        disabled={!canExport}
                        title={canExport ? undefined : `${dashRole} lacks the Export permission`}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold disabled:opacity-40"
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="p-3 text-[10px] text-ink-muted border-t border-subtle">
              Appendix C of LMN-SMS-FEAT-001 (about 60 reports) was not in the source provided. This list shows only reports that a feature ID above names directly.
            </p>
          </div>

          <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-x-auto">
            <div className="p-3 bg-subtle border-b border-line text-xs font-bold text-ink">Export events (AUD-003)</div>
            {exportLog.length === 0 ? (
              <p className="p-4 text-xs text-ink-muted">No exports this session.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-ink-soft">
                  <tr>
                    {['When', 'Report', 'Format', 'Rows', 'By', 'Purpose'].map(h => (
                      <th key={h} className="text-left p-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {exportLog.map((e, i) => (
                    <tr key={`${e.at}-${i}`}>
                      <td className="p-2 font-mono whitespace-nowrap">{e.at}</td>
                      <td className="p-2">{e.report}</td>
                      <td className="p-2">{e.format}</td>
                      <td className="p-2 font-mono">{e.rows}</td>
                      <td className="p-2">{e.by}</td>
                      <td className="p-2">{e.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'branches' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            {(['enrolment', 'attendancePct', 'collectionPct', 'admissions'] as const).map(m => (
              <button
                key={m}
                onClick={() => setBranchMetric(m)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${branchMetric === m ? 'bg-brand text-white' : 'bg-slate-100 text-ink hover:bg-slate-200'}`}
              >
                {{ enrolment: 'Enrolment', attendancePct: 'Attendance', collectionPct: 'Collection', admissions: 'Admissions' }[m]}
              </button>
            ))}
          </div>
          <div className="bg-surface rounded-2xl border border-line-soft shadow-sm p-4 space-y-3">
            <p className="text-xs font-bold text-ink">{metricLabel} by branch · click a bar to drill in</p>
            {branchRows.map(r => {
              const v = r[branchMetric] as number | null;
              return (
                <button key={r.id} onClick={() => setBranchDrill(branchDrill === r.id ? null : r.id)} className="w-full text-left">
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="font-semibold text-ink">
                      {r.name} <span className="font-mono text-ink-muted">{r.code}</span>
                    </span>
                    <span className="font-mono">{v === null ? 'No data yet' : branchMetric === 'enrolment' || branchMetric === 'admissions' ? v.toLocaleString('en-IN') : `${v}%`}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${branchDrill === r.id ? 'bg-amber-500' : 'bg-brand'}`} style={{ width: `${v === null ? 0 : (v / metricMax) * 100}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
          {branchDrill && (() => {
            const r = branchRows.find(b => b.id === branchDrill)!;
            return (
              <div className="bg-white rounded-2xl border border-amber-300 shadow-xs p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                {[
                  ['Enrolment', r.enrolment.toLocaleString('en-IN')],
                  ['Attendance', r.attendancePct === null ? '—' : `${r.attendancePct}%`],
                  ['Fee collection', r.collectionPct === null ? '—' : `${r.collectionPct}%`],
                  ['Admissions', r.admissions === null ? '—' : String(r.admissions)],
                ].map(([label, value]) => (
                  <div key={label} className="p-2 rounded-lg bg-slate-50">
                    <p className="text-lg font-bold text-ink">{value}</p>
                    <p className="text-[10px] text-ink-muted">
                      {r.name} · {label}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {tab === 'schedules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={addSchedule} className="bg-surface rounded-2xl border border-line-soft shadow-sm p-4 space-y-3 text-xs">
              <p className="font-bold text-ink">New scheduled report</p>
              <label className="block">
                <span className="block font-semibold text-ink-soft mb-1">Report</span>
                <select value={newSchedule.report} onChange={e => setNewSchedule({ ...newSchedule, report: e.target.value })} className="w-full border border-line rounded-lg px-2 py-1.5">
                  {REPORT_LIBRARY.map(r => (
                    <option key={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="block font-semibold text-ink-soft mb-1">Cadence</span>
                  <select value={newSchedule.cadence} onChange={e => setNewSchedule({ ...newSchedule, cadence: e.target.value })} className="w-full border border-line rounded-lg px-2 py-1.5">
                    <option>Daily · 07:30</option>
                    <option>Weekly · Monday 08:00</option>
                    <option>Monthly · 1st 09:00</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block font-semibold text-ink-soft mb-1">Channel</span>
                  <select value={newSchedule.channel} onChange={e => setNewSchedule({ ...newSchedule, channel: e.target.value })} className="w-full border border-line rounded-lg px-2 py-1.5">
                    <option>Email</option>
                    <option>WhatsApp</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block font-semibold text-ink-soft mb-1">Recipient</span>
                  <select value={newSchedule.recipient} onChange={e => setNewSchedule({ ...newSchedule, recipient: e.target.value })} className="w-full border border-line rounded-lg px-2 py-1.5">
                    <option>Principal</option>
                    <option>Branch Admin</option>
                    <option>Accountant</option>
                    <option>Coordinator / HOD</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="font-semibold px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-strong">
                Add schedule
              </button>
            </form>

            <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
              <div className="p-4 bg-subtle border-b border-line text-xs font-bold text-ink">Active schedules</div>
              <div className="divide-y divide-subtle">
                {schedules.map(s => (
                  <div key={s.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-ink">{s.report}</p>
                      <p className="text-[11px] text-ink-muted">
                        {s.cadence} · {s.channel} → {s.recipient}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSchedules(prev => prev.filter(x => x.id !== s.id));
                        addToast('Schedule removed', 'info');
                      }}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <PhaseNotice ids={['RPT-011', 'RPT-012']} phase="Phase 4" note="The custom report builder and natural-language queries are deferred to the intelligence release." />
        </div>
      )}
    </div>
  );
};
