import React from 'react';
import { useApp } from '../../context/AppContext';
import { STUDENTS_MOCK, BUS_ROUTE_14 } from '../../data/mockData';

export const ParentHomeView: React.FC = () => {
  const {
    setParentView,
    setRole,
    setAdminView,
    setSelectedStudent,
    setPtmModalOpen,
    setLeaveModalOpen,
    driverCurrentStopIndex,
    addToast,
  } = useApp();

  const student = STUDENTS_MOCK[0]; // Aarav Ramanathan
  const currentStop = BUS_ROUTE_14.stops[driverCurrentStopIndex] || BUS_ROUTE_14.stops[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Student Spotlight Card */}
      <div className="bg-gradient-to-r from-[#0e5d84] to-[#166d99] text-white p-5 md:p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/60 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display">{student.name}</h1>
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                Roll #{student.rollNo}
              </span>
            </div>
            <div className="text-xs text-[#d0ebf8] mt-0.5">
              {student.class} • Class Mentor: <strong>{student.mentor || 'Mrs. Malini Iyer'}</strong>
            </div>
            <div className="flex items-center gap-3 text-xs mt-2 text-[#f0f7fb]">
              <span>Attendance: <strong>{student.attendancePct}%</strong></span>
              <span>•</span>
              <span>CBSE CGPA: <strong>{student.cgpa || student.gpa} / 10</strong></span>
              <span>•</span>
              <span>Blood Group: <strong>{student.bloodGroup}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setLeaveModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            Apply Medical Leave
          </button>
          <button
            onClick={() => setPtmModalOpen(true)}
            className="bg-white text-[#0e5d84] text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-[#f0f7fb] transition-colors"
          >
            Book PTM Slot
          </button>
        </div>
      </div>

      {/* Live Transit & School Arrival Pill */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#e0ecf4] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f0f7fb] border border-[#cbe0ec] flex items-center justify-center text-[#0e5d84]">
            <span className="material-symbols-outlined text-xl animate-pulse">directions_bus</span>
          </div>
          <div>
            <div className="text-xs font-bold text-[#082b3d] flex items-center gap-2">
              <span>Bus #12 En Route (Route #14)</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.2 rounded-full font-bold">
                Aarav Boarded
              </span>
            </div>
            <div className="text-xs text-[#464555] mt-0.5">
              Approaching <strong>{currentStop.name}</strong> • ETA to School: <strong>{BUS_ROUTE_14.etaSchool}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => setParentView('bus')}
          className="text-xs font-semibold text-[#0e5d84] hover:underline flex items-center gap-1"
        >
          <span>Open Live GPS Radar</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {/* Quick Action Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setParentView('academics')}
          className="bg-white p-4 rounded-xl border border-[#e0ecf4] hover:border-[#0e5d84] cursor-pointer transition-all shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-[#f0f7fb] text-[#0e5d84] flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-lg">grade</span>
          </div>
          <div className="text-xs font-bold text-[#082b3d]">CBSE Report Card</div>
          <div className="text-[11px] text-[#464555] mt-0.5">Pre-Board 94.2% A1</div>
        </div>

        <div
          onClick={() => setParentView('fees')}
          className="bg-white p-4 rounded-xl border border-[#e0ecf4] hover:border-[#0e5d84] cursor-pointer transition-all shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-lg">payment</span>
          </div>
          <div className="text-xs font-bold text-[#082b3d]">School Fees</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Term 3 Due: ₹42,500</div>
        </div>

        <div
          onClick={() => setParentView('ptm')}
          className="bg-white p-4 rounded-xl border border-[#e0ecf4] hover:border-[#0e5d84] cursor-pointer transition-all shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-[#f0f7fb] text-[#0e5d84] flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-lg">handshake</span>
          </div>
          <div className="text-xs font-bold text-[#082b3d]">Parent-Teacher Meet</div>
          <div className="text-[11px] text-[#464555] mt-0.5">Mrs. Malini (Physics)</div>
        </div>

        <div
          onClick={() => {
            setSelectedStudent(student);
            setRole('admin');
            setAdminView('student-360');
            addToast('Viewing Aarav in Institutional Student 360 view', 'info');
          }}
          className="bg-white p-4 rounded-xl border border-[#e0ecf4] hover:border-[#0e5d84] cursor-pointer transition-all shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-lg">analytics</span>
          </div>
          <div className="text-xs font-bold text-[#082b3d]">Student 360 Full</div>
          <div className="text-[11px] text-[#464555] mt-0.5">Comprehensive Dossier</div>
        </div>
      </div>

      {/* Today's Timetable & Classes */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#082b3d] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0e5d84] text-base">schedule</span>
          <span>Aarav's Schedule Today (Day Order 3)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-[#777587] font-semibold">08:30 - 09:15 AM</span>
            <div className="font-bold text-[#082b3d] mt-0.5">Period 1: Mathematics</div>
            <div className="text-[11px] text-[#464555]">Dr. V. Raghavan • Quadratic Equations</div>
          </div>
          <div className="p-3 bg-[#f0f7fb] rounded-xl border border-[#0e5d84]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#0e5d84] font-bold">09:15 - 10:00 AM</span>
              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">LIVE</span>
            </div>
            <div className="font-bold text-[#082b3d] mt-0.5">Period 2: Physics Lab</div>
            <div className="text-[11px] text-[#464555]">Mrs. Malini Iyer • Prism Refraction</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-[#777587] font-semibold">10:15 - 11:00 AM</span>
            <div className="font-bold text-[#082b3d] mt-0.5">Period 3: English Literature</div>
            <div className="text-[11px] text-[#464555]">Ms. Clara D'Souza • Julius Caesar</div>
          </div>
        </div>
      </div>
    </div>
  );
};
