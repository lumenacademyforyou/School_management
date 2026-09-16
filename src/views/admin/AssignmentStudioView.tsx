import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface StudentSubmission {
  id: string;
  name: string;
  roll: string;
  submittedAt: string;
  turnitin: string;
  rubrics: [number, number, number, number];
  feedback: string;
  fileName: string;
}

export const AssignmentStudioView: React.FC = () => {
  const { addToast } = useApp();

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([
    {
      id: 'sub-1',
      name: 'Aarav S. Ramanathan',
      roll: '10-A / Roll 14',
      submittedAt: '25 Feb, 04:30 PM',
      turnitin: '4% Match (Clean)',
      rubrics: [5, 5, 4.5, 5],
      feedback: 'Flawless ray alignment and correct calculation of minimum deviation D_m = 37.2°. Clean i-D curve plotted.',
      fileName: 'Aarav_Ramanathan_Lab04_Prism.pdf',
    },
    {
      id: 'sub-2',
      name: 'Diya Krishnan',
      roll: '10-A / Roll 08',
      submittedAt: '25 Feb, 05:12 PM',
      turnitin: '2% Match (Clean)',
      rubrics: [4.5, 4, 4.5, 4],
      feedback: 'Well constructed observation table. Minor deviation in calculation for Run 4.',
      fileName: 'Diya_Krishnan_Lab04_Prism.pdf',
    },
    {
      id: 'sub-3',
      name: 'Rohan Sharma',
      roll: '10-A / Roll 21',
      submittedAt: '25 Feb, 06:45 PM',
      turnitin: '6% Match (Clean)',
      rubrics: [4, 4, 3.5, 4],
      feedback: 'Good effort on angle measurements. Re-verify the Snell law denominator index.',
      fileName: 'Rohan_Sharma_Lab04_Prism.pdf',
    },
  ]);

  const [selectedStudentId, setSelectedStudentId] = useState('sub-1');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitReason, setResubmitReason] = useState('Please recalculate angle of emergence and redraw graph axis.');

  const currentStudent = submissions.find(s => s.id === selectedStudentId) || submissions[0];

  const [rubric1, setRubric1] = useState(currentStudent.rubrics[0]);
  const [rubric2, setRubric2] = useState(currentStudent.rubrics[1]);
  const [rubric3, setRubric3] = useState(currentStudent.rubrics[2]);
  const [rubric4, setRubric4] = useState(currentStudent.rubrics[3]);
  const [feedback, setFeedback] = useState(currentStudent.feedback);

  const total = rubric1 + rubric2 + rubric3 + rubric4;

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      setRubric1(sub.rubrics[0]);
      setRubric2(sub.rubrics[1]);
      setRubric3(sub.rubrics[2]);
      setRubric4(sub.rubrics[3]);
      setFeedback(sub.feedback);
      setVoiceRecorded(false);
    }
  };

  const handlePublishMarks = () => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === selectedStudentId
          ? { ...s, rubrics: [rubric1, rubric2, rubric3, rubric4], feedback }
          : s
      )
    );
    addToast(`Grade published! ${currentStudent.name} scored ${total}/20. Sync dispatched to Parent Portal.`, 'success');
  };

  const handleDownloadGradedReport = () => {
    const reportText = `LumenAcademy CBSE Evaluation Report\nAssignment: Physics Practical #04: Prism Deviation Curve\nStudent: ${currentStudent.name} (${currentStudent.roll})\nScore: ${total}/20 (Percentage: ${(total / 20 * 100).toFixed(1)}%)\nRubric Breakdown:\n1. Ray Diagram & Neatness: ${rubric1}/5\n2. Snell's Law & Calculations: ${rubric2}/5\n3. Error Margin & Graph: ${rubric3}/5\n4. Viva Voce & Scientific Deduction: ${rubric4}/5\nFaculty Feedback: ${feedback}\nEvaluator: Mrs. Malini Iyer (PGT Physics)\nEvaluated on: ${new Date().toISOString()}`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Graded_Report_${currentStudent.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Downloaded Evaluation Dossier for ${currentStudent.name}`, 'success');
  };

  const handleConfirmResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResubmitModal(false);
    addToast(`Returned submission to ${currentStudent.name} with revision notes`, 'warning');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
            <span>Submissions & Competency-Based Assessment</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Physics Practical #04: Prism Deviation Curve
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Student: <strong>{currentStudent.name} ({currentStudent.roll})</strong> • Submitted: {currentStudent.submittedAt} • Turnitin: {currentStudent.turnitin}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadGradedReport}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Download Report</span>
          </button>

          <button
            onClick={() => setShowResubmitModal(true)}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">replay</span>
            <span>Request Revision</span>
          </button>

          <button
            onClick={handlePublishMarks}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">publish</span>
            <span>Publish Marks & Sync</span>
          </button>
        </div>
      </div>

      {/* Student Roster Selector Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#e0ecf4] shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#777587] uppercase tracking-wider pl-1">Evaluate Student:</span>
          {submissions.map(s => (
            <button
              key={s.id}
              onClick={() => handleStudentChange(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedStudentId === s.id
                  ? 'bg-[#0e5d84] text-white shadow-xs'
                  : 'bg-[#f0f7fb] text-[#464555] hover:bg-slate-200'
              }`}
            >
              {s.name} ({s.roll.split('/')[1].trim()})
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-[#0e5d84] font-bold pr-2">Class 10-A Lab Batch 1</span>
      </div>

      {/* Main Grid: Student Document & Rubric Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Student Submission Preview */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f7fb]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0e5d84]">description</span>
              <div>
                <div className="text-xs font-bold text-[#082b3d]">{currentStudent.fileName}</div>
                <div className="text-[11px] text-[#777587]">4.2 MB • Scanned with Apple Pencil & GoodNotes</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Turnitin: {currentStudent.turnitin}</span>
              </span>
            </div>
          </div>

          {/* Rendered Lab Document Sheet Preview */}
          <div className="bg-[#f8f9ff] p-6 rounded-xl border border-[#cbe0ec] space-y-4 text-xs font-mono">
            <div className="border-b border-[#cbe0ec] pb-3 flex justify-between text-[#082b3d]">
              <span>AIM: To plot angle of incidence (i) vs deviation (D)</span>
              <span>APPARATUS: Crown Glass Prism, Pins</span>
            </div>

            <div className="space-y-1 text-[#464555]">
              <div>OBSERVATION TABLE ({currentStudent.name}):</div>
              <div className="bg-white p-3 rounded-lg border border-[#cbe0ec] text-[11px] space-y-1">
                <div>Run 1: i = 35° ➔ D = 40.0°</div>
                <div>Run 2: i = 40° ➔ D = 38.0°</div>
                <div className="font-bold text-[#0e5d84]">Run 3: i = 45° ➔ D = 37.2° (Minimum Deviation D_m)</div>
                <div>Run 4: i = 50° ➔ D = 38.5°</div>
                <div>Run 5: i = 55° ➔ D = 41.0°</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[11px]">
              CALCULATED REFRACTIVE INDEX: μ = sin[(A + D_m)/2] / sin(A/2) = sin(48.6°) / sin(30°) = 1.50
            </div>
          </div>
        </div>

        {/* Right Col: 4-Criteria Rubric Grading Slider */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#f0f7fb]">
            <h2 className="text-sm font-bold text-[#082b3d]">Grading Rubric</h2>
            <div className="text-base font-bold font-display text-[#0e5d84]">{total} / 20</div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-[#082b3d] mb-1">
                <span>1. Ray Diagram & Neatness</span>
                <span className="text-[#0e5d84] font-bold">{rubric1} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={rubric1}
                onChange={e => setRubric1(Number(e.target.value))}
                className="w-full accent-[#0e5d84]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[#082b3d] mb-1">
                <span>2. Snell's Law & Calculations</span>
                <span className="text-[#0e5d84] font-bold">{rubric2} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={rubric2}
                onChange={e => setRubric2(Number(e.target.value))}
                className="w-full accent-[#0e5d84]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[#082b3d] mb-1">
                <span>3. Error Margin & Graph</span>
                <span className="text-[#0e5d84] font-bold">{rubric3} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={rubric3}
                onChange={e => setRubric3(Number(e.target.value))}
                className="w-full accent-[#0e5d84]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[#082b3d] mb-1">
                <span>4. Viva Voce & Scientific Deduction</span>
                <span className="text-[#0e5d84] font-bold">{rubric4} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={rubric4}
                onChange={e => setRubric4(Number(e.target.value))}
                className="w-full accent-[#0e5d84]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#082b3d] mb-1">Faculty Feedback & Voice Memo</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="w-full bg-[#f0f7fb] border border-[#cbe0ec] rounded-lg p-2 text-xs text-[#082b3d] outline-hidden focus:border-[#0e5d84]"
            />
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (!isRecordingVoice) {
                    setIsRecordingVoice(true);
                    setTimeout(() => {
                      setIsRecordingVoice(false);
                      setVoiceRecorded(true);
                      addToast('Voice Memo recorded: "Excellent precision on minimum deviation, Aarav!"', 'success');
                    }, 1500);
                  }
                }}
                className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                  isRecordingVoice
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : voiceRecorded
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-[#0e5d84] hover:underline'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isRecordingVoice ? 'fiber_manual_record' : voiceRecorded ? 'check_circle' : 'mic'}
                </span>
                <span>
                  {isRecordingVoice ? 'Recording audio...' : voiceRecorded ? 'Voice Memo Attached (0:18)' : 'Record Voice Feedback'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Request Revision */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#082b3d]">Request Assignment Revision</h3>
                <span className="text-xs text-[#777587]">Return to {currentStudent.name}</span>
              </div>
              <button onClick={() => setShowResubmitModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmResubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#464555] mb-1">Reason for Resubmission Request</label>
                <textarea
                  rows={3}
                  value={resubmitReason}
                  onChange={e => setResubmitReason(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Revised Due Date</label>
                <input
                  type="date"
                  defaultValue="2025-03-02"
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
                >
                  Send Revision Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
