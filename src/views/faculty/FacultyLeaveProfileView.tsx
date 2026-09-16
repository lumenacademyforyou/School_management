import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface LeaveRequest {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  substitute: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  appliedOn: string;
}

export const FacultyLeaveProfileView: React.FC = () => {
  const { addToast } = useApp();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave (CL)');
  const [fromDate, setFromDate] = useState('2026-09-22');
  const [toDate, setToDate] = useState('2026-09-23');
  const [reason, setReason] = useState('');
  const [substituteTeacher, setSubstituteTeacher] = useState('Dr. Arvind Swaminathan (PGT Chemistry)');

  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([
    {
      id: 'LV-2026-089',
      type: 'Casual Leave (CL)',
      from: '12 Aug 2026',
      to: '13 Aug 2026',
      days: 2,
      reason: 'Family ceremonial function',
      substitute: 'Dr. Arvind Swaminathan',
      status: 'Approved',
      appliedOn: '08 Aug 2026',
    },
    {
      id: 'LV-2026-042',
      type: 'On Duty (OD)',
      from: '04 Jul 2026',
      to: '05 Jul 2026',
      days: 2,
      reason: 'CBSE Regional Science Exhibition Evaluator',
      substitute: 'Mrs. Rekha Sundaram',
      status: 'Approved',
      appliedOn: '28 Jun 2026',
    },
    {
      id: 'LV-2026-015',
      type: 'Medical Leave (ML)',
      from: '19 May 2026',
      to: '20 May 2026',
      days: 2,
      reason: 'Viral fever recovery',
      substitute: 'Mr. David Rajan',
      status: 'Approved',
      appliedOn: '19 May 2026',
    },
  ]);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast('Please enter a reason for leave', 'warning');
      return;
    }
    const newReq: LeaveRequest = {
      id: `LV-2026-0${leaveHistory.length + 95}`,
      type: leaveType,
      from: fromDate,
      to: toDate,
      days: 2,
      reason,
      substitute: substituteTeacher.split(' (')[0],
      status: 'Pending',
      appliedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setLeaveHistory([newReq, ...leaveHistory]);
    setShowApplyModal(false);
    setReason('');
    addToast('Leave application submitted to Academic Dean', 'success', `Substitute: ${newReq.substitute} notified.`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Teacher Profile Banner */}
      <div className="bg-[#082b3d] text-white p-5 md:p-6 rounded-2xl border border-[#213145] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
            alt="Mrs. Malini Iyer"
            className="w-16 h-16 rounded-full object-cover border-2 border-[#f59e0b]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display">Mrs. Malini Iyer, M.Sc. B.Ed.</h1>
              <span className="bg-[#f59e0b]/20 text-[#f59e0b] text-xs px-2 py-0.5 rounded font-mono font-bold">
                FAC-109
              </span>
            </div>
            <div className="text-xs text-[#cbd5e1] mt-0.5">
              PGT Physics (Department Head) • Employee ID: EMP-DEL-042 • 7th CPC Level 8
            </div>
            <div className="text-xs text-[#f59e0b] mt-1 font-medium flex items-center gap-3">
              <span>Teacher TRN: <strong>TRN-CBSE-994182</strong></span>
              <span>•</span>
              <span>Total Service: <strong>8 Years, 4 Months</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowApplyModal(true)}
          className="bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balance Quotas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#e0ecf4] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777587] uppercase">Casual Leave (CL)</span>
            <span className="material-symbols-outlined text-[#0e5d84] text-lg">event_available</span>
          </div>
          <div className="text-2xl font-bold font-display text-[#082b3d] mt-2">5 <span className="text-xs font-normal text-[#777587]">/ 12 Remaining</span></div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#0e5d84] h-full rounded-full" style={{ width: '41.6%' }}></div>
          </div>
          <div className="text-[11px] text-[#464555] mt-1.5">7 days utilized in AY 2024–25</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e0ecf4] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777587] uppercase">Medical Leave (ML)</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">medical_services</span>
          </div>
          <div className="text-2xl font-bold font-display text-[#082b3d] mt-2">8 <span className="text-xs font-normal text-[#777587]">/ 10 Remaining</span></div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '80%' }}></div>
          </div>
          <div className="text-[11px] text-[#464555] mt-1.5">2 days utilized with certificate</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e0ecf4] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777587] uppercase">On Duty / Training (OD)</span>
            <span className="material-symbols-outlined text-teal-600 text-lg">work</span>
          </div>
          <div className="text-2xl font-bold font-display text-[#082b3d] mt-2">3 <span className="text-xs font-normal text-[#777587]">/ 5 Remaining</span></div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full" style={{ width: '60%' }}></div>
          </div>
          <div className="text-[11px] text-[#464555] mt-1.5">CBSE capacity-building workshops</div>
        </div>
      </div>

      {/* NEP 2020 Continuous Professional Development (CPD) Tracker */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0e5d84] uppercase tracking-wider">NEP 2020 §5.15 Mandate</span>
            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-1.5 py-0.5 rounded">On Track</span>
          </div>
          <h2 className="text-base font-bold text-[#082b3d]">Continuous Professional Development (CPD 50-Hour Target)</h2>
          <p className="text-xs text-[#464555]">
            42 hours completed across DIKSHA, CBSE Sahodaya, and NISHTHA 3.0 pedagogical certifications.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-bold font-mono text-[#082b3d]">42 / 50 hrs</div>
            <div className="text-[11px] text-[#777587]">8 hrs to statutory target</div>
          </div>
          <button
            type="button"
            onClick={() => addToast('CPD certification ledger and certificates opened', 'info')}
            className="bg-[#f0f7fb] hover:bg-[#dbeafe] text-[#0e5d84] border border-[#cbe0ec] text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            View Certificates
          </button>
        </div>
      </div>

      {/* Leave Application History */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
          <span className="text-xs font-bold text-[#082b3d]">Leave Applications Ledger & Substitute Proxy</span>
          <span className="text-xs text-[#777587] font-semibold">{leaveHistory.length} Total Records</span>
        </div>

        <div className="divide-y divide-[#f0f7fb]">
          {leaveHistory.map(req => (
            <div key={req.id} className="p-4 hover:bg-[#f8f9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#082b3d]">{req.type}</span>
                  <span className="font-mono text-[#777587] text-[11px]">({req.id})</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      req.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <div className="text-[#464555] mt-1">
                  Reason: <em>"{req.reason}"</em>
                </div>
                <div className="text-[11px] text-[#777587] mt-1 flex items-center gap-3">
                  <span>Duration: <strong>{req.from} to {req.to}</strong> ({req.days} days)</span>
                  <span>•</span>
                  <span>Proxy Teacher: <strong>{req.substitute}</strong></span>
                  <span>•</span>
                  <span>Applied: {req.appliedOn}</span>
                </div>
              </div>

              {req.status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => {
                    setLeaveHistory(leaveHistory.filter(item => item.id !== req.id));
                    addToast('Leave application withdrawn', 'info');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold self-start sm:self-auto cursor-pointer"
                >
                  Withdraw
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#cbe0ec] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <h2 className="text-base font-bold text-[#082b3d]">Apply for Leave (HRM-014)</h2>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-[#777587] hover:text-[#082b3d] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#464555] mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl px-3 py-2 text-[#082b3d] font-medium focus:border-[#0e5d84] focus:outline-hidden"
                >
                  <option>Casual Leave (CL) — 5 balance</option>
                  <option>Medical Leave (ML) — 8 balance</option>
                  <option>On Duty (OD) — 3 balance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#464555] mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl px-3 py-2 text-[#082b3d] focus:border-[#0e5d84] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#464555] mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl px-3 py-2 text-[#082b3d] focus:border-[#0e5d84] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">
                  Designated Substitute Teacher (CBSE Proxy Mandate)
                </label>
                <select
                  value={substituteTeacher}
                  onChange={e => setSubstituteTeacher(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl px-3 py-2 text-[#082b3d] focus:border-[#0e5d84] focus:outline-hidden"
                >
                  <option>Dr. Arvind Swaminathan (PGT Chemistry)</option>
                  <option>Mrs. Rekha Sundaram (PGT Mathematics)</option>
                  <option>Mr. David Rajan (TGT Science)</option>
                  <option>Ms. Sneha Kulkarni (Lab Assistant)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Reason / Purpose</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Attending family ceremonial function in Bengaluru..."
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-3 text-[#082b3d] focus:border-[#0e5d84] focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0e5d84] hover:bg-[#083a4f] text-white px-5 py-2 rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
