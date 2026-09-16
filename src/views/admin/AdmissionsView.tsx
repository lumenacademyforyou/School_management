import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface Applicant {
  id: string;
  name: string;
  targetClass: string;
  stage: 'new' | 'docs' | 'interview' | 'fee' | 'enrolled';
  score?: number;
  guardian: string;
  phone: string;
}

export const AdmissionsView: React.FC = () => {
  const { addToast } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showNewModal, setShowNewModal] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newTargetClass, setNewTargetClass] = useState('Class 11 (Science)');
  const [newGuardian, setNewGuardian] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [applicants, setApplicants] = useState<Applicant[]>([
    { id: 'app-01', name: 'Rohan Venkatesh', targetClass: 'Class 11 (PCM)', stage: 'new', guardian: 'Venkatesh K.', phone: '+91 98401 11223' },
    { id: 'app-02', name: 'Meera S. Krishnan', targetClass: 'Class 9', stage: 'docs', score: 88, guardian: 'S. Krishnan', phone: '+91 98402 33445' },
    { id: 'app-03', name: 'Kabir Sengupta', targetClass: 'Class 11 (Commerce)', stage: 'interview', score: 92, guardian: 'Ananya Sengupta', phone: '+91 98403 55667' },
    { id: 'app-04', name: 'Diya Pradeep', targetClass: 'Class 6', stage: 'fee', score: 95, guardian: 'Pradeep R.', phone: '+91 98404 77889' },
    { id: 'app-05', name: 'Advaith Nambiar', targetClass: 'Class 10', stage: 'enrolled', score: 94, guardian: 'Dr. Nambiar', phone: '+91 98405 99001' },
  ]);

  const advanceStage = (id: string) => {
    const stageOrder: Applicant['stage'][] = ['new', 'docs', 'interview', 'fee', 'enrolled'];
    setApplicants(prev =>
      prev.map(app => {
        if (app.id !== id) return app;
        const currentIdx = stageOrder.indexOf(app.stage);
        const nextStage = stageOrder[Math.min(currentIdx + 1, stageOrder.length - 1)];
        return { ...app, stage: nextStage };
      })
    );
    addToast('Applicant advanced to next admission phase', 'success');
  };

  const handleCreateApplicant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newGuardian.trim()) {
      addToast('Please enter both student and guardian names', 'error');
      return;
    }

    const newApp: Applicant = {
      id: `app-${Date.now()}`,
      name: newName.trim(),
      targetClass: newTargetClass,
      stage: 'new',
      guardian: newGuardian.trim(),
      phone: newPhone.trim() || '+91 98400 00000',
    };

    setApplicants([newApp, ...applicants]);
    setShowNewModal(false);
    setNewName('');
    setNewGuardian('');
    setNewPhone('');
    addToast(`Registered new admission application for ${newApp.name} (ADM-001)`, 'success');
  };

  const handleExportPipeline = () => {
    const csvContent = [
      'Application ID,Student Name,Target Class,Pipeline Stage,Score,Guardian Name,Phone',
      ...applicants.map(a => `${a.id},"${a.name}","${a.targetClass}","${a.stage}",${a.score || 'N/A'},"${a.guardian}","${a.phone}"`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Admissions_Pipeline_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Admissions Pipeline Ledger (CSV)', 'success');
  };

  const stages = [
    { key: 'new', label: '1. New Inquiries', color: 'border-slate-300 bg-slate-50' },
    { key: 'docs', label: '2. Document Verification', color: 'border-[#93d5ea] bg-[#f0f7fb]' },
    { key: 'interview', label: '3. Entrance & Interview', color: 'border-amber-300 bg-amber-50/50' },
    { key: 'fee', label: '4. Offer & Fee Payment', color: 'border-blue-300 bg-blue-50/50' },
    { key: 'enrolled', label: '5. Formally Enrolled', color: 'border-emerald-300 bg-emerald-50/50' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">how_to_reg</span>
            <span>Admissions & Enrollment Operations (ADM-001..027)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Academic Year 2025–26 Enrollment Pipeline
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Stage-Gate Funnel • Automated DigiLocker Verification • 142 Confirmed Seats
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPipeline}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Roster</span>
          </button>
          <div className="bg-[#f0f7fb] border border-[#cbe0ec] p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-[#0e5d84] text-white' : 'text-[#464555]'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-[#0e5d84] text-white' : 'text-[#464555]'
              }`}
            >
              Data Table
            </button>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Conversion Funnel Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#e0ecf4] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#777587]">1. Inquiries</div>
          <div className="text-xl font-bold text-[#082b3d] mt-0.5">412</div>
          <div className="text-[11px] text-[#464555]">100% Inflow</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e0ecf4] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#777587]">2. Verified Docs</div>
          <div className="text-xl font-bold text-[#0e5d84] mt-0.5">328</div>
          <div className="text-[11px] text-[#464555]">79.6% Conversion</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e0ecf4] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#777587]">3. Entrance Cleared</div>
          <div className="text-xl font-bold text-[#0e5d84] mt-0.5">240</div>
          <div className="text-[11px] text-[#464555]">58.2% Conversion</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e0ecf4] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#777587]">4. Offer Issued</div>
          <div className="text-xl font-bold text-amber-700 mt-0.5">180</div>
          <div className="text-[11px] text-amber-800 font-medium">Fee Link Dispatched</div>
        </div>
        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-800">5. Enrolled (Seats)</div>
          <div className="text-xl font-bold text-emerald-900 mt-0.5">142</div>
          <div className="text-[11px] text-emerald-700 font-semibold">94% Target Reached</div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map(st => {
            const stageApplicants = applicants.filter(a => a.stage === st.key);
            return (
              <div key={st.key} className={`p-3 rounded-2xl border ${st.color} flex flex-col justify-between min-h-[360px]`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#082b3d]">{st.label}</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-[#0e5d84] shadow-xs">
                      {stageApplicants.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stageApplicants.map(app => (
                      <div
                        key={app.id}
                        className="bg-white p-3 rounded-xl border border-[#cbe0ec] shadow-xs space-y-2 text-xs"
                      >
                        <div className="font-bold text-[#082b3d]">{app.name}</div>
                        <div className="text-[11px] text-[#464555]">Applying for: <strong>{app.targetClass}</strong></div>
                        <div className="text-[10px] text-[#777587]">
                          <div>Parent: {app.guardian}</div>
                          <div>Phone: {app.phone}</div>
                        </div>
                        {app.stage !== 'enrolled' && (
                          <button
                            onClick={() => advanceStage(app.id)}
                            className="w-full mt-1 bg-[#f0f7fb] hover:bg-[#0e5d84] hover:text-white text-[#0e5d84] text-[11px] font-semibold py-1 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Advance Stage</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-black/5 text-[10px] text-center text-[#777587]">
                  Drag or click advance
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f0f7fb] text-[#464555] font-semibold border-b border-[#cbe0ec]">
              <tr>
                <th className="p-3">Applicant Name</th>
                <th className="p-3">Class Target</th>
                <th className="p-3">Guardian & Contact</th>
                <th className="p-3">Current Pipeline Stage</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {applicants.map(app => (
                <tr key={app.id} className="hover:bg-[#f8f9ff]">
                  <td className="p-3 font-bold text-[#082b3d]">{app.name}</td>
                  <td className="p-3 text-[#464555]">{app.targetClass}</td>
                  <td className="p-3 text-[#464555]">
                    {app.guardian} ({app.phone})
                  </td>
                  <td className="p-3">
                    <span className="bg-[#f0f7fb] text-[#0e5d84] px-2 py-0.5 rounded font-semibold uppercase text-[10px]">
                      {app.stage}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {app.stage !== 'enrolled' && (
                      <button
                        onClick={() => advanceStage(app.id)}
                        className="text-[#0e5d84] font-semibold hover:underline"
                      >
                        Advance →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Register New Applicant */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e5d84]">how_to_reg</span>
                <h3 className="font-bold text-[#082b3d] text-sm">New Admission Registration (ADM-001)</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateApplicant} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Ananya Deshmukh"
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#0e5d84]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Admission Class</label>
                <select
                  value={newTargetClass}
                  onChange={e => setNewTargetClass(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option value="Class 1">Class 1 (Primary)</option>
                  <option value="Class 6">Class 6 (Middle)</option>
                  <option value="Class 9">Class 9 (Secondary)</option>
                  <option value="Class 11 (Science)">Class 11 (PCM / PCB Science)</option>
                  <option value="Class 11 (Commerce)">Class 11 (Commerce & Economics)</option>
                  <option value="Class 11 (Humanities)">Class 11 (Humanities)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  value={newGuardian}
                  onChange={e => setNewGuardian(e.target.value)}
                  placeholder="e.g., Ramesh Deshmukh"
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#0e5d84]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Contact Mobile</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+91 98401 23456"
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#0e5d84]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Register Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
