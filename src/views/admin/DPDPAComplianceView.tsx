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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">gavel</span>
            <span>Statutory Privacy & Child Data Protection (CNS-001..020)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            DPDPA 2023 Section 9 Minor Consent Governance
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Data Protection Officer (DPO): Adv. S. Venkataraman • Verifiable Parental Consent (VPC) • Zero-Ad Policy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSarModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">assignment_return</span>
            <span>Log SAR Request</span>
          </button>
          <button
            onClick={handleDownloadDpoDossier}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
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
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Data Retention Cycle</div>
          <div className="text-2xl font-bold font-display text-ink mt-0.5">30 Days</div>
          <div className="text-[11px] text-ink-soft">Auto-purge for CCTV & logs</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Targeted Advertising</div>
          <div className="text-2xl font-bold font-display text-rose-700 mt-0.5">0% BANNED</div>
          <div className="text-[11px] text-ink-soft">Strict DPDPA compliance</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Data Subject Requests (SAR)</div>
          <div className="text-2xl font-bold font-display text-brand mt-0.5">0 Pending</div>
          <div className="text-[11px] text-emerald-700 font-semibold">Average SLA: 4 hours</div>
        </div>
      </div>

      {/* Purpose Specific Consent Table */}
      <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
        <div className="p-4 bg-subtle border-b border-line flex items-center justify-between">
          <span className="text-xs font-bold text-ink">Purpose-Specific Parental Consent Ledger</span>
          <span className="text-xs font-mono text-brand">Cryptographically Hashed & Immutable</span>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-subtle/60 text-ink-soft font-semibold border-b border-line">
            <tr>
              <th className="p-3">Processing Purpose</th>
              <th className="p-3">Statutory Legal Basis</th>
              <th className="p-3">Current Status</th>
              <th className="p-3">Audit Frequency</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {consents.map(c => (
              <tr key={c.purpose} className="hover:bg-wash">
                <td className="p-3 font-bold text-ink">{c.purpose}</td>
                <td className="p-3 text-ink-soft">{c.legalBasis}</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {c.status}
                  </span>
                </td>
                <td className="p-3 text-ink-soft">{c.lastAudit}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedConsentForLogs(c)}
                    className="text-brand font-semibold hover:underline"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">receipt_long</span>
                <h3 className="font-bold text-ink text-sm">Consent Ledger Immutable Audit</h3>
              </div>
              <button
                onClick={() => setSelectedConsentForLogs(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-ink">{selectedConsentForLogs.purpose}</div>
              <div className="text-[11px] text-ink-muted">Basis: {selectedConsentForLogs.legalBasis}</div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-ink">Recent Verifiable Consent Entries</div>
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
                className="px-4 py-2 bg-brand text-white font-bold rounded-xl text-xs"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Subject Access Request */}
      {showSarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">assignment_return</span>
                <h3 className="font-bold text-ink text-sm">Log Data Subject Request (DPDPA Sec 11)</h3>
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
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
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
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
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
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
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
