import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminView } from '../../types';
import { ROLE_LABEL, StaffRole } from '../../data/staffAccess';
import { Figure, Icon } from '../../components/common/ui';

// ---------------------------------------------------------------------------
// Role overview: one headline answer to "is everything okay?", then the rest
// ---------------------------------------------------------------------------

type MetricId = 'attendance' | 'realisation' | 'admissions' | 'outstanding' | 'teachers' | 'students' | 'results';

interface Metric {
  id: MetricId;
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  icon: string;
  view: AdminView;
  viewLabel: string;
  /** Semantic state: ok (success), watch (warning). Brand colours never carry a data state. */
  state: 'ok' | 'watch';
  verdict: string;
  note: string;
  breakdown: { label: string; value: string; prefix?: string; suffix?: string; state?: 'ok' | 'watch' | 'bad' }[];
}

/** Dashboard figures (demo data, as of today). */
const METRICS: Record<MetricId, Metric> = {
  attendance: {
    id: 'attendance', label: 'Attendance today', value: '94.6', suffix: '%', icon: 'fact_check', view: 'attendance', viewLabel: 'Open attendance',
    state: 'ok', verdict: 'On track', note: 'Above the 90% daily threshold; 82 absences are being followed up.',
    breakdown: [
      { label: 'Present', value: '2,352', state: 'ok' },
      { label: 'Absent', value: '82', state: 'bad' },
      { label: 'Late', value: '38', state: 'watch' },
      { label: 'On leave', value: '14' },
    ],
  },
  realisation: {
    id: 'realisation', label: 'Term 3 fees realised', value: '81.2', suffix: '%', icon: 'payments', view: 'fees', viewLabel: 'Open fees desk',
    state: 'watch', verdict: 'Needs attention', note: '₹10.4L is overdue and SMS reminders have gone out; ₹22.4L is still within the grace period.',
    breakdown: [
      { label: 'Collected', value: '1.42', prefix: '₹', suffix: 'Cr', state: 'ok' },
      { label: 'Pending (within grace)', value: '22.4', prefix: '₹', suffix: 'L', state: 'watch' },
      { label: 'Overdue', value: '10.4', prefix: '₹', suffix: 'L', state: 'bad' },
      { label: 'Collected today', value: '18.4', prefix: '₹', suffix: 'L' },
    ],
  },
  admissions: {
    id: 'admissions', label: 'Admissions pending', value: '126', icon: 'how_to_reg', view: 'admissions', viewLabel: 'Open admissions',
    state: 'watch', verdict: 'Needs attention', note: '88 applications are waiting on documents before they can move to interview.',
    breakdown: [
      { label: 'Waiting on documents', value: '88', state: 'watch' },
      { label: 'Interview scheduled', value: '38' },
      { label: 'Enquiries this cycle', value: '480' },
      { label: 'Applications submitted', value: '312' },
    ],
  },
  outstanding: {
    id: 'outstanding', label: 'Outstanding fees', value: '32.8', prefix: '₹', suffix: 'L', icon: 'receipt_long', view: 'fees', viewLabel: 'Open fees desk',
    state: 'watch', verdict: 'Needs attention', note: 'Term 3 closing window: ₹10.4L of this is already overdue.',
    breakdown: [
      { label: 'Within grace period', value: '22.4', prefix: '₹', suffix: 'L', state: 'watch' },
      { label: 'Overdue', value: '10.4', prefix: '₹', suffix: 'L', state: 'bad' },
    ],
  },
  teachers: {
    id: 'teachers', label: 'Teachers present', value: '168', suffix: ' / 174', icon: 'co_present', view: 'teacher-management', viewLabel: 'Open teachers',
    state: 'ok', verdict: 'On track', note: '96.5% on duty; substitutions cover the six absences.',
    breakdown: [
      { label: 'On duty', value: '168', state: 'ok' },
      { label: 'Absent (covered)', value: '6', state: 'watch' },
    ],
  },
  students: {
    id: 'students', label: 'Students enrolled', value: '2,486', icon: 'school', view: 'students', viewLabel: 'Open students',
    state: 'ok', verdict: 'On track', note: 'Up 4.2% on last term.',
    breakdown: [{ label: 'Change vs last term', value: '+4.2', suffix: '%', state: 'ok' }],
  },
  results: {
    id: 'results', label: 'Pre-board pass rate', value: '98.6', suffix: '%', icon: 'workspace_premium', view: 'exams', viewLabel: 'Open examinations',
    state: 'ok', verdict: 'On track', note: 'No failures in Class 10 or Class 12; aggregates between 87% and 91%.',
    breakdown: [
      { label: 'Class 10-A aggregate', value: '91.2', suffix: '%', state: 'ok' },
      { label: 'Class 12-Science aggregate', value: '89.4', suffix: '%', state: 'ok' },
      { label: 'Class 12-Commerce / Humanities', value: '87.5', suffix: '%', state: 'ok' },
      { label: 'Failures', value: '0', state: 'ok' },
    ],
  },
};

