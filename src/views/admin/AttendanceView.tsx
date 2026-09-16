import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const AttendanceView: React.FC = () => {
  const { attendanceRecords, updateStudentAttendance, markAllPresent, addToast } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'P' | 'L' | 'A' | 'E'>('ALL');
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  const presentCount = attendanceRecords.filter(r => r.status === 'P').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'L').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'A').length;
  const excusedCount = attendanceRecords.filter(r => r.status === 'E').length;

  const filteredRecords = filter === 'ALL'
    ? attendanceRecords
    : attendanceRecords.filter(r => r.status === filter);

  const handleExportAttendanceCSV = () => {
    const csvContent = [
      'Roll No,Student Name,Status,Telemetry Source,Gate Time,Streak (Days),Notes',
      ...attendanceRecords.map(r => `${r.rollNo},"${r.name}",${r.status},"${r.telemetrySource}","${r.time}",${r.streakDays},"${r.notes || ''}"`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Class10A_Attendance_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Class 10-A Daily Attendance Register (CSV)', 'success');
  };

  const handleConfirmDispatch = () => {
    setShowDispatchModal(false);
    addToast(`Automated WhatsApp absence alerts dispatched to parents of ${absentCount} absent students!`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">fact_check</span>
            <span>Period 2 Roll Call • Class 10-A (ATT-001..012)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Classroom Attendance & Hardware Turnstile Sync
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Mentor: <strong>Mrs. Malini Iyer</strong> • Turnstile Gate #01-#04 Telemetry Active • Auto-WhatsApp on Absenteeism
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportAttendanceCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Register</span>
          </button>
          <button
            onClick={markAllPresent}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">done_all</span>
            <span>Mark All Present</span>
          </button>
          <button
            onClick={() => {
              if (absentCount === 0) {
                addToast('All students in Class 10-A are present. No absence notifications needed!', 'info');
              } else {
                setShowDispatchModal(true);
              }
            }}
            className="flex items-center gap-1.5 bg-[#f0f7fb] hover:bg-[#e0ecf4] text-[#0e5d84] text-xs font-semibold px-3.5 py-2 rounded-xl border border-[#cbe0ec] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            <span>Dispatch SMS / WhatsApp ({absentCount})</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilter('P')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filter === 'P' ? 'bg-emerald-100 border-emerald-500 ring-1 ring-emerald-500' : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-emerald-800">Present (P)</div>
          <div className="text-xl font-bold text-emerald-900 mt-0.5">{presentCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium">Biometric Verified</div>
        </div>

        <div
          onClick={() => setFilter('L')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filter === 'L' ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-500' : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-amber-800">Late Arrival (L)</div>
          <div className="text-xl font-bold text-amber-900 mt-0.5">{lateCount}</div>
          <div className="text-[11px] text-amber-700 font-medium">&gt; 08:00 AM</div>
        </div>

        <div
          onClick={() => setFilter('A')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filter === 'A' ? 'bg-rose-100 border-rose-500 ring-1 ring-rose-500' : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-rose-800">Unexcused Absent (A)</div>
          <div className="text-xl font-bold text-rose-900 mt-0.5">{absentCount}</div>
          <div className="text-[11px] text-rose-700 font-medium">Parent SMS Pending</div>
        </div>

        <div
          onClick={() => setFilter('E')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filter === 'E' ? 'bg-[#e0f2fe] border-[#0e5d84] ring-1 ring-[#0e5d84]' : 'bg-[#f0f7fb] border-[#cbe0ec] hover:bg-[#bae6fd]'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-[#082b3d]">Excused / OD (E)</div>
          <div className="text-xl font-bold text-[#082b3d] mt-0.5">{excusedCount}</div>
          <div className="text-[11px] text-[#0e5d84] font-medium">Sports / Olympiad</div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#082b3d]">Roster Register: {filteredRecords.length} Students</span>
            {filter !== 'ALL' && (
              <button
                onClick={() => setFilter('ALL')}
                className="text-[11px] text-[#0e5d84] underline font-semibold"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="text-xs text-[#464555] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Turnstile Auto-Polling: 08:42:15 AM</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f0f7fb]/60 text-[#464555] font-semibold border-b border-[#cbe0ec]">
              <tr>
                <th className="p-3">Roll & Student</th>
                <th className="p-3">Telemetry Source</th>
                <th className="p-3">Gate In Time</th>
                <th className="p-3">Attendance Streak</th>
                <th className="p-3 text-center">Interactive Mark</th>
                <th className="p-3">Notes & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {filteredRecords.map(record => (
                <tr key={record.studentId} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#777587] w-6">{record.rollNo}</span>
                      <img
                        src={record.avatar}
                        alt={record.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#cbe0ec]"
                      />
                      <div className="font-bold text-[#082b3d]">{record.name}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                      {record.telemetrySource}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-[#082b3d]">
                    {record.time}
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="material-symbols-outlined text-sm">local_fire_department</span>
                      <span>{record.streakDays} Days</span>
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {(['P', 'L', 'A', 'E'] as const).map(status => {
                        const isSelected = record.status === status;
                        const bgColors = {
                          P: isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
                          L: isSelected ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100',
                          A: isSelected ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-800 hover:bg-rose-100',
                          E: isSelected ? 'bg-[#0e5d84] text-white shadow-xs' : 'bg-[#f0f7fb] text-[#082b3d] hover:bg-[#bae6fd]',
                        };

                        return (
                          <button
                            key={status}
                            onClick={() => updateStudentAttendance(record.studentId, status)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${bgColors[status]}`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 text-[11px] text-[#464555]">
                    {record.notes || <span className="text-[#777587] italic">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Dispatch Absence Alerts */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600">notification_important</span>
                <h3 className="font-bold text-[#082b3d] text-sm">Dispatch Absence Notifications (ATT-008)</h3>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-950 space-y-1">
              <div className="font-bold">Absent Students Identified: {absentCount}</div>
              <div className="text-[11px] text-rose-800">
                {attendanceRecords.filter(r => r.status === 'A').map(r => r.name).join(', ')}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700">TRAI DLT Template ID: #100844201</label>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed">
                "Dear Parent, your ward [Student Name] was marked UNEXCUSED ABSENT for Period 2 on {new Date().toLocaleDateString('en-IN')}. Please contact Class Teacher if unexpected."
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Send WhatsApp Alerts ({absentCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
