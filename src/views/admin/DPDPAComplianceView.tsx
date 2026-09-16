import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface ConsentRecord {
  purpose: string;
  legalBasis: string;
  status: string;
  lastAudit: string;
}

export const DPDPAComplianceView: React.FC = () => {
  const { addToast } = useApp();
  const [selectedConsentForLogs, setSelectedConsentForLogs] = useState<ConsentRecord | null>(null);
  const [showSarModal, setShowSarModal] = useState(false);

  // SAR Form
  const [sarStudent, setSarStudent] = useState('Aarav S. Ramanathan');
  const [sarType, setSarType] = useState('Access / Export Data');

  const consents: ConsentRecord[] = [
    { purpose: 'Facial & Biometric Turnstile Hardware Sync', legalBasis: 'Explicit Parental Consent (DPDPA Sec 9)', status: 'Active (100% Signed)', lastAudit: '15 Jan 2025' },
    { purpose: 'Live AIS-140 GPS Route & Seat Geofencing', legalBasis: 'Public Safety & Transit Protocol', status: 'Active (100% Signed)', lastAudit: '12 Jan 2025' },
    { purpose: 'National DigiLocker & APAAR ID Synchronization', legalBasis: 'Ministry of Education Directive', status: 'Active (100% Signed)', lastAudit: '20 Jan 2025' },
    { purpose: 'Campus CCTV Video Retention (30 Days Cycle)', legalBasis: 'Physical Security & POCSO Norms', status: 'WORM Auto-Purged', lastAudit: 'Daily at 00:00' },
  ];

  const handleDownloadDpoDossier = () => {
    const reportText = `================================================================================
LUMEN ACADEMY SENIOR SECONDARY SCHOOL
DPDPA 2023 & POCSO STATUTORY DATA PROTECTION AUDIT DOSSIER
================================================================================
Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Data Protection Officer: Adv. S. Venkataraman (Bar Council Roll #TN-10482/14)
Affiliation: CBSE Affiliation #1930412 | UDISE Code: 33020701402

1. SECTION 9 (PROCESSING OF PERSONAL DATA OF CHILDREN):
- Verifiable Parental Consent (VPC): 2,450 of 2,450 enrolled minor scholars covered.
- Consent Collection Channel: Aadhaar-based OTP verification & physical signed bond.
- Student Profiling / Behavioral Tracking / Targeted Ads: STRICTLY 0% (ENFORCED).
- Data Localization: All primary & backup data stored in Indian data centers (Mumbai).

2. CONSENT LEDGER AUDIT TRAILS:
- Biometric Turnstiles: Explicit consent verified. WORM-hashed template storage.
- AIS-140 Transit GPS: Explicit parental opt-in for live tracking.
- DigiLocker Academic Certificates: Ministry of Education APAAR consent compliant.
- CCTV 30-Day FIFO Retention: Auto-purged after 30 days pursuant to DPDPA Section 8(7).

3. DATA SUBJECT ACCESS & ERASURE REQUESTS:
- Outstanding / Pending Requests: 0
- Resolved this financial quarter: 3 (Data export requests fulfilled in < 24 hours).
================================================================================
DIGITALLY SIGNED & NOTARIZED: Adv. S. Venkataraman, Institutional DPO`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DPDPA_DPO_Audit_Dossier_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded Official DPDPA Statutory Compliance Audit Dossier', 'success');
  };

  const handleSubmitSar = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSarModal(false);
    addToast(`Logged statutory Data Subject Request (${sarType}) for ${sarStudent}. SLA: 48 hours.`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">gavel</span>
            <span>Statutory Privacy & Child Data Protection (CNS-001..020)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            DPDPA 2023 Section 9 Minor Consent Governance
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Data Protection Officer (DPO): Adv. S. Venkataraman • Verifiable Parental Consent (VPC) • Zero-Ad Policy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSarModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">assignment_return</span>
            <span>Log SAR Request</span>
          </button>
          <button
            onClick={handleDownloadDpoDossier}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Download DPO Audit Dossier</span>
          </button>
        </div>
      </div>

      {/* Compliance Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-800">Verifiable Parental Consent</div>
          <div className="text-2xl font-bold font-display text-emerald-900 mt-0.5">100%</div>
          <div className="text-[11px] text-emerald-700 font-semibold">2,450 / 2,450 Verified</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e0ecf4] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#777587]">Data Retention Cycle</div>
          <div className="text-2xl font-bold font-display text-[#082b3d] mt-0.5">30 Days</div>
          <div className="text-[11px] text-[#464555]">Auto-purge for CCTV & logs</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e0ecf4] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#777587]">Targeted Advertising</div>
          <div className="text-2xl font-bold font-display text-rose-700 mt-0.5">0% BANNED</div>
          <div className="text-[11px] text-[#464555]">Strict DPDPA compliance</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e0ecf4] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#777587]">Data Subject Requests (SAR)</div>
          <div className="text-2xl font-bold font-display text-[#0e5d84] mt-0.5">0 Pending</div>
          <div className="text-[11px] text-emerald-700 font-semibold">Average SLA: 4 hours</div>
        </div>
      </div>

      {/* Purpose Specific Consent Table */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
          <span className="text-xs font-bold text-[#082b3d]">Purpose-Specific Parental Consent Ledger</span>
          <span className="text-xs font-mono text-[#0e5d84]">Cryptographically Hashed & Immutable</span>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-[#f0f7fb]/60 text-[#464555] font-semibold border-b border-[#cbe0ec]">
            <tr>
              <th className="p-3">Processing Purpose</th>
              <th className="p-3">Statutory Legal Basis</th>
              <th className="p-3">Current Status</th>
              <th className="p-3">Audit Frequency</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f7fb]">
            {consents.map(c => (
              <tr key={c.purpose} className="hover:bg-[#f8f9ff]">
                <td className="p-3 font-bold text-[#082b3d]">{c.purpose}</td>
                <td className="p-3 text-[#464555]">{c.legalBasis}</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {c.status}
                  </span>
                </td>
                <td className="p-3 text-[#464555]">{c.lastAudit}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedConsentForLogs(c)}
                    className="text-[#0e5d84] font-semibold hover:underline"
                  >
                    View Logs →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Consent Ledger Details */}
      {selectedConsentForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e5d84]">receipt_long</span>
                <h3 className="font-bold text-[#082b3d] text-sm">Consent Ledger Immutable Audit</h3>
              </div>
              <button
                onClick={() => setSelectedConsentForLogs(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-[#082b3d]">{selectedConsentForLogs.purpose}</div>
              <div className="text-[11px] text-[#777587]">Basis: {selectedConsentForLogs.legalBasis}</div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-[#082b3d]">Recent Verifiable Consent Entries</div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex justify-between">
                  <span>Sundar Ramanathan (Father of Aarav S.)</span>
                  <span className="text-emerald-700">Aadhaar OTP Verified #88941</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex justify-between">
                  <span>N. Siddiqui (Father of Farah N.)</span>
                  <span className="text-emerald-700">Aadhaar OTP Verified #88939</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex justify-between">
                  <span>Venkatesh K. (Father of Rohan V.)</span>
                  <span className="text-emerald-700">Aadhaar OTP Verified #88935</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setSelectedConsentForLogs(null)}
                className="px-4 py-2 bg-[#0e5d84] text-white font-bold rounded-xl text-xs"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Subject Access Request */}
      {showSarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e5d84]">assignment_return</span>
                <h3 className="font-bold text-[#082b3d] text-sm">Log Data Subject Request (DPDPA Sec 11)</h3>
              </div>
              <button
                onClick={() => setShowSarModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitSar} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student / Data Principal</label>
                <select
                  value={sarStudent}
                  onChange={e => setSarStudent(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option value="Aarav S. Ramanathan">Aarav S. Ramanathan (Class 10-A)</option>
                  <option value="Farah N. Siddiqui">Farah N. Siddiqui (Class 10-A)</option>
                  <option value="Rohan Venkatesh">Rohan Venkatesh (Class 11-PCM)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Statutory Request Category</label>
                <select
                  value={sarType}
                  onChange={e => setSarType(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option value="Access / Export Data">Right to Access / Export Personal Data Dossier</option>
                  <option value="Correction / Update">Right to Correction & Updating of Inaccurate Records</option>
                  <option value="Erasure / Deletion">Right to Erasure (Subject to statutory CBSE retention)</option>
                  <option value="Grievance Redressal">Grievance Redressal to Data Protection Officer</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                Notice: Under DPDPA 2023, institutional response SLA is strictly within 72 business hours.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSarModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Register Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