/** Each role's single most important number (README → Dashboards by role). */
export const HEADLINE_BY_ROLE: Record<StaffRole, MetricId> = {
  principal: 'attendance',
  accountant: 'realisation',
  admissions: 'admissions',
  auditor: 'outstanding',
  'exam-coordinator': 'results',
};

const SECONDARY: MetricId[] = ['attendance', 'realisation', 'outstanding', 'admissions', 'teachers', 'students'];

const STATE_PILL = {
  ok: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  watch: 'bg-amber-50 text-amber-800 ring-amber-200',
  bad: 'bg-rose-50 text-rose-800 ring-rose-200',
};
const STATE_TEXT = { ok: 'text-emerald-700', watch: 'text-amber-800', bad: 'text-rose-700' };

const Breakdown: React.FC<{ m: Metric; onOpen: () => void }> = ({ m, onOpen }) => (
  <div className="mt-3 border-t border-line-soft pt-3 space-y-2" data-breakdown={m.id}>
    <dl className="grid gap-1.5">
      {m.breakdown.map(b => (
        <div key={b.label} className="flex items-baseline justify-between gap-3 text-xs">
          <dt className="text-ink-soft">{b.label}</dt>
          <dd className={`font-semibold ${b.state ? STATE_TEXT[b.state] : 'text-ink'}`}>
            <Figure value={b.value} prefix={b.prefix} suffix={b.suffix} />
          </dd>
        </div>
      ))}
    </dl>
    <button onClick={onOpen} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
      {m.viewLabel}
      <Icon name="arrow_forward" className="text-sm" />
    </button>
  </div>
);

