import React from 'react';
import { useApp } from '../../context/AppContext';

export const FacultyHeader: React.FC = () => {
  const { markAllPresent, addToast, logout } = useApp();

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
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
          alt="Mrs. Malini Iyer"
          className="w-10 h-10 rounded-full object-cover border border-[#0e5d84] shrink-0"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#082b3d]">Mrs. Malini Iyer, M.Sc. B.Ed.</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
              PGT Physics
            </span>
          </div>
          <div className="text-[11px] text-[#464555] flex items-center gap-1.5">
            <span className="text-[#0e5d84] font-semibold">Active: Period 2 • Physics Lab 02</span>
            <span>•</span>
            <span>Class 10-A</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={markAllPresent}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-sm">done_all</span>
          <span>Mark All Present</span>
        </button>
        <button
          onClick={() => addToast('Substitute teacher request submitted to Academic Dean', 'info')}
          className="hidden sm:flex items-center gap-1 bg-[#f0f7fb] hover:bg-[#e0ecf4] text-[#0e5d84] text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#cbe0ec]"
        >
          <span className="material-symbols-outlined text-sm">swap_horiz</span>
          <span>Proxy Request</span>
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
