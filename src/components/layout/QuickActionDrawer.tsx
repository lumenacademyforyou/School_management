import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const QuickActionDrawer: React.FC = () => {
  const {
    quickActionOpen,
    setQuickActionOpen,
    setRole,
    setAdminView,
    addToast,
  } = useApp();

  const [studentName, setStudentName] = useState('');
  const [targetClass, setTargetClass] = useState('10');
  const [feeAmount, setFeeAmount] = useState('24500');

  if (!quickActionOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex justify-end fade-in" onClick={() => setQuickActionOpen(false)}>
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#cbe0ec] slide-in-from-right" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#f0f7fb] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0e5d84]">bolt</span>
            <h2 className="text-sm font-bold text-[#082b3d]">Quick Operational Action</h2>
          </div>
          <button
            onClick={() => setQuickActionOpen(false)}
            className="p-1 text-[#777587] hover:text-[#082b3d] rounded-lg hover:bg-[#f0f7fb]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drawer Body with Quick Forms */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {/* Action 1: New Admission Lead */}
          <div className="p-3.5 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec]">
            <div className="text-xs font-bold text-[#082b3d] flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-sm text-[#0e5d84]">person_add</span>
              <span>Fast-Track Admission Lead</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Applicant Full Name"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="w-full bg-white border border-[#cbe0ec] rounded-lg px-2.5 py-1.5 text-xs text-[#082b3d] outline-hidden focus:border-[#0e5d84]"
              />
              <div className="flex gap-2">
                <select
                  value={targetClass}
                  onChange={e => setTargetClass(e.target.value)}
                  className="bg-white border border-[#cbe0ec] rounded-lg px-2 py-1.5 text-xs text-[#082b3d] outline-hidden"
                >
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11 Science</option>
                  <option value="12">Class 12 Commerce</option>
                </select>
                <button
                  onClick={() => {
                    if (!studentName) return;
                    addToast(`Admission lead created for ${studentName}`, 'success', 'Added to Phase 1: Document Verification Kanban');
                    setStudentName('');
                    setQuickActionOpen(false);
                    setRole('admin');
                    setAdminView('admissions');
                  }}
                  className="flex-1 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
                >
                  Submit & Open Kanban
                </button>
              </div>
            </div>
          </div>

          {/* Action 2: Raise Fee Demand Note */}
          <div className="p-3.5 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec]">
            <div className="text-xs font-bold text-[#082b3d] flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-sm text-[#0e5d84]">request_quote</span>
              <span>Raise Fee Demand Note</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={feeAmount}
                onChange={e => setFeeAmount(e.target.value)}
                className="w-28 bg-white border border-[#cbe0ec] rounded-lg px-2.5 py-1.5 text-xs text-[#082b3d] outline-hidden"
              />
              <button
                onClick={() => {
                  addToast(`Demanded ₹${feeAmount} fee batch`, 'info', 'Razorpay payment link sent via WhatsApp to 42 parents');
                  setQuickActionOpen(false);
                  setRole('admin');
                  setAdminView('fees-and-finance');
                }}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
              >
                Dispatch Payment Links
              </button>
            </div>
          </div>

          {/* Action 3: Multi-channel Broadcast Notice */}
          <div className="p-3.5 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec]">
            <div className="text-xs font-bold text-[#082b3d] flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-sm text-[#0e5d84]">campaign</span>
              <span>TRAI DLT SMS & WhatsApp Blast</span>
            </div>
            <p className="text-[11px] text-[#464555] mb-2">
              Send emergency weather alert, sports day notice, or circular instantly to 2,450 parents.
            </p>
            <button
              onClick={() => {
                setQuickActionOpen(false);
                setRole('admin');
                setAdminView('communication');
              }}
              className="w-full bg-[#082b3d] hover:bg-[#152438] text-white text-xs font-semibold rounded-lg px-3 py-1.5 text-center transition-colors"
            >
              Open Notice Composer
            </button>
          </div>

          {/* Action 4: Hardware Terminal Diagnostics */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-[#082b3d] flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-sm text-emerald-600">sensors</span>
              <span>Hardware Turnstiles & Bus GPS</span>
            </div>
            <div className="text-[11px] text-[#464555] space-y-1">
              <div className="flex justify-between">
                <span>Gate Turnstile #01-#04</span>
                <span className="text-emerald-700 font-bold">ONLINE (1,940 Punches)</span>
              </div>
              <div className="flex justify-between">
                <span>Bus Fleet GPS (18 AIS-140)</span>
                <span className="text-emerald-700 font-bold">18/18 LIVE</span>
              </div>
              <div className="flex justify-between">
                <span>Library RFID Trays</span>
                <span className="text-emerald-700 font-bold">CALIBRATED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-[#f0f7fb] border-t border-[#cbe0ec] text-[11px] text-[#464555] flex justify-between items-center">
          <span>Enterprise SMS v4.8</span>
          <button
            onClick={() => setQuickActionOpen(false)}
            className="text-xs text-[#0e5d84] font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