const RoleOverview: React.FC = () => {
  const { currentUser, setAdminView } = useApp();
  const headline = METRICS[HEADLINE_BY_ROLE[currentUser.staffRole]];
  const rest = SECONDARY.filter(id => id !== headline.id).map(id => METRICS[id]);
  // Progressive disclosure: at most one breakdown is open at a time.
  const [open, setOpen] = useState<MetricId | null>(null);
  const toggle = (id: MetricId) => setOpen(o => (o === id ? null : id));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4" aria-label="Is everything okay?" data-testid="role-overview">
      <article className="lg:col-span-5 bg-surface rounded-2xl border border-line-soft shadow-sm p-5 md:p-6 flex flex-col" data-headline={headline.id}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink flex items-center gap-1.5">
          <Icon name={headline.icon} className="text-sm text-accent" />
          {ROLE_LABEL[currentUser.staffRole]} · today at a glance
        </p>
        <div className="mt-3 text-[56px] leading-none font-bold font-display tracking-tight text-ink">
          <Figure value={headline.value} prefix={headline.prefix} suffix={headline.suffix} />
        </div>
        <p className="mt-2 text-sm font-semibold text-ink">{headline.label}</p>
        <div className="mt-3 flex items-start gap-2">
          <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATE_PILL[headline.state]}`} data-state={headline.state}>
            <Icon name={headline.state === 'ok' ? 'check_circle' : 'error'} className="text-sm" />
            {headline.verdict}
          </span>
          <p className="text-xs text-ink-soft">{headline.note}</p>
        </div>
        <button
          onClick={() => toggle(headline.id)}
          aria-expanded={open === headline.id}
          className="mt-4 self-start inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink"
        >
          <Icon name={open === headline.id ? 'expand_less' : 'expand_more'} className="text-base" />
          {open === headline.id ? 'Hide breakdown' : 'Show breakdown'}
        </button>
        {open === headline.id && <Breakdown m={headline} onOpen={() => setAdminView(headline.view)} />}
      </article>

      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start items-start">
        {rest.map(m => (
          <article key={m.id} className="bg-surface rounded-xl border border-line-soft p-3.5 shadow-xs" data-metric={m.id}>
            <button onClick={() => toggle(m.id)} aria-expanded={open === m.id} className="w-full text-left">
              <span className="flex items-center justify-between gap-2 text-[11px] font-semibold text-ink-muted">
                {m.label}
                <span className={`w-2 h-2 rounded-full ${m.state === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} title={m.verdict} aria-label={m.verdict} />
              </span>
              <span className="mt-1 block text-xl font-bold font-display tracking-tight text-ink">
                <Figure value={m.value} prefix={m.prefix} suffix={m.suffix} />
              </span>
              <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-ink-muted">
                <span className="truncate">{m.verdict}</span>
                <Icon name={open === m.id ? 'expand_less' : 'expand_more'} className="text-sm" />
              </span>
            </button>
            {open === m.id && <Breakdown m={m} onOpen={() => setAdminView(m.view)} />}
          </article>
        ))}
      </div>
    </section>
  );
};

