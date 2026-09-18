import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TIMETABLE_PERIODS } from '../../data/mockData';

interface PeriodItem {
  period: number;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  active: boolean;
}

export const AcademicsView: React.FC = () => {
  const { addToast } = useApp();

  const [periods, setPeriods] = useState<PeriodItem[]>(TIMETABLE_PERIODS);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);

  // Proxy state
  const [selectedAbsentTeacher, setSelectedAbsentTeacher] = useState('Mrs. Malini Iyer (PGT Physics)');
  const [selectedProxyPeriod, setSelectedProxyPeriod] = useState(5);
  const [selectedProxyTeacher, setSelectedProxyTeacher] = useState('Mr. K. Natarajan (TGT Science)');

  // New period state
  const [newPeriod, setNewPeriod] = useState({
    subject: '',
    teacher: '',
    room: '',
    time: '02:00 - 02:45 PM',
  });

  const teachers = [
    { name: 'Mrs. Malini Iyer (PGT Physics)', load: '24 / 28', status: 'Optimal', activeNow: true },
    { name: 'Dr. V. Raghavan (HOD Mathematics)', load: '26 / 28', status: 'High', activeNow: false },
    { name: 'Mr. S. Balaji (PGT Chemistry)', load: '22 / 28', status: 'Optimal', activeNow: false },
    { name: 'Ms. Clara D’Souza (TGT English)', load: '22 / 28', status: 'Optimal', activeNow: false },
    { name: 'Coach R. Dinesh (PE & Sports)', load: '20 / 28', status: 'Available', activeNow: false },
  ];

  const handleDispatchProxy = (e: React.FormEvent) => {
    e.preventDefault();
    setPeriods(prev =>
      prev.map(p =>
        p.period === Number(selectedProxyPeriod)
          ? { ...p, teacher: `${selectedProxyTeacher} (Proxy for ${selectedAbsentTeacher.split(' ')[1]})` }
          : p
      )
    );
    setShowProxyModal(false);
    addToast(`Auto-Proxy dispatched: ${selectedProxyTeacher} assigned to Period ${selectedProxyPeriod}`, 'success');
  };

  const handleAddPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriod.subject.trim() || !newPeriod.teacher.trim()) {
      addToast('Subject and faculty are required', 'warning');
      return;
    }
    const nextPeriodNum = periods.length + 1;
    const created: PeriodItem = {
      period: nextPeriodNum,
      subject: newPeriod.subject,
      teacher: newPeriod.teacher,
      room: newPeriod.room || 'Room 102',
      time: newPeriod.time,
      active: false,
    };
    setPeriods(prev => [...prev, created]);
    setShowAddPeriodModal(false);
    setNewPeriod({ subject: '', teacher: '', room: '', time: '02:00 - 02:45 PM' });
    addToast(`Allotted Period ${nextPeriodNum} (${created.subject}) to daily roster`, 'success');
  };

  const handleExportSchedule = () => {
    const csvContent = [
      'Period,Subject,Teacher,Room,Time Slot',
      ...periods.map(p => `P${p.period},"${p.subject}","${p.teacher}","${p.room}","${p.time}"`)
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Class_10A_Timetable_Schedule_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Class 10-A Timetable (CSV)', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span>Academic Curriculum & Master Allocations</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            Class 10-A Day Order & Faculty Allocation Matrix
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Period 2 Currently Active (09:15 - 10:00 AM) • Physics Lab 02 • Automated Proxy Engine
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportSchedule}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Schedule</span>
          </button>

          <button
            onClick={() => setShowAddPeriodModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Allot Period</span>
          </button>

          <button
            onClick={() => setShowProxyModal(true)}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            <span>Trigger Proxy Auto-Dispatch</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Timetable Periods Roster + Faculty Workload Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timetable Period Ledger */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
          <div className="p-4 bg-subtle border-b border-line flex items-center justify-between">
            <span className="text-xs font-bold text-ink">Today's Period Schedule (Wednesday Day Order 3)</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
              {periods.length} Periods Allotted
            </span>
          </div>

          <div className="divide-y divide-subtle">
            {periods.map(p => (
              <div
                key={p.period}
                className={`p-3.5 transition-colors flex items-center justify-between text-xs ${
                  p.active ? 'bg-subtle border-l-4 border-brand' : 'hover:bg-wash'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      p.active ? 'bg-brand text-white' : 'bg-slate-100 text-ink-soft'
                    }`}
                  >
                    P{p.period}
                  </div>
                  <div>
                    <div className="font-bold text-ink flex items-center gap-2">
                      <span>{p.subject}</span>
                      {p.active && (
                        <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded animate-pulse">
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-soft">{p.teacher} • {p.room}</div>
                  </div>
                </div>
                <div className="font-mono text-xs text-ink-muted font-semibold">{p.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Teacher Workload Heatmap */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-base">work_history</span>
            <span>Teacher Workload Heatmap</span>
          </h2>
          <p className="text-[11px] text-ink-soft">Weekly period limits under CBSE affiliation norms (Max 28 periods/week).</p>

          <div className="space-y-3">
            {teachers.map(t => (
              <div key={t.name} className="p-3 bg-subtle rounded-xl border border-line text-xs">
                <div className="flex items-center justify-between font-bold text-ink">
                  <span>{t.name}</span>
                  <span className="font-mono text-brand">{t.load}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-ink-soft">
                  <span>Status: <strong className="text-emerald-700">{t.status}</strong></span>
                  {t.activeNow ? (
                    <span className="text-emerald-700 font-bold">● Teaching P2</span>
                  ) : (
                    <span>Free</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Trigger Proxy Auto-Dispatch */}
      {showProxyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">Automated Faculty Proxy Dispatch</h3>
                <span className="text-xs text-ink-muted">Assign replacement mentor without clash</span>
              </div>
              <button onClick={() => setShowProxyModal(false)} className="text-ink-muted hover:text-ink">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleDispatchProxy} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink-soft mb-1">Absent Faculty Member</label>
                <select
                  value={selectedAbsentTeacher}
                  onChange={e => setSelectedAbsentTeacher(e.target.value)}
                  className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs"
                >
                  {teachers.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1">Target Period to Substitute</label>
                <select
                  value={selectedProxyPeriod}
                  onChange={e => setSelectedProxyPeriod(Number(e.target.value))}
                  className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs"
                >
                  {periods.map(p => (
                    <option key={p.period} value={p.period}>Period {p.period} — {p.subject} ({p.time})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1">Available Replacement Faculty</label>
                <select
                  value={selectedProxyTeacher}
                  onChange={e => setSelectedProxyTeacher(e.target.value)}
                  className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs"
                >
                  <option value="Mr. K. Natarajan (TGT Science)">Mr. K. Natarajan (TGT Science) — 18/28 Free</option>
                  <option value="Coach R. Dinesh (PE & Sports)">Coach R. Dinesh (PE & Sports) — 20/28 Free</option>
                  <option value="Ms. Clara D’Souza (TGT English)">Ms. Clara D’Souza (TGT English) — 22/28 Free</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setShowProxyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl font-bold"
                >
                  Dispatch Proxy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Allot Period */}
      {showAddPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">Allot New Daily Period</h3>
                <span className="text-xs text-ink-muted">Add subject slot to Class 10-A</span>
              </div>
              <button onClick={() => setShowAddPeriodModal(false)} className="text-ink-muted hover:text-ink">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddPeriod} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink-soft mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence / Robotics"
                  value={newPeriod.subject}
                  onChange={e => setNewPeriod({ ...newPeriod, subject: e.target.value })}
                  className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1">Faculty Mentor</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. S. Balaji"
                  value={newPeriod.teacher}
                  onChange={e => setNewPeriod({ ...newPeriod, teacher: e.target.value })}
                  className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-soft mb-1">Classroom / Lab</label>
                  <input
                    type="text"
                    placeholder="e.g. CS Lab 01"
                    value={newPeriod.room}
                    onChange={e => setNewPeriod({ ...newPeriod, room: e.target.value })}
                    className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink-soft mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newPeriod.time}
                    onChange={e => setNewPeriod({ ...newPeriod, time: e.target.value })}
                    className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setShowAddPeriodModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl font-bold"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
