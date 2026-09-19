import React, { useId, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/ui';

interface BookIssue {
  id: string;
  bookTitle: string;
  studentName: string;
  rollNo: string;
  dewey: string;
  dueDate: string;
  status: 'Issued' | 'Returned' | 'Overdue';
}

export const LibraryView: React.FC = () => {
  const { addToast } = useApp();
  const issueFormId = useId();
  const [rfidScanning, setRfidScanning] = useState(false);
  const [scannedBook, setScannedBook] = useState<string>('Concepts of Physics Vol 1 - Dr. H.C. Verma');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  // Form state
  const [issueStudent, setIssueStudent] = useState('Aarav S. Ramanathan (10-A, Roll 14)');
  const [issueBookName, setIssueBookName] = useState('Concepts of Physics Vol 1 - Dr. H.C. Verma');
  const [issueDays, setIssueDays] = useState('14');

  const [recentIssues, setRecentIssues] = useState<BookIssue[]>([
    {
      id: 'ISS-001',
      bookTitle: 'NCERT Exemplar Problems Class 10',
      studentName: 'Bhavna Menon',
      rollNo: '10-A #07',
      dewey: '510.7',
      dueDate: '04 Mar 2026',
      status: 'Issued',
    },
    {
      id: 'ISS-002',
      bookTitle: 'A Brief History of Time - Stephen Hawking',
      studentName: 'Chetan R. Varma',
      rollNo: '10-A #12',
      dewey: '523.1',
      dueDate: '28 Feb 2026',
      status: 'Overdue',
    },
    {
      id: 'ISS-003',
      bookTitle: 'Wings of Fire - Dr. A.P.J. Abdul Kalam',
      studentName: 'Farah N. Siddiqui',
      rollNo: '10-A #18',
      dewey: '920.0',
      dueDate: '10 Mar 2026',
      status: 'Issued',
    },
  ]);

  const handleIssueBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (parseInt(issueDays) || 14));
    const dueDateStr = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newIssue: BookIssue = {
      id: `ISS-00${recentIssues.length + 1}`,
      bookTitle: issueBookName,
      studentName: issueStudent.split(' (')[0],
      rollNo: issueStudent.includes('(') ? issueStudent.split('(')[1].replace(')', '') : 'General',
      dewey: '530.1',
      dueDate: dueDateStr,
      status: 'Issued',
    };

    setRecentIssues([newIssue, ...recentIssues]);
    setShowIssueModal(false);
    addToast(`Book "${issueBookName}" issued to ${newIssue.studentName}. RFID Tag 04-E2-A8 activated (LIB-003).`, 'success');
  };

  const handleProcessReturn = () => {
    addToast(`Book "${scannedBook}" returned. RFID security bit re-sensitized and shelving queue updated (LIB-004).`, 'info');
  };

  const handleExportCatalog = () => {
    const csvContent = [
      'Accession ID,Book Title,Dewey Code,Category,Total Copies,Available Copies,Shelf Location',
      'ACC-5301,Concepts of Physics Vol 1,530.1,Physics,15,4,Stack 4B-12',
      'ACC-5107,NCERT Exemplar Problems Class 10,510.7,Mathematics,25,11,Stack 2A-08',
      'ACC-5231,A Brief History of Time,523.1,Cosmology,8,1,Stack 3C-04',
      'ACC-9200,Wings of Fire,920.0,Biography,12,6,Stack 5A-01',
      'ACC-6002,Introduction to Python Robotics,600.2,Computer Science,20,8,Stack 1D-03',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Central_Library_Catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Central Library Catalog & Circulation Register (CSV)', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">local_library</span>
            <span>Digital Media & RFID Circulation Hub (LIB-001..010)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            Dewey Decimal Catalog & Smart RFID Circulation
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            24,500 Physical Volumes • RFID Self-Checkout Antennas • Automated WhatsApp Fine Notices
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCatalog}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Catalog</span>
          </button>
          <button
            onClick={() => setShowOverdueModal(true)}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            <span>Overdue Reminders</span>
          </button>
          <button
            onClick={() => {
              setRfidScanning(true);
              setTimeout(() => {
                setRfidScanning(false);
                setScannedBook('Principles of Optics - Max Born & Emil Wolf');
                addToast('RFID Tag 04-E2-A8 detected on Circulation Tray (LIB-002)', 'success');
              }, 900);
            }}
            disabled={rfidScanning}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{rfidScanning ? 'sync' : 'contactless'}</span>
            <span>{rfidScanning ? 'Scanning Tray...' : 'Trigger RFID Book Scan'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: RFID Tray Simulator + Dewey Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Smart RFID Circulation Desk */}
        <div className="lg:col-span-2 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">sensors</span>
              <span>Self-Checkout RFID Antenna Tray #01</span>
            </h2>
            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
              ANTENNA CALIBRATED
            </span>
          </div>

          <div className="p-6 bg-subtle rounded-xl border border-line flex flex-col items-center justify-center text-center space-y-3">
            <span className="material-symbols-outlined text-5xl text-brand animate-bounce">
              book_2
            </span>
            <div className="space-y-1">
              <div className="text-xs uppercase font-bold text-ink-muted">Detected Item on Tray</div>
              <div className="text-base font-bold text-ink">{scannedBook}</div>
              <div className="text-xs text-ink-soft">Dewey: 530.1 (Physics) • Barcode: #LMN-LIB-09412</div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIssueBookName(scannedBook);
                  setShowIssueModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Issue to Student</span>
              </button>
              <button
                onClick={handleProcessReturn}
                className="bg-white hover:bg-slate-100 border border-line text-ink font-semibold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">assignment_return</span>
                <span>Process Return</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-ink">
              <span>Active Issue & Circulation Ledger</span>
              <span className="text-ink-muted font-normal">{recentIssues.length} active records</span>
            </div>
            <div className="space-y-1.5">
              {recentIssues.map(issue => (
                <div key={issue.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
                  <div>
                    <div className="font-bold text-ink">{issue.bookTitle}</div>
                    <div className="text-ink-muted text-[11px]">
                      Issued to {issue.studentName} ({issue.rollNo}) • Due: <strong>{issue.dueDate}</strong>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      issue.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Dewey Decimal Explorer */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-base">category</span>
            <span>Dewey 500–900 Classification</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-subtle rounded-xl border border-line">
              <div className="font-bold text-brand">500 Natural Sciences & Mathematics</div>
              <div className="text-[11px] text-ink-soft">6,420 Volumes (Physics, Chem, Bio, Maths)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-ink">600 Technology & Applied Sciences</div>
              <div className="text-[11px] text-ink-soft">4,850 Volumes (Robotics, AI, Medicine)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-ink">800 Literature & Rhetoric</div>
              <div className="text-[11px] text-ink-soft">5,200 Volumes (Shakespeare, Tagore, Hindi)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-ink">900 History & Geography</div>
              <div className="text-[11px] text-ink-soft">3,100 Volumes (Indian Independence, Atlas)</div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Issue Book to Student */}
      <Modal
        open={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Library Book (LIB-003)"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowIssueModal(false)}
              className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={issueFormId}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Confirm Issue
            </button>
          </>
        }
      >
        <form id={issueFormId} onSubmit={handleIssueBookSubmit} className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Book Title</label>
            <input
              type="text"
              value={issueBookName}
              onChange={e => setIssueBookName(e.target.value)}
              className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Student Borrower</label>
            <select
              value={issueStudent}
              onChange={e => setIssueStudent(e.target.value)}
              className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
            >
              <option value="Aarav S. Ramanathan (10-A, Roll 14)">Aarav S. Ramanathan (Class 10-A, Roll 14)</option>
              <option value="Farah N. Siddiqui (10-A, Roll 18)">Farah N. Siddiqui (Class 10-A, Roll 18)</option>
              <option value="Chetan R. Varma (10-A, Roll 12)">Chetan R. Varma (Class 10-A, Roll 12)</option>
              <option value="Rohan Venkatesh (11-PCM, Roll 03)">Rohan Venkatesh (Class 11-PCM, Roll 03)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Loan Period (Days)</label>
            <select
              value={issueDays}
              onChange={e => setIssueDays(e.target.value)}
              className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
            >
              <option value="7">7 Days (Weekly Borrow)</option>
              <option value="14">14 Days (Standard Student Loan)</option>
              <option value="28">28 Days (Reference / Scholar Loan)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Overdue Fine & Reminders */}
      <Modal
        open={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        title="Automated Overdue Notice Dispatch (LIB-007)"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowOverdueModal(false)}
              className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOverdueModal(false);
                addToast('Dispatched WhatsApp & SMS overdue notice to Chetan R. Varma guardian (LIB-007)', 'success');
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Send Automated Notice
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
            Found 1 overdue loan: <strong>"A Brief History of Time"</strong> with Chetan R. Varma (Due 28 Feb 2026). Late fine accrued: ₹20.00 (₹2/day).
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
            <div>Dispatch Channel: <strong>WhatsApp TRAI DLT + SMS</strong></div>
            <div>Parent Contact: +91 98402 11094 (R. Varma)</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
