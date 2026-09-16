import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const FacultyPeriodsView: React.FC = () => {
  const { setFacultyView, addToast } = useApp();
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'>('Wed');

  const timetable = [
    {
      period: 'Period 1',
      time: '08:30 – 09:15 AM',
      className: 'Class 9-B',
      subject: 'General Physics',
      topic: 'Motion & Kinematics Equations',
      room: 'Room 204',
      status: 'completed',
    },
    {
      period: 'Period 2',
      time: '09:15 – 10:00 AM',
      className: 'Class 10-A',
      subject: 'Physics Practicals',
      topic: 'Ray Optics: Focal Length of Convex Lens',
      room: 'Physics Lab 02',
      status: 'active',
      isCurrent: true,
    },
    {
      period: 'Period 3',
      time: '10:15 – 11:00 AM',
      className: 'Class 11-A',
      subject: 'Senior Physics',
      topic: 'Laws of Thermodynamics & Heat Engines',
      room: 'Room 302',
      status: 'upcoming',
    },
    {
      period: 'Period 4',
      time: '11:00 – 11:45 AM',
      className: 'Staff Room',
      subject: 'Free Period / CPD',
      topic: 'NEP 2020 Pedagogical Documentation',
      room: 'Faculty Lounge Desk 14',
      status: 'upcoming',
    },
    {
      period: 'Period 5',
      time: '12:30 – 01:15 PM',
      className: 'Class 10-C',
      subject: 'Physics Theory',
      topic: 'Magnetic Effects of Electric Current',
      room: 'Room 208',
      status: 'upcoming',
    },
    {
      period: 'Period 6',
      time: '01:15 – 02:00 PM',
      className: 'Remedial Group',
      subject: 'Board Exam Clinic',
      topic: 'Numerical Problem Solving (CBSE PYQs)',
      room: 'AV Hall B',
      status: 'upcoming',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Banner */}
      <div className="bg-[#082b3d] text-white p-5 md:p-6 rounded-2xl border border-[#213145] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
            alt="Mrs. Malini Iyer"
            className="w-14 h-14 rounded-full object-cover border-2 border-[#f59e0b]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold font-display">Daily Teaching Schedule</h1>
              <span className="bg-[#f59e0b]/20 text-[#f59e0b] text-xs px-2 py-0.5 rounded font-mono font-bold">
                TTB-014
              </span>
            </div>
            <div className="text-xs text-[#cbd5e1] mt-0.5">
              Mrs. Malini Iyer • PGT Physics • 24 Teaching Hours / Week
            </div>
            <div className="text-xs text-[#f59e0b] mt-1 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Currently in session: <strong>Period 2 • Class 10-A (Physics Lab 02)</strong></span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFacultyView('attendance-roster')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">how_to_reg</span>
            <span>Go to Active Roll Call (10-A)</span>
          </button>
        </div>
      </div>

      {/* Weekday Selector */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-[#e0ecf4] shadow-xs overflow-x-auto">
        {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map(day => (
          <button
            key={day}
            type="button"
            onClick={() => {
              setSelectedDay(day);
              addToast(`Viewing ${day} schedule`, 'info');
            }}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              selectedDay === day
                ? 'bg-[#0e5d84] text-white shadow-xs'
                : 'text-[#464555] hover:bg-[#f0f7fb] hover:text-[#082b3d]'
            }`}
          >
            {day === 'Wed' ? `${day} (Today)` : day}
          </button>
        ))}
      </div>

      {/* Timetable Period Cards */}
      <div className="space-y-3">
        {timetable.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border transition-all ${
              item.isCurrent
                ? 'bg-gradient-to-r from-[#f0f7fb] to-white border-[#0e5d84] shadow-md ring-2 ring-[#0e5d84]/20'
                : item.status === 'completed'
                ? 'bg-slate-50/70 border-slate-200 opacity-80'
                : 'bg-white border-[#e0ecf4] hover:border-[#cbd5e1] shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                    item.isCurrent
                      ? 'bg-[#0e5d84] text-white shadow-xs'
                      : item.status === 'completed'
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-[#f0f7fb] text-[#0e5d84]'
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono">P{idx + 1}</span>
                  <span className="text-xs">{item.period.split(' ')[1]}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[#082b3d]">{item.className} — {item.subject}</h2>
                    {item.isCurrent && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        LIVE NOW
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        Done
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#464555] mt-0.5">
                    Topic: <strong>{item.topic}</strong>
                  </div>
                  <div className="text-[11px] text-[#777587] flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {item.time}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">room</span>
                      {item.room}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {item.isCurrent ? (
                  <button
                    type="button"
                    onClick={() => setFacultyView('attendance-roster')}
                    className="bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">fact_check</span>
                    <span>Take Roll Call</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToast(`Lesson plan notes opened for ${item.className}`, 'info')}
                    className="bg-[#f0f7fb] hover:bg-[#dbeafe] text-[#0e5d84] border border-[#cbe0ec] text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Lesson Plan
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
