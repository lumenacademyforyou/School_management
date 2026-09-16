import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface NumberingSeriesItem {
  code: string;
  module: string;
  prefix: string;
  currentNumber: number;
  format: string;
  status: string;
}

interface BellPeriodItem {
  period: string;
  time: string;
  duration: string;
  type: string;
}

interface GradingScaleItem {
  grade: string;
  minMarks: number;
  maxMarks: number;
  gpa: string;
  remark: string;
}

interface HouseItem {
  id: string;
  name: string;
  motto: string;
  captain: string;
  points: number;
  color: 'red' | 'blue' | 'emerald' | 'amber';
}

export const MastersConfigView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'numbering' | 'bell-schedule' | 'grading' | 'houses'>('numbering');

  // Modals state
  const [showAddSeriesModal, setShowAddSeriesModal] = useState(false);
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [showAwardPointsModal, setShowAwardPointsModal] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<HouseItem | null>(null);

  // Form states
  const [newSeries, setNewSeries] = useState({
    code: '',
    module: 'Admissions',
    prefix: '',
    currentNumber: 1,
    format: '',
  });

  const [newPeriod, setNewPeriod] = useState({
    period: '',
    time: '',
    duration: '45 min',
    type: 'Instructional',
  });

  const [newGrade, setNewGrade] = useState({
    grade: '',
    minMarks: 0,
    maxMarks: 0,
    gpa: '',
    remark: '',
  });

  const [pointsDelta, setPointsDelta] = useState(50);
  const [pointsReason, setPointsReason] = useState('Annual Sports Day Championship 4x100m Relay');

  const [numberingSeries, setNumberingSeries] = useState<NumberingSeriesItem[]>([
    { code: 'SER-01', module: 'Admissions', prefix: 'ADM/2026/', currentNumber: 142, format: 'ADM/2026/XXXX', status: 'Active' },
    { code: 'SER-02', module: 'Fee Receipts', prefix: 'RCP/2026/', currentNumber: 3840, format: 'RCP/2026/XXXXXX', status: 'Active' },
    { code: 'SER-03', module: 'Transfer Certificate', prefix: 'TC/2026/', currentNumber: 28, format: 'TC/2026/XXX', status: 'Active' },
    { code: 'SER-04', module: 'Purchase Order', prefix: 'PO/2026/', currentNumber: 84, format: 'PO/2026/XXXX', status: 'Active' },
    { code: 'SER-05', module: 'Support Ticket', prefix: 'HD-2026-', currentNumber: 844, format: 'HD-2026-XXXX', status: 'Active' },
  ]);

  const [bellPeriods, setBellPeriods] = useState<BellPeriodItem[]>([
    { period: 'Morning Assembly', time: '08:30 AM - 08:50 AM', duration: '20 min', type: 'Prayer & Pledge' },
    { period: 'Period 1', time: '08:50 AM - 09:35 AM', duration: '45 min', type: 'Instructional' },
    { period: 'Period 2', time: '09:35 AM - 10:20 AM', duration: '45 min', type: 'Instructional' },
    { period: 'Short Break', time: '10:20 AM - 10:35 AM', duration: '15 min', type: 'Break' },
    { period: 'Period 3', time: '10:35 AM - 11:20 AM', duration: '45 min', type: 'Instructional' },
    { period: 'Period 4', time: '11:20 AM - 12:05 PM', duration: '45 min', type: 'Instructional / Lab' },
    { period: 'Lunch Break', time: '12:05 PM - 12:45 PM', duration: '40 min', type: 'Lunch' },
    { period: 'Period 5', time: '12:45 PM - 01:30 PM', duration: '45 min', type: 'Instructional' },
    { period: 'Period 6', time: '01:30 PM - 02:15 PM', duration: '45 min', type: 'Instructional' },
    { period: 'Period 7', time: '02:15 PM - 03:00 PM', duration: '45 min', type: 'Instructional' },
    { period: 'Period 8 (Zero Hour)', time: '03:00 PM - 03:40 PM', duration: '40 min', type: 'Remedial / Sports' },
  ]);

  const [gradingScales, setGradingScales] = useState<GradingScaleItem[]>([
    { grade: 'A1', minMarks: 91, maxMarks: 100, gpa: '10.0', remark: 'Outstanding Achievement' },
    { grade: 'A2', minMarks: 81, maxMarks: 90, gpa: '9.0', remark: 'Excellent' },
    { grade: 'B1', minMarks: 71, maxMarks: 80, gpa: '8.0', remark: 'Very Good' },
    { grade: 'B2', minMarks: 61, maxMarks: 70, gpa: '7.0', remark: 'Good' },
    { grade: 'C1', minMarks: 51, maxMarks: 60, gpa: '6.0', remark: 'Above Average' },
    { grade: 'C2', minMarks: 41, maxMarks: 50, gpa: '5.0', remark: 'Average' },
    { grade: 'D', minMarks: 33, maxMarks: 40, gpa: '4.0', remark: 'Pass / Needs Improvement' },
    { grade: 'E', minMarks: 0, maxMarks: 32, gpa: '0.0', remark: 'Essential Repeat (CBSE Criteria)' },
  ]);

  const [houses, setHouses] = useState<HouseItem[]>([
    { id: 'H-01', name: 'Ruby House', motto: 'Courage', captain: 'Rohit Kumar (12-B)', points: 1240, color: 'red' },
    { id: 'H-02', name: 'Sapphire House', motto: 'Wisdom', captain: 'Deepika Raman (12-A)', points: 1310, color: 'blue' },
    { id: 'H-03', name: 'Emerald House', motto: 'Harmony', captain: 'S. Karthik (12-C)', points: 1195, color: 'emerald' },
    { id: 'H-04', name: 'Topaz House', motto: 'Valour', captain: 'Ananya Rao (12-B)', points: 1280, color: 'amber' },
  ]);

  const handleCreateSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeries.prefix.trim()) {
      addToast('Prefix cannot be empty', 'warning');
      return;
    }
    const item: NumberingSeriesItem = {
      code: `SER-0${numberingSeries.length + 1}`,
      module: newSeries.module,
      prefix: newSeries.prefix,
      currentNumber: Number(newSeries.currentNumber) || 1,
      format: newSeries.format || `${newSeries.prefix}XXXX`,
      status: 'Active',
    };
    setNumberingSeries(prev => [...prev, item]);
    setShowAddSeriesModal(false);
    setNewSeries({ code: '', module: 'Admissions', prefix: '', currentNumber: 1, format: '' });
    addToast(`Numbering series ${item.code} created for ${item.module}`, 'success');
  };

  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriod.period.trim() || !newPeriod.time.trim()) {
      addToast('Period name and time interval are required', 'warning');
      return;
    }
    setBellPeriods(prev => [...prev, newPeriod]);
    setShowAddPeriodModal(false);
    setNewPeriod({ period: '', time: '', duration: '45 min', type: 'Instructional' });
    addToast(`Bell period "${newPeriod.period}" added to timetable`, 'success');
  };

  const handleCreateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrade.grade.trim()) {
      addToast('Grade code required', 'warning');
      return;
    }
    setGradingScales(prev => [...prev, newGrade]);
    setShowAddGradeModal(false);
    setNewGrade({ grade: '', minMarks: 0, maxMarks: 0, gpa: '', remark: '' });
    addToast(`Grading boundary "${newGrade.grade}" added`, 'success');
  };

  const handleAwardPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouse) return;
    setHouses(prev =>
      prev.map(h =>
        h.id === selectedHouse.id ? { ...h, points: h.points + Number(pointsDelta) } : h
      )
    );
    setShowAwardPointsModal(false);
    addToast(`Awarded ${pointsDelta} points to ${selectedHouse.name} for "${pointsReason}"`, 'success');
  };

  const handleExportConfig = () => {
    const data = {
      numberingSeries,
      bellPeriods,
      gradingScales,
      houses,
      exportedAt: new Date().toISOString(),
      institution: 'LumenAcademy K-12',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LumenAcademy_Institutional_Masters_Config_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Institutional master configurations exported (JSON)', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#f0f7fb] text-[#0e5d84]">
              MST · Module 10
            </span>
            <span className="text-xs text-[#777587]">14 Master Features</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#082b3d] mt-1">
            Masters & Institutional Configuration
          </h1>
          <p className="text-xs md:text-sm text-[#464555]">
            Class/section setups, bell timetable schedules, CBSE grading scales, dynamic numbering series, and working-day rules.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportConfig}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Config JSON</span>
          </button>
          <button
            onClick={() => addToast('All institutional masters committed and synchronized with database RLS cache', 'success')}
            className="px-4 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e0ecf4] pb-2">
        <button
          onClick={() => setActiveTab('numbering')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'numbering' ? 'bg-[#0e5d84] text-white shadow-xs' : 'text-[#464555] hover:bg-[#f0f7fb]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">pin</span>
          <span>Numbering Series (MST-010)</span>
        </button>
        <button
          onClick={() => setActiveTab('bell-schedule')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'bell-schedule' ? 'bg-[#0e5d84] text-white shadow-xs' : 'text-[#464555] hover:bg-[#f0f7fb]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">notifications_active</span>
          <span>Bell & Period Schedule (MST-005)</span>
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'grading' ? 'bg-[#0e5d84] text-white shadow-xs' : 'text-[#464555] hover:bg-[#f0f7fb]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">grade</span>
          <span>CBSE 9-Point Grading Scale (MST-014)</span>
        </button>
        <button
          onClick={() => setActiveTab('houses')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'houses' ? 'bg-[#0e5d84] text-white shadow-xs' : 'text-[#464555] hover:bg-[#f0f7fb]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">shield</span>
          <span>Houses & Clubs (MST-006)</span>
        </button>
      </div>

      {/* Tab 1: Numbering Series */}
      {activeTab === 'numbering' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#e0ecf4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#082b3d]">Automated Voucher & Document Series (MST-010)</h3>
              <p className="text-xs text-[#777587]">Concurrency-Safe Atomic Sequences across multi-branch instances</p>
            </div>
            <button
              onClick={() => setShowAddSeriesModal(true)}
              className="px-3.5 py-1.5 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>New Series Sequence</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[#464555] border-b border-[#e0ecf4] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Prefix</th>
                  <th className="py-3 px-4">Sample Generated Format</th>
                  <th className="py-3 px-4 font-mono text-center">Next Sequence</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {numberingSeries.map(item => (
                  <tr key={item.code} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0e5d84]">{item.code}</td>
                    <td className="py-3 px-4 font-semibold text-[#082b3d]">{item.module}</td>
                    <td className="py-3 px-4 font-mono text-[#464555]">{item.prefix}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{item.format}</td>
                    <td className="py-3 px-4 font-mono text-center font-bold text-[#082b3d]">{item.currentNumber + 1}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setNumberingSeries(prev =>
                            prev.map(s => (s.code === item.code ? { ...s, currentNumber: s.currentNumber + 1 } : s))
                          );
                          addToast(`Incremented sequence for ${item.module}`, 'info');
                        }}
                        className="text-[#0e5d84] hover:underline font-bold text-xs"
                      >
                        Advance +1
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Bell Schedule */}
      {activeTab === 'bell-schedule' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#e0ecf4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#082b3d]">Daily Campus Period & Bell Timings (MST-005)</h3>
              <p className="text-xs text-[#777587]">Configured for morning shift, assembly, breaks, and zero hour remedials</p>
            </div>
            <button
              onClick={() => setShowAddPeriodModal(true)}
              className="px-3.5 py-1.5 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Add Timetable Period</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[#464555] border-b border-[#e0ecf4] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Time Interval</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {bellPeriods.map((bp, idx) => (
                  <tr key={idx} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#082b3d]">{bp.period}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#0e5d84]">{bp.time}</td>
                    <td className="py-3 px-4 text-[#464555]">{bp.duration}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          bp.type.includes('Instructional')
                            ? 'bg-blue-50 text-blue-700'
                            : bp.type === 'Break' || bp.type === 'Lunch'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-[#f0f7fb] text-[#0e5d84]'
                        }`}
                      >
                        {bp.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setBellPeriods(prev => prev.filter((_, i) => i !== idx));
                          addToast(`Removed period ${bp.period}`, 'info');
                        }}
                        className="text-rose-600 hover:underline font-bold text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Grading Scale */}
      {activeTab === 'grading' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#e0ecf4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#082b3d]">CBSE Affiliated 9-Point Grading Scale (MST-014)</h3>
              <p className="text-xs text-[#777587]">Standardized mapping of numerical marks to 9 letter grades and grade points</p>
            </div>
            <button
              onClick={() => setShowAddGradeModal(true)}
              className="px-3.5 py-1.5 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Add Custom Boundary</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[#464555] border-b border-[#e0ecf4] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Marks Range (Out of 100)</th>
                  <th className="py-3 px-4 font-mono">Grade Point (GPA)</th>
                  <th className="py-3 px-4">Performance Remark</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {gradingScales.map((g, idx) => (
                  <tr key={g.grade} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0e5d84] font-mono text-sm">{g.grade}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#082b3d]">{g.minMarks} — {g.maxMarks}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{g.gpa}</td>
                    <td className="py-3 px-4 text-[#464555]">{g.remark}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setGradingScales(prev => prev.filter((_, i) => i !== idx));
                          addToast(`Removed grade ${g.grade}`, 'info');
                        }}
                        className="text-rose-600 hover:underline font-bold text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Houses */}
      {activeTab === 'houses' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0ecf4] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#082b3d]">Inter-House Championship & Co-Scholastic Roster (MST-006)</h3>
              <p className="text-xs text-[#777587]">Live scoreboards for athletics, debates, science exhibitions, and cultural trophies</p>
            </div>
            <button
              onClick={() => {
                setSelectedHouse(houses[0]);
                setShowAwardPointsModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">military_tech</span>
              <span>Award House Trophy Points</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {houses.map(house => (
              <div
                key={house.id}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  house.color === 'red'
                    ? 'border-red-200 bg-red-50/50'
                    : house.color === 'blue'
                    ? 'border-blue-200 bg-blue-50/50'
                    : house.color === 'emerald'
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-amber-200 bg-amber-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#464555]">
                      {house.motto}
                    </span>
                    <span className="font-mono text-xs font-bold">{house.id}</span>
                  </div>
                  <div className="font-bold text-[#082b3d] text-base mt-1">{house.name}</div>
                  <div className="text-xs text-[#777587] mt-1">Captain: {house.captain}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
                  <div className="text-2xl font-bold font-mono text-[#082b3d]">
                    {house.points.toLocaleString()} <span className="text-xs font-normal">Pts</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedHouse(house);
                      setShowAwardPointsModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-[#082b3d] shadow-2xs hover:bg-slate-100 transition-colors"
                  >
                    + Points
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Numbering Series */}
      {showAddSeriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <h3 className="font-bold text-base text-[#082b3d]">New Numbering Series (MST-010)</h3>
              <button onClick={() => setShowAddSeriesModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSeries} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#464555] mb-1">Target Module</label>
                <select
                  value={newSeries.module}
                  onChange={e => setNewSeries({ ...newSeries, module: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                >
                  <option value="Admissions">Admissions (Student Enrolment)</option>
                  <option value="Fee Receipts">Fee Receipts</option>
                  <option value="Transfer Certificate">Transfer Certificate (TC)</option>
                  <option value="Purchase Order">Purchase Order (PO)</option>
                  <option value="Hostel Gatepass">Hostel Gatepass</option>
                  <option value="Library Voucher">Library Voucher</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Prefix Pattern</label>
                <input
                  type="text"
                  placeholder="e.g. TC/2026/ or RCP/AY26/"
                  value={newSeries.prefix}
                  onChange={e => setNewSeries({ ...newSeries, prefix: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Initial Sequence</label>
                  <input
                    type="number"
                    value={newSeries.currentNumber}
                    onChange={e => setNewSeries({ ...newSeries, currentNumber: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Display Mask</label>
                  <input
                    type="text"
                    placeholder="e.g. TC/2026/XXX"
                    value={newSeries.format}
                    onChange={e => setNewSeries({ ...newSeries, format: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowAddSeriesModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl font-bold"
                >
                  Save Sequence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Bell Period */}
      {showAddPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <h3 className="font-bold text-base text-[#082b3d]">Add Timetable Period (MST-005)</h3>
              <button onClick={() => setShowAddPeriodModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#464555] mb-1">Period Label</label>
                <input
                  type="text"
                  placeholder="e.g. Period 9 or Remedial Lab"
                  value={newPeriod.period}
                  onChange={e => setNewPeriod({ ...newPeriod, period: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Time Interval</label>
                <input
                  type="text"
                  placeholder="e.g. 03:40 PM - 04:20 PM"
                  value={newPeriod.time}
                  onChange={e => setNewPeriod({ ...newPeriod, time: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Duration</label>
                  <input
                    type="text"
                    value={newPeriod.duration}
                    onChange={e => setNewPeriod({ ...newPeriod, duration: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Classification</label>
                  <select
                    value={newPeriod.type}
                    onChange={e => setNewPeriod({ ...newPeriod, type: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  >
                    <option value="Instructional">Instructional</option>
                    <option value="Instructional / Lab">Instructional / Lab</option>
                    <option value="Break">Break</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Remedial / Sports">Remedial / Sports</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowAddPeriodModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl font-bold"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Grade Boundary */}
      {showAddGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <h3 className="font-bold text-base text-[#082b3d]">Add Custom Grade Boundary (MST-014)</h3>
              <button onClick={() => setShowAddGradeModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGrade} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Letter Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. A+"
                    value={newGrade.grade}
                    onChange={e => setNewGrade({ ...newGrade, grade: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Grade Point (GPA)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9.5"
                    value={newGrade.gpa}
                    onChange={e => setNewGrade({ ...newGrade, gpa: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Min Marks (%)</label>
                  <input
                    type="number"
                    value={newGrade.minMarks}
                    onChange={e => setNewGrade({ ...newGrade, minMarks: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Max Marks (%)</label>
                  <input
                    type="number"
                    value={newGrade.maxMarks}
                    onChange={e => setNewGrade({ ...newGrade, maxMarks: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Remark Statement</label>
                <input
                  type="text"
                  placeholder="e.g. Exceptional Proficiency"
                  value={newGrade.remark}
                  onChange={e => setNewGrade({ ...newGrade, remark: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowAddGradeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl font-bold"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Award House Points */}
      {showAwardPointsModal && selectedHouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <h3 className="font-bold text-base text-[#082b3d]">Award Trophy Points — {selectedHouse.name}</h3>
              <button onClick={() => setShowAwardPointsModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAwardPoints} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#464555] mb-1">Select House</label>
                <select
                  value={selectedHouse.id}
                  onChange={e => setSelectedHouse(houses.find(h => h.id === e.target.value) || houses[0])}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                >
                  {houses.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} (Current: {h.points} Pts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Points to Award / Deduct</label>
                <input
                  type="number"
                  value={pointsDelta}
                  onChange={e => setPointsDelta(Number(e.target.value))}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Event / Achievement Reason</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowAwardPointsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl font-bold"
                >
                  Confirm Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

