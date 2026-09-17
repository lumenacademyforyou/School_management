import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const LMSCoursesView: React.FC = () => {
  const { setAdminView, addToast } = useApp();
  const [angle, setAngle] = useState(45);
  const [activeLessonId, setActiveLessonId] = useState('10.2');
  const [showPushModal, setShowPushModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('10-A (38 Tablets)');
  const [pushNotes, setPushNotes] = useState('Observe spectrum dispersion at incidence angle 45°. Calculate minimum deviation.');

  // Refractive calculations
  const devAngle = (2 * angle - 60).toFixed(1);

  const lessons = [
    {
      id: '10.1',
      code: '10.1',
      title: 'Refraction through a Glass Slab',
      subtitle: 'Lateral displacement & optical density • Completed',
      status: 'completed',
      weightage: '3 Marks',
    },
    {
      id: '10.2',
      code: '10.2',
      title: 'Dispersion through Prism (Active)',
      subtitle: 'VIBGYOR formation & rainbow mechanics',
      status: 'active',
      weightage: '7 Marks guaranteed (Sec C + Sec E)',
    },
    {
      id: '10.3',
      code: '10.3',
      title: 'Atmospheric Refraction & Twinkling',
      subtitle: 'Advanced sunrise & delayed sunset • Tomorrow',
      status: 'upcoming',
      weightage: '2 Marks',
    },
  ];

  const handleConfirmPush = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPushModal(false);
    addToast(`Pushed interactive optical simulation state to ${selectedBatch}!`, 'success');
  };

  const handleExportLessonPlan = () => {
    const planText = `LumenAcademy CBSE 5E Instructional Lesson Plan\nSubject: Physics (Class 10)\nUnit: Natural Phenomena - Light\nLesson: 10.2 Dispersion of Light through Glass Prism\nFaculty: Mrs. Malini Iyer (PGT Physics)\nTarget Batch: Class 10-A\n\n5E PEDAGOGY BREAKDOWN:\n1. ENGAGE: White light ray incident on crown glass prism (μ=1.52).\n2. EXPLORE: Interactive ray slider measuring angle of deviation (i = ${angle}°, D = ${devAngle}°).\n3. EXPLAIN: Cauchy's equation - shorter wavelength (violet 400nm) deviates more than red (700nm).\n4. ELABORATE: Formation of secondary rainbow and total internal reflection within water droplets.\n5. EVALUATE: Practical submission in Assignment Studio with Snell's law observation table.\n\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([planText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CBSE_LessonPlan_10_2_Prism.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded official CBSE 5E Lesson Plan Dossier', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">play_lesson</span>
            <span>Digital Classroom & Interactive STEM Studio</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Physics 10: Dispersion of Light through a Glass Prism
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Teacher: <strong>Mrs. Malini Iyer</strong> • Ray Optics Simulation • Synchronized to Class 10-A Tablets
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportLessonPlan}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export 5E Lesson Plan</span>
          </button>
          <button
            onClick={() => {
              setAdminView('assignments');
              addToast('Opening Submissions Studio for this lesson', 'info');
            }}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
            <span>Grade Student Reports</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Simulation Player + Curriculum Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Ray Optics SVG Simulator */}
        <div className="lg:col-span-2 bg-[#082b3d] text-white p-5 md:p-6 rounded-2xl border border-[#213145] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#213145] mb-4">
              <span className="text-xs font-bold text-[#f59e0b] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">science</span>
                <span>Interactive Optical Bench: Snell’s Law & VIBGYOR Spectrum</span>
              </span>
              <span className="text-[11px] font-mono text-[#cbd5e1] bg-[#1e293b] px-2 py-0.5 rounded">
                Refractive Index μ = 1.52 • Dev = {devAngle}°
              </span>
            </div>

            {/* SVG Prism dispersion simulation */}
            <div className="h-64 w-full relative flex items-center justify-center bg-[#071321] rounded-xl overflow-hidden border border-[#1e293b]">
              <svg className="w-full h-full" viewBox="0 0 500 240">
                {/* Triangular Prism */}
                <polygon
                  points="250,30 170,200 330,200"
                  fill="rgba(134, 242, 228, 0.12)"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* Incident White Ray based on Angle */}
                <line
                  x1={60}
                  y1={160 + (angle - 45) * 1.2}
                  x2="210"
                  y2="115"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <text x="70" y="145" fill="#ffffff" fontSize="11" fontFamily="sans-serif">
                  White Light Beam (i={angle}°)
                </text>

                {/* Refracted Dispersion Rays Inside Prism to Outside */}
                {/* Red (Least Deviated) */}
                <path d={`M 210 115 L 280 ${120 + (angle - 45) * 0.4} L 440 ${100 + (angle - 45) * 0.8}`} fill="none" stroke="#ef4444" strokeWidth="2" />
                <text x="445" y={104 + (angle - 45) * 0.8} fill="#ef4444" fontSize="11" fontWeight="bold">Red (λ=700nm)</text>

                {/* Orange */}
                <path d={`M 210 115 L 280 ${124 + (angle - 45) * 0.45} L 440 ${120 + (angle - 45) * 0.9}`} fill="none" stroke="#f97316" strokeWidth="1.5" />

                {/* Yellow */}
                <path d={`M 210 115 L 280 ${128 + (angle - 45) * 0.5} L 440 ${140 + (angle - 45) * 1.0}`} fill="none" stroke="#eab308" strokeWidth="1.5" />

                {/* Green */}
                <path d={`M 210 115 L 280 ${132 + (angle - 45) * 0.55} L 440 ${160 + (angle - 45) * 1.1}`} fill="none" stroke="#22c55e" strokeWidth="1.5" />

                {/* Blue */}
                <path d={`M 210 115 L 280 ${136 + (angle - 45) * 0.6} L 440 ${180 + (angle - 45) * 1.2}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" />

                {/* Violet (Most Deviated) */}
                <path d={`M 210 115 L 280 ${142 + (angle - 45) * 0.7} L 440 ${205 + (angle - 45) * 1.3}`} fill="none" stroke="#a855f7" strokeWidth="2" />
                <text x="445" y={210 + (angle - 45) * 1.3} fill="#a855f7" fontSize="11" fontWeight="bold">Violet (λ=400nm)</text>

                {/* Angle Marker */}
                <circle cx="210" cy="115" r="4" fill="#f59e0b" />
              </svg>
            </div>
          </div>

          {/* Interactive Slider */}
          <div className="mt-4 pt-3 border-t border-[#213145] flex items-center justify-between gap-4 text-xs">
            <div className="flex-1 flex items-center gap-3">
              <span className="text-[#cbd5e1]">Angle of Incidence (i):</span>
              <input
                type="range"
                min="30"
                max="60"
                value={angle}
                onChange={e => setAngle(Number(e.target.value))}
                className="flex-1 accent-[#f59e0b]"
              />
              <span className="font-mono text-[#f59e0b] font-bold">{angle}°</span>
            </div>
            <button
              onClick={() => setShowPushModal(true)}
              className="bg-[#0e5d84] hover:bg-[#083a4f] text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">tablet_mac</span>
              <span>Push to Student Tablets</span>
            </button>
          </div>
        </div>

        {/* Right Col: Course Outline & CBSE Key Concepts */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#082b3d] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0e5d84] text-base">menu_book</span>
            <span>Curriculum Modules (Unit 3: Natural Phenomena)</span>
          </h2>

          <div className="space-y-2 text-xs">
            {lessons.map(les => {
              const isSelected = activeLessonId === les.id;
              return (
                <div
                  key={les.id}
                  onClick={() => {
                    setActiveLessonId(les.id);
                    addToast(`Loaded ${les.title}`, 'info');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0e5d84] text-white shadow-xs border-[#0e5d84]'
                      : 'bg-[#f0f7fb] text-[#082b3d] border-[#cbe0ec] hover:border-[#0e5d84]/50'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{les.title}</span>
                    {isSelected && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">ACTIVE</span>}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-[#d0ebf8]' : 'text-[#464555]'}`}>
                    {les.subtitle}
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${isSelected ? 'text-[#f59e0b]' : 'text-[#0e5d84]'}`}>
                    Weightage: {les.weightage}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
            <strong>CBSE Board Weightage:</strong> 7 Marks guaranteed in Annual Board Exam (Section C + Section E Case-Study).
          </div>
        </div>
      </div>

      {/* Modal: Push Simulation to Student Tablets */}
      {showPushModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#082b3d]">Broadcast to Student Tablets</h3>
                <span className="text-xs text-[#777587]">MDM Class-Room Sync Protocol</span>
              </div>
              <button onClick={() => setShowPushModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmPush} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#464555] mb-1">Target Classroom Batch</label>
                <select
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                >
                  <option value="10-A (38 Tablets)">Class 10-A (38 Tablets Connected)</option>
                  <option value="10-B (40 Tablets)">Class 10-B (40 Tablets Connected)</option>
                  <option value="Physics Lab Group 1 (18 Devices)">Physics Lab Group 1 (18 Devices)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Interactive Task Prompt for Students</label>
                <textarea
                  rows={3}
                  value={pushNotes}
                  onChange={e => setPushNotes(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div className="p-3 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec] text-[#082b3d] text-xs">
                Current optical parameters (Incidence Angle = {angle}°, Deviation = {devAngle}°) will be locked onto student screens for active observation.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowPushModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white rounded-xl font-bold"
                >
                  Broadcast to Devices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
