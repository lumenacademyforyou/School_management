import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const DashboardView: React.FC = () => {
  const { setAdminView, selectedCampus, addToast } = useApp();
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
            Good morning, Administrator
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

      {/* Top 6 KPI Cards (Exact user specification) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* KPI 1: Total Students */}
        <div
          onClick={() => setAdminView('students')}
          className="bg-surface p-4 rounded-2xl border border-line-soft shadow-sm hover:-translate-y-px hover:shadow-md hover:border-brand transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="text-[11px] font-semibold">Total Students</span>
            <span className="material-symbols-outlined text-base text-brand">school</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">2,486</div>
            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>+4.2% vs last term</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Attendance Today */}
        <div
          onClick={() => setAdminView('attendance')}
          className="bg-surface p-4 rounded-2xl border border-line-soft shadow-sm hover:-translate-y-px hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="text-[11px] font-semibold">Attendance Today</span>
            <span className="material-symbols-outlined text-base text-emerald-600">fact_check</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">94.6%</div>
            <div className="text-[10px] text-ink-soft mt-0.5">
              2,352 present • 82 absent
            </div>
          </div>
        </div>

        {/* KPI 3: Fee Collection */}
        <div
          onClick={() => setAdminView('fees')}
          className="bg-surface p-4 rounded-2xl border border-line-soft shadow-sm hover:-translate-y-px hover:shadow-md hover:border-teal-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="text-[11px] font-semibold">Fee Collection</span>
            <span className="material-symbols-outlined text-base text-teal-600">payments</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">₹18.4L</div>
            <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
              Today's collections
            </div>
          </div>
        </div>

        {/* KPI 4: Pending Admissions */}
        <div
          onClick={() => setAdminView('admissions')}
          className="bg-surface p-4 rounded-2xl border border-line-soft shadow-sm hover:-translate-y-px hover:shadow-md hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="text-[11px] font-semibold">Pending Admissions</span>
            <span className="material-symbols-outlined text-base text-amber-600">how_to_reg</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">126</div>
            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
              38 interview • 88 docs
            </div>
          </div>
        </div>

        {/* KPI 5: Teachers Present */}
        <div
          onClick={() => setAdminView('teacher-management')}
          className="bg-surface p-4 rounded-2xl border border-line-soft shadow-sm hover:-translate-y-px hover:shadow-md hover:border-brand transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="text-[11px] font-semibold">Teachers Present</span>
            <span className="material-symbols-outlined text-base text-brand">co_present</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">168 / 174</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              96.5% active on duty
            </div>
          </div>
        </div>

        {/* KPI 6: Outstanding Fees */}
        <div
          onClick={() => setAdminView('fees')}
          className="bg-surface p-4 rounded-2xl border border-line-soft shadow-sm hover:-translate-y-px hover:shadow-md hover:border-rose-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="text-[11px] font-semibold">Outstanding Fees</span>
            <span className="material-symbols-outlined text-base text-rose-600">receipt_long</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">₹32.8L</div>
            <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
              Term 3 closing window
            </div>
          </div>
        </div>
      </div>

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
                stroke="#2a8193"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="300" cy="20" r="4.5" fill="#2a8193" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex justify-between text-[11px] text-ink-muted font-mono border-t border-line-soft pt-2">
            <span>07:00 AM (Buses Arrive)</span>
            <span>07:45 AM (Gate Inflow)</span>
            <span className="font-bold text-teal-700">08:30 AM (Assembly Peak: 94.6%)</span>
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
                <div className="h-full bg-blue-500 rounded-full w-[65%]"></div>
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
              <div className="text-base font-bold text-emerald-950 mt-0.5">₹1.42 Cr</div>
              <div className="text-[10px] text-emerald-700">81.2% realized</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-[10px] uppercase font-bold text-amber-800">Pending</div>
              <div className="text-base font-bold text-amber-950 mt-0.5">₹22.4L</div>
              <div className="text-[10px] text-amber-700">Within grace period</div>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <div className="text-[10px] uppercase font-bold text-rose-800">Overdue</div>
              <div className="text-base font-bold text-rose-950 mt-0.5">₹10.4L</div>
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
              98.6% Pass Rate
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Class 10-A (Secondary)</span>
                <span className="font-mono text-brand font-bold">91.2% Aggregate • 0 Failures</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full w-[91%]"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Class 12-Science (Senior Secondary)</span>
                <span className="font-mono text-teal-700 font-bold">89.4% Aggregate • 0 Failures</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full w-[89%]"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Class 12-Commerce / Humanities</span>
                <span className="font-mono text-brand font-bold">87.5% Aggregate • 0 Failures</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full w-[87%]"></div>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-ink-muted">Maths</div>
                <div className="font-bold text-ink text-xs">92%</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-ink-muted">Physics</div>
                <div className="font-bold text-ink text-xs">88%</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-ink-muted">English</div>
                <div className="font-bold text-ink text-xs">94%</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-ink-muted">Chemistry</div>
                <div className="font-bold text-ink text-xs">85%</div>
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
