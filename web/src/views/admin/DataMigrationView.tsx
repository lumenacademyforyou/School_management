import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Figure } from '../../components/common/Figure';
import { ConfirmDialog, Stepper, btnPrimary, btnSoft, inputCls } from '../../components/common/ui';

interface MappingRow {
  source: string;
  target: string;
  status: string;
}

interface MigrationSnapshot {
  id: string;
  entity: string;
  recordsCount: number;
  committedAt: string;
  status: 'COMMITTED' | 'ROLLED_BACK';
}

export const DataMigrationView: React.FC = () => {
  const { addToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedEntity, setSelectedEntity] = useState('students');
  const [uploadedFileName, setUploadedFileName] = useState('Lumen_Chennai_Students_AY26.csv');
  const [uploadedRowCount, setUploadedRowCount] = useState(450);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunComplete, setDryRunComplete] = useState(false);
  const [confirmCommit, setConfirmCommit] = useState(false);

  // A dry run only vouches for the file, entity and mapping it ran against. Changing any of them
  // sends the wizard back to step 3, so nothing reaches production unvalidated.
  const invalidateDryRun = () => {
    setDryRunComplete(false);
    setStep(current => (current === 4 ? 3 : current));
  };

  const [mappings, setMappings] = useState<MappingRow[]>([
    { source: 'admission_no', target: 'Student.admissionNumber', status: 'Exact Match' },
    { source: 'student_name', target: 'Student.fullName', status: 'Exact Match' },
    { source: 'dob', target: 'Student.dateOfBirth (ISO-8601 parsed)', status: 'Formatted' },
    { source: 'class_sec', target: 'Academic.grade + section', status: 'Auto Split' },
    { source: 'father_phone', target: 'Guardian.primaryMobile', status: 'Normalized +91' },
    { source: 'apaar_id', target: 'Government.apaarPenId', status: 'Verified Format' },
  ]);

  const [snapshots, setSnapshots] = useState<MigrationSnapshot[]>([
    {
      id: 'TX-8491',
      entity: 'Staff Personnel',
      recordsCount: 68,
      committedAt: '2026-09-14 11:20 AM',
      status: 'COMMITTED',
    },
    {
      id: 'TX-8380',
      entity: 'Opening Fee Balances',
      recordsCount: 312,
      committedAt: '2026-09-10 03:45 PM',
      status: 'COMMITTED',
    },
  ]);

  const handleDownloadTemplate = (entity: string) => {
    const sampleHeaders: Record<string, string[]> = {
      students: ['admission_no', 'full_name', 'dob_dd_mm_yyyy', 'gender', 'grade', 'section', 'guardian_name', 'mobile_no', 'apaar_id', 'pen_number'],
      fees: ['admission_no', 'fee_head', 'due_date', 'amount_inr', 'concession_code', 'late_fee_waiver'],
      staff: ['employee_id', 'full_name', 'department', 'designation', 'qualification', 'date_of_joining', 'pan_number', 'epf_uan'],
    };

    const headers = sampleHeaders[entity] || sampleHeaders['students'];
    const csvContent = headers.join(',') + '\n' +
      (entity === 'students' ? 'LMN-2026-001,Aarav Sharma,15/06/2012,M,Grade 9,A,Vikram Sharma,9876543210,123456789012,PEN998877' : '');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LumenAcademy_Template_${entity.toUpperCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Downloaded official ${entity} import template (CSV)`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    invalidateDryRun();
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const rowCount = Math.max(lines.length - 1, 1);
      setUploadedRowCount(rowCount);
      addToast(`Parsed "${file.name}" successfully (${rowCount} rows detected)`, 'success');
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleTriggerDryRun = () => {
    setIsDryRunning(true);
    setTimeout(() => {
      setIsDryRunning(false);
      setDryRunComplete(true);
      addToast('Dry-run simulation completed with 0 fatal errors and 2 warnings', 'info');
    }, 1000);
  };

  const handleDownloadDryRunReport = () => {
    const reportData = {
      executionTime: new Date().toISOString(),
      file: uploadedFileName,
      entity: selectedEntity,
      totalRows: uploadedRowCount,
      validRows: Math.max(uploadedRowCount - 2, 0),
      warningCount: 2,
      fatalErrors: 0,
      warnings: [
        { row: 114, message: 'Missing postal PIN code; fallback to campus pincode (600042) applied' },
        { row: 282, message: 'Missing postal PIN code; fallback to campus pincode (600042) applied' },
      ],
      mappings,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DryRun_Validation_Report_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded Dry-Run Validation Audit Report (JSON)', 'success');
  };

  const handleFinalCommit = () => {
    setConfirmCommit(false);
    if (!dryRunComplete) {
      addToast('Dry-run validation required', 'warning', 'Commit is only available once a dry run has passed for the current file and mapping.');
      setStep(3);
      return;
    }
    const newTxId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSnapshot: MigrationSnapshot = {
      id: newTxId,
      entity: selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1),
      recordsCount: uploadedRowCount,
      committedAt: new Date().toLocaleString(),
      status: 'COMMITTED',
    };
    setSnapshots(prev => [newSnapshot, ...prev]);
    addToast(`Successfully committed ${uploadedRowCount} records into live database with transactional rollback point #${newTxId}`, 'success');
    setStep(1);
    setDryRunComplete(false);
  };

  const handleRollback = (id: string) => {
    setSnapshots(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'ROLLED_BACK' } : s))
    );
    addToast(`Transactional rollback executed for snapshot #${id}. Records safely un-staged.`, 'warning');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-subtle text-brand">
              MIG · Module 11
            </span>
            <span className="text-xs text-ink-muted">16 Master Features</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink mt-1">
            Data Import, Export &amp; Migration Wizard
          </h1>
          <p className="text-xs md:text-sm text-ink-soft">
            Guided 4-step import wizard, fuzzy column auto-mapping, dry-run validation report, atomic staged commit & rollback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadTemplate(selectedEntity)}
            className={btnSoft}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Step Indicator. The commit step stays out of reach until a dry run has passed, so the
          validation it depends on cannot be stepped over. */}
      <div className="bg-surface p-4 rounded-2xl border border-line-soft shadow-sm">
        <Stepper
          current={String(step)}
          onSelect={id => setStep(Number(id) as 1 | 2 | 3 | 4)}
          steps={[
            { id: '1', label: 'Select Entity & File', done: step > 1 },
            { id: '2', label: 'Column Auto-Mapping', done: step > 2 },
            { id: '3', label: 'Dry-Run Validation', done: dryRunComplete },
            { id: '4', label: 'Atomic Commit', disabled: !dryRunComplete },
          ]}
        />
      </div>

      {/* Step 1: Upload & Select Entity */}
      {step === 1 && (
        <div className="bg-surface rounded-2xl border border-line-soft p-6 shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-ink-muted uppercase">Target Entity for Migration</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'students', name: 'Student 360 Records', desc: 'Demographics, PEN, APAAR, Parents' },
                { id: 'fees', name: 'Fee Opening Balances', desc: 'Arrears, Advance Credits, Ledgers' },
                { id: 'staff', name: 'Faculty & Personnel', desc: '7th CPC designations, EPF, Qualifications' },
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedEntity(item.id);
                    invalidateDryRun();
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedEntity === item.id
                      ? 'border-brand bg-subtle/40 shadow-xs'
                      : 'border-line-soft hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-ink">{item.name}</div>
                  <div className="text-xs text-ink-muted mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-wash space-y-3">
            <span className="material-symbols-outlined text-4xl text-brand">cloud_upload</span>
            <div className="font-bold text-sm text-ink">Upload CSV or Excel (.csv, .xlsx)</div>
            <p className="text-xs text-ink-muted">Maximum file size: 50 MB (Supports up to 25,000 rows in single batch)</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={btnPrimary}
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>Select & Upload Local File</span>
              </button>

              <button
                onClick={() => {
                  setUploadedFileName('Lumen_Chennai_Students_AY26.csv');
                  setUploadedRowCount(450);
                  addToast('Loaded sample dataset "Lumen_Chennai_Students_AY26.csv" (450 rows detected)', 'info');
                  setStep(2);
                }}
                className={btnSoft}
              >
                Load Sample Batch (450 Rows)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Column Auto-Mapping */}
      {step === 2 && (
        <div className="bg-surface rounded-2xl border border-line-soft p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-line-soft pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-ink">Fuzzy Auto-Mapping Engine (MIG-003)</h3>
              <p className="text-xs text-ink-muted">
                Mapping for <span className="font-bold text-ink">{uploadedFileName}</span> ({uploadedRowCount} rows)
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200">
              <Figure value="100" suffix="%" /> Schema Compatible
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {mappings.map((row, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 gap-2">
                <span className="font-mono font-bold text-ink">{row.source}</span>
                <span className="material-symbols-outlined text-sm text-ink-muted hidden sm:inline">arrow_forward</span>
                <input
                  type="text"
                  value={row.target}
                  aria-label={`Target field for ${row.source}`}
                  onChange={e => {
                    const nextVal = e.target.value;
                    setMappings(prev =>
                      prev.map((m, idx) => (idx === i ? { ...m, target: nextVal } : m))
                    );
                    invalidateDryRun();
                  }}
                  className={`${inputCls} font-mono text-brand flex-1 max-w-sm`}
                />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                  {row.status}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-line-soft">
            <button onClick={() => setStep(1)} className={btnSoft}>
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className={btnPrimary}
            >
              Proceed to Dry-Run →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Dry-Run Validation */}
      {step === 3 && (
        <div className="bg-surface rounded-2xl border border-line-soft p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-ink">Simulated Dry-Run Validation (MIG-005)</h3>
            <p className="text-xs text-ink-muted">Simulate batch insertion against database constraints without altering live data</p>
          </div>

          {!dryRunComplete ? (
            <div className="p-8 text-center space-y-4">
              <button
                onClick={handleTriggerDryRun}
                disabled={isDryRunning}
                className={`${btnPrimary} mx-auto`}
              >
                <span className="material-symbols-outlined text-sm">play_circle</span>
                <span>{isDryRunning ? 'Analyzing Constraints...' : 'Execute Dry-Run Analyzer'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase">Valid Rows</div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{uploadedRowCount - 2} / {uploadedRowCount}</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-800 uppercase">Warnings</div>
                  <div className="text-2xl font-bold font-mono text-amber-700 mt-1">2</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-800 uppercase">Fatal Errors</div>
                  <div className="text-2xl font-bold font-mono text-slate-700 mt-1">0</div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                ⚠️ Notice: Row #114 and #282 have missing postal PIN codes; fallback to campus pincode (600042) applied.
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-line-soft flex-wrap gap-2">
                <button onClick={() => setStep(2)} className={btnSoft}>
                  ← Back
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadDryRunReport}
                    className={btnSoft}
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Download Report (JSON)</span>
                  </button>

                  <button
                    onClick={() => setStep(4)}
                    className={btnPrimary}
                  >
                    Confirm & Go to Staged Commit →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Staged Commit & Rollback */}
      {step === 4 && (
        <div className="bg-surface rounded-2xl border border-line-soft p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-ink">Atomic Transactional Staged Commit (MIG-006)</h3>
            <p className="text-xs text-ink-muted">
              Once committed, all {uploadedRowCount - 2} student profiles, parent logins, and initial ledgers will become live immediately. A rollback snapshot point will be created automatically.
            </p>
          </div>

          <div className="p-4 bg-subtle rounded-xl border border-line text-xs space-y-2">
            <div className="font-bold text-brand">Post-Migration Safety Guarantee:</div>
            <ul className="list-disc list-inside text-ink-soft space-y-1">
              <li>Automatic deduplication checks against existing student admission numbers</li>
              <li>SMS welcome credentials queued in DLT quiet hours buffer</li>
              <li>Single-click rollback capability available for 72 hours under audit supervision</li>
            </ul>
          </div>

          <div className="flex justify-between pt-4 border-t border-line-soft">
            <button onClick={() => setStep(3)} className={btnSoft}>
              ← Back
            </button>
            <button onClick={() => setConfirmCommit(true)} disabled={!dryRunComplete} className={btnPrimary}>
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Commit {uploadedRowCount - 2} Records to Production</span>
            </button>
          </div>
        </div>
      )}

      {/* Snapshot Rollback Registry */}
      <div className="bg-surface rounded-2xl border border-line-soft p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">Recent Migration Snapshots & Rollback Points (MIG-008)</h3>
            <p className="text-xs text-ink-muted">Audited transactional snapshots available for rollback within 72 hours</p>
          </div>
          <span className="text-xs font-mono text-brand bg-subtle px-2 py-0.5 rounded border border-line">
            Atomic DDL/DML Guard
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-ink-soft font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Snapshot ID</th>
                <th className="p-2.5">Entity</th>
                <th className="p-2.5">Records</th>
                <th className="p-2.5">Committed At</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-mono font-bold text-brand">{s.id}</td>
                  <td className="p-2.5 text-ink font-medium">{s.entity}</td>
                  <td className="p-2.5 font-mono">{s.recordsCount} rows</td>
                  <td className="p-2.5 text-ink-muted">{s.committedAt}</td>
                  <td className="p-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        s.status === 'COMMITTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    {s.status === 'COMMITTED' ? (
                      <button
                        onClick={() => handleRollback(s.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1 ml-auto"
                      >
                        <span className="material-symbols-outlined text-sm">undo</span>
                        <span>Rollback</span>
                      </button>
                    ) : (
                      <span className="text-ink-muted text-[11px] italic">Rolled back</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCommit}
        title="Commit to production?"
        confirmLabel={`Commit ${uploadedRowCount - 2} records`}
        onCancel={() => setConfirmCommit(false)}
        onConfirm={handleFinalCommit}
        body={
          <>
            {uploadedRowCount - 2} {selectedEntity} records from <span className="font-semibold text-ink">{uploadedFileName}</span> become live immediately. A rollback
            snapshot is created automatically and stays available for 72 hours.
          </>
        }
      />
    </div>
  );
};
