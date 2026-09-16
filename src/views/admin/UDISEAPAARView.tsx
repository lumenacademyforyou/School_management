import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface DcfSection {
  sec: string;
  name: string;
  status: string;
  error: number;
  fields: { name: string; value: string; rule: string }[];
}

export const UDISEAPAARView: React.FC = () => {
  const { addToast } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<DcfSection | null>(null);
  const [showApaarCardModal, setShowApaarCardModal] = useState(false);

  const sections: DcfSection[] = [
    {
      sec: 'Section 1A',
      name: 'School Profile & Location Coordinates',
      status: 'Completed (41/41 fields)',
      error: 0,
      fields: [
        { name: 'School Name', value: 'Lumen Academy Senior Secondary School', rule: 'MoE Reg #33020701402' },
        { name: 'Latitude & Longitude', value: '12.9815° N, 80.2180° E', rule: 'GPS Geofenced' },
        { name: 'School Category', value: 'Higher Secondary with Grades 1 to 12', rule: 'CBSE Affiliation #1930412' },
        { name: 'Medium of Instruction', value: 'English (Primary), Hindi/Tamil (Secondary)', rule: 'Schedule VIII Language' },
      ],
    },
    {
      sec: 'Section 1B',
      name: 'Physical Facilities & Equipment',
      status: 'Completed (52/52 fields)',
      error: 0,
      fields: [
        { name: 'Total Pucca Classrooms', value: '48 Rooms', rule: 'Fire Safety NOC #FS-2024-912' },
        { name: 'CWSN Functional Toilets', value: '8 Dedicated Units with Grab Rails', rule: 'RPwD Act 2016 Compliant' },
        { name: 'Solar Energy Inverter Capacity', value: '25 kW On-Grid Rooftop Array', rule: 'Green Campus Initiative' },
        { name: 'Rainwater Harvesting Pit', value: 'Functional (200,000 Liters Capacity)', rule: 'Jal Shakti Abhiyan Verified' },
      ],
    },
    {
      sec: 'Section 2',
      name: 'Teaching & Non-Teaching Staff Roster',
      status: 'Completed (184/184 staff)',
      error: 0,
      fields: [
        { name: 'Trained Graduate Teachers (TGT)', value: '64 Staff (100% B.Ed / CTET Certified)', rule: 'NCTE Guidelines' },
        { name: 'Post Graduate Teachers (PGT)', value: '42 Staff (Master Degree in Discipline)', rule: 'CBSE Norms' },
        { name: 'Special Educator on Payroll', value: '2 Dedicated RCI Registered Professionals', rule: 'RPwD Act 2016' },
      ],
    },
    {
      sec: 'Section 3',
      name: 'Student Enrollment & Social Category',
      status: 'Completed (2,450/2,450)',
      error: 0,
      fields: [
        { name: 'Total Active Enrolled Students', value: '2,450 (1,240 Boys, 1,210 Girls)', rule: '100% Aadhaar Verified' },
        { name: 'RTE 25% EWS Enrolled', value: '180 Students with Zero Tuition Escrow', rule: 'RTE Act Section 12(1)(c)' },
        { name: 'APAAR 12-Digit ID Generated', value: '2,450 of 2,450 Students', rule: 'DigiLocker NAD Seeded' },
      ],
    },
    {
      sec: 'Section 4',
      name: 'Incentives & Facilities provided to CWSN',
      status: 'Completed (100%)',
      error: 0,
      fields: [
        { name: 'Braille Textbooks & Large Font', value: 'Supplied for 12 Vision-Impaired Scholars', rule: 'NCERT Braille Press' },
        { name: 'Tactile Paving & Ramp Incline', value: '1:12 Barrier-Free Ramp to all Floors', rule: 'Accessible India Campaign' },
      ],
    },
  ];

  const handleExportJson = () => {
    const dcfPackage = {
      udiseCode: '33020701402',
      schoolName: 'Lumen Academy Senior Secondary School',
      academicYear: '2025-2026',
      exportTimestamp: new Date().toISOString(),
      verifiedDcfSections: sections.map(s => ({
        sectionCode: s.sec,
        title: s.name,
        fields: s.fields,
      })),
      digitalCertificate: 'SHA256:7b9104fae1098234deca5521e4590abc12345678',
    };

    const blob = new Blob([JSON.stringify(dcfPackage, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `UDISE_PLUS_DCF_Submission_${dcfPackage.udiseCode}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded UDISE+ Official DCF JSON Submission Package (UDI-002)', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>Ministry of Education National Portal (UDI-001..010)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            UDISE+ & APAAR "One Nation, One Student ID" Sync
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            School UDISE Code: <strong>33020701402</strong> • 12-Digit APAAR IDs 100% Seeded • DCF Validation Cleared
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Download DCF JSON</span>
          </button>
          <button
            onClick={() => setShowApaarCardModal(true)}
            className="flex items-center gap-1.5 bg-[#f0f7fb] hover:bg-[#bae6fd] text-[#082b3d] border border-[#cbe0ec] text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>View APAAR Smart Card</span>
          </button>
          <button
            onClick={() => {
              setSyncing(true);
              setTimeout(() => {
                setSyncing(false);
                addToast('2,450 APAAR Student Records successfully synced with National Academic Depository (NAD)', 'success');
              }, 1000);
            }}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{syncing ? 'sync' : 'cloud_sync'}</span>
            <span>{syncing ? 'Connecting to MoE API...' : 'Sync with National Portal'}</span>
          </button>
        </div>
      </div>

      {/* APAAR ID Spotlight Card */}
      <div className="bg-[#082b3d] text-white p-5 rounded-2xl border border-[#213145] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b]">
            <span className="material-symbols-outlined text-2xl">id_card</span>
          </div>
          <div>
            <div className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider">Active Verified Sample</div>
            <div className="text-base font-bold text-white mt-0.5">Aarav S. Ramanathan • Class 10-A</div>
            <div className="font-mono text-sm text-[#cbd5e1] mt-0.5">
              APAAR ID: <strong className="text-white">9840-1284-9012</strong> • PEN: 20241094821
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowApaarCardModal(true)}
          className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold px-3 py-2 rounded-xl font-mono text-center transition-colors flex items-center gap-1.5 justify-center"
        >
          <span className="material-symbols-outlined text-xs">verified</span>
          <span>NAD / ABC LINKED (VIEW CARD)</span>
        </button>
      </div>

      {/* UDISE+ Data Capture Format (DCF) Checklist */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
          <span className="text-xs font-bold text-[#082b3d]">UDISE+ 2025–26 Data Capture Format (DCF) Sections</span>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
            100% ERROR-FREE
          </span>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-[#f0f7fb]/60 text-[#464555] font-semibold border-b border-[#cbe0ec]">
            <tr>
              <th className="p-3">DCF Section Code</th>
              <th className="p-3">Section Description</th>
              <th className="p-3">Validation Status</th>
              <th className="p-3 text-right">Data Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f7fb]">
            {sections.map(s => (
              <tr key={s.sec} className="hover:bg-[#f8f9ff]">
                <td className="p-3 font-mono font-bold text-[#0e5d84]">{s.sec}</td>
                <td className="p-3 font-bold text-[#082b3d]">{s.name}</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {s.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedSection(s)}
                    className="text-[#0e5d84] font-semibold hover:underline flex items-center gap-1 ml-auto"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    <span>View Fields ({s.fields.length})</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: View DCF Fields */}
      {selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#0e5d84] uppercase font-mono">{selectedSection.sec}</span>
                <h3 className="font-bold text-[#082b3d] text-sm">{selectedSection.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSection(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2">
              {selectedSection.fields.map((f, idx) => (
                <div key={idx} className="p-3 bg-[#f0f7fb]/60 border border-[#cbe0ec] rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-[#082b3d]">
                    <span>{f.name}</span>
                    <span className="text-emerald-700 text-[10px]">Verified</span>
                  </div>
                  <div className="text-slate-800 font-semibold">{f.value}</div>
                  <div className="text-[10px] text-[#777587] font-mono">{f.rule}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSelectedSection(null)}
                className="px-4 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white font-bold rounded-xl text-xs"
              >
                Close Audit Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APAAR Smart Card Print */}
      {showApaarCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e5d84]">badge</span>
                <h3 className="font-bold text-[#082b3d] text-sm">APAAR National ID Card</h3>
              </div>
              <button
                onClick={() => setShowApaarCardModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Smart Card Visual */}
            <div className="bg-linear-to-br from-[#082b3d] to-[#1e3a8a] text-white p-5 rounded-2xl border border-blue-400/30 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-[#f59e0b] font-bold">Government of India</div>
                  <div className="text-xs font-bold text-white">Ministry of Education • APAAR</div>
                </div>
                <div className="text-right text-[9px] font-mono text-[#cbd5e1]">
                  ONE NATION ONE ID
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-20 bg-slate-200 rounded-lg overflow-hidden border border-white/30 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=250&fit=crop"
                    alt="Student Photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">Aarav S. Ramanathan</div>
                  <div className="text-[11px] text-slate-300">DOB: 14 Oct 2009 • Gender: Male</div>
                  <div className="text-[11px] text-slate-300">School: Lumen Academy Sr. Sec. School</div>
                  <div className="text-[11px] text-[#f59e0b] font-mono font-bold">PEN: 20241094821</div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">APAAR ID</div>
                  <div className="text-base font-mono font-bold tracking-wider text-white">
                    9840-1284-9012
                  </div>
                </div>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=APAAR:984012849012"
                  alt="QR"
                  className="w-12 h-12 bg-white p-0.5 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  addToast('Dispatched APAAR Smart Card print job', 'success');
                }}
                className="px-4 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">print</span>
                <span>Print Plastic PVC Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
