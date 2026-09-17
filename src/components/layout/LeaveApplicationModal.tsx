import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const LeaveApplicationModal: React.FC = () => {
  const { leaveModalOpen, setLeaveModalOpen, addToast } = useApp();

  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [fromDate, setFromDate] = useState('2025-03-03');
  const [toDate, setToDate] = useState('2025-03-04');
  const [reason, setReason] = useState('Mild viral fever and prescribed doctor rest.');

  if (!leaveModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 fade-in" onClick={() => setLeaveModalOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl border border-[#cbe0ec] max-w-md w-full overflow-hidden zoom-in" onClick={e => e.stopPropagation()}>
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0e5d84]">edit_calendar</span>
            <div>
              <h2 className="text-sm font-bold text-[#082b3d]">Submit Student Leave Request</h2>
              <div className="text-[11px] text-[#464555]">Aarav S. Ramanathan • Class 10-A</div>
            </div>
          </div>
          <button
            onClick={() => setLeaveModalOpen(false)}
            className="text-[#777587] hover:text-[#082b3d] p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#082b3d] mb-1">Leave Category</label>
            <select
              value={leaveType}
              onChange={e => setLeaveType(e.target.value)}
              className="w-full bg-white border border-[#cbe0ec] rounded-lg p-2 text-xs text-[#082b3d] outline-hidden focus:border-[#0e5d84]"
            >
              <option value="Medical Leave">Medical Leave (Doctor prescription attachable)</option>
              <option value="Family Event">Family / Personal Emergency</option>
              <option value="Competitive Exam">Olympiad / Competitive Exam External</option>
              <option value="Sports Event">District Sports Tournament</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#082b3d] mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full bg-white border border-[#cbe0ec] rounded-lg p-2 text-xs text-[#082b3d] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#082b3d] mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full bg-white border border-[#cbe0ec] rounded-lg p-2 text-xs text-[#082b3d] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#082b3d] mb-1">Reason / Notes for Class Teacher</label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-white border border-[#cbe0ec] rounded-lg p-2 text-xs text-[#082b3d] outline-hidden focus:border-[#0e5d84]"
              placeholder="State reasons for absence..."
            />
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-[#464555] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#0e5d84]">attach_file</span>
              <span>Attach Doctor Note (Optional)</span>
            </span>
            <span className="text-[#0e5d84] font-semibold cursor-pointer">Browse PDF</span>
          </div>
        </div>

        <div className="p-3 bg-[#f0f7fb] border-t border-[#cbe0ec] flex justify-end gap-2">
          <button
            onClick={() => setLeaveModalOpen(false)}
            className="px-3 py-1.5 text-xs text-[#464555] hover:text-[#082b3d] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setLeaveModalOpen(false);
              addToast('Leave Request Dispatched', 'success', `Forwarded to Mrs. Malini Iyer for Class 10-A attendance exemption.`);
            }}
            className="px-4 py-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Submit to School
          </button>
        </div>
      </div>
    </div>
  );
};
