import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const PTMBookingModal: React.FC = () => {
  const { ptmModalOpen, setPtmModalOpen, student, addToast } = useApp();

  const [selectedTeacher, setSelectedTeacher] = useState('Mrs. Malini Iyer (Physics)');
  const [slot, setSlot] = useState('02:30 PM - 02:45 PM');
  const [mode, setMode] = useState<'In-Person' | 'Google Meet'>('In-Person');

  if (!ptmModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 fade-in" onClick={() => setPtmModalOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl border border-[#cbe0ec] max-w-md w-full overflow-hidden zoom-in" onClick={e => e.stopPropagation()}>
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0e5d84]">event_available</span>
            <div>
              <h2 className="text-sm font-bold text-[#082b3d]">Schedule Parent-Teacher Meeting</h2>
              <div className="text-[11px] text-[#464555]">Child: {student.name} ({student.class}-{student.section})</div>
            </div>
          </div>
          <button
            onClick={() => setPtmModalOpen(false)}
            className="text-[#777587] hover:text-[#082b3d] p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#082b3d] mb-1">Select Faculty Member</label>
            <select
              value={selectedTeacher}
              onChange={e => setSelectedTeacher(e.target.value)}
              className="w-full bg-white border border-[#cbe0ec] rounded-lg p-2 text-xs text-[#082b3d] outline-hidden focus:border-[#0e5d84]"
            >
              <option value="Mrs. Malini Iyer (Physics)">Mrs. Malini Iyer (PGT Physics & Class Mentor)</option>
              <option value="Dr. V. Raghavan (Mathematics)">Dr. V. Raghavan (HOD Mathematics)</option>
              <option value="Mr. S. Balaji (Chemistry)">Mr. S. Balaji (PGT Chemistry)</option>
              <option value="Ms. Clara D’Souza (English)">Ms. Clara D’Souza (TGT English)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#082b3d] mb-1">Select Available Slot (Saturday, 1 Mar)</label>
            <div className="grid grid-cols-2 gap-2">
              {['10:00 AM - 10:15 AM', '11:15 AM - 11:30 AM', '02:30 PM - 02:45 PM', '03:45 PM - 04:00 PM'].map(s => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    slot === s
                      ? 'bg-[#0e5d84] text-white border-[#0e5d84] font-semibold'
                      : 'bg-[#f0f7fb] border-[#cbe0ec] text-[#082b3d] hover:bg-[#e0ecf4]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#082b3d] mb-1">Interaction Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('In-Person')}
                className={`flex-1 p-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 ${
                  mode === 'In-Person'
                    ? 'bg-[#0e5d84] text-white border-[#0e5d84]'
                    : 'bg-[#f0f7fb] border-[#cbe0ec] text-[#082b3d]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">meeting_room</span>
                <span>In-Person (Room 304)</span>
              </button>
              <button
                onClick={() => setMode('Google Meet')}
                className={`flex-1 p-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 ${
                  mode === 'Google Meet'
                    ? 'bg-[#0e5d84] text-white border-[#0e5d84]'
                    : 'bg-[#f0f7fb] border-[#cbe0ec] text-[#082b3d]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">video_call</span>
                <span>Google Meet</span>
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">verified</span>
            <span>Appointment confirmed instantly. Calendar invite sent to father's registered email.</span>
          </div>
        </div>

        <div className="p-3 bg-[#f0f7fb] border-t border-[#cbe0ec] flex justify-end gap-2">
          <button
            onClick={() => setPtmModalOpen(false)}
            className="px-3 py-1.5 text-xs text-[#464555] hover:text-[#082b3d] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setPtmModalOpen(false);
              addToast(`PTM Booked with ${selectedTeacher}`, 'success', `Confirmed for ${slot} (${mode}).`);
            }}
            className="px-4 py-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Confirm Appointment
          </button>
        </div>
      </div>
    </div>
  );
};
