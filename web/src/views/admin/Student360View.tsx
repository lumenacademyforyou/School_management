import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EditIdentifiersModal, EmisDisplay, StudentStatusBadge } from '../../components/students/StudentIdentifiers';
import { useGrants } from '../../hooks/useGrants';
import { useRoster } from '../../services/studentService';
import { Figure } from '../../components/common/Figure';

export const Student360View: React.FC = () => {
  const { student, setAdminView, setPtmModalOpen, setLeaveModalOpen, addToast } = useApp();
  const g = useGrants();
  const roster = useRoster();
  const record = roster.find(r => r.id === student.id);
  const [editingIds, setEditingIds] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'attendance' | 'transport' | 'hostel' | 'compliance'>('overview');

  const handleExportMarksheet = () => {
    const csvContent = [
      'Subject Code,Subject Name,Faculty,Term 1,Term 2,Pre-Board Theory (80),Practicals (20),Total,Grade',
      '086,Science,Mrs. Malini Iyer,94,96,76,20,96,A1',
      '041,Mathematics Standard,Dr. V. Raghavan,92,90,74,19,93,A1',
      '184,English Language & Literature,Ms. Clara D’Souza,88,91,71,19,90,A1',
      '087,Social Science,Mrs. Priya Mohan,86,89,68,18,86,A2',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CBSE_Scorecard_${student.rollNo}_${student.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported Official CBSE Marksheet for ${student.name}`, 'success');
  };

  const handleDownloadDossier = () => {
    const dossier = `LUMEN ACADEMY STUDENT 360 CUMULATIVE DOSSIER
==================================================
Name: ${student.name}
Class: ${student.class} - Section ${student.section} | Roll No: ${student.rollNo}
APAAR ID: ${student.apaarId} | PEN: ${student.pen} | Admission No: ${student.admissionNo}
DOB: ${student.dob} | Blood Group: ${student.bloodGroup} | House: ${student.house}
Cumulative GPA: ${student.gpa} / 10.0 | Attendance: ${student.attendancePct}%

GUARDIAN DETAILS:
Primary: ${student.guardianName} (${student.guardianPhone})
Secondary: ${student.guardianAltName} (${student.guardianAltPhone})
Address: ${student.address}

TRANSPORT & HOSTEL:
Route: ${student.transportRoute}
Hostel: ${student.hostelRoom}

DPDPA CONSENT:
Turnstile Biometric: VERIFIED
CCTV Hallway: VERIFIED
GPS Telemetry: VERIFIED
AI LMS Analytics: VERIFIED
==================================================
Generated on: ${new Date().toLocaleString()}`;

    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(dossier);
    link.download = `Student360_${student.rollNo}_${student.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Downloaded Complete Student 360 Dossier for ${student.name}`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Student 360 Hero Identity Card */}
      <div className="bg-surface rounded-2xl border border-line-soft p-5 md:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-subtle to-transparent rounded-full -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 md:flex-1 min-w-0">
            <div className="relative">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-subtle shadow-md"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2" data-testid="s360-identity">
                <h1 className="text-2xl font-bold font-display tracking-tight text-ink">{student.name}</h1>
                <StudentStatusBadge status={record?.status ?? 'Active'} className="text-[11px]" />
              </div>
              <p className="mt-1 text-sm text-ink-soft flex flex-wrap items-center gap-x-1.5">
                <span className="font-mono font-semibold text-ink">{student.admissionNo}</span>
                <span className="text-slate-300">·</span>
                <span className="whitespace-nowrap">{student.class} – Section {student.section}</span>
                <span className="text-slate-300">·</span>
                <span className="whitespace-nowrap">Roll {student.rollNo}</span>
                <span className="text-slate-300">·</span>
                <span className="whitespace-nowrap">{student.house}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {student.batch && (
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[13px]">school</span>
                    Batch {student.batch}
                  </span>
                )}
                {student.school && (
                  <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[13px]">apartment</span>
                    {student.school}
                  </span>
                )}
                {student.academicYear && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                    {student.academicYear}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted mt-1">
                <span>APAAR <strong className="font-mono font-semibold text-ink-soft">{student.apaarId}</strong></span>
                <span>PEN <strong className="font-mono font-semibold text-ink-soft">{student.pen}</strong></span>
                <span>DOB <strong className="font-semibold text-ink-soft">{student.dob}</strong></span>
              </div>
              {record && (
                <div className="mt-3 max-w-md">
                  <EmisDisplay student={record} canEdit={g.can('STU-026', 'U')} editWhy={g.why('STU-026', 'U')} onEdit={() => setEditingIds(true)} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 md:max-w-[46%] md:justify-end">
            <button
              onClick={() => {
                window.print();
                addToast(`Sent ${student.name}'s Student 360 profile to printer`, 'info');
              }}
              className="flex items-center gap-1.5 bg-subtle hover:bg-line-soft text-ink text-xs font-semibold px-3 py-2 rounded-xl border border-line transition-colors"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Dossier</span>
            </button>
            <button
              onClick={handleDownloadDossier}
              className="flex items-center gap-1.5 bg-subtle hover:bg-line-soft text-brand text-xs font-semibold px-3 py-2 rounded-xl border border-line transition-colors"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Download Dossier</span>
            </button>
            <button
              onClick={() => setAdminView('id-cards')}
              className="flex items-center gap-1.5 bg-subtle hover:bg-line-soft text-brand text-xs font-semibold px-3 py-2 rounded-xl border border-line transition-colors"
            >
              <span className="material-symbols-outlined text-base">id_card</span>
              <span>ID Card</span>
            </button>
            <button
              onClick={() => setPtmModalOpen(true)}
              className="flex items-center gap-1.5 bg-subtle hover:bg-line-soft text-brand text-xs font-semibold px-3 py-2 rounded-xl border border-line transition-colors"
            >
              <span className="material-symbols-outlined text-base">event</span>
              <span>Schedule PTM</span>
            </button>
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="flex items-center gap-1.5 bg-subtle hover:bg-line-soft text-brand text-xs font-semibold px-3 py-2 rounded-xl border border-line transition-colors"
            >
              <span className="material-symbols-outlined text-base">edit_calendar</span>
              <span>Record Leave</span>
            </button>
            <button
              onClick={() => {
                setAdminView('certificates');
                addToast('Generating CBSE Transfer Certificate in DigiLocker module', 'info');
              }}
              className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Issue TC / DigiLocker</span>
            </button>
          </div>
        </div>

        {/* Holistic Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-subtle">
          <div className="bg-subtle/60 p-3 rounded-xl border border-line">
            <div className="text-[10px] uppercase font-bold text-ink-muted">Fee Status</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5"><Figure prefix="₹" value="24,500" /> Due</div>
            <div className="text-[11px] text-amber-800 font-semibold cursor-pointer hover:underline" onClick={() => setAdminView('fees')}>
              Pay via Ledger →
            </div>
          </div>
          <div className="bg-subtle/60 p-3 rounded-xl border border-line">
            <div className="text-[10px] uppercase font-bold text-ink-muted">Term 3 Attendance</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5"><Figure value={student.attendancePct} suffix="%" /></div>
            <div className="text-[11px] text-ink-soft">Above CBSE <Figure value="75" suffix="%" /> quota</div>
          </div>
          <div className="bg-subtle/60 p-3 rounded-xl border border-line">
            <div className="text-[10px] uppercase font-bold text-ink-muted">Cumulative GPA</div>
            <div className="text-xl font-bold text-ink mt-0.5"><Figure value={student.gpa} suffix=" / 10.0" /></div>
            <div className="text-[11px] text-emerald-700 font-semibold">Distinction Track (A1)</div>
          </div>
          <div className="bg-subtle/60 p-3 rounded-xl border border-line">
            <div className="text-[10px] uppercase font-bold text-ink-muted">Transport & Boarding</div>
            <div className="text-sm font-bold text-ink mt-1 truncate">{student.transportRoute}</div>
            <div className="text-[11px] text-ink-soft">{student.hostelRoom}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-line-soft pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Holistic Overview', icon: 'person' },
          { id: 'academics', label: 'Academics & Scorecards', icon: 'auto_stories' },
          { id: 'attendance', label: 'Biometric Attendance Matrix', icon: 'fact_check' },
          { id: 'transport', label: 'Route & Geofence GPS', icon: 'directions_bus' },
          { id: 'hostel', label: 'Hostel & Curfew', icon: 'night_shelter' },
          { id: 'compliance', label: 'DPDPA & Statutory Consent', icon: 'verified_user' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand text-white shadow-xs'
                : 'text-ink-soft hover:bg-subtle hover:text-ink'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guardian & Contact Dossier */}
          <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-base">family_restroom</span>
              <span>Guardians & Emergency Contacts</span>
            </h2>

            <div className="p-3 bg-subtle rounded-xl border border-line space-y-1">
              <div className="text-[10px] uppercase font-bold text-ink-muted">Primary Father / Guardian</div>
              <div className="text-xs font-bold text-ink">{student.guardianName}</div>
              <div className="text-xs text-brand font-mono">{student.guardianPhone}</div>
              <div className="text-[11px] text-ink-soft">VP, Cognizant Technology Solutions</div>
            </div>

            <div className="p-3 bg-subtle rounded-xl border border-line space-y-1">
              <div className="text-[10px] uppercase font-bold text-ink-muted">Secondary Mother / Guardian</div>
              <div className="text-xs font-bold text-ink">{student.guardianAltName}</div>
              <div className="text-xs text-brand font-mono">{student.guardianAltPhone}</div>
              <div className="text-[11px] text-ink-soft">Senior Consultant, Apollo Hospitals</div>
            </div>

            <div className="text-xs space-y-1 pt-1">
              <div className="text-[11px] font-semibold text-ink-muted">Permanent Residence</div>
              <div className="text-ink">{student.address}</div>
            </div>
          </div>

          {/* Academic Strengths & Co-Curricular */}
          <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-base">workspace_premium</span>
              <span>Co-Curricular & Special Accolades</span>
            </h2>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="material-symbols-outlined text-amber-700">military_tech</span>
                <div>
                  <div className="text-xs font-bold text-amber-900">National Science Olympiad (NSO)</div>
                  <div className="text-[11px] text-amber-800">State Rank 4 • Gold Medalist (Physics Category)</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="material-symbols-outlined text-emerald-700">sports_tennis</span>
                <div>
                  <div className="text-xs font-bold text-emerald-900">CBSE South Zone Badminton Championship</div>
                  <div className="text-[11px] text-emerald-800">Under-16 Doubles Runner-up (Dec 2024)</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-subtle rounded-xl border border-line">
                <span className="material-symbols-outlined text-brand">code</span>
                <div>
                  <div className="text-xs font-bold text-ink">Junior Robotics Club President</div>
                  <div className="text-[11px] text-ink">Designed automated campus trash sorter on Arduino</div>
                </div>
              </div>
            </div>
          </div>

          {/* Health & Medical Telemetry */}
          <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-base">health_and_safety</span>
              <span>Campus Health & Vitals</span>
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-ink-muted">Blood Group</div>
                <div className="font-bold text-rose-700 mt-0.5">{student.bloodGroup}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-ink-muted">Vision / Spectacles</div>
                <div className="font-bold text-ink mt-0.5">-1.25 D (Both)</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-ink-muted">Allergies</div>
                <div className="font-bold text-ink mt-0.5">Penicillin (Mild)</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-ink-muted">Emergency Inf.</div>
                <div className="font-bold text-emerald-700 mt-0.5">Campus Sickbay OK</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
              Annual health physical cleared on 12 Nov 2024 by Dr. K. Meenakshi (School Medical Officer).
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academics */}
      {activeTab === 'academics' && (
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Subject Master Scorecards (CBSE Class 10 Curriculum)</h2>
            <button
              onClick={handleExportMarksheet}
              className="text-xs bg-subtle hover:bg-lumen-100 text-brand font-semibold px-3 py-1.5 rounded-lg border border-line flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export Term Marksheet (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-subtle text-ink-soft font-semibold border-b border-line">
                <tr>
                  <th className="p-3">Subject Code & Name</th>
                  <th className="p-3">Mentor / Faculty</th>
                  <th className="p-3">Term 1 (100)</th>
                  <th className="p-3">Term 2 (100)</th>
                  <th className="p-3">Pre-Board (80)</th>
                  <th className="p-3">Practicals (20)</th>
                  <th className="p-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                <tr>
                  <td className="p-3 font-bold text-ink">086 • Science (Physics, Chem, Bio)</td>
                  <td className="p-3 text-ink-soft">Mrs. Malini Iyer</td>
                  <td className="p-3 font-mono">94</td>
                  <td className="p-3 font-mono">96</td>
                  <td className="p-3 font-mono">76 / 80</td>
                  <td className="p-3 font-mono text-emerald-700 font-bold">20 / 20</td>
                  <td className="p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">A1</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-ink">041 • Mathematics Standard</td>
                  <td className="p-3 text-ink-soft">Dr. V. Raghavan</td>
                  <td className="p-3 font-mono">92</td>
                  <td className="p-3 font-mono">90</td>
                  <td className="p-3 font-mono">74 / 80</td>
                  <td className="p-3 font-mono text-emerald-700 font-bold">19 / 20</td>
                  <td className="p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">A1</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-ink">184 • English Language & Literature</td>
                  <td className="p-3 text-ink-soft">Ms. Clara D’Souza</td>
                  <td className="p-3 font-mono">88</td>
                  <td className="p-3 font-mono">91</td>
                  <td className="p-3 font-mono">71 / 80</td>
                  <td className="p-3 font-mono text-emerald-700 font-bold">19 / 20</td>
                  <td className="p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">A1</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-ink">087 • Social Science</td>
                  <td className="p-3 text-ink-soft">Mrs. Priya Mohan</td>
                  <td className="p-3 font-mono">86</td>
                  <td className="p-3 font-mono">89</td>
                  <td className="p-3 font-mono">68 / 80</td>
                  <td className="p-3 font-mono text-emerald-700 font-bold">18 / 20</td>
                  <td className="p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">A2</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Attendance Matrix */}
      {activeTab === 'attendance' && (
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">February 2025 Biometric Punch Calendar</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded"></span> Present (21)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded"></span> Late (1)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-500 rounded"></span> Absent (0)</span>
            </div>
          </div>

          {/* Mini Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="font-bold text-ink-muted py-1">{day}</div>
            ))}
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => {
              const isSunday = d % 7 === 0;
              const isSaturday = (d + 1) % 7 === 0;
              const isLate = d === 12;
              return (
                <div
                  key={d}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isSunday || isSaturday
                      ? 'bg-slate-100 text-slate-400 border-slate-200'
                      : isLate
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  <div>{d}</div>
                  <div className="text-[9px] font-normal opacity-80">
                    {isSunday || isSaturday ? 'Holiday' : isLate ? '08:14 AM' : '07:44 AM'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Transport & Hostel */}
      {(activeTab === 'transport' || activeTab === 'hostel') && (
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-ink">Route #14 Transit Manifest & Residential Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-subtle rounded-xl border border-line">
              <div className="text-xs font-bold text-ink mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-brand">directions_bus</span>
                <span>Fleet Telemetry: Bus #12 (TN-07-BW-4821)</span>
              </div>
              <div className="text-xs space-y-1 text-ink-soft">
                <div>Boarding Stop: <strong>Velachery Bypass Junction</strong> (07:44 AM)</div>
                <div>Allocated Seat: <strong>Seat 12B (Window)</strong></div>
                <div>Driver: <strong>G. Murugan (+91 94441 98765)</strong></div>
                <div className="text-emerald-700 font-semibold pt-1">RFID Card Tap In: 07:44:12 AM Verified</div>
              </div>
            </div>

            <div className="p-4 bg-subtle rounded-xl border border-line">
              <div className="text-xs font-bold text-ink mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-brand">night_shelter</span>
                <span>Residential Hostel Allocation</span>
              </div>
              <div className="text-xs space-y-1 text-ink-soft">
                <div>Building Block: <strong>Godavari Hall (Senior Boys)</strong></div>
                <div>Room Number: <strong>Room #204 (Air-Cooled 2-Sharing)</strong></div>
                <div>Roommate: <strong>Chetan R. Varma (Class 10-A)</strong></div>
                <div>Warden: <strong>Prof. S. Natarajan (+91 98403 44556)</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: DPDPA Statutory Consent */}
      {activeTab === 'compliance' && (
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-base">verified_user</span>
              <span>DPDPA 2023 Statutory Minor Consent Ledger</span>
            </h2>
            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
              VERIFIED COMPLIANT
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { purpose: 'Biometric Turnstile Facial & Fingerprint Recognition', status: 'Consented by Sundar Ramanathan on 02 Jun 2024 via OTP' },
              { purpose: 'Campus CCTV Surveillance & Hallway Safety Feeds', status: 'Consented by Sundar Ramanathan on 02 Jun 2024 via OTP' },
              { purpose: 'AIS-140 Transport GPS Telemetry & Geo-fencing Alerts', status: 'Consented by Sundar Ramanathan on 02 Jun 2024 via OTP' },
              { purpose: 'AI LMS Homework Analytics & Plagiarism Checking', status: 'Consented by Sundar Ramanathan on 02 Jun 2024 via OTP' },
            ].map((c, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-ink">{c.purpose}</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">{c.status}</div>
                </div>
                <span className="material-symbols-outlined text-emerald-700 text-base">check_circle</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {editingIds && record && <EditIdentifiersModal student={record} onClose={() => setEditingIds(false)} />}
    </div>
  );
};
