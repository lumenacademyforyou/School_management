import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface StudentHpc {
  rollNo: string;
  name: string;
  totalScore: string;
  percentage: string;
  grade: string;
  hpcStatus: string;
  published: boolean;
}

export const ReportCardsView: React.FC = () => {
  const { addToast } = useApp();
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [selectedTerm, setSelectedTerm] = useState('Term 2 / Pre-Board');
  const [activeTab, setActiveTab] = useState<'hpc' | 'marksheet'>('hpc');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState(false);

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<StudentHpc | null>(null);
  const [showRubricDesigner, setShowRubricDesigner] = useState(false);

  // Rubric weights
  const [selfWeight, setSelfWeight] = useState(20);
  const [peerWeight, setPeerWeight] = useState(20);
  const [teacherWeight, setTeacherWeight] = useState(60);

  const [students, setStudents] = useState<StudentHpc[]>([
    { rollNo: '1001', name: 'Ananya Sundaram', totalScore: '488 / 500', percentage: '97.6%', grade: 'A1', hpcStatus: '360° Completed', published: true },
    { rollNo: '1002', name: 'Rohan Sharma', totalScore: '462 / 500', percentage: '92.4%', grade: 'A1', hpcStatus: '360° Completed', published: true },
    { rollNo: '1003', name: 'Diya Krishnan', totalScore: '445 / 500', percentage: '89.0%', grade: 'A2', hpcStatus: 'Self-Review Pending', published: false },
    { rollNo: '1004', name: 'Siddharth M.', totalScore: '420 / 500', percentage: '84.0%', grade: 'A2', hpcStatus: '360° Completed', published: false },
    { rollNo: '1005', name: 'Kavitha R.', totalScore: '395 / 500', percentage: '79.0%', grade: 'B1', hpcStatus: '360° Completed', published: false },
  ]);

  const handleBulkGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedBatch(true);
      addToast(`Generated 240 Holistic Progress Cards for ${selectedGrade} with digital principal seal`, 'success');
    }, 1000);
  };

  const handlePublishToParentApp = () => {
    setStudents(prev => prev.map(s => ({ ...s, published: true, hpcStatus: '360° Completed' })));
    addToast('Published report cards directly to Parent Mobile App (RCD-010)', 'success');
  };

  const handleSaveRubric = (e: React.FormEvent) => {
    e.preventDefault();
    if (selfWeight + peerWeight + teacherWeight !== 100) {
      addToast('Total weightage must sum exactly to 100%', 'warning');
      return;
    }
    setShowRubricDesigner(false);
    addToast(`NEP 2020 Rubric updated: Self ${selfWeight}%, Peer ${peerWeight}%, Teacher ${teacherWeight}%`, 'success');
  };

  const handleDownloadZipArchive = () => {
    const manifest = `CBSE Class 10 HPC Batch Render Manifest\nTotal Cards: 240\nTerm: ${selectedTerm}\nGenerated: ${new Date().toISOString()}`;
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(manifest);
    link.download = `LumenAcademy_HPC_${selectedGrade.replace(/\s+/g, '_')}_Archive.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded bulk report cards archive (ZIP/PDF)', 'success');
  };

  const handleExportMarksheet = () => {
    const csvRows = [
      'Roll No,Student Name,Mathematics,Science,English,Social Studies,AI/IT,Total Score,Percentage,Grade',
      ...students.map(s => `${s.rollNo},"${s.name}",98,96,94,91,99,${s.totalScore.split(' ')[0]},${s.percentage},${s.grade}`)
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Marksheet_${selectedGrade.replace(/\s+/g, '_')}_${selectedTerm.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Consolidated Class Marksheet (CSV/XLSX)', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#f0f7fb] text-[#0e5d84]">
              RCD · Module 17
            </span>
            <span className="text-xs text-[#777587]">14 Master Features</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#082b3d] mt-1">
            Report Cards & Holistic Progress Card (HPC)
          </h1>
          <p className="text-xs md:text-sm text-[#464555]">
            NEP 2020 360-degree holistic student evaluation, CBSE board templates, automated bulk rendering, and instant Parent App digital release.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {generatedBatch && (
            <button
              onClick={handleDownloadZipArchive}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">folder_zip</span>
              <span>Download Batch ZIP</span>
            </button>
          )}
          <button
            onClick={handleBulkGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>{isGenerating ? 'Rendering PDFs...' : 'Bulk Render Report Cards'}</span>
          </button>
          <button
            onClick={handlePublishToParentApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            <span>Publish to App</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e0ecf4] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#777587] uppercase mb-1">Class / Grade</label>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="bg-[#f8f9ff] border border-[#e0ecf4] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#082b3d]"
            >
              <option value="Grade 10">Grade 10 (Secondary Board)</option>
              <option value="Grade 12">Grade 12 (Senior Secondary)</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 8">Grade 8</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#777587] uppercase mb-1">Evaluation Term</label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="bg-[#f8f9ff] border border-[#e0ecf4] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#082b3d]"
            >
              <option value="Term 2 / Pre-Board">Term 2 / Pre-Board Examination</option>
              <option value="Mid-Term">Mid-Term Assessment</option>
              <option value="Annual Board Finals">Annual Board Finals</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('hpc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hpc' ? 'bg-[#0e5d84] text-white shadow-xs' : 'text-[#464555] hover:bg-[#f0f7fb]'
            }`}
          >
            HPC 360° Evaluation (RCD-003)
          </button>
          <button
            onClick={() => setActiveTab('marksheet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'marksheet' ? 'bg-[#0e5d84] text-white shadow-xs' : 'text-[#464555] hover:bg-[#f0f7fb]'
            }`}
          >
            Consolidated Marksheet (RCD-013)
          </button>
        </div>
      </div>

      {/* Tab 1: HPC 360 Evaluation */}
      {activeTab === 'hpc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Roster (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#e0ecf4] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#082b3d]">Students Roster & HPC Readiness</h3>
              <span className="text-xs text-[#777587]">{students.length} Evaluated</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[#464555] border-b border-[#e0ecf4] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">CBSE Grade</th>
                  <th className="py-3 px-4 text-center">HPC Status</th>
                  <th className="py-3 px-4 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {students.map(s => (
                  <tr key={s.rollNo} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0e5d84]">{s.rollNo}</td>
                    <td className="py-3 px-4 font-bold text-[#082b3d]">{s.name}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#082b3d]">{s.totalScore}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-[#f0f7fb] text-[#0e5d84] font-mono font-bold text-xs">
                        {s.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          s.hpcStatus.includes('Completed')
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {s.hpcStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="text-xs text-[#0e5d84] font-bold hover:underline"
                      >
                        View HPC Card →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* HPC Rubric Summary Canvas (1 col) */}
          <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
            <div className="border-b border-[#e0ecf4] pb-3">
              <h3 className="text-sm font-bold text-[#082b3d]">NEP 2020 Holistic Progress Card Structure</h3>
              <p className="text-xs text-[#777587]">Multidimensional evaluation model</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-950 flex items-center justify-between">
                  <span>1. Self Assessment (Student)</span>
                  <span className="font-mono text-amber-800">Weight: {selfWeight}%</span>
                </div>
                <p className="text-amber-900 text-[11px]">
                  Self-reflection on learning goals, curiosity, and habits of mind.
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                <div className="font-bold text-blue-950 flex items-center justify-between">
                  <span>2. Peer Assessment (Classmate)</span>
                  <span className="font-mono text-blue-700">Weight: {peerWeight}%</span>
                </div>
                <p className="text-blue-900 text-[11px]">
                  Collaboration, peer respect, communication, and sportsmanship.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>3. Teacher Assessment (Subject & Class)</span>
                  <span className="font-mono text-emerald-700">Weight: {teacherWeight}%</span>
                </div>
                <p className="text-emerald-900 text-[11px]">
                  Academic domain mastery, conceptual understanding, and attendance (96.4%).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRubricDesigner(true)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl text-xs font-bold transition-all"
            >
              Configure HPC Rubric Parameters
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Marksheet */}
      {activeTab === 'marksheet' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#082b3d]">Consolidated Class Marksheet Matrix (RCD-013)</h3>
              <p className="text-xs text-[#777587]">Board format with theory, practical, and internal assessment splits</p>
            </div>
            <button
              onClick={handleExportMarksheet}
              className="px-3.5 py-1.5 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export Marksheet (CSV)</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono">
            Previewing: {selectedGrade} • 5 Core Subjects (Mathematics, Science, English, Social Studies, AI / IT)
            with automatic pass criteria calculation (minimum 33% combined).
          </div>
        </div>
      )}

      {/* MODAL 1: Interactive Holistic Progress Card (HPC) Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e5d84]">assignment</span>
                <h3 className="font-bold text-[#082b3d] text-sm">NEP 2020 Holistic Progress Card (HPC)</h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* HPC Printable Sheet */}
            <div className="border border-slate-300 rounded-xl p-6 bg-[#fafcff] space-y-5 text-xs text-[#082b3d]">
              <div className="text-center border-b pb-3 space-y-0.5">
                <div className="font-black text-base text-[#082b3d]">LUMEN ACADEMY SENIOR SECONDARY SCHOOL</div>
                <div className="text-[11px] text-[#464555]">(Affiliated to CBSE, New Delhi • Affiliation No. 1930412 • School Code 55192)</div>
                <div className="inline-block mt-1 px-3 py-0.5 bg-[#f0f7fb] text-[#0e5d84] border border-[#cbe0ec] rounded text-[11px] font-bold">
                  HOLISTIC PROGRESS CARD (HPC) • {selectedTerm.toUpperCase()}
                </div>
              </div>

              {/* Student Demographics */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>Student Name: <strong>{selectedStudent.name}</strong></div>
                <div className="text-right">Roll No: <strong>{selectedStudent.rollNo}</strong></div>
                <div>Class & Section: <strong>{selectedGrade} - Section A</strong></div>
                <div className="text-right">APAAR ID: <strong className="font-mono">9012-4410-8821</strong></div>
                <div>Academic Term: <strong>{selectedTerm}</strong></div>
                <div className="text-right">Attendance: <strong className="text-emerald-700">97.1% (204/210 Days)</strong></div>
              </div>

              {/* 360 Evaluation Radar Scores */}
              <div className="space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-[#0e5d84]">1. Multidimensional 360° Review</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="text-[10px] uppercase font-bold text-amber-800">Self Review ({selfWeight}%)</div>
                    <div className="text-lg font-bold font-mono text-amber-900 mt-1">9.4 / 10</div>
                    <div className="text-[10px] text-amber-700">Curiosity & Reflection</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-[10px] uppercase font-bold text-blue-800">Peer Review ({peerWeight}%)</div>
                    <div className="text-lg font-bold font-mono text-blue-900 mt-1">9.2 / 10</div>
                    <div className="text-[10px] text-blue-700">Empathy & Teamwork</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">Teacher Review ({teacherWeight}%)</div>
                    <div className="text-lg font-bold font-mono text-emerald-900 mt-1">9.6 / 10</div>
                    <div className="text-[10px] text-emerald-700">Concept Mastery</div>
                  </div>
                </div>
              </div>

              {/* Subject Academic Scores */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-[#0e5d84]">2. Scholastic Performance (CBSE Standards)</div>
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2">Subject</th>
                      <th className="p-2 text-center">Theory (80)</th>
                      <th className="p-2 text-center">Practical (20)</th>
                      <th className="p-2 text-center">Total (100)</th>
                      <th className="p-2 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-2 font-medium">Mathematics Standard (041)</td><td className="p-2 text-center font-mono">78</td><td className="p-2 text-center font-mono">20</td><td className="p-2 text-center font-mono font-bold">98</td><td className="p-2 text-center text-emerald-700 font-bold">A1</td></tr>
                    <tr><td className="p-2 font-medium">Science & Technology (086)</td><td className="p-2 text-center font-mono">76</td><td className="p-2 text-center font-mono">20</td><td className="p-2 text-center font-mono font-bold">96</td><td className="p-2 text-center text-emerald-700 font-bold">A1</td></tr>
                    <tr><td className="p-2 font-medium">English Language & Literature (184)</td><td className="p-2 text-center font-mono">75</td><td className="p-2 text-center font-mono">19</td><td className="p-2 text-center font-mono font-bold">94</td><td className="p-2 text-center text-emerald-700 font-bold">A1</td></tr>
                    <tr><td className="p-2 font-medium">Social Science (087)</td><td className="p-2 text-center font-mono">72</td><td className="p-2 text-center font-mono">19</td><td className="p-2 text-center font-mono font-bold">91</td><td className="p-2 text-center text-emerald-700 font-bold">A1</td></tr>
                    <tr><td className="p-2 font-medium">Artificial Intelligence (417)</td><td className="p-2 text-center font-mono">79</td><td className="p-2 text-center font-mono">20</td><td className="p-2 text-center font-mono font-bold">99</td><td className="p-2 text-center text-emerald-700 font-bold">A1</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks & Signatures */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                <div>
                  <span className="font-bold text-slate-800">Class Teacher's Remark:</span> "Exceptional academic leadership and peer collaborative spirit."
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">Dr. Meenakshi Sundaram</div>
                  <div>Principal & Board Examination Superintendent</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={() => {
                  window.print();
                  addToast('Dispatched HPC to system print dialog', 'info');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Official Card</span>
              </button>
              <button
                onClick={() => {
                  const cardContent = `LUMEN ACADEMY HOLISTIC PROGRESS CARD\nStudent: ${selectedStudent.name}\nRoll: ${selectedStudent.rollNo}\nScore: ${selectedStudent.totalScore} (${selectedStudent.percentage})\nGrade: ${selectedStudent.grade}`;
                  const link = document.createElement('a');
                  link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(cardContent);
                  link.download = `HPC_${selectedStudent.rollNo}_${selectedStudent.name.replace(/\s+/g, '_')}.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  addToast(`Downloaded Card Document for ${selectedStudent.name}`, 'success');
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Download Card File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rubric Parameter Designer */}
      {showRubricDesigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-[#082b3d] text-sm">Configure NEP 2020 Rubric Weights</h3>
              <button
                onClick={() => setShowRubricDesigner(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Set the multidimensional weightages according to your school board policy. The three dimensions must sum to 100%.
            </p>

            <form onSubmit={handleSaveRubric} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>1. Student Self-Assessment:</span>
                  <span className="font-mono font-bold text-[#0e5d84]">{selfWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={selfWeight}
                  onChange={e => setSelfWeight(Number(e.target.value))}
                  className="w-full accent-[#0e5d84]"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>2. Peer Assessment:</span>
                  <span className="font-mono font-bold text-[#0e5d84]">{peerWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={peerWeight}
                  onChange={e => setPeerWeight(Number(e.target.value))}
                  className="w-full accent-[#0e5d84]"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>3. Teacher Assessment:</span>
                  <span className="font-mono font-bold text-[#0e5d84]">{teacherWeight}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="5"
                  value={teacherWeight}
                  onChange={e => setTeacherWeight(Number(e.target.value))}
                  className="w-full accent-[#0e5d84]"
                />
              </div>

              <div className={`p-2.5 rounded-lg text-xs font-bold text-center ${selfWeight + peerWeight + teacherWeight === 100 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                Sum: {selfWeight + peerWeight + teacherWeight}% {selfWeight + peerWeight + teacherWeight === 100 ? '✓ (Valid 100%)' : '✗ (Must equal 100%)'}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRubricDesigner(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Rubric Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