export const DashboardView: React.FC = () => {
  const { setAdminView, selectedCampus, addToast, currentUser } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<number>(2);

  // Approvals State
  const [approvals, setApprovals] = useState([
    {
      id: 'app-1',
      title: 'Medical Leave Request',
      category: 'Staff',
      details: 'Mrs. Lakshmi Menon (PGT Biology) • 2 Days Leave (28 Feb - 01 Mar)',
      amountOrBal: 'Casual Leave Balance: 6 days remaining',
      status: 'pending' as 'pending' | 'approved' | 'rejected',
      applicant: 'Mrs. Lakshmi Menon',
      reason: 'Undergoing routine ENT minor surgery; substitute teacher Mr. Arvind Kumar assigned for Grade 11-B biology sessions.',
    },
    {
      id: 'app-2',
      title: 'Purchase Order PO-2025-082',
      category: 'Procurement',
      details: 'Physics Optics Bench & Vernier Calipers • ₹42,500',
      amountOrBal: 'Budget Head: Academic Lab Equipment 2024-25',
      status: 'pending' as 'pending' | 'approved' | 'rejected',
      applicant: 'Physics Lab In-charge (Mr. K. Narayanan)',
      reason: 'Required for Class 10 CBSE Board practical examinations scheduled starting 15th March.',
    },
  ]);
  const [selectedReviewItem, setSelectedReviewItem] = useState<typeof approvals[0] | null>(null);

  const handleApproveItem = (id: string, name: string) => {
    setApprovals(prev => prev.map(item => item.id === id ? { ...item, status: 'approved' } : item));
    addToast(`Approved ${name} with digital DSC authorization!`, 'success');
  };

  const handleRejectItem = (id: string, name: string) => {
    setApprovals(prev => prev.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
    addToast(`Returned ${name} with revision remark.`, 'info');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-lumen-night text-white p-5 md:p-7 rounded-2xl shadow-lg ring-1 ring-lumen-950/40">
        <div aria-hidden="true" className="absolute inset-0 bg-sunburst [mask-image:radial-gradient(90%_140%_at_100%_0%,black_0%,transparent_70%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-gold-300 uppercase tracking-[0.14em] mb-2">
            <span className="material-symbols-outlined text-sm">school</span>
            <span>{selectedCampus.name} ({selectedCampus.code}) • {selectedCampus.academicYear}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 ring-1 ring-inset ring-emerald-300/30 px-2 py-0.5 normal-case tracking-normal text-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              live system
            </span>
          </div>
          <h1 className="text-2xl md:text-[32px] leading-tight font-bold font-display tracking-tight text-white">
            Good morning, {currentUser.name}
          </h1>
          <p className="text-xs md:text-sm text-lumen-100/80 mt-1">
            Here's what's happening across your school today.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setAdminView('admissions');
              addToast('Opening Admissions Pipeline', 'info');
            }}
            className="flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.14] text-white ring-1 ring-inset ring-white/15 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">how_to_reg</span>
            <span>Admissions Hub</span>
          </button>
          <button
            onClick={() => {
              setAdminView('communication');
              addToast('Opening Broadcast Communications', 'info');
            }}
            className="flex items-center gap-1.5 bg-gold-400 hover:bg-gold-300 text-lumen-950 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_4px_14px_-4px_rgb(240_180_58/0.55)] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">campaign</span>
            <span>Broadcast Notice</span>
          </button>
        </div>
      </div>

      <RoleOverview />

      {/* Row 2: Attendance Overview & Admissions Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Overview (7 cols) */}
        <div className="lg:col-span-7 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-base">fact_check</span>
                <span>Attendance Overview</span>
              </h2>
              <p className="text-xs text-ink-muted">Biometric Turnstiles & Bus RFID sync today</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">2,352 Present</span>
              <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">82 Absent</span>
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">38 Late</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">14 Leave</span>
            </div>
          </div>

          {/* Daily attendance graph */}
          <div className="h-44 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a8193" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2a8193" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#ebe5d6" strokeDasharray="3" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#ebe5d6" strokeDasharray="3" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#ebe5d6" strokeDasharray="3" />
              {/* Shaded Area */}
              <path
                d="M 0 140 Q 60 130, 100 90 T 200 40 T 300 20 T 400 35 T 500 25 L 500 150 L 0 150 Z"
                fill="url(#attendanceGradient)"
              />
              {/* Line */}
              <path
                d="M 0 140 Q 60 130, 100 90 T 200 40 T 300 20 T 400 35 T 500 25"
                fill="none"
                stroke="#354b57"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="300" cy="20" r="4.5" fill="#354b57" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex justify-between text-[11px] text-ink-muted font-mono border-t border-line-soft pt-2">
            <span>07:00 AM (Buses Arrive)</span>
            <span>07:45 AM (Gate Inflow)</span>
            <span className="font-bold text-ink">08:30 AM (Assembly Peak: <Figure value="94.6" suffix="%" />)</span>
            <span>10:30 AM (Interval)</span>
            <span>01:30 PM (Post-Lunch)</span>
          </div>
        </div>

        {/* Admissions Funnel (5 cols) */}
        <div className="lg:col-span-5 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-base">filter_alt</span>
                <span>Admissions Funnel (AY 2025-26)</span>
              </h2>
              <p className="text-xs text-ink-muted">Pipeline conversion velocity</p>
            </div>
            <button
              onClick={() => setAdminView('admissions')}
              className="text-xs text-brand hover:underline font-semibold"
            >
              View Pipeline →
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Step 1: Enquiries */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>1. Enquiries</span>
                <span className="font-mono">480 Leads (100%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full w-full"></div>
              </div>
            </div>
            {/* Step 2: Applications */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>2. Applications Submitted</span>
                <span className="font-mono">312 Forms (65%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full w-[65%]"></div>
              </div>
            </div>
            {/* Step 3: Shortlisted */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>3. Shortlisted & Tested</span>
                <span className="font-mono">194 Candidates (40%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[40%]"></div>
              </div>
            </div>
            {/* Step 4: Admitted */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-emerald-700">4. Final Admitted & Enrolled</span>
                <span className="font-mono text-emerald-700 font-bold">126 Students (26%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-[26%]"></div>
              </div>
            </div>
            {/* Step 5: Rejected */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-ink-muted">
              <span>Rejected / Ineligible: 42</span>
              <span>Waitlisted: 26</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Fee Collection Breakdown & Academic Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fee Collection (6 cols) */}
        <div className="lg:col-span-6 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-base">account_balance_wallet</span>
                <span>Fee Collection & Realization</span>
              </h2>
              <p className="text-xs text-ink-muted">Term 3 dual-entry fee accounts ledger</p>
            </div>
            <button
              onClick={() => setAdminView('fees')}
              className="text-xs text-brand hover:underline font-semibold"
            >
              Finance Ledger →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-[10px] uppercase font-bold text-emerald-800">Collected</div>
              <div className="text-base font-bold text-emerald-950 mt-0.5"><Figure prefix="₹" value="1.42" suffix=" Cr" /></div>
              <div className="text-[10px] text-emerald-700"><Figure value="81.2" suffix="%" /> realized</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-[10px] uppercase font-bold text-amber-800">Pending</div>
              <div className="text-base font-bold text-amber-950 mt-0.5"><Figure prefix="₹" value="22.4" suffix="L" /></div>
              <div className="text-[10px] text-amber-700">Within grace period</div>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <div className="text-[10px] uppercase font-bold text-rose-800">Overdue</div>
              <div className="text-base font-bold text-rose-950 mt-0.5"><Figure prefix="₹" value="10.4" suffix="L" /></div>
              <div className="text-[10px] text-rose-700">Auto SMS dispatched</div>
            </div>
          </div>

          {/* Monthly trend visual bars */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-ink-soft">Monthly Inflow Trend (₹ Lakhs)</div>
            <div className="flex items-end justify-between h-20 gap-2 text-[10px] text-center pt-2">
              {[
                { month: 'Oct', val: 32, label: '32L' },
                { month: 'Nov', val: 28, label: '28L' },
                { month: 'Dec', val: 45, label: '45L' },
                { month: 'Jan', val: 68, label: '68L' },
                { month: 'Feb', val: 52, label: '52L' },
              ].map(b => (
                <div key={b.month} className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="text-[9px] text-ink-muted font-mono mb-1">{b.label}</span>
                  <div
                    className="w-full bg-brand rounded-t-md transition-all hover:bg-teal-600"
                    style={{ height: `${(b.val / 70) * 100}%` }}
                  ></div>
                  <span className="mt-1 font-semibold text-ink-soft">{b.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Academic Performance (6 cols) */}
        <div className="lg:col-span-6 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-base">grade</span>
                <span>Academic Performance (CBSE Pre-Board)</span>
              </h2>
              <p className="text-xs text-ink-muted">Class aggregate & subject pass benchmark</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              <Figure value="98.6" suffix="%" /> Pass Rate
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Class 10-A (Secondary)</span>
                <span className="font-semibold text-ink"><Figure value="91.2" suffix="%" /> Aggregate • 0 Failures</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[91%]"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Class 12-Science (Senior Secondary)</span>
                <span className="font-semibold text-ink"><Figure value="89.4" suffix="%" /> Aggregate • 0 Failures</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[89%]"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Class 12-Commerce / Humanities</span>
                <span className="font-semibold text-ink"><Figure value="87.5" suffix="%" /> Aggregate • 0 Failures</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[87%]"></div>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-ink-muted">Maths</div>
                <div className="font-bold text-ink text-xs"><Figure value="92" suffix="%" /></div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-ink-muted">Physics</div>
                <div className="font-bold text-ink text-xs"><Figure value="88" suffix="%" /></div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-ink-muted">English</div>
                <div className="font-bold text-ink text-xs"><Figure value="94" suffix="%" /></div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-ink-muted">Chemistry</div>
                <div className="font-bold text-ink text-xs"><Figure value="85" suffix="%" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Today's Schedule & Pending Approvals & Upcoming Events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-brand">schedule</span>
              <span>Today's Schedule</span>
            </h3>
            <span className="text-[10px] font-mono text-brand font-bold bg-subtle px-1.5 py-0.5 rounded">
              Period {selectedPeriod} Active
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { p: 1, time: '08:30 - 09:20', subject: 'Mathematics', teacher: 'Dr. V. Raghavan', room: 'Hall 10A' },
              { p: 2, time: '09:20 - 10:10', subject: 'Physics (Ray Optics)', teacher: 'Mrs. Malini Iyer', room: 'Physics Lab' },
              { p: 3, time: '10:10 - 11:00', subject: 'English Literature', teacher: 'Ms. Clara D’Souza', room: 'Room 204' },
              { p: 4, time: '11:00 - 11:50', subject: 'Chemistry Practical', teacher: 'Mr. Rajesh Nair', room: 'Chem Lab' },
            ].map(item => (
              <div
                key={item.p}
                onClick={() => setSelectedPeriod(item.p)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedPeriod === item.p
                    ? 'bg-subtle border-brand text-brand'
                    : 'border-line-soft hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold">{item.subject}</div>
                  <div className="text-[10px] text-ink-muted">{item.teacher} • {item.room}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono font-semibold">{item.time}</div>
                  <span className="text-[9px] bg-slate-100 px-1 rounded">P{item.p}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-amber-600">pending_actions</span>
              <span>Pending Approvals</span>
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
              {approvals.filter(a => a.status === 'pending').length} Pending
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {approvals.map(app => (
              <div key={app.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>{app.title}</span>
                  <span className={`text-[10px] ${app.status === 'approved' ? 'text-emerald-700 font-bold' : app.status === 'rejected' ? 'text-rose-700 font-bold' : 'text-amber-700'}`}>
                    {app.status === 'approved' ? '✓ Approved' : app.status === 'rejected' ? '✗ Returned' : app.category}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft">{app.details}</p>
                {app.status === 'pending' ? (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleApproveItem(app.id, app.title)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setSelectedReviewItem(app)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                    >
                      Review
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold mt-1">
                    Authorization recorded by Principal DSC
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events & Alerts */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-brand">event</span>
              <span>Upcoming School Events</span>
            </h3>
            <span className="text-[10px] text-ink-muted">This Month</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-xl bg-subtle text-brand flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold">28</span>
                <span className="text-[8px] uppercase font-bold">Feb</span>
              </div>
              <div>
                <div className="font-bold text-ink">CBSE Class 10 PTM Consultations</div>
                <div className="text-[10px] text-ink-muted">Hybrid Mode • In-person & Google Meet</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold">04</span>
                <span className="text-[8px] uppercase font-bold">Mar</span>
              </div>
              <div>
                <div className="font-bold text-ink">Annual Science & Robotics Expo</div>
                <div className="text-[10px] text-ink-muted">Main Auditorium • Inter-School Showcase</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold">12</span>
                <span className="text-[8px] uppercase font-bold">Mar</span>
              </div>
              <div>
                <div className="font-bold text-ink">CBSE Board Exam Hall Ticket Distribution</div>
                <div className="text-[10px] text-ink-muted">Principal Class 3 DSC Verification</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Review Approval Modal */}
      {selectedReviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">{selectedReviewItem.title}</h3>
                <span className="text-xs text-ink-muted">Department Category: {selectedReviewItem.category}</span>
              </div>
              <button onClick={() => setSelectedReviewItem(null)} className="text-ink-muted hover:text-ink">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-ink-muted font-semibold">Applicant / Initiator:</div>
                <div className="font-bold text-ink">{selectedReviewItem.applicant}</div>
                <div className="text-[11px] text-ink-soft">{selectedReviewItem.details}</div>
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1">Detailed Operational Justification</label>
                <div className="p-3 bg-wash border border-line rounded-xl text-ink text-xs leading-relaxed">
                  {selectedReviewItem.reason}
                </div>
              </div>

              <div className="p-3 bg-subtle border border-line rounded-xl text-ink text-[11px] font-medium">
                {selectedReviewItem.amountOrBal}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    handleRejectItem(selectedReviewItem.id, selectedReviewItem.title);
                    setSelectedReviewItem(null);
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-colors"
                >
                  Return with Remarks
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReviewItem(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveItem(selectedReviewItem.id, selectedReviewItem.title);
                      setSelectedReviewItem(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    Approve Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
