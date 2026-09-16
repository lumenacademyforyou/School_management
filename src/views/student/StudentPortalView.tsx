import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const StudentPortalView: React.FC = () => {
  const { student, addToast, logout } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'timetable' | 'assignments' | 'certificates' | 'hall-ticket'>('overview');
  const [submittedAssignment, setSubmittedAssignment] = useState<string | null>(null);

  const scheduleToday = [
    { period: 'Period 1', time: '08:30 - 09:15 AM', subject: 'Mathematics', room: 'Room 304', teacher: 'Mrs. Lakshmi Iyer', status: 'Completed', topic: 'Trigonometric Identities & Proofs' },
    { period: 'Period 2', time: '09:15 - 10:00 AM', subject: 'Physics (Lab)', room: 'Physics Lab 2', teacher: 'Dr. V. Raman', status: 'Ongoing', topic: 'Verification of Snell\'s Law with Glass Slab' },
    { period: 'Period 3', time: '10:15 - 11:00 AM', subject: 'English Language', room: 'Room 304', teacher: 'Ms. Sarah Thomas', status: 'Upcoming', topic: 'Analytical Paragraph Writing (CBSE Format)' },
    { period: 'Period 4', time: '11:00 - 11:45 AM', subject: 'Computer Applications', room: 'IT Hub A', teacher: 'Mr. Dinesh Kumar', status: 'Upcoming', topic: 'Relational Database Queries & SQL Joins' },
    { period: 'Period 5', time: '12:30 - 01:15 PM', subject: 'Chemistry', room: 'Room 304', teacher: 'Mrs. Jayashree V.', status: 'Upcoming', topic: 'Periodic Classification of Elements' },
  ];

  const assignments = [
    { id: 'asn-01', title: 'CBSE Chapter 8: Trigonometry Exercise 8.4', subject: 'Mathematics', dueDate: 'Tomorrow, 08:30 AM', maxMarks: 25, status: submittedAssignment === 'asn-01' ? 'Submitted' : 'Pending', file: 'math_exercise_8_4.pdf' },
    { id: 'asn-02', title: 'Physics Lab Record: Focal Length of Convex Lens', subject: 'Physics', dueDate: '18 Sep 2026, 05:00 PM', maxMarks: 20, status: 'Submitted', file: 'optics_record_final.pdf' },
    { id: 'asn-03', title: 'Formal Letter to Municipal Commissioner (Water Supply)', subject: 'English', dueDate: '20 Sep 2026, 11:59 PM', maxMarks: 15, status: 'Pending', file: 'english_formal_letter.docx' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-linear-to-r from-[#082b3d] via-[#0e5d84] to-[#166d99] rounded-2xl p-5 md:p-6 text-white shadow-lg relative overflow-hidden border border-[#213145]">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.2),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-md"
              />
              <img
                src="/lumen-academy-logo.svg"
                alt="Lumen Academy Crest"
                referrerPolicy="no-referrer"
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 object-contain drop-shadow-md bg-white rounded-full p-0.5 border border-[#d97706]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white">
                  {student.name}
                </h1>
                <span className="bg-[#f59e0b] text-[#082b3d] text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  {student.class} - {student.section}
                </span>
                <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded border border-white/20">
                  Roll: {student.rollNo}
                </span>
              </div>
              <p className="text-xs text-[#dce9ff] mt-1 flex items-center gap-2 flex-wrap">
                <span>APAAR ID: <span className="font-mono text-emerald-300 font-bold">{student.apaarId}</span></span>
                <span>•</span>
                <span>House: <span className="font-semibold text-amber-300">{student.house}</span></span>
                <span>•</span>
                <span>CBSE Enrollment: ADM-2018-0492</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Logout */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
            <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center">
              <div className="px-2">
                <div className="text-[10px] text-[#bae6fd] uppercase font-bold">Attendance</div>
                <div className="text-lg font-bold text-emerald-300">96.4%</div>
                <div className="text-[9px] text-white/70">188 / 195 Days</div>
              </div>
              <div className="px-2 border-x border-white/20">
                <div className="text-[10px] text-[#bae6fd] uppercase font-bold">Current CGPA</div>
                <div className="text-lg font-bold text-amber-300">9.2 / 10</div>
                <div className="text-[9px] text-white/70">Rank 3 of 42</div>
              </div>
              <div className="px-2">
                <div className="text-[10px] text-[#bae6fd] uppercase font-bold">Pending Tasks</div>
                <div className="text-lg font-bold text-sky-300">2 Due</div>
                <div className="text-[9px] text-white/70">Due This Week</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-rose-600/40 text-rose-200 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all shadow-xs"
              title="Sign Out to Login Page"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto border-t border-white/15 pt-3">
          {[
            { id: 'overview', label: 'Day Schedule', icon: 'schedule' },
            { id: 'assignments', label: 'Homework & Tasks', icon: 'assignment' },
            { id: 'timetable', label: 'Weekly Timetable', icon: 'calendar_month' },
            { id: 'hall-ticket', label: 'CBSE Hall Ticket', icon: 'badge' },
            { id: 'certificates', label: 'DigiLocker Records', icon: 'verified' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#082b3d] shadow-sm'
                  : 'text-[#e0f2fe] hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Today's Classroom Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-[#e0ecf4] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#082b3d]">Today's Academic Schedule</h2>
                  <p className="text-xs text-[#777587]">Tuesday • AY 2024–25 Term 3 • Active Bell Schedule</p>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Period 2 in Session
                </span>
              </div>

              <div className="space-y-3">
                {scheduleToday.map((period, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      period.status === 'Ongoing'
                        ? 'bg-[#f0f7fb] border-[#0e5d84] ring-2 ring-[#0e5d84]/15'
                        : period.status === 'Completed'
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-white border-[#e0ecf4] hover:border-[#0e5d84]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          period.status === 'Ongoing'
                            ? 'bg-[#0e5d84] text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {period.period}
                        </span>
                        <h3 className="font-bold text-sm text-[#082b3d]">{period.subject}</h3>
                        <span className="text-xs text-[#777587]">• {period.room}</span>
                      </div>
                      <div className="text-xs font-mono text-[#464555] bg-white px-2 py-0.5 rounded border border-[#e0ecf4]">
                        {period.time}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#464555]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#0e5d84]">school</span>
                        <span>{period.teacher}</span>
                      </div>
                      <div className="text-right text-[11px] text-[#777587]">
                        Topic: <span className="font-medium text-[#082b3d]">{period.topic}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Quick Widgets */}
          <div className="space-y-5">
            {/* Bus Live Status Card */}
            <div className="bg-white rounded-xl border border-[#e0ecf4] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e0ecf4]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0e5d84]">directions_bus</span>
                  <h3 className="font-bold text-sm text-[#082b3d]">School Transport</h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  GPS Active
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#777587]">Assigned Route:</span>
                  <span className="font-bold text-[#082b3d]">{student.transportRoute}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777587]">Boarding Stop:</span>
                  <span className="font-semibold text-[#082b3d]">Velachery Bypass Bay</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777587]">Seat Allocation:</span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{student.busSeat}</span>
                </div>
                <div className="pt-2 border-t border-[#f0f4ff] flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Boarded at 07:44 AM (RFID Gate #03)</span>
                </div>
              </div>
            </div>

            {/* Library Books Due */}
            <div className="bg-white rounded-xl border border-[#e0ecf4] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e0ecf4]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0e5d84]">local_library</span>
                  <h3 className="font-bold text-sm text-[#082b3d]">Library Borrowings</h3>
                </div>
                <span className="text-[10px] bg-slate-100 text-[#464555] font-semibold px-1.5 py-0.5 rounded">
                  2 Books Active
                </span>
              </div>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-[#082b3d]">Concepts of Physics (Vol 1)</div>
                  <div className="text-[11px] text-[#777587]">Author: H.C. Verma • Acc #LIB-8841</div>
                  <div className="mt-1 text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">timer</span>
                    Due in 4 days (20 Sep 2026)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Homework Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#082b3d]">Subject Assignments & Worksheets</h2>
              <p className="text-xs text-[#777587]">Digital submission linked to Teacher Gradebook (TCH-024)</p>
            </div>
            <button
              onClick={() => addToast('All homework guidelines refreshed from central portal', 'info')}
              className="text-xs text-[#0e5d84] font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">refresh</span> Refresh Tasks
            </button>
          </div>

          <div className="space-y-3">
            {assignments.map(asn => (
              <div key={asn.id} className="p-4 rounded-xl border border-[#e0ecf4] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#0e5d84]/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f0f7fb] text-[#0e5d84]">
                      {asn.subject}
                    </span>
                    <h3 className="font-bold text-sm text-[#082b3d]">{asn.title}</h3>
                  </div>
                  <div className="text-xs text-[#777587] flex items-center gap-3">
                    <span>Due: <strong className="text-[#082b3d]">{asn.dueDate}</strong></span>
                    <span>•</span>
                    <span>Max Marks: {asn.maxMarks}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-500">Attach: {asn.file}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {asn.status === 'Submitted' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Submitted for Grading
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSubmittedAssignment(asn.id);
                        addToast(`Submitted ${asn.title}`, 'success', 'Assignment sent to Mrs. Lakshmi Iyer for grading.');
                      }}
                      className="inline-flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      Submit Solution (PDF)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hall Ticket Tab */}
      {activeTab === 'hall-ticket' && (
        <div className="bg-white rounded-xl border border-[#e0ecf4] p-6 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="text-center border-b border-[#e0ecf4] pb-4">
            <span className="text-xs font-mono font-bold text-[#0e5d84] uppercase tracking-wider">
              CENTRAL BOARD OF SECONDARY EDUCATION
            </span>
            <h2 className="text-lg font-bold text-[#082b3d] mt-1">
              Class X Board Examination • Hall Ticket / Admit Card
            </h2>
            <p className="text-xs text-[#777587]">Academic Session: 2024–2025 • Center Code: 814022</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[#777587]">Candidate Name:</span>
              <div className="font-bold text-[#082b3d]">{student.name}</div>
            </div>
            <div>
              <span className="text-[#777587]">Roll Number:</span>
              <div className="font-bold text-[#0e5d84] font-mono">1042018841</div>
            </div>
            <div>
              <span className="text-[#777587]">Mother's Name:</span>
              <div className="font-bold text-[#082b3d]">Dr. Radhika Ramanathan</div>
            </div>
            <div>
              <span className="text-[#777587]">Father's Name:</span>
              <div className="font-bold text-[#082b3d]">{student.guardianName}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#777587] uppercase mb-2">Subject Examination Schedule</h3>
            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-[#f0f7fb] text-[#082b3d] font-bold">
                <tr>
                  <th className="p-2.5">Date & Time</th>
                  <th className="p-2.5">Sub Code</th>
                  <th className="p-2.5">Subject Name</th>
                  <th className="p-2.5">Center Venue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-medium">18 Feb 2025 (10:30 AM)</td>
                  <td className="p-2.5 font-mono">184</td>
                  <td className="p-2.5 font-semibold">English Language & Literature</td>
                  <td className="p-2.5 text-[#777587]">Kendriya Vidyalaya CLRI, Chennai</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">24 Feb 2025 (10:30 AM)</td>
                  <td className="p-2.5 font-mono">086</td>
                  <td className="p-2.5 font-semibold">Science (Theory)</td>
                  <td className="p-2.5 text-[#777587]">Kendriya Vidyalaya CLRI, Chennai</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">02 Mar 2025 (10:30 AM)</td>
                  <td className="p-2.5 font-mono">041</td>
                  <td className="p-2.5 font-semibold">Mathematics (Standard)</td>
                  <td className="p-2.5 text-[#777587]">Kendriya Vidyalaya CLRI, Chennai</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e0ecf4]">
            <div className="text-[11px] text-[#777587]">
              Signed by Principal & CBSE Controller of Examinations.
            </div>
            <button
              onClick={() => addToast('Admit Card Downloaded', 'success', 'PDF saved to device storage.')}
              className="inline-flex items-center gap-1.5 bg-[#0e5d84] text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Signed Hall Ticket (PDF)
            </button>
          </div>
        </div>
      )}

      {/* DigiLocker Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#082b3d]">DigiLocker Verified Academic Vault</h2>
              <p className="text-xs text-[#777587]">National Academic Depository (NAD) digital credentials (INT-014)</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
              <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
              DigiLocker Linked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#e0ecf4] bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  VERIFIED CREDENTIAL
                </span>
                <span className="font-mono text-[10px] text-slate-500">SHA-256 Validated</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#082b3d]">Grade 9 Annual Progress Marksheet</h4>
                <p className="text-xs text-[#777587] mt-0.5">Issued by LumenAcademy on 31 March 2024</p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="font-semibold text-emerald-700">CGPA: 9.4 (A1 Distinction)</span>
                <button
                  onClick={() => addToast('Opening DigiLocker credential link...', 'info')}
                  className="text-[#0e5d84] font-bold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span> View Certificate
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#e0ecf4] bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  STATUTORY CREDENTIAL
                </span>
                <span className="font-mono text-[10px] text-slate-500">DPDP Consent Sealed</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#082b3d]">Automated Permanent Academic Account (APAAR)</h4>
                <p className="text-xs text-[#777587] mt-0.5">National ID: 9842-3310-8841 (Ministry of Education)</p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-600">Aadhaar Vault e-KYC: Bound</span>
                <button
                  onClick={() => addToast('APAAR Card QR Verification Successful', 'success')}
                  className="text-[#0e5d84] font-bold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_2</span> View APAAR Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#082b3d]">Class 10-A Master Weekly Timetable</h2>
              <p className="text-xs text-[#777587]">Room 304 • Academic Year 2024–25 (TTB-018)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-[#f0f7fb] text-[#082b3d] font-bold">
                  <th className="p-2.5 text-left">Day</th>
                  <th className="p-2.5">P1 (08:30)</th>
                  <th className="p-2.5">P2 (09:15)</th>
                  <th className="p-2.5">P3 (10:15)</th>
                  <th className="p-2.5">P4 (11:00)</th>
                  <th className="p-2.5">P5 (12:30)</th>
                  <th className="p-2.5">P6 (01:15)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-bold text-left bg-slate-50">Monday</td>
                  <td className="p-2.5 bg-blue-50/50 font-semibold">English</td>
                  <td className="p-2.5 bg-amber-50/50 font-semibold">Mathematics</td>
                  <td className="p-2.5 bg-emerald-50/50 font-semibold">Physics</td>
                  <td className="p-2.5 bg-sky-50/70 font-semibold text-[#0e5d84]">Chemistry</td>
                  <td className="p-2.5 bg-rose-50/50 font-semibold">Biology</td>
                  <td className="p-2.5 bg-slate-50 font-semibold">Sports / PE</td>
                </tr>
                <tr className="bg-[#f0f7fb]/30 font-medium">
                  <td className="p-2.5 font-bold text-left bg-[#e0f2fe] text-[#0e5d84]">Tuesday (Today)</td>
                  <td className="p-2.5 bg-amber-100/60 font-bold text-[#0e5d84]">Mathematics</td>
                  <td className="p-2.5 bg-emerald-100/60 font-bold text-[#0e5d84]">Physics Lab</td>
                  <td className="p-2.5 bg-blue-50 font-semibold">English</td>
                  <td className="p-2.5 bg-teal-50 font-semibold">Comp Apps</td>
                  <td className="p-2.5 bg-sky-50 font-semibold text-[#0e5d84]">Chemistry</td>
                  <td className="p-2.5 bg-slate-50 font-semibold">Library</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-left bg-slate-50">Wednesday</td>
                  <td className="p-2.5 bg-emerald-50/50 font-semibold">Social Science</td>
                  <td className="p-2.5 bg-amber-50/50 font-semibold">Mathematics</td>
                  <td className="p-2.5 bg-rose-50/50 font-semibold">Chemistry Lab</td>
                  <td className="p-2.5 bg-blue-50/50 font-semibold">Second Lang</td>
                  <td className="p-2.5 bg-sky-50/70 font-semibold text-[#0e5d84]">Physics</td>
                  <td className="p-2.5 bg-slate-50 font-semibold">Art & Craft</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-left bg-slate-50">Thursday</td>
                  <td className="p-2.5 bg-amber-50/50 font-semibold">Mathematics</td>
                  <td className="p-2.5 bg-blue-50/50 font-semibold">English</td>
                  <td className="p-2.5 bg-emerald-50/50 font-semibold">Biology Lab</td>
                  <td className="p-2.5 bg-sky-50/70 font-semibold text-[#0e5d84]">History</td>
                  <td className="p-2.5 bg-teal-50 font-semibold">Comp Apps</td>
                  <td className="p-2.5 bg-slate-50 font-semibold">Clubs</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-left bg-slate-50">Friday</td>
                  <td className="p-2.5 bg-emerald-50/50 font-semibold">Physics</td>
                  <td className="p-2.5 bg-sky-50/70 font-semibold text-[#0e5d84]">Chemistry</td>
                  <td className="p-2.5 bg-amber-50/50 font-semibold">Mathematics</td>
                  <td className="p-2.5 bg-blue-50/50 font-semibold">Social Science</td>
                  <td className="p-2.5 bg-rose-50/50 font-semibold">Moral Science</td>
                  <td className="p-2.5 bg-slate-50 font-semibold">Assembly / Drill</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
