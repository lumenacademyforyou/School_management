import React from 'react';
import { useApp } from '../../context/AppContext';
import { STUDENTS_MOCK } from '../../data/mockData';

export const ParentAcademicsView: React.FC = () => {
  const { addToast } = useApp();
  const student = STUDENTS_MOCK[0]; // Aarav

  const subjects = [
    { name: 'Mathematics (Standard)', code: '041', marks: '96 / 100', grade: 'A1', percentile: '99.2%' },
    { name: 'Science (Physics/Chem/Bio)', code: '086', marks: '94 / 100', grade: 'A1', percentile: '98.8%' },
    { name: 'Social Science (History/Pol/Geo)', code: '087', marks: '92 / 100', grade: 'A1', percentile: '97.5%' },
    { name: 'English Language & Lit', code: '184', marks: '93 / 100', grade: 'A1', percentile: '98.1%' },
    { name: 'Sanskrit / Hindi Course B', code: '085', marks: '96 / 100', grade: 'A1', percentile: '99.0%' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">school</span>
            <span>Academic Performance & Competency Radar</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            CBSE Class 10 Pre-Board Assessment
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Cumulative Aggregate: <strong>94.2%</strong> • Scholastic Grade: <strong>A1 Outstanding</strong> • Rank: <strong>#02 in Class 10-A</strong>
          </p>
        </div>

        <button
          onClick={() => addToast('CBSE Pre-Board Digital Report Card downloaded', 'success')}
          className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          <span>Download Report Card PDF</span>
        </button>
      </div>

      {/* Subject Scorecard Table */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
          <span className="text-xs font-bold text-[#082b3d]">Scholastic Subject Mastery</span>
          <span className="text-xs text-[#0e5d84] font-bold">CGPA: 9.8 / 10</span>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-[#f0f7fb]/60 text-[#464555] font-semibold border-b border-[#cbe0ec]">
            <tr>
              <th className="p-3">Subject Name & Code</th>
              <th className="p-3">Score Obtained</th>
              <th className="p-3">CBSE Grade</th>
              <th className="p-3">National Percentile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f7fb]">
            {subjects.map(s => (
              <tr key={s.name} className="hover:bg-[#f8f9ff]">
                <td className="p-3">
                  <div className="font-bold text-[#082b3d]">{s.name}</div>
                  <div className="text-[10px] text-[#777587]">Subject Code: {s.code}</div>
                </td>
                <td className="p-3 font-mono font-bold text-xs text-[#082b3d]">{s.marks}</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {s.grade}
                  </span>
                </td>
                <td className="p-3 text-[#0e5d84] font-semibold font-mono">{s.percentile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Competency & Learning Trajectory */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#082b3d] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0e5d84] text-base">psychology</span>
          <span>AI Learning Diagnostic for Aarav</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
            <strong className="text-emerald-900 block">Top Strengths:</strong>
            <p className="text-emerald-800">
              Exceptional conceptual clarity in Optics and Coordinate Geometry. High speed and precision in solving 5-mark structured word problems.
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
            <strong className="text-amber-900 block">Recommended Focus:</strong>
            <p className="text-amber-800">
              Revise Section B (2-mark) precise definitions in Chemistry (Carbon and Its Compounds) to maximize perfect 100/100 score probability in Board exams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
