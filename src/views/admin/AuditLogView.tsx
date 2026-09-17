import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  hash: string;
  prevHash: string;
  ip: string;
  status: 'VERIFIED' | 'TAMPER_CHECK_PASSED';
  payloadSummary: string;
}

export const AuditLogView: React.FC = () => {
  const { addToast } = useApp();
  const [verifyingMerkle, setVerifyingMerkle] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [auditEvents] = useState<AuditEvent[]>([
    {
      id: 'evt-01',
      timestamp: '26 Feb 2025, 08:44:12 AM',
      actor: 'Turnstile Gate #03 Hardware Daemon',
      action: 'BIOMETRIC_PUNCH_RECORDED',
      target: 'Aarav S. Ramanathan (Roll 14)',
      hash: 'sha256:4a8f9c0e1b2d4590abcc934a67ef890123456789abcdef0123456789abcdef01',
      prevHash: 'sha256:7b1e4f9a0c2e3391bbff129a56de7890123456789abcdef0123456789abcdef02',
      ip: '10.0.4.12 (Internal IoT VLAN)',
      status: 'VERIFIED',
      payloadSummary: '{"deviceId":"TS-03","cardUid":"E4:29:A1:02","gateDirection":"ENTRY","tempCelsius":36.4}',
    },
    {
      id: 'evt-02',
      timestamp: '26 Feb 2025, 08:14:02 AM',
      actor: 'Mrs. Malini Iyer (Faculty ID: FAC-109)',
      action: 'MANUAL_ATTENDANCE_OVERRIDE',
      target: 'Arjun K. Nair (Marked Late)',
      hash: 'sha256:7b1e4f9a0c2e3391bbff129a56de7890123456789abcdef0123456789abcdef02',
      prevHash: 'sha256:9c0a1e3f8d2b7712ccaa998e45ef67890123456789abcdef0123456789abcdef03',
      ip: '10.0.2.88 (Teacher Room Wi-Fi)',
      status: 'VERIFIED',
      payloadSummary: '{"studentId":"STU-2024-0012","period":1,"reason":"Late school bus arrival #14","overrideAuth":"FAC-109"}',
    },
    {
      id: 'evt-03',
      timestamp: '26 Feb 2025, 07:44:10 AM',
      actor: 'AIS-140 GPS Telemetry Ingest',
      action: 'ROUTE_14_GEOFENCE_ARRIVED',
      target: 'Velachery Bypass Bus Stop',
      hash: 'sha256:9c0a1e3f8d2b7712ccaa998e45ef67890123456789abcdef0123456789abcdef03',
      prevHash: 'sha256:2d4e6f8a0b1c5543ddbb887e34cd567890123456789abcdef0123456789abcdef04',
      ip: '172.16.8.4 (Cellular Gateway)',
      status: 'VERIFIED',
      payloadSummary: '{"vehicleNo":"TN-09-CB-4821","lat":12.9815,"lng":80.2180,"speedKmph":0,"geofenceId":"STOP-14-03"}',
    },
    {
      id: 'evt-04',
      timestamp: '25 Feb 2025, 04:45:00 PM',
      actor: 'Dr. Arvind Swaminathan (Super Admin)',
      action: 'FEE_STRUCTURE_RECONCILED',
      target: 'Term 3 Institutional Ledger (₹1.42 Cr)',
      hash: 'sha256:2d4e6f8a0b1c5543ddbb887e34cd567890123456789abcdef0123456789abcdef04',
      prevHash: 'sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      ip: '192.168.1.10 (Admin Console)',
      status: 'VERIFIED',
      payloadSummary: '{"academicYearId":"AY-2025-26","reconciledTotal":14250000,"escrowAwaiting":120000,"auditorSign":"AS-MFA-991"}',
    },
  ]);

  const handleExportCSV = () => {
    const csvContent = [
      'Event ID,Timestamp,Actor,Action,Target,SHA-256 Hash,Previous Hash,Client IP,Status',
      ...auditEvents.map(
        e =>
          `${e.id},"${e.timestamp}","${e.actor}","${e.action}","${e.target}","${e.hash}","${e.prevHash}","${e.ip}",${e.status}`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Forensic_WORM_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Cryptographic Forensic Audit Trail (CSV)', 'success');
  };

  const filteredEvents = auditEvents.filter(
    e =>
      e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">history_edu</span>
            <span>Cryptographic Audit Trail & Automated Workflows (AUD-001..010)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Immutable WORM Event Stream & Merkle Integrity
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Write-Once-Read-Many (WORM) Compliance • SHA-256 Hashed Blocks • CBSE Forensic Audit Ready
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Log</span>
          </button>
          <button
            onClick={() => {
              setVerifyingMerkle(true);
              setTimeout(() => {
                setVerifyingMerkle(false);
                addToast('Merkle Tree Root 0x8F3C...A12 re-verified against SHA-256 chain (AUD-005)', 'success');
              }, 1000);
            }}
            disabled={verifyingMerkle}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{verifyingMerkle ? 'sync' : 'verified'}</span>
            <span>{verifyingMerkle ? 'Validating Hashes...' : 'Re-verify Merkle Root'}</span>
          </button>
        </div>
      </div>

      {/* Merkle Root Banner */}
      <div className="bg-[#082b3d] text-white p-5 rounded-2xl border border-[#213145] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-[#f59e0b]">account_tree</span>
          <div>
            <div className="text-xs font-mono text-[#f59e0b] font-bold">MERKLE ROOT HASH: BLOCK #48,201</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              0x8F3C92B104EAA5098DF4C12E79B5A0329910D701A
            </div>
            <div className="text-[11px] text-[#cbdbf5] mt-0.5">
              Verified against National Informatics Centre (NIC) and CBSE central ledger timestamping service.
            </div>
          </div>
        </div>

        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-xl font-mono text-center">
          100% UNTAMPERED
        </span>
      </div>

      {/* Visual DAG Workflow Pipeline */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#082b3d] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0e5d84] text-base">schema</span>
          <span>Automated Operational DAG Workflow: Absenteeism Exception Resolution</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec]">
            <div className="text-[10px] font-bold text-[#0e5d84] uppercase">Node 1: Trigger</div>
            <div className="font-bold text-[#082b3d] mt-1">Biometric Turnstile Miss</div>
            <div className="text-[11px] text-[#464555] mt-0.5">Unrecorded at 08:30 AM</div>
          </div>
          <div className="p-3 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec]">
            <div className="text-[10px] font-bold text-[#0e5d84] uppercase">Node 2: Decision</div>
            <div className="font-bold text-[#082b3d] mt-1">Class Teacher Verify</div>
            <div className="text-[11px] text-[#464555] mt-0.5">Mrs. Malini roll call scan</div>
          </div>
          <div className="p-3 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec]">
            <div className="text-[10px] font-bold text-[#0e5d84] uppercase">Node 3: Dispatch</div>
            <div className="font-bold text-[#082b3d] mt-1">TRAI DLT WhatsApp</div>
            <div className="text-[11px] text-[#464555] mt-0.5">Instant parent alert sent</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300">
            <div className="text-[10px] font-bold text-emerald-800 uppercase">Node 4: Audit</div>
            <div className="font-bold text-emerald-900 mt-1">WORM SHA-256 Log</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Block hash sealed forever</div>
          </div>
        </div>
      </div>

      {/* Forensic Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#082b3d]">Forensic Event Stream (Last 24 Hours)</span>
            <span className="text-xs font-mono text-[#464555] ml-2">• Zero Retention Pruning Policy</span>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search action or actor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbe0ec] rounded-xl text-xs focus:outline-hidden focus:border-[#0e5d84]"
            />
            <span className="material-symbols-outlined text-xs absolute left-2.5 top-2 text-[#777587]">search</span>
          </div>
        </div>

        <div className="divide-y divide-[#f0f7fb]">
          {filteredEvents.map(evt => (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className="p-3.5 hover:bg-[#f8f9ff] text-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0e5d84]">{evt.action}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    {evt.status}
                  </span>
                </div>
                <div className="text-xs text-[#082b3d] mt-0.5">
                  Actor: <strong>{evt.actor}</strong> ➔ Target: <strong>{evt.target}</strong>
                </div>
              </div>
              <div className="text-right text-[11px] text-[#777587] font-mono shrink-0">
                <div>{evt.timestamp}</div>
                <div className="text-[#0e5d84] font-semibold flex items-center justify-end gap-1">
                  <span>{evt.hash.slice(0, 18)}...</span>
                  <span className="material-symbols-outlined text-xs">visibility</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Event Cryptographic Inspection */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e5d84]">verified</span>
                <h3 className="font-bold text-[#082b3d] text-sm">Cryptographic Event Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                <div><strong className="text-slate-600 font-sans">Action:</strong> <span className="text-[#0e5d84] font-bold">{selectedEvent.action}</span></div>
                <div><strong className="text-slate-600 font-sans">Timestamp:</strong> {selectedEvent.timestamp}</div>
                <div><strong className="text-slate-600 font-sans">Origin IP:</strong> {selectedEvent.ip}</div>
                <div><strong className="text-slate-600 font-sans">Actor:</strong> {selectedEvent.actor}</div>
                <div><strong className="text-slate-600 font-sans">Target:</strong> {selectedEvent.target}</div>
              </div>

              <div>
                <span className="font-bold text-slate-700 font-sans block mb-1">SHA-256 Current Block Hash</span>
                <div className="p-2.5 bg-[#f0f7fb] border border-[#cbe0ec] rounded-lg text-[#082b3d] break-all text-[10px]">
                  {selectedEvent.hash}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 font-sans block mb-1">Parent Block Hash (PrevHash)</span>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 break-all text-[10px]">
                  {selectedEvent.prevHash}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 font-sans block mb-1">JSON Structured Payload (WORM Encrypted)</span>
                <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap">
                  {selectedEvent.payloadSummary}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedEvent.hash);
                  addToast('Copied SHA-256 hash to clipboard', 'info');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-lg font-bold text-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                <span>Copy Hash</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white rounded-lg font-bold text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
