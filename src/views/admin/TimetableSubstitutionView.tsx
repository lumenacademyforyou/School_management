import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Figure } from '../../components/common/Figure';

interface SubstitutionSuggestion {
  id: string;
  period: string;
  classSection: string;
  subject: string;
  absentTeacher: string;
  substituteTeacher: string;
  reason: string;
  status: 'Pending Alert' | 'Dispatched & Confirmed';
}

export const TimetableSubstitutionView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'substitution' | 'grid' | 'workload'>('substitution');
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual sub form
  const [formPeriod, setFormPeriod] = useState('Period 1 (08:45 - 09:30 AM)');
  const [formClass, setFormClass] = useState('Grade 10-A');
  const [formSubject, setFormSubject] = useState('Physics');
  const [formAbsent, setFormAbsent] = useState('Dr. S. K. Narayanan (Sick Leave)');
  const [formSub, setFormSub] = useState('Mrs. V. Revathi (TGT Science)');

  const [substitutions, setSubstitutions] = useState<SubstitutionSuggestion[]>([
    {
      id: 'SUB-01',
      period: 'Period 2 (09:35 - 10:20 AM)',
      classSection: 'Grade 10-A',
      subject: 'Mathematics',
      absentTeacher: 'K. S. Ramanathan (Medical Leave)',
      substituteTeacher: 'V. S. Raghavan (Free Period, PGT Maths)',
      reason: 'Zero period conflict, 100% subject competency match',
      status: 'Pending Alert',
    },
    {
      id: 'SUB-02',
      period: 'Period 4 (11:20 - 12:05 PM)',
      classSection: 'Grade 8-B',
      subject: 'Social Science',
      absentTeacher: 'Meenakshi Iyer (Casual Leave)',
      substituteTeacher: 'Archana Devi (Free Period, TGT Social)',
      reason: 'Fairness algorithm: Lowest substitution load this week (1/5)',
      status: 'Pending Alert',
    },
    {
      id: 'SUB-03',
      period: 'Period 6 (01:30 - 02:15 PM)',
      classSection: 'Grade 12-B',
      subject: 'Computer Science Lab',
      absentTeacher: 'D. Praveen (On Duty - Cluster Meet)',
      substituteTeacher: 'G. Vignesh (Lab Assistant / MCA)',
      reason: 'Lab supervision qualified',
      status: 'Dispatched & Confirmed',
    },
  ]);

  const handleDispatchSubstitutionAlert = (id: string) => {
    setSubstitutions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'Dispatched & Confirmed' } : s))
    );
    addToast('Substitution alert dispatched via SMS & Faculty App push notification (TTB-014)', 'success');
  };

  const handleAutoAllocateAll = () => {
    setSubstitutions(prev => prev.map(s => ({ ...s, status: 'Dispatched & Confirmed' })));
    addToast('Absence-driven automated substitution executed with 0 teacher clashes (TTB-012)', 'success');
  };

  const handleManualAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub: SubstitutionSuggestion = {
      id: `SUB-0${substitutions.length + 1}`,
      period: formPeriod,
      classSection: formClass,
      subject: formSubject,
      absentTeacher: formAbsent,
      substituteTeacher: formSub,
      reason: 'Manual administrative override assignment',
      status: 'Dispatched & Confirmed',
    };

    setSubstitutions([newSub, ...substitutions]);
    setShowManualModal(false);
    addToast(`Manually assigned ${formSub} to ${formClass} (${formPeriod})`, 'success');
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Substitution ID,Period,Class & Section,Subject,Absent Regular Teacher,Substitute Assigned,Reason,Status',
      ...substitutions.map(
        s =>
          `"${s.id}","${s.period}","${s.classSection}","${s.subject}","${s.absentTeacher}","${s.substituteTeacher}","${s.reason}","${s.status}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Daily_Substitution_Roster_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Daily Substitution Roster (CSV)', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-subtle text-brand">
              TTB · Module 15
            </span>
            <span className="text-xs text-ink-muted">17 Master Features (TTB-001..017)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-ink mt-1">
            Timetable & Automated Absence Substitution
          </h1>
          <p className="text-xs md:text-sm text-ink-soft">
            Dynamic period matrix, clash detection, teacher workload balancer, and absence-driven morning substitution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Roster</span>
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 bg-subtle hover:bg-lumen-200 text-brand border border-line rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Manual Override</span>
          </button>
          <button
            onClick={handleAutoAllocateAll}
            className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            <span>Auto-Allocate Substitutions</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Absent Teachers Today</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">3 Faculty</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Reported before 07:45 AM</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Periods Requiring Coverage</div>
          <div className="text-xl font-bold font-mono text-ink mt-1">{substitutions.length} Periods</div>
          <div className="text-[11px] text-emerald-600 mt-0.5"><Figure value="100" suffix="%" /> Covered by Substitutes</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Schedule Clashes</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">0 Clashes</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Constraint solver verified</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Weekly Workload Balance</div>
          <div className="text-xl font-bold font-mono text-ink mt-1">26.4 hrs / wk</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Target: 28 hrs maximum</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line-soft pb-2">
        <button
          onClick={() => setActiveTab('substitution')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'substitution' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">published_with_changes</span>
          <span>Absence-Driven Substitution (TTB-012)</span>
        </button>
        <button
          onClick={() => setActiveTab('grid')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'grid' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">grid_view</span>
          <span>Class 10-A Master Timetable</span>
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'workload' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">equalizer</span>
          <span>Teacher Workload Fairness (TTB-013)</span>
        </button>
      </div>

      {/* Tab 1: Substitution Engine */}
      {activeTab === 'substitution' && (
        <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
          <div className="p-4 border-b border-line-soft flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Today's Automated Substitution Roster</h3>
            <span className="text-xs text-ink-muted">Morning Run: 08:15 AM</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-ink-soft border-b border-line-soft text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Period & Class</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Absent Regular Teacher</th>
                <th className="py-3 px-4">Recommended Substitute</th>
                <th className="py-3 px-4">Optimization Reason</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {substitutions.map(sub => (
                <tr key={sub.id} className="hover:bg-wash transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-ink">{sub.period}</div>
                    <div className="text-[10px] text-brand font-semibold">{sub.classSection}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink">{sub.subject}</td>
                  <td className="py-3 px-4 text-rose-700 font-medium">{sub.absentTeacher}</td>
                  <td className="py-3 px-4 text-emerald-800 font-bold">{sub.substituteTeacher}</td>
                  <td className="py-3 px-4 text-ink-muted text-[11px]">{sub.reason}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        sub.status.includes('Confirmed')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {sub.status === 'Pending Alert' ? (
                      <button
                        onClick={() => handleDispatchSubstitutionAlert(sub.id)}
                        className="px-2.5 py-1 bg-brand hover:bg-brand-strong text-white rounded text-xs font-bold transition-all"
                      >
                        Notify Staff
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-bold">✓ Dispatched</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Master Grid */}
      {activeTab === 'grid' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-ink">Grade 10-A Weekly Timetable Matrix (CBSE Standard)</h3>
            <span className="text-xs bg-subtle text-brand px-2.5 py-0.5 rounded-full font-bold">
              8 Periods / Day
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-ink font-bold">
                  <th className="p-2.5 border border-slate-200">Day</th>
                  <th className="p-2.5 border border-slate-200">P1 (08:30)</th>
                  <th className="p-2.5 border border-slate-200">P2 (09:15)</th>
                  <th className="p-2.5 border border-slate-200">P3 (10:00)</th>
                  <th className="p-2.5 border border-slate-200">P4 (11:00)</th>
                  <th className="p-2.5 border border-slate-200">P5 (11:45)</th>
                  <th className="p-2.5 border border-slate-200">P6 (12:45)</th>
                  <th className="p-2.5 border border-slate-200">P7 (01:30)</th>
                  <th className="p-2.5 border border-slate-200">P8 (02:15)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { day: 'Mon', p: ['Mathematics', 'Science (Phy)', 'English', 'Social Science', 'Hindi/Tamil', 'AI / Robotics', 'Physical Edu', 'Library'] },
                  { day: 'Tue', p: ['Science (Chem)', 'Mathematics', 'Social Science', 'English', 'Hindi/Tamil', 'Science Lab', 'Science Lab', 'Art / Craft'] },
                  { day: 'Wed', p: ['Mathematics', 'Science (Bio)', 'English', 'Social Science', 'AI Lab', 'AI Lab', 'Yoga & Wellness', 'Value Edu'] },
                  { day: 'Thu', p: ['Social Science', 'Mathematics', 'Science (Phy)', 'Hindi/Tamil', 'English', 'Mathematics', 'Sports / Games', 'Remedial'] },
                  { day: 'Fri', p: ['Science (Chem)', 'Social Science', 'Mathematics', 'English', 'Hindi/Tamil', 'Robotics STEM', 'Music / Dance', 'Club Activity'] },
                ].map(row => (
                  <tr key={row.day} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold bg-slate-50 border border-slate-200 text-brand">{row.day}</td>
                    {row.p.map((subject, idx) => (
                      <td key={idx} className="p-2 border border-slate-200 font-semibold text-slate-800">
                        {subject}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Workload Fairness */}
      {activeTab === 'workload' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ink">Teacher Workload & Fairness Index (TTB-013)</h3>
          <p className="text-xs text-ink-muted">
            Ensures equitable distribution of emergency substitute periods without overloading faculty members.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-xs text-ink">PGT Mathematics Dept</div>
              <div className="text-xs text-ink-muted mt-1">Average Load: 24.2 periods/wk</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Optimal Balance</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-xs text-ink">PGT Physics & Chemistry</div>
              <div className="text-xs text-ink-muted mt-1">Average Load: 25.0 periods/wk</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Optimal Balance</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-xs text-ink">TGT English & Languages</div>
              <div className="text-xs text-ink-muted mt-1">Average Load: 23.8 periods/wk</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Optimal Balance</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manual Substitute Assignment */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">person_add</span>
                <h3 className="font-bold text-ink text-sm">Assign Manual Substitute (TTB-014)</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleManualAssign} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Period</label>
                <select
                  value={formPeriod}
                  onChange={e => setFormPeriod(e.target.value)}
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option value="Period 1 (08:30 - 09:15 AM)">Period 1 (08:30 - 09:15 AM)</option>
                  <option value="Period 2 (09:15 - 10:00 AM)">Period 2 (09:15 - 10:00 AM)</option>
                  <option value="Period 3 (10:00 - 10:45 AM)">Period 3 (10:00 - 10:45 AM)</option>
                  <option value="Period 4 (11:00 - 11:45 AM)">Period 4 (11:00 - 11:45 AM)</option>
                  <option value="Period 5 (11:45 - 12:30 PM)">Period 5 (11:45 - 12:30 PM)</option>
                  <option value="Period 6 (01:15 - 02:00 PM)">Period 6 (01:15 - 02:00 PM)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class & Section</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={e => setFormClass(e.target.value)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Absent Regular Teacher</label>
                <input
                  type="text"
                  value={formAbsent}
                  onChange={e => setFormAbsent(e.target.value)}
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Substitute Teacher</label>
                <select
                  value={formSub}
                  onChange={e => setFormSub(e.target.value)}
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option value="Mrs. V. Revathi (TGT Science)">Mrs. V. Revathi (TGT Science - Free)</option>
                  <option value="V. S. Raghavan (PGT Maths)">V. S. Raghavan (PGT Maths - Free)</option>
                  <option value="Archana Devi (TGT Social)">Archana Devi (TGT Social - Free)</option>
                  <option value="G. Vignesh (Lab Assistant)">G. Vignesh (Lab Assistant - Free)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Confirm & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
