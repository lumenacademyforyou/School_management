import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const ParentPTMView: React.FC = () => {
  const { addToast } = useApp();
  const [selectedSlot, setSelectedSlot] = useState<string | null>('04:30 PM');
  const [booked, setBooked] = useState(false);

  const mentors = [
    { name: 'Mrs. Malini Iyer', subject: 'Class Mentor & PGT Physics', slots: ['04:00 PM', '04:30 PM', '05:00 PM'], room: 'Physics Lab 02' },
    { name: 'Dr. V. Raghavan', subject: 'HOD Mathematics', slots: ['03:30 PM', '04:00 PM', '05:30 PM'], room: 'Maths Department' },
    { name: 'Ms. Clara D’Souza', subject: 'TGT English Literature', slots: ['04:15 PM', '04:45 PM'], room: 'Language Room 102' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">handshake</span>
            <span>Parent-Teacher Academic Consultations</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Pre-Board Review PTM Bookings
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Friday, 28 February 2025 • Hybrid Mode (Campus In-Person or Google Meet)
          </p>
        </div>

        {booked && (
          <button
            onClick={() => addToast('Launching encrypted Google Meet video room for PTM', 'info')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">video_camera_front</span>
            <span>Join Google Meet (04:30 PM)</span>
          </button>
        )}
      </div>

      {/* Teachers Consultation Slots */}
      <div className="space-y-4">
        {mentors.map(m => (
          <div key={m.name} className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f0f7fb] pb-3">
              <div>
                <div className="font-bold text-sm text-[#082b3d]">{m.name}</div>
                <div className="text-xs text-[#464555]">{m.subject} • Venue: {m.room}</div>
              </div>
              <span className="text-xs text-[#0e5d84] font-semibold bg-[#f0f7fb] px-2.5 py-1 rounded-full">
                15 Mins One-on-One
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#082b3d] mb-2">Select Preferred Consultation Slot:</label>
              <div className="flex flex-wrap gap-2">
                {m.slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setBooked(true);
                      addToast(`PTM Slot booked with ${m.name} at ${slot} (Google Meet link dispatched)`, 'success');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedSlot === slot && booked
                        ? 'bg-[#0e5d84] text-white border-[#0e5d84]'
                        : 'bg-[#f0f7fb] text-[#0e5d84] border-[#cbe0ec] hover:bg-[#e0ecf4]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
