import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface DocumentRecord {
  id: string;
  docCode: string;
  studentOrStaffName: string;
  admissionOrEmpNo: string;
  type: 'Birth Certificate' | 'Aadhaar Card' | 'Transfer Certificate' | 'Previous Marksheet' | 'Transport Fitness NOC';
  fileSize: string;
  uploadDate: string;
  verificationStatus: 'Verified' | 'Pending Scrutiny' | 'Re-upload Requested';
  verifiedBy?: string;
  expiryDate?: string;
}

export const DocumentManagementView: React.FC = () => {
  const { addToast } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [uploadType, setUploadType] = useState<DocumentRecord['type']>('Transfer Certificate');
  const [fileName, setFileName] = useState('Scanned_Certificate.pdf');

  const [documents, setDocuments] = useState<DocumentRecord[]>([
    {
      id: 'DOC-01',
      docCode: 'DOC-2026-081',
      studentOrStaffName: 'Ananya Sundaram',
      admissionOrEmpNo: 'LMN-2026-042',
      type: 'Transfer Certificate',
      fileSize: '1.4 MB (PDF)',
      uploadDate: '2026-09-14',
      verificationStatus: 'Verified',
      verifiedBy: 'Admissions Officer (K. Ramesh)',
    },
    {
      id: 'DOC-02',
      docCode: 'DOC-2026-082',
      studentOrStaffName: 'Rohan Sharma',
      admissionOrEmpNo: 'LMN-2026-089',
      type: 'Birth Certificate',
      fileSize: '840 KB (JPG)',
      uploadDate: '2026-09-14',
      verificationStatus: 'Pending Scrutiny',
    },
    {
      id: 'DOC-03',
      docCode: 'DOC-2026-083',
      studentOrStaffName: 'Diya Krishnan',
      admissionOrEmpNo: 'LMN-2026-104',
      type: 'Aadhaar Card',
      fileSize: '620 KB (PDF)',
      uploadDate: '2026-09-15',
      verificationStatus: 'Pending Scrutiny',
    },
    {
      id: 'DOC-04',
      docCode: 'DOC-2026-084',
      studentOrStaffName: 'School Bus #14 (TN-09-BG-4912)',
      admissionOrEmpNo: 'FLEET-BUS-14',
      type: 'Transport Fitness NOC',
      fileSize: '2.1 MB (PDF)',
      uploadDate: '2026-08-10',
      verificationStatus: 'Verified',
      verifiedBy: 'Transport Head',
      expiryDate: '2026-11-30',
    },
  ]);

  const handleVerify = (id: string, status: 'Verified' | 'Re-upload Requested') => {
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, verificationStatus: status, verifiedBy: 'Super Admin' } : d))
    );
    addToast(`Document marked as ${status}`, status === 'Verified' ? 'success' : 'info');
    if (selectedDoc?.id === id) {
      setSelectedDoc(prev => (prev ? { ...prev, verificationStatus: status } : null));
    }
  };

  const handleOpenSignedPreview = (doc: DocumentRecord) => {
    setSelectedDoc(doc);
    addToast(`Generated tamper-proof watermarked preview URL for ${doc.studentOrStaffName}`, 'info');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) {
      addToast('Please enter candidate or vehicle name', 'error');
      return;
    }

    const newDoc: DocumentRecord = {
      id: `DOC-0${documents.length + 1}`,
      docCode: `DOC-2026-0${85 + documents.length}`,
      studentOrStaffName: uploadName.trim(),
      admissionOrEmpNo: uploadId.trim() || `LMN-2026-0${Math.floor(100 + Math.random() * 900)}`,
      type: uploadType,
      fileSize: '1.2 MB (PDF)',
      uploadDate: new Date().toISOString().slice(0, 10),
      verificationStatus: 'Pending Scrutiny',
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setUploadName('');
    setUploadId('');
    addToast(`Document ${newDoc.docCode} uploaded and queued for ClamAV scan & scrutiny (DOC-001)`, 'success');
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Document Code,Target Name,Admission/Staff ID,Document Type,File Size,Upload Date,Verification Status,Verified By,Expiry Date',
      ...documents.map(
        d =>
          `"${d.docCode}","${d.studentOrStaffName}","${d.admissionOrEmpNo}","${d.type}","${d.fileSize}","${d.uploadDate}","${d.verificationStatus}","${d.verifiedBy || 'N/A'}","${d.expiryDate || 'N/A'}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Document_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Document Management & Compliance Ledger (CSV)', 'success');
  };

  const filteredDocs =
    activeFilter === 'all'
      ? documents
      : activeFilter === 'pending'
      ? documents.filter(d => d.verificationStatus === 'Pending Scrutiny')
      : documents.filter(d => d.verificationStatus === 'Verified');

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-subtle text-brand">
              DOC · Module 6
            </span>
            <span className="text-xs text-ink-muted">15 Master Features (DOC-001..015)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-ink mt-1">
            Enterprise Document Management & Verification
          </h1>
          <p className="text-xs md:text-sm text-ink-soft">
            Secure document repositories, in-browser watermarked preview, verification queues, signed expiring URLs, and expiry alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Ledger</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Storage Quota & Virus Scan Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Cloud Storage Quota (DOC-014)</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono text-ink">42.8 GB / 100 GB</span>
            <span className="text-xs font-bold text-emerald-600">42.8% used</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-brand rounded-full w-[42.8%]"></div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Malware & Virus Defense (DOC-012)</div>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-600 text-base">verified_user</span>
            <span>ClamAV Engine Clean</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">100% of uploaded files scanned before preview</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Verification Queue (DOC-004)</div>
          <div className="text-lg font-bold font-mono text-amber-600 mt-1">
            {documents.filter(d => d.verificationStatus === 'Pending Scrutiny').length} Documents Pending
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Average verification turnaround: 3.2 hours</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 border-b border-line-soft pb-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'all' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          All Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'pending' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          Pending Scrutiny ({documents.filter(d => d.verificationStatus === 'Pending Scrutiny').length})
        </button>
        <button
          onClick={() => setActiveFilter('verified')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'verified' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          Verified Safe ({documents.filter(d => d.verificationStatus === 'Verified').length})
        </button>
      </div>

      {/* Table & In-Browser Preview Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table (2 cols) */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-subtle/60 text-ink-soft font-semibold border-b border-line">
                <tr>
                  <th className="p-3">Doc Code</th>
                  <th className="p-3">Candidate / Vehicle</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Uploaded</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-wash">
                    <td className="p-3 font-mono font-bold text-brand">{doc.docCode}</td>
                    <td className="p-3">
                      <div className="font-bold text-ink">{doc.studentOrStaffName}</div>
                      <div className="text-[10px] text-ink-muted font-mono">{doc.admissionOrEmpNo}</div>
                    </td>
                    <td className="p-3 text-ink-soft">
                      <div>{doc.type}</div>
                      <div className="text-[10px] text-ink-muted">{doc.fileSize}</div>
                    </td>
                    <td className="p-3 text-ink-muted">{doc.uploadDate}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          doc.verificationStatus === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.verificationStatus === 'Pending Scrutiny'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenSignedPreview(doc)}
                        className="px-2.5 py-1 bg-subtle text-brand font-bold rounded-lg hover:bg-lumen-200 transition-all text-xs"
                      >
                        Preview & Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Watermarked Preview Drawer */}
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="border-b border-line-soft pb-3">
                <span className="text-[10px] font-bold font-mono text-brand uppercase">{selectedDoc.docCode}</span>
                <h3 className="text-sm font-bold text-ink mt-1">{selectedDoc.type}</h3>
                <div className="text-xs text-ink-muted">
                  Target: <span className="font-semibold text-ink">{selectedDoc.studentOrStaffName}</span>
                </div>
              </div>

              {/* Watermarked Document Preview Canvas */}
              <div className="relative border border-slate-200 rounded-xl bg-slate-100 p-6 min-h-[220px] flex flex-col items-center justify-center overflow-hidden">
                {/* Watermark overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-15 rotate-[-25deg]">
                  <span className="text-xl font-bold font-mono text-slate-900 tracking-wider">
                    CONFIDENTIAL • LUMEN ACADEMY • {selectedDoc.admissionOrEmpNo}
                  </span>
                </div>

                <span className="material-symbols-outlined text-5xl text-brand">description</span>
                <div className="font-mono text-xs font-bold text-ink mt-2">{selectedDoc.type}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">Scanned High-Res PDF (Verified ClamAV Clean)</div>
                <div className="mt-3 text-[10px] bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-600 font-mono">
                  SHA-256: e3b0c44298fc1c149afbf4c8996fb924...
                </div>
              </div>

              {/* Verification Actions */}
              <div className="space-y-2 pt-2 border-t border-line-soft">
                <button
                  onClick={() => handleVerify(selectedDoc.id, 'Verified')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>Approve & Mark Verified</span>
                </button>
                <button
                  onClick={() => handleVerify(selectedDoc.id, 'Re-upload Requested')}
                  className="w-full py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-ink-soft rounded-xl text-xs font-bold transition-all"
                >
                  Request Parent Re-upload (Blurry / Invalid)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-ink-muted space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">visibility</span>
              <p className="text-xs">Click "Preview & Audit" on any document to open secure watermarked viewer and record scrutiny verdict.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Upload Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">upload_file</span>
                <h3 className="font-bold text-ink text-sm">Upload Student / Staff Document (DOC-001)</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Candidate / Student / Asset Name</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder="e.g. Siddharth Raghavan"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admission / Roll / Staff ID</label>
                <input
                  type="text"
                  value={uploadId}
                  onChange={e => setUploadId(e.target.value)}
                  placeholder="e.g. LMN-2026-112"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Type</label>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value as DocumentRecord['type'])}
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Transfer Certificate">Transfer Certificate</option>
                  <option value="Previous Marksheet">Previous Marksheet</option>
                  <option value="Transport Fitness NOC">Transport Fitness NOC</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select File (PDF / JPG / PNG)</label>
                <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                  <span className="font-mono text-slate-600">{fileName}</span>
                  <label className="cursor-pointer px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-100">
                    Browse
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) setFileName(e.target.files[0].name);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Submit for Scrutiny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
