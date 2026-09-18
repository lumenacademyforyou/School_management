import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Figure } from '../../components/common/Figure';

interface FacultyMember {
  id: string;
  code: string;
  name: string;
  designation: 'PGT Senior Faculty' | 'TGT Faculty' | 'PRT Primary' | 'HOD Department Lead';
  subject: string;
  classes: string;
  weeklyLoad: number; // periods
  maxLoad: number;
  classTeacherOf?: string;
  syllabusCoverage: number; // percentage
  lessonPlansSubmitted: number;
  lessonPlansApproved: number;
  qualification: string;
  status: 'Active Duty' | 'On Leave' | 'CPD Training';
}

export const TeacherManagementView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'roster' | 'lesson-plans' | 'competency' | 'cpd'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<FacultyMember | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Assign load form state
  const [assignTeacherId, setAssignTeacherId] = useState('TCH-001');
  const [assignClass, setAssignClass] = useState('Grade 10-A');
  const [assignSubject, setAssignSubject] = useState('Advanced Mathematics');
  const [assignPeriods, setAssignPeriods] = useState('4');
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  const [teachers, setTeachers] = useState<FacultyMember[]>([
    {
      id: 'TCH-001',
      code: 'FAC-104',
      name: 'Dr. Meenakshi Sundaram',
      designation: 'HOD Department Lead',
      subject: 'Mathematics (PGT)',
      classes: 'Grade 11-A, 12-A, 12-B',
      weeklyLoad: 24,
      maxLoad: 28,
      classTeacherOf: 'Grade 12-A',
      syllabusCoverage: 88,
      lessonPlansSubmitted: 16,
      lessonPlansApproved: 16,
      qualification: 'Ph.D Mathematics, M.Ed, CTET Certified',
      status: 'Active Duty',
    },
    {
      id: 'TCH-002',
      code: 'FAC-109',
      name: 'V. S. Raghavan',
      designation: 'PGT Senior Faculty',
      subject: 'Physics (PGT)',
      classes: 'Grade 10-A, 11-B, 12-B',
      weeklyLoad: 26,
      maxLoad: 28,
      classTeacherOf: 'Grade 11-B',
      syllabusCoverage: 82,
      lessonPlansSubmitted: 15,
      lessonPlansApproved: 14,
      qualification: 'M.Sc Physics, B.Ed',
      status: 'Active Duty',
    },
    {
      id: 'TCH-003',
      code: 'FAC-122',
      name: 'Deepa Narayan',
      designation: 'TGT Faculty',
      subject: 'English & Literature',
      classes: 'Grade 8-A, 9-B, 10-B',
      weeklyLoad: 22,
      maxLoad: 28,
      classTeacherOf: 'Grade 9-B',
      syllabusCoverage: 91,
      lessonPlansSubmitted: 18,
      lessonPlansApproved: 18,
      qualification: 'M.A English, B.Ed, Cambridge CELTA',
      status: 'Active Duty',
    },
    {
      id: 'TCH-004',
      code: 'FAC-135',
      name: 'K. S. Ramanathan',
      designation: 'PGT Senior Faculty',
      subject: 'Computer Science & AI',
      classes: 'Grade 11-C, 12-C',
      weeklyLoad: 20,
      maxLoad: 28,
      syllabusCoverage: 79,
      lessonPlansSubmitted: 14,
      lessonPlansApproved: 12,
      qualification: 'M.Tech CSE, GATE Qualified',
      status: 'On Leave',
    },
    {
      id: 'TCH-005',
      code: 'FAC-148',
      name: 'Archana Devi',
      designation: 'PRT Primary',
      subject: 'Environmental Science & Social',
      classes: 'Grade 4-A, 5-B',
      weeklyLoad: 25,
      maxLoad: 28,
      classTeacherOf: 'Grade 5-B',
      syllabusCoverage: 94,
      lessonPlansSubmitted: 20,
      lessonPlansApproved: 20,
      qualification: 'B.Sc Botany, D.El.Ed',
      status: 'CPD Training',
    },
  ]);

  const filteredTeachers = teachers.filter(
    t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprovePlan = (teacherId: string) => {
    setTeachers(prev =>
      prev.map(t =>
        t.id === teacherId
          ? { ...t, lessonPlansApproved: Math.min(t.lessonPlansSubmitted, t.lessonPlansApproved + 1) }
          : t
      )
    );
    addToast('Lesson Plan certified and approved by Academic Coordinator (TCH-016)', 'success');
  };

  const handleAssignLoad = (e: React.FormEvent) => {
    e.preventDefault();
    const periodsNum = parseInt(assignPeriods) || 4;
    setTeachers(prev =>
      prev.map(t => {
        if (t.id === assignTeacherId) {
          const updatedClasses = t.classes.includes(assignClass) ? t.classes : `${t.classes}, ${assignClass}`;
          return {
            ...t,
            classes: updatedClasses,
            weeklyLoad: Math.min(t.maxLoad, t.weeklyLoad + periodsNum),
            classTeacherOf: isClassTeacher ? assignClass : t.classTeacherOf,
          };
        }
        return t;
      })
    );
    const targetTeacher = teachers.find(t => t.id === assignTeacherId);
    setShowAssignModal(false);
    addToast(`Successfully assigned ${assignClass} (${assignSubject}, +${periodsNum} periods/wk) to ${targetTeacher?.name || 'Faculty'} (TCH-002)`, 'success');
  };

  const handleExportAllPlans = () => {
    const manifest = [
      'Faculty Code,Name,Subject,Classes,Assigned Weekly Load,Submitted NoL Units,Approved NoL Units,Syllabus %',
      ...teachers.map(t => `${t.code},"${t.name}","${t.subject}","${t.classes}",${t.weeklyLoad}/${t.maxLoad},${t.lessonPlansSubmitted},${t.lessonPlansApproved},${t.syllabusCoverage}%`)
    ].join('\n');
    const blob = new Blob([manifest], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CBSE_NotesOfLesson_Workload_Register_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported weekly campus Notes of Lesson archive (CSV) for board inspection (TCH-021)', 'success');
  };

  const handleGenerateInspectionPack = (teacher: FacultyMember) => {
    setSelectedTeacher(teacher);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              TCH · Module 36 · Layer 6 (People)
            </span>
            <span className="text-xs text-ink-muted">34 Master Features</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-ink mt-1">
            Teacher Management & Academic Pedagogical Governance
          </h1>
          <p className="text-xs md:text-sm text-ink-soft">
            Class teacher allocations, teaching workload distribution, Notes of Lesson (planned vs actual), HOD approvals, and CBSE inspection packs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">assignment_ind</span>
            <span>Assign Load / Class</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Total Teaching Faculty</div>
          <div className="text-xl font-bold font-mono text-ink mt-1">174 Faculty</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5"><Figure value="100" suffix="%" /> CTET / B.Ed Qualified</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Avg Teaching Load (TCH-005)</div>
          <div className="text-xl font-bold font-mono text-ink mt-1">23.4 / 28 hrs</div>
          <div className="text-[11px] text-ink-muted mt-0.5">CBSE Max Cap: 28 periods/week</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Syllabus Coverage (TCH-015)</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1"><Figure value="86.8" suffix="%" /> Avg</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">+4.2% ahead of term plan</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Notes of Lesson Approval (TCH-016)</div>
          <div className="text-xl font-bold font-mono text-ink mt-1"><Figure value="96.2" suffix="%" /> Approved</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Reviewed weekly by HODs</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line-soft pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'roster' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">badge</span>
          <span>Faculty Directory & Teaching Load (TCH-001/005)</span>
        </button>
        <button
          onClick={() => setActiveTab('lesson-plans')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'lesson-plans' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">menu_book</span>
          <span>Notes of Lesson & Syllabus Tracking (TCH-010..015)</span>
        </button>
        <button
          onClick={() => setActiveTab('competency')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'competency' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">psychology</span>
          <span>Subject Competency Matrix (TCH-002)</span>
        </button>
        <button
          onClick={() => setActiveTab('cpd')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'cpd' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">school</span>
          <span>Training & 50-Hour CPD Record (TCH-028)</span>
        </button>
      </div>

      {/* Tab 1: Faculty Directory & Workload */}
      {activeTab === 'roster' && (
        <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
          <div className="p-4 border-b border-line-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-sm text-ink-muted">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search faculty by name, code, subject..."
                className="w-full bg-wash border border-line-soft rounded-xl pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:border-brand"
              />
            </div>
            <div className="text-xs text-ink-muted">
              Showing <span className="font-bold text-ink">{filteredTeachers.length}</span> educators
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-ink-soft border-b border-line-soft text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Subject & Role</th>
                  <th className="py-3 px-4">Classes Assigned</th>
                  <th className="py-3 px-4 text-center">Weekly Load</th>
                  <th className="py-3 px-4 text-center">Syllabus %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {filteredTeachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-wash transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-ink">{teacher.name}</div>
                      <div className="text-[10px] text-ink-muted font-mono">{teacher.code} • {teacher.qualification}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{teacher.subject}</div>
                      <div className="text-[10px] text-brand font-semibold">{teacher.designation}</div>
                      {teacher.classTeacherOf && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded border border-amber-200">
                          CT: {teacher.classTeacherOf}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-ink-soft">{teacher.classes}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-mono font-bold text-ink">
                        {teacher.weeklyLoad} / {teacher.maxLoad}
                      </div>
                      <div className="w-16 h-1 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            teacher.weeklyLoad > 26 ? 'bg-amber-500' : 'bg-brand'
                          }`}
                          style={{ width: `${(teacher.weeklyLoad / teacher.maxLoad) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-emerald-700"><Figure value={teacher.syllabusCoverage} suffix="%" /></span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          teacher.status === 'Active Duty'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : teacher.status === 'CPD Training'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleGenerateInspectionPack(teacher)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-brand hover:text-white text-ink rounded text-xs font-bold transition-all"
                        title="Generate CBSE Inspection Dossier"
                      >
                        Inspection Pack
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Notes of Lesson & Syllabus Tracking */}
      {activeTab === 'lesson-plans' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line-soft pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink">Notes of Lesson (NoL) & Planned vs. Actual Tracking (TCH-010..014)</h3>
              <p className="text-xs text-ink-muted">Weekly pedagogical unit plans submitted for HOD review & NEP 2020 competency alignment</p>
            </div>
            <button
              onClick={handleExportAllPlans}
              className="px-3 py-1.5 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export All Unit Plans</span>
            </button>
          </div>

          <div className="space-y-3">
            {teachers.map(teacher => (
              <div key={teacher.id} className="p-4 bg-wash rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-ink">{teacher.name} — {teacher.subject}</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    Assigned: {teacher.classes} • Submitted Units: <span className="font-bold text-ink">{teacher.lessonPlansSubmitted}</span> • Approved: <span className="font-bold text-emerald-700">{teacher.lessonPlansApproved}</span>
                  </div>
                  <div className="text-[11px] text-ink-soft mt-1 font-mono">
                    Current Unit: "Trigonometric Functions & Vector Algebra" (Lesson 4 of 6 · Bloom: Analyze)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {teacher.lessonPlansSubmitted > teacher.lessonPlansApproved ? (
                    <button
                      onClick={() => handleApprovePlan(teacher.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Review & Approve NoL</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Certified Up to Date</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Competency Matrix */}
      {activeTab === 'competency' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ink">Subject Competency & Skill Matrix (TCH-002)</h3>
            <p className="text-xs text-ink-muted">Verified faculty subject qualifications across Primary, Secondary, and Senior Secondary CBSE levels</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="font-bold text-sm text-ink">Science & Mathematics Dept</div>
              <div className="text-ink-muted">28 Faculty Members • 12 Postgraduates • 4 Ph.D</div>
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between"><span>Advanced Calculus:</span> <span className="font-bold text-emerald-700">9 Qualified</span></div>
                <div className="flex justify-between"><span>Quantum & Optics Lab:</span> <span className="font-bold text-emerald-700">7 Qualified</span></div>
                <div className="flex justify-between"><span>Organic Chemistry:</span> <span className="font-bold text-emerald-700">6 Qualified</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="font-bold text-sm text-ink">Languages & Humanities</div>
              <div className="text-ink-muted">32 Faculty Members • English, Tamil, Hindi, Sanskrit</div>
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between"><span>Creative Writing & Drama:</span> <span className="font-bold text-emerald-700">14 Qualified</span></div>
                <div className="flex justify-between"><span>Linguistic Translation:</span> <span className="font-bold text-emerald-700">11 Qualified</span></div>
                <div className="flex justify-between"><span>CBSE Board Evaluator:</span> <span className="font-bold text-emerald-700">8 Certified</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="font-bold text-sm text-ink">Computer Science & AI Lab</div>
              <div className="text-ink-muted">14 Faculty Members • Python, Robotics, Data Science</div>
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between"><span>Python & MySQL (Code 083):</span> <span className="font-bold text-emerald-700">12 Qualified</span></div>
                <div className="flex justify-between"><span>AI & Robotics (Code 417):</span> <span className="font-bold text-emerald-700">8 Qualified</span></div>
                <div className="flex justify-between"><span>Cyber Safety Trainer:</span> <span className="font-bold text-emerald-700">6 Certified</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: CPD Training */}
      {activeTab === 'cpd' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">NEP 2020 Mandatory 50-Hour Continuous Professional Development (CPD) (TCH-028)</h3>
              <p className="text-xs text-ink-muted">Compliance register tracking workshops, DIKSHA modules, and CBSE capacity building programmes</p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200">
              Institutional Average: 44.6 / 50 hrs
            </span>
          </div>

          <div className="p-4 bg-subtle rounded-xl border border-line text-xs text-ink-soft space-y-1">
            <div className="font-bold text-brand">Recent Completed Institutional Workshops:</div>
            <div>• "Experiential Learning in Secondary Science" — CBSE COE Chennai (12 hrs)</div>
            <div>• "NEP 2020 Holistic Progress Card (HPC) Rubrics Implementation" (15 hrs)</div>
            <div>• "Cyber Security & Child Safety under DPDPA 2023" — LumenAcademy Legal Cell (8 hrs)</div>
          </div>
        </div>
      )}

      {/* MODAL 1: Assign Workload & Class Teacher Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">assignment_ind</span>
                <h3 className="font-bold text-ink text-sm">Assign Faculty Workload & Classes (TCH-002)</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAssignLoad} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Faculty Educator</label>
                <select
                  value={assignTeacherId}
                  onChange={e => setAssignTeacherId(e.target.value)}
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code} • {t.subject} • Current: {t.weeklyLoad}/{t.maxLoad} periods)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Class / Section</label>
                  <select
                    value={assignClass}
                    onChange={e => setAssignClass(e.target.value)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="Grade 10-A">Grade 10-A</option>
                    <option value="Grade 10-B">Grade 10-B</option>
                    <option value="Grade 11-A">Grade 11-A</option>
                    <option value="Grade 11-B">Grade 11-B</option>
                    <option value="Grade 12-A">Grade 12-A</option>
                    <option value="Grade 12-B">Grade 12-B</option>
                    <option value="Grade 9-A">Grade 9-A</option>
                    <option value="Grade 9-B">Grade 9-B</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={assignSubject}
                    onChange={e => setAssignSubject(e.target.value)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Weekly Periods</label>
                <select
                  value={assignPeriods}
                  onChange={e => setAssignPeriods(e.target.value)}
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                >
                  <option value="2">2 Periods / Week</option>
                  <option value="4">4 Periods / Week (Standard)</option>
                  <option value="6">6 Periods / Week (Lab & Core)</option>
                  <option value="8">8 Periods / Week (Senior Core)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={isClassTeacher}
                  onChange={e => setIsClassTeacher(e.target.checked)}
                  className="accent-brand rounded"
                />
                <span className="text-amber-950 font-semibold text-xs">
                  Designate as Official Class Teacher for {assignClass}
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CBSE Faculty Inspection Dossier Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">verified_user</span>
                <h3 className="font-bold text-ink text-sm">CBSE Faculty Inspection Dossier (TCH-022)</h3>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Dossier Content Sheet */}
            <div className="border border-slate-300 rounded-xl p-5 bg-wash space-y-4 text-xs text-ink">
              <div className="text-center border-b pb-3">
                <div className="font-black text-base">LUMEN ACADEMY SENIOR SECONDARY SCHOOL</div>
                <div className="text-[11px] text-slate-500">Board Affiliation No. 1930412 • Faculty Verification Record</div>
                <div className="inline-block mt-1 px-3 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[11px]">
                  OFFICIAL CBSE AFFILIATION & INSPECTION DOSSIER
                </div>
              </div>

              {/* Faculty Summary Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
                <div>Faculty Name: <strong>{selectedTeacher.name}</strong></div>
                <div className="text-right">Code: <strong className="font-mono">{selectedTeacher.code}</strong></div>
                <div>Designation: <strong>{selectedTeacher.designation}</strong></div>
                <div className="text-right">Status: <strong className="text-emerald-700">{selectedTeacher.status}</strong></div>
                <div>Subject Department: <strong>{selectedTeacher.subject}</strong></div>
                <div className="text-right">Weekly Load: <strong className="font-mono">{selectedTeacher.weeklyLoad} / {selectedTeacher.maxLoad} periods</strong></div>
                <div>Academic Qualifications: <strong>{selectedTeacher.qualification}</strong></div>
                <div className="text-right">Class Teacher: <strong>{selectedTeacher.classTeacherOf || 'None Assigned'}</strong></div>
                <div>Classes Handled: <strong>{selectedTeacher.classes}</strong></div>
                <div className="text-right">Syllabus Coverage: <strong className="text-emerald-700"><Figure value={selectedTeacher.syllabusCoverage} suffix="%" /></strong></div>
              </div>

              {/* Notes of Lesson Audit */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex justify-between">
                  <span>Pedagogical Unit Plans (Notes of Lesson)</span>
                  <span className="text-emerald-700">{selectedTeacher.lessonPlansApproved} / {selectedTeacher.lessonPlansSubmitted} Certified</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Term 2 Unit 4: "Differential Equations & Mathematical Modeling"</span>
                    <span className="font-mono text-emerald-700 font-bold">Approved by HOD</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Bloom's Taxonomy: Evaluation & Creation • NEP 2020 Real-world application</span>
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              {/* 50-Hour CPD Register */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex justify-between">
                  <span>NEP 2020 Continuous Professional Development (50-Hour Mandate)</span>
                  <span className="text-emerald-700 font-bold">48 / 50 Hours Completed</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] space-y-1 text-slate-600">
                  <div>✓ CBSE COE: "Pedagogical Leadership & Art-Integrated Learning" (16 Hours)</div>
                  <div>✓ DIKSHA: "Foundational Literacy & Holistic Progress Card (HPC)" (18 Hours)</div>
                  <div>✓ Institutional: "DPDPA 2023 Student Data Privacy & Safe Lab Protocols" (14 Hours)</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                <div>Digital Certificate Stamp: <strong className="font-mono">SHA256:d8c199..cbse_verified</strong></div>
                <div>Superintendent of Examination</div>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={() => {
                  window.print();
                  addToast('Dispatched Faculty Dossier to print dialog', 'info');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Official Dossier</span>
              </button>

              <button
                onClick={() => {
                  const dossierText = `CBSE FACULTY INSPECTION DOSSIER\nFaculty: ${selectedTeacher.name} (${selectedTeacher.code})\nDesignation: ${selectedTeacher.designation}\nQualifications: ${selectedTeacher.qualification}\nClasses: ${selectedTeacher.classes}\nWorkload: ${selectedTeacher.weeklyLoad}/${selectedTeacher.maxLoad} periods\nNoL Units Approved: ${selectedTeacher.lessonPlansApproved}/${selectedTeacher.lessonPlansSubmitted}\nCPD Hours: 48/50 Completed\nStatus: Certified Valid`;
                  const link = document.createElement('a');
                  link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(dossierText);
                  link.download = `CBSE_Dossier_${selectedTeacher.code}_${selectedTeacher.name.replace(/\s+/g, '_')}.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  addToast(`Downloaded CBSE Inspection Dossier for ${selectedTeacher.name}`, 'success');
                  setSelectedTeacher(null);
                }}
                className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Download Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
