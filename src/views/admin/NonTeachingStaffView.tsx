import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface SupportStaff {
  id: string;
  code: string;
  name: string;
  category: 'Campus Security' | 'Housekeeping & Sanitation' | 'Fleet & Transport' | 'Lab & IT Support' | 'Hostel Wardens';
  employmentType: 'Direct School Payroll' | 'Vendor Contract (SIS India)' | 'Vendor Contract (G4S)';
  shift: 'Morning (06:00 - 14:00)' | 'General (08:30 - 17:00)' | 'Night (22:00 - 06:00)';
  policeVerification: 'Verified (Clear)' | 'In Process' | 'Renewal Due';
  medicalFitness: 'Fit (Annual Certified)' | 'Pending Checkup';
  workOrdersActive: number;
  workOrdersCompleted: number;
  uniformAssetIssued: boolean;
  status: 'On Duty' | 'Relieved / Shift Off' | 'On Leave';
}

interface WorkOrder {
  id: string;
  title: string;
  assignee: string;
  priority: 'Routine' | 'High' | 'Emergency';
  status: 'In Progress' | 'Completed';
  category: string;
}

export const NonTeachingStaffView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'staff-roster' | 'duty-shifts' | 'work-orders' | 'statutory-compliance'>('staff-roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [staffList, setStaffList] = useState<SupportStaff[]>([
    {
      id: 'NTS-001',
      code: 'EMP-SEC-01',
      name: 'Rajendran M.',
      category: 'Campus Security',
      employmentType: 'Vendor Contract (SIS India)',
      shift: 'Morning (06:00 - 14:00)',
      policeVerification: 'Verified (Clear)',
      medicalFitness: 'Fit (Annual Certified)',
      workOrdersActive: 1,
      workOrdersCompleted: 42,
      uniformAssetIssued: true,
      status: 'On Duty',
    },
    {
      id: 'NTS-002',
      code: 'EMP-TRN-04',
      name: 'P. Murugan (Heavy Badge #TN-0481)',
      category: 'Fleet & Transport',
      employmentType: 'Direct School Payroll',
      shift: 'Morning (06:00 - 14:00)',
      policeVerification: 'Verified (Clear)',
      medicalFitness: 'Fit (Annual Certified)',
      workOrdersActive: 0,
      workOrdersCompleted: 98,
      uniformAssetIssued: true,
      status: 'On Duty',
    },
    {
      id: 'NTS-003',
      code: 'EMP-LAB-02',
      name: 'K. Senthil Kumar',
      category: 'Lab & IT Support',
      employmentType: 'Direct School Payroll',
      shift: 'General (08:30 - 17:00)',
      policeVerification: 'Verified (Clear)',
      medicalFitness: 'Fit (Annual Certified)',
      workOrdersActive: 2,
      workOrdersCompleted: 64,
      uniformAssetIssued: true,
      status: 'On Duty',
    },
    {
      id: 'NTS-004',
      code: 'EMP-HSK-12',
      name: 'Lakshmi Ammal',
      category: 'Housekeeping & Sanitation',
      employmentType: 'Vendor Contract (G4S)',
      shift: 'Morning (06:00 - 14:00)',
      policeVerification: 'Verified (Clear)',
      medicalFitness: 'Fit (Annual Certified)',
      workOrdersActive: 1,
      workOrdersCompleted: 110,
      uniformAssetIssued: true,
      status: 'On Duty',
    },
    {
      id: 'NTS-005',
      code: 'EMP-HST-03',
      name: 'S. Balamurugan',
      category: 'Hostel Wardens',
      employmentType: 'Direct School Payroll',
      shift: 'Night (22:00 - 06:00)',
      policeVerification: 'Verified (Clear)',
      medicalFitness: 'Fit (Annual Certified)',
      workOrdersActive: 0,
      workOrdersCompleted: 35,
      uniformAssetIssued: true,
      status: 'Relieved / Shift Off',
    },
  ]);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    { id: 'WO-801', title: 'Secondary Chemistry Lab Exhaust Vent Service', assignee: 'K. Senthil Kumar', priority: 'High', status: 'In Progress', category: 'Lab Facility' },
    { id: 'WO-802', title: 'Campus Gate 2 Turnstile Biometric Sensor Cleaning', assignee: 'Rajendran M.', priority: 'Routine', status: 'Completed', category: 'Security' },
    { id: 'WO-803', title: 'Primary Block 2nd Floor Sanitisation & Water Cooler Filter Check', assignee: 'Lakshmi Ammal', priority: 'High', status: 'In Progress', category: 'Housekeeping' },
  ]);

  // Modal States
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [woTitle, setWoTitle] = useState('');
  const [woAssignee, setWoAssignee] = useState('K. Senthil Kumar');
  const [woPriority, setWoPriority] = useState<'Routine' | 'High' | 'Emergency'>('High');
  const [woCategory, setWoCategory] = useState('General Maintenance');

  const [selectedStaffMember, setSelectedStaffMember] = useState<SupportStaff | null>(null);

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!woTitle.trim()) {
      addToast('Please enter a work order title', 'error');
      return;
    }

    const newWO: WorkOrder = {
      id: `WO-${800 + workOrders.length + 1}`,
      title: woTitle.trim(),
      assignee: woAssignee,
      priority: woPriority,
      status: 'In Progress',
      category: woCategory,
    };

    setWorkOrders([newWO, ...workOrders]);

    // Update assignee active work orders
    setStaffList(prev =>
      prev.map(s => (s.name === woAssignee ? { ...s, workOrdersActive: s.workOrdersActive + 1 } : s))
    );

    setShowWorkOrderModal(false);
    setWoTitle('');
    addToast(`Dispatched work order ${newWO.id} to ${woAssignee} via SMS & staff notification (NTS-019)`, 'success');
  };

  const handleCompleteWorkOrder = (woId: string, assigneeName: string) => {
    setWorkOrders(prev =>
      prev.map(wo => (wo.id === woId ? { ...wo, status: 'Completed' } : wo))
    );

    setStaffList(prev =>
      prev.map(s =>
        s.name === assigneeName
          ? {
              ...s,
              workOrdersCompleted: s.workOrdersCompleted + 1,
              workOrdersActive: Math.max(0, s.workOrdersActive - 1),
            }
          : s
      )
    );

    addToast(`Work order ${woId} marked verified and closed (NTS-020)`, 'success');
  };

  const handlePublishDutyRoster = () => {
    const rosterData = `LUMEN ACADEMY NON-TEACHING DUTY ROSTER (ALL SHIFTS)
==================================================
Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Academic Year: 2024-2025 | Institutional Affiliation: CBSE 1930412

SHIFT 1: MORNING (06:00 - 14:00)
- Fleet Depot: P. Murugan (Bus #12 TN-07-BW-4821)
- Gate 1 & 2 Security: Rajendran M. (SIS India Guard Lead)
- Housekeeping Lead: Lakshmi Ammal (Sanitization Corridor A-C)

SHIFT 2: GENERAL (08:30 - 17:00)
- Science & Computing Labs: K. Senthil Kumar
- Administrative Runners: R. Kannan, G. Suresh
- Infirmary Assistant: Mary John

SHIFT 3: NIGHT (22:00 - 06:00)
- Godavari Hostel Senior Warden: S. Balamurugan
- Perimeter Patrol: SIS India Night Guard Unit
==================================================
Status: PUBLISHED & BROADCASTED VIA SMS TO ALL 64 SUPPORT PERSONNEL`;

    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(rosterData);
    link.download = `Duty_Roster_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Published weekly non-teaching duty roster across all 3 shifts & downloaded shift plan (NTS-013)', 'success');
  };

  const handleExportCompliance = () => {
    const csvContent = [
      'Emp Code,Staff Name,Department,Employment Type,Police Clearance (POCSO),Medical Fitness,Annual Renewal Due',
      ...staffList.map(s => `${s.code},"${s.name}","${s.category}","${s.employmentType}","${s.policeVerification}","${s.medicalFitness}",30-Nov-2025`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `POCSO_SupportStaff_Compliance_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Exported POCSO & Police Clearance Compliance Register (CSV)', 'success');
  };

  const filteredStaff = staffList.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
              NTS · Module 37 · Layer 6 (People)
            </span>
            <span className="text-xs text-ink-muted">30 Master Features</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-ink mt-1">
            Non-Teaching Staff & Support Operations
          </h1>
          <p className="text-xs md:text-sm text-ink-soft">
            Campus security, bus drivers, housekeeping, lab attendants, shift rosters, work order dispatch, and POCSO police verifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePublishDutyRoster}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">event_available</span>
            <span>Publish Roster</span>
          </button>
          <button
            onClick={() => setShowWorkOrderModal(true)}
            className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add_task</span>
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Total Support Staff (NTS-001)</div>
          <div className="text-xl font-bold font-mono text-ink mt-1">64 Personnel</div>
          <div className="text-[11px] text-ink-muted mt-0.5">38 Direct • 26 Contracted</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Shift Coverage Today (NTS-014)</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">98.4% Present</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Zero unstaffed campus posts</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Police Verification (NTS-007)</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">100% Cleared</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Mandatory POCSO Act protocol</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Work Order Completion (NTS-020)</div>
          <div className="text-xl font-bold font-mono text-brand mt-1">94.8% SLA</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Avg turnaround: 2.1 hours</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line-soft pb-2">
        <button
          onClick={() => setActiveTab('staff-roster')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'staff-roster' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">badge</span>
          <span>Staff Directory & Profiles (NTS-001..005)</span>
        </button>
        <button
          onClick={() => setActiveTab('duty-shifts')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'duty-shifts' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>Shift Master & Duty Rosters (NTS-011..016)</span>
        </button>
        <button
          onClick={() => setActiveTab('work-orders')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'work-orders' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">assignment</span>
          <span>Work Orders & Tasks ({workOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('statutory-compliance')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'statutory-compliance' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span>Police Verification & Safety Compliance (NTS-007/026)</span>
        </button>
      </div>

      {/* Tab 1: Staff Directory & Categories */}
      {activeTab === 'staff-roster' && (
        <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
          <div className="p-4 border-b border-line-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'Campus Security', 'Fleet & Transport', 'Housekeeping & Sanitation', 'Lab & IT Support', 'Hostel Wardens'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat ? 'bg-brand text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Roles' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-sm text-ink-muted">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="w-full bg-wash border border-line-soft rounded-xl pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-hidden focus:border-brand"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-ink-soft border-b border-line-soft text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department & Payroll</th>
                  <th className="py-3 px-4">Current Shift</th>
                  <th className="py-3 px-4 text-center">Police Clear (POCSO)</th>
                  <th className="py-3 px-4 text-center">Active / Done</th>
                  <th className="py-3 px-4 text-center">Duty Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {filteredStaff.map(staff => (
                  <tr key={staff.id} className="hover:bg-wash transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-ink">{staff.name}</div>
                      <div className="text-[10px] text-ink-muted font-mono">{staff.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{staff.category}</div>
                      <div className="text-[10px] text-ink-muted">{staff.employmentType}</div>
                    </td>
                    <td className="py-3 px-4 text-ink-soft font-mono text-[11px]">{staff.shift}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {staff.policeVerification}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-ink">
                      <span className="text-amber-700">{staff.workOrdersActive} active</span> • <span className="text-emerald-700">{staff.workOrdersCompleted} done</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          staff.status === 'On Duty'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStaffMember(staff)}
                        className="text-xs text-brand font-bold hover:underline"
                      >
                        Profile & Assets →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Shift Master & Rosters */}
      {activeTab === 'duty-shifts' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line-soft pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink">Campus 3-Shift Roster Structure (NTS-011)</h3>
              <p className="text-xs text-ink-muted">24/7 campus gate security, early morning transport depot departures, and facility sanitization</p>
            </div>
            <button
              onClick={handlePublishDutyRoster}
              className="text-xs font-mono font-bold bg-subtle hover:bg-lumen-200 text-brand px-3 py-1 rounded-lg border border-line transition-colors"
            >
              Export Shift Roster
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">Shift 1 · Morning</span>
                <span className="font-mono text-brand font-bold">06:00 — 14:00</span>
              </div>
              <p className="text-ink-muted">Bus boarding arrival, gates 1 & 2 morning intake, main building housekeeping prep.</p>
              <div className="font-bold text-emerald-700 text-[11px] pt-1 border-t border-slate-200">24 Staff Assigned</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">Shift 2 · General</span>
                <span className="font-mono text-brand font-bold">08:30 — 17:00</span>
              </div>
              <p className="text-ink-muted">Laboratory attendants, library circulation assistants, office messengers, canteen.</p>
              <div className="font-bold text-emerald-700 text-[11px] pt-1 border-t border-slate-200">28 Staff Assigned</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">Shift 3 · Night</span>
                <span className="font-mono text-brand font-bold">22:00 — 06:00</span>
              </div>
              <p className="text-ink-muted">Perimeter campus security, hostel gatekeepers, overnight maintenance & CCTV monitor.</p>
              <div className="font-bold text-emerald-700 text-[11px] pt-1 border-t border-slate-200">12 Staff Assigned</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Work Orders */}
      {activeTab === 'work-orders' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Active Work Orders & Maintenance Log (NTS-019)</h3>
              <p className="text-xs text-ink-muted">Dispatched tasks linked to support staff with GPS / timestamp verification</p>
            </div>
            <button
              onClick={() => setShowWorkOrderModal(true)}
              className="px-3.5 py-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Create Work Order</span>
            </button>
          </div>

          <div className="space-y-3">
            {workOrders.map(wo => (
              <div key={wo.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">{wo.id}</span>
                    <span className="text-xs font-bold text-ink">{wo.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      wo.priority === 'Emergency' ? 'bg-rose-100 text-rose-800' : wo.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {wo.priority}
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted mt-1">
                    Assignee: <span className="font-semibold text-ink">{wo.assignee}</span> • Category: {wo.category}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wo.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {wo.status}
                  </span>
                  {wo.status !== 'Completed' && (
                    <button
                      onClick={() => handleCompleteWorkOrder(wo.id, wo.assignee)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-ink hover:text-emerald-800 border border-slate-200 rounded text-xs font-bold transition-all"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Statutory Compliance */}
      {activeTab === 'statutory-compliance' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line-soft pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink">Statutory Compliance & Child Protection Register (NTS-026)</h3>
              <p className="text-xs text-ink-muted">POCSO Act 2012, mandatory background verification, and vendor SLA audit</p>
            </div>
            <button
              onClick={handleExportCompliance}
              className="text-xs font-mono font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export POCSO Register (CSV)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Police Character & Background Checks (NTS-007)</div>
              <div className="text-slate-600">
                All 64 support staff have verified police clearance certificates on file in the secure document vault. Annual renewals flagged 60 days before expiry.
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Vendor Staff SLA & Security Audits (NTS-030)</div>
              <div className="text-slate-600">
                Quarterly performance scorecards and PF/ESI compliance audits for contracted housekeeping (G4S) and campus guarding (SIS India).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Work Order Modal */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">add_task</span>
                <h3 className="font-bold text-ink text-sm">Dispatch New Support Work Order</h3>
              </div>
              <button
                onClick={() => setShowWorkOrderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Order Task Title</label>
                <input
                  type="text"
                  value={woTitle}
                  onChange={e => setWoTitle(e.target.value)}
                  placeholder="e.g., Auditorium Stage Mic Line Repair"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Support Staff</label>
                <select
                  value={woAssignee}
                  onChange={e => setWoAssignee(e.target.value)}
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.category} • {s.shift.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={woPriority}
                    onChange={e => setWoPriority(e.target.value as any)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="Routine">Routine</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={woCategory}
                    onChange={e => setWoCategory(e.target.value)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="General Maintenance">General Maintenance</option>
                    <option value="Security">Security</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Lab Facility">Lab Facility</option>
                    <option value="Transport Depot">Transport Depot</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowWorkOrderModal(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Staff Profile & Asset Ledger Modal */}
      {selectedStaffMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">badge</span>
                <h3 className="font-bold text-ink text-sm">
                  Support Staff Profile & Assets (NTS-010)
                </h3>
              </div>
              <button
                onClick={() => setSelectedStaffMember(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 bg-wash p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-ink">{selectedStaffMember.name}</div>
                  <div className="font-mono text-slate-500 text-[11px]">{selectedStaffMember.code} • {selectedStaffMember.category}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {selectedStaffMember.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200">
                <div>Shift: <strong>{selectedStaffMember.shift}</strong></div>
                <div>Payroll: <strong>{selectedStaffMember.employmentType}</strong></div>
                <div>Police Clearance: <strong className="text-emerald-700">{selectedStaffMember.policeVerification}</strong></div>
                <div>Medical Fitness: <strong className="text-emerald-700">{selectedStaffMember.medicalFitness}</strong></div>
                <div>Completed Tasks: <strong className="font-mono">{selectedStaffMember.workOrdersCompleted}</strong></div>
                <div>Active Tasks: <strong className="font-mono text-amber-700">{selectedStaffMember.workOrdersActive}</strong></div>
              </div>
            </div>

            {/* Issued Institutional Assets */}
            <div className="space-y-2">
              <div className="font-bold text-ink flex justify-between">
                <span>Issued School Equipment & Assets (NTS-022)</span>
                <span className="text-emerald-700 font-normal">All Signed Out</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span>• Institutional Uniform (2 Sets + Safety Vest)</span>
                  <span className="font-mono text-slate-500">Asset #UNIF-2024-41</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>• RFID Smart Card & Biometric NFC Tag</span>
                  <span className="font-mono text-slate-500">NFC-0941-SEC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>• VHF Walkie-Talkie Handset (Channel 4)</span>
                  <span className="font-mono text-slate-500">WT-CHAN4-02</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  addToast(`Issued additional equipment asset requisition for ${selectedStaffMember.name}`, 'success');
                  setSelectedStaffMember(null);
                }}
                className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">inventory_2</span>
                <span>Issue Additional Asset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
