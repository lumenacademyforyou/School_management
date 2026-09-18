import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const HostelView: React.FC = () => {
  const { addToast } = useApp();
  const [selectedBlock, setSelectedBlock] = useState('Godavari');
  const [showCurfewAuditModal, setShowCurfewAuditModal] = useState(false);
  const [showOutingPassModal, setShowOutingPassModal] = useState(false);

  // Form state for Outing Pass
  const [outingStudent, setOutingStudent] = useState('Aarav S. Ramanathan');
  const [outingDestination, setOutingDestination] = useState('Local Guardian Residence (Adyar)');
  const [outingReturnTime, setOutingReturnTime] = useState('18:00 Sunday');

  const blocks = [
    { name: 'Godavari Hall', type: 'Senior Boys (Grades 9-12)', rooms: 64, capacity: 128, occupied: 124, curfewStatus: '100% Present' },
    { name: 'Kaveri Hall', type: 'Senior Girls (Grades 9-12)', rooms: 64, capacity: 128, occupied: 126, curfewStatus: '100% Present' },
    { name: 'Yamuna Hall', type: 'Junior Boys (Grades 5-8)', rooms: 48, capacity: 96, occupied: 90, curfewStatus: '100% Present' },
    { name: 'Ganga Hall', type: 'Junior Girls (Grades 5-8)', rooms: 48, capacity: 96, occupied: 88, curfewStatus: '100% Present' },
  ];

  const handleExportBoardingRegister = () => {
    const csvContent = [
      'Hall Name,Category,Total Rooms,Capacity,Occupancy,Curfew Status,Warden In Charge',
      'Godavari Hall,Senior Boys (9-12),64,128,124,100% Present,Mr. S. Balamurugan',
      'Kaveri Hall,Senior Girls (9-12),64,128,126,100% Present,Dr. Radhika Krishnan',
      'Yamuna Hall,Junior Boys (5-8),48,96,90,100% Present,Mr. K. Narayanan',
      'Ganga Hall,Junior Girls (5-8),48,96,88,100% Present,Mrs. Mary Varghese',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Hostel_Boarding_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Central Boarding & Occupancy Register (CSV)', 'success');
  };

  const handleIssueOutingPass = (e: React.FormEvent) => {
    e.preventDefault();
    setShowOutingPassModal(false);
    addToast(`Approved & generated QR Outing Gatepass for ${outingStudent} until ${outingReturnTime} (HST-014)`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">night_shelter</span>
            <span>Residential Campus & Boarding Affairs (HST-001..020)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            Hostel Operations & 21:00 Curfew Command
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            4 Halls of Residence • 428 Resident Scholars • Automated RFID Turnstile Curfew Audit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportBoardingRegister}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Register</span>
          </button>
          <button
            onClick={() => setShowOutingPassModal(true)}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>Issue Outing Pass</span>
          </button>
          <button
            onClick={() => setShowCurfewAuditModal(true)}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">lock_clock</span>
            <span>Audit Curfew Roll</span>
          </button>
        </div>
      </div>

      {/* 4 Residential Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {blocks.map(b => (
          <div
            key={b.name}
            onClick={() => setSelectedBlock(b.name.split(' ')[0])}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedBlock === b.name.split(' ')[0]
                ? 'bg-subtle border-brand ring-1 ring-brand'
                : 'bg-white border-line-soft hover:border-line'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="font-semibold uppercase tracking-wider text-[10px]">{b.type}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-base font-bold text-ink mt-1">{b.name}</div>
            <div className="text-xs text-ink-soft mt-1 flex justify-between">
              <span>Occupancy: {b.occupied} / {b.capacity}</span>
              <span className="font-semibold text-emerald-700">{b.curfewStatus}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Room #204 Dossier & Resident Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-base">meeting_room</span>
              <span>{selectedBlock} Hall • Room #204 (Air-Cooled Twin)</span>
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
              2/2 Resident Allotted
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-subtle rounded-xl border border-line space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                  alt="Aarav"
                  className="w-10 h-10 rounded-full object-cover border border-brand"
                />
                <div>
                  <div className="text-xs font-bold text-ink">Aarav S. Ramanathan</div>
                  <div className="text-[11px] text-ink-soft">Bed 204-A • Class 10-A</div>
                </div>
              </div>
              <div className="text-[11px] text-ink-soft space-y-0.5 border-t border-line pt-2">
                <div>Curfew Gate In: <strong className="text-emerald-700">19:42 PM (Dinner cleared)</strong></div>
                <div>Weekly Outing: Sunday Approved (Dr. Radhika)</div>
              </div>
            </div>

            <div className="p-4 bg-subtle rounded-xl border border-line space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                  alt="Chetan"
                  className="w-10 h-10 rounded-full object-cover border border-line"
                />
                <div>
                  <div className="text-xs font-bold text-ink">Chetan R. Varma</div>
                  <div className="text-[11px] text-ink-soft">Bed 204-B • Class 10-A</div>
                </div>
              </div>
              <div className="text-[11px] text-ink-soft space-y-0.5 border-t border-line pt-2">
                <div>Curfew Gate In: <strong className="text-amber-700">Sickbay Medical Leave</strong></div>
                <div>Weekly Outing: Medical Rest Required</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dining Telemetry & Warden Notes */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-base">restaurant</span>
            <span>Central Mess Headcount</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span>Breakfast (Idli / Pongal / Milk)</span>
              <span className="font-bold text-emerald-700">421 / 428 Served</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span>Lunch (Rice, Sambhar, Poriyal, Curd)</span>
              <span className="font-bold text-emerald-700">428 / 428 Served</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span>Dinner (Roti, Dal Tadka, Kheer)</span>
              <span className="font-bold text-brand">Commences 19:30 PM</span>
            </div>
          </div>

          <div className="p-3 bg-subtle border border-line rounded-xl text-[11px] text-ink">
            <strong>Senior Warden Note:</strong> Resident study hours observed strictly 21:15 to 23:00. High-speed campus Wi-Fi throttles gaming traffic after 22:30.
          </div>
        </div>
      </div>

      {/* MODAL 1: Curfew Audit Modal */}
      {showCurfewAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">lock_clock</span>
                <h3 className="font-bold text-ink text-sm">21:00 Curfew Biometric Audit Report</h3>
              </div>
              <button
                onClick={() => setShowCurfewAuditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-xl font-bold font-mono text-emerald-800">426</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">In Rooms / Mess</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-xl font-bold font-mono text-amber-800">2</div>
                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Infirmary (Monitored)</div>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
                <div className="text-xl font-bold font-mono text-slate-800">0</div>
                <div className="text-[10px] text-slate-600 font-semibold mt-0.5">Unaccounted For</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
              ✓ All 4 residential block perimeter turnstiles locked at 21:00. CCTV perimeter sensors active. Zero unauthorized exits detected.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowCurfewAuditModal(false)}
                className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs"
              >
                Close Audit Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Issue Outing Pass Modal */}
      {showOutingPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">badge</span>
                <h3 className="font-bold text-ink text-sm">Issue Weekend Outing Gatepass (HST-014)</h3>
              </div>
              <button
                onClick={() => setShowOutingPassModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleIssueOutingPass} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Scholar Name & Room</label>
                <select
                  value={outingStudent}
                  onChange={e => setOutingStudent(e.target.value)}
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option value="Aarav S. Ramanathan">Aarav S. Ramanathan (Godavari Room 204-A)</option>
                  <option value="Farah N. Siddiqui">Farah N. Siddiqui (Kaveri Room 102-B)</option>
                  <option value="Rohan Venkatesh">Rohan Venkatesh (Godavari Room 301-A)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination & Escort</label>
                <input
                  type="text"
                  value={outingDestination}
                  onChange={e => setOutingDestination(e.target.value)}
                  placeholder="e.g., Local Guardian Residence (Adyar)"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory Return Deadline</label>
                <input
                  type="text"
                  value={outingReturnTime}
                  onChange={e => setOutingReturnTime(e.target.value)}
                  placeholder="18:00 Sunday"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowOutingPassModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Authorize Gatepass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
