import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const FacultyRosterView: React.FC = () => {
  const { attendanceRecords, updateStudentAttendance, markAllPresent, setRole, setAdminView, addToast } = useApp();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'P' | 'L' | 'A'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = {
    P: attendanceRecords.filter(r => r.status === 'P').length,
    L: attendanceRecords.filter(r => r.status === 'L').length,
    A: attendanceRecords.filter(r => r.status === 'A').length,
    total: attendanceRecords.length,
  };

  const filteredStudents = attendanceRecords.filter(rec => {
    const matchesFilter = filterStatus === 'ALL' || rec.status === filterStatus;
    const matchesSearch =
      rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.rollNo.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = (studentId: string, studentName: string, status: 'P' | 'L' | 'A') => {
    updateStudentAttendance(studentId, status);
    const label = status === 'P' ? 'Present' : status === 'L' ? 'Late' : 'Absent';
    addToast(`${studentName} marked ${label}`, status === 'P' ? 'success' : status === 'L' ? 'warning' : 'info');
  };

  const handleNotifyAbsentees = () => {
    const absentees = attendanceRecords.filter(r => r.status === 'A');
    if (absentees.length === 0) {
      addToast('No absentees to notify. All students accounted for.', 'info');
      return;
    }
    addToast(
      `Automated DLT SMS dispatched to ${absentees.length} guardian(s)`,
      'warning',
      'NOT-004: Period 2 Absentees Alert sent to parents via Gov DLT route.'
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Faculty Profile Banner */}
      <div className="bg-[#082b3d] text-white p-5 md:p-6 rounded-2xl border border-[#213145] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
            alt="Mrs. Malini Iyer"
            className="w-14 h-14 rounded-full object-cover border-2 border-[#f59e0b]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold font-display">Mrs. Malini Iyer</h1>
              <span className="bg-[#f59e0b]/20 text-[#f59e0b] text-xs px-2 py-0.5 rounded font-mono font-bold">
                FAC-109
              </span>
            </div>
            <div className="text-xs text-[#cbd5e1] mt-0.5">
              Class 10-A Mentor • PGT Physics (Ray Optics & Modern Physics)
            </div>
            <div className="text-xs text-[#f59e0b] mt-1 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Active Period: <strong>Period 2 (09:15 - 10:00 AM) • Physics Lab 02</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={markAllPresent}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">done_all</span>
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setAdminView('lms-and-courses');
              addToast('Opening Ray Optics Digital Classroom simulation', 'info');
            }}
            className="bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">play_lesson</span>
            <span>Launch Lab Simulator</span>
          </button>
        </div>
      </div>

      {/* Live Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'ALL'
              ? 'bg-[#f0f7fb] border-[#0e5d84] ring-2 ring-[#0e5d84]/20'
              : 'bg-white border-[#e0ecf4] hover:border-[#cbd5e1]'
          }`}
        >
          <div className="text-[11px] font-bold text-[#777587] uppercase">Total Enrolled</div>
          <div className="text-xl font-bold font-mono text-[#082b3d] mt-1">{counts.total} Students</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('P')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'P'
              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
              : 'bg-white border-[#e0ecf4] hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center justify-between">
            <span>Present (P)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">{counts.P}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('L')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'L'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-[#e0ecf4] hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase flex items-center justify-between">
            <span>Late (L)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">{counts.L}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('A')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'A'
              ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-600/20'
              : 'bg-white border-[#e0ecf4] hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-700 uppercase flex items-center justify-between">
            <span>Absent (A)</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-800 mt-1">{counts.A}</div>
        </button>
      </div>

      {/* Classroom Quick Roll Call */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#082b3d] flex items-center gap-2">
              <span>Period 2 Roll Call • Class 10-A (ATT-001..014)</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Turnstile Sync Active
              </span>
            </div>
            <div className="text-[11px] text-[#464555] mt-0.5">
              Click P (Present), L (Late), or A (Absent) on any student row below to update.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-[#777587]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search roll or student..."
                className="bg-white border border-[#cbe0ec] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#082b3d] focus:border-[#0e5d84] focus:outline-hidden"
              />
            </div>
            {counts.A > 0 && (
              <button
                type="button"
                onClick={handleNotifyAbsentees}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-sm">sms</span>
                <span>Notify Parents ({counts.A})</span>
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-[#f0f7fb]">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-[#777587] text-xs">
              No students match the current filter or search criteria.
            </div>
          ) : (
            filteredStudents.map(rec => (
              <div
                key={rec.studentId}
                className="p-3.5 hover:bg-[#f8f9ff] flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#777587] w-6 text-center">{rec.rollNo}</span>
                  <img
                    src={rec.avatar}
                    alt={rec.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#cbe0ec] shadow-2xs"
                  />
                  <div>
                    <div className="font-bold text-[#082b3d] flex items-center gap-2">
                      <span>{rec.name}</span>
                      <span className="text-[10px] text-[#777587] font-normal">
                        ({rec.studentId})
                      </span>
                    </div>
                    <div className="text-[11px] text-[#777587] flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-emerald-600">login</span>
                        Gate In: {rec.time}
                      </span>
                      <span>•</span>
                      <span className="text-[#464555]">{rec.telemetrySource}</span>
                    </div>
                  </div>
                </div>

                {/* Status Toggle Buttons: P, L, A */}
                <div className="flex items-center gap-1.5">
                  {(['P', 'L', 'A'] as const).map(st => {
                    const isCur = rec.status === st;
                    const labels = { P: 'Present', L: 'Late', A: 'Absent' };
                    const styles = {
                      P: isCur
                        ? 'bg-emerald-600 text-white font-bold shadow-sm ring-2 ring-emerald-400 scale-105'
                        : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800',
                      L: isCur
                        ? 'bg-amber-500 text-white font-bold shadow-sm ring-2 ring-amber-300 scale-105'
                        : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800',
                      A: isCur
                        ? 'bg-rose-600 text-white font-bold shadow-sm ring-2 ring-rose-400 scale-105'
                        : 'bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800',
                    };

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(rec.studentId, rec.name, st)}
                        title={`Mark ${rec.name} as ${labels[st]}`}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${styles[st]}`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
