import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface GradeRow {
  studentId: string;
  name: string;
  rollNo: string;
  theoryMarks: number; // out of 30
  practicalMarks: number; // out of 15
  vivaMarks: number; // out of 5
  status: 'Draft' | 'Submitted';
}

export const FacultyGradebookView: React.FC = () => {
  const { addToast } = useApp();
  const [selectedAssessment, setSelectedAssessment] = useState<'FA-2' | 'Practical-Term2' | 'PeriodicTest-3'>('Practical-Term2');
  
  const [grades, setGrades] = useState<GradeRow[]>([
    { studentId: 'stu-1', name: 'Aarav S. Ramanathan', rollNo: '01', theoryMarks: 28, practicalMarks: 14, vivaMarks: 5, status: 'Draft' },
    { studentId: 'stu-2', name: 'Diya M. Sharma', rollNo: '02', theoryMarks: 29, practicalMarks: 15, vivaMarks: 5, status: 'Draft' },
    { studentId: 'stu-3', name: 'Kabir V. Nair', rollNo: '03', theoryMarks: 24, practicalMarks: 13, vivaMarks: 4, status: 'Draft' },
    { studentId: 'stu-4', name: 'Ananya P. Deshmukh', rollNo: '04', theoryMarks: 27, practicalMarks: 14, vivaMarks: 4, status: 'Draft' },
    { studentId: 'stu-5', name: 'Rohan K. Gupta', rollNo: '05', theoryMarks: 22, practicalMarks: 11, vivaMarks: 3, status: 'Draft' },
    { studentId: 'stu-6', name: 'Farah N. Siddiqui', rollNo: '06', theoryMarks: 26, practicalMarks: 13, vivaMarks: 4, status: 'Draft' },
    { studentId: 'stu-7', name: 'Tejas B. Patil', rollNo: '07', theoryMarks: 25, practicalMarks: 12, vivaMarks: 4, status: 'Draft' },
    { studentId: 'stu-8', name: 'Meera S. Pillai', rollNo: '08', theoryMarks: 28, practicalMarks: 14, vivaMarks: 5, status: 'Draft' },
    { studentId: 'stu-9', name: 'Advait C. Joshi', rollNo: '09', theoryMarks: 23, practicalMarks: 12, vivaMarks: 3, status: 'Draft' },
    { studentId: 'stu-10', name: 'Harini R. Krishnan', rollNo: '10', theoryMarks: 29, practicalMarks: 15, vivaMarks: 5, status: 'Draft' },
  ]);

  const updateMarks = (studentId: string, field: 'theoryMarks' | 'practicalMarks' | 'vivaMarks', value: number) => {
    setGrades(prev =>
      prev.map(row => (row.studentId === studentId ? { ...row, [field]: value } : row))
    );
  };

  const calculateTotal = (row: GradeRow) => row.theoryMarks + row.practicalMarks + row.vivaMarks;

  const calculateGrade = (total: number) => {
    if (total >= 46) return { grade: 'A1', color: 'text-emerald-700 bg-emerald-100' };
    if (total >= 41) return { grade: 'A2', color: 'text-teal-700 bg-teal-100' };
    if (total >= 36) return { grade: 'B1', color: 'text-blue-700 bg-blue-100' };
    if (total >= 31) return { grade: 'B2', color: 'text-[#0e5d84] bg-[#e0f2fe]' };
    if (total >= 26) return { grade: 'C1', color: 'text-amber-700 bg-amber-100' };
    return { grade: 'C2', color: 'text-rose-700 bg-rose-100' };
  };

  const handleSaveDraft = () => {
    addToast('Gradebook entries saved locally as draft', 'info');
  };

  const handleSubmitDean = () => {
    setGrades(prev => prev.map(g => ({ ...g, status: 'Submitted' })));
    addToast('Marks submitted to Academic Dean for moderation', 'success', 'Class 10-A Physics Lab Rubrics locked.');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-[#082b3d] text-white p-5 md:p-6 rounded-2xl border border-[#213145] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold font-display">Faculty Marksheet & Rubric Studio</h1>
            <span className="bg-emerald-400/20 text-emerald-300 text-xs px-2 py-0.5 rounded font-mono font-bold">
              RCD-008
            </span>
          </div>
          <div className="text-xs text-[#cbd5e1] mt-0.5">
            Class 10-A • Subject: Physics (Code 086) • Term 2 Evaluation
          </div>
          <div className="text-xs text-[#f59e0b] mt-1 font-medium">
            NEP 2020 Holistic Progress Card (HPC) & Bloom’s Taxonomy Rubric Enabled
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSubmitDean}
            className="bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">publish</span>
            <span>Submit to Dean</span>
          </button>
        </div>
      </div>

      {/* Assessment Selector & Summary Pills */}
      <div className="bg-white p-4 rounded-2xl border border-[#e0ecf4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#777587] uppercase">Assessment:</span>
          <div className="flex gap-1.5">
            {[
              { id: 'Practical-Term2', label: 'Term 2 Lab Practicals (Max 50)' },
              { id: 'FA-2', label: 'Formative Assessment 2 (Max 25)' },
              { id: 'PeriodicTest-3', label: 'Periodic Test 3 (Max 40)' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedAssessment(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  selectedAssessment === tab.id
                    ? 'bg-[#0e5d84] text-white shadow-xs'
                    : 'bg-[#f0f7fb] text-[#0e5d84] hover:bg-[#dbeafe]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl font-medium">
            Class Average: <strong>44.2 / 50 (88.4%)</strong>
          </div>
          <div className="bg-[#f0f7fb] text-[#0e5d84] border border-[#cbe0ec] px-3 py-1 rounded-xl font-medium">
            Pass Rate: <strong>100%</strong>
          </div>
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f0f7fb] text-[#082b3d] border-b border-[#cbe0ec] font-bold">
              <tr>
                <th className="p-3.5 w-12 text-center">Roll</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5 text-center">Lab Record (30)</th>
                <th className="p-3.5 text-center">Experiment (15)</th>
                <th className="p-3.5 text-center">Viva-Voce (5)</th>
                <th className="p-3.5 text-center">Total (50)</th>
                <th className="p-3.5 text-center">Grade</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {grades.map(row => {
                const total = calculateTotal(row);
                const gradeInfo = calculateGrade(total);
                return (
                  <tr key={row.studentId} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-center text-[#777587]">{row.rollNo}</td>
                    <td className="p-3.5 font-bold text-[#082b3d]">
                      <div>{row.name}</div>
                      <div className="text-[10px] text-[#777587] font-normal">STU-2024-00{row.rollNo}</div>
                    </td>
                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={row.theoryMarks}
                        onChange={e => updateMarks(row.studentId, 'theoryMarks', Number(e.target.value))}
                        className="w-16 text-center bg-[#f8f9ff] border border-[#cbe0ec] rounded-lg py-1 font-mono font-bold text-[#082b3d] focus:border-[#0e5d84] focus:outline-hidden"
                      />
                    </td>
                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={row.practicalMarks}
                        onChange={e => updateMarks(row.studentId, 'practicalMarks', Number(e.target.value))}
                        className="w-16 text-center bg-[#f8f9ff] border border-[#cbe0ec] rounded-lg py-1 font-mono font-bold text-[#082b3d] focus:border-[#0e5d84] focus:outline-hidden"
                      />
                    </td>
                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={row.vivaMarks}
                        onChange={e => updateMarks(row.studentId, 'vivaMarks', Number(e.target.value))}
                        className="w-14 text-center bg-[#f8f9ff] border border-[#cbe0ec] rounded-lg py-1 font-mono font-bold text-[#082b3d] focus:border-[#0e5d84] focus:outline-hidden"
                      />
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-sm text-[#082b3d]">
                      {total}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold font-mono text-[11px] ${gradeInfo.color}`}>
                        {gradeInfo.grade}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          row.status === 'Submitted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
