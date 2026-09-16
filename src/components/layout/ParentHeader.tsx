import React from 'react';
import { useApp } from '../../context/AppContext';

export const ParentHeader: React.FC = () => {
  const { student, setPtmModalOpen, setLeaveModalOpen, logout } = useApp();

  return (
    <div className="bg-[#ffffff] border-b border-[#e0ecf4] px-4 py-2.5 sticky top-0 z-30 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src="/lumen-academy-logo.svg"
          alt="Lumen Academy"
          referrerPolicy="no-referrer"
          className="w-10 h-10 object-contain shrink-0 drop-shadow-xs hidden xs:block"
        />
        <div className="h-8 w-px bg-slate-200 hidden xs:block" />
        <img
          src={student.avatar}
          alt={student.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-[#0e5d84] shrink-0"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#082b3d]">{student.name}</h1>
            <span className="bg-[#f0f7fb] text-[#0e5d84] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#cbe0ec]">
              {student.class}-{student.section}
            </span>
          </div>
          <div className="text-[11px] text-[#464555] flex items-center gap-1.5">
            <span>Roll #{student.rollNo}</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Gate In: 07:44 AM</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setLeaveModalOpen(true)}
          className="flex items-center gap-1 bg-[#f0f7fb] hover:bg-[#e0ecf4] text-[#0e5d84] text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#cbe0ec] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit_calendar</span>
          <span className="hidden sm:inline">Apply Leave</span>
        </button>

        <button
          onClick={() => setPtmModalOpen(true)}
          className="flex items-center gap-1 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-sm">event</span>
          <span>Book PTM</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-1 text-rose-600 hover:bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          title="Sign Out to Login Page"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
