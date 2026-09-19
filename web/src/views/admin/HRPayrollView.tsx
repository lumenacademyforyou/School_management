import React, { useId, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Figure } from '../../components/common/Figure';
import { DialogClose, DialogShell } from '../../components/common/ui';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  level: string;
  basic: number;
  da: number;
  hra: number;
  ta: number;
  epf: number;
  tax: number;
  status: string;
  pan: string;
  uan: string;
  bankAccount: string;
}

export const HRPayrollView: React.FC = () => {
  const { addToast } = useApp();
  const payslipTitleId = useId();
  const disbursalTitleId = useId();
  const addStaffTitleId = useId();

  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: 'EMP-101',
      name: 'Dr. Arvind Swaminathan',
      role: 'Principal & Secretary',
      level: 'Level 13A (₹1,31,400)',
      basic: 131400,
      da: 65700,
      hra: 35478,
      ta: 7200,
      epf: 15768,
      tax: 18400,
      status: 'Present (07:30 AM)',
      pan: 'ABCPS1234A',
      uan: '100987654321',
      bankAccount: 'HDFC0001234 - 5010049281',
    },
    {
      id: 'EMP-102',
      name: 'Mrs. Malini Iyer',
      role: 'PGT Physics (Class 10-A Mentor)',
      level: 'Level 11 (₹67,700)',
      basic: 67700,
      da: 33850,
      hra: 18279,
      ta: 3600,
      epf: 8124,
      tax: 6200,
      status: 'Present (07:38 AM)',
      pan: 'BCDPS2345B',
      uan: '100987654322',
      bankAccount: 'SBI0004567 - 3029182746',
    },
    {
      id: 'EMP-103',
      name: 'Dr. V. Raghavan',
      role: 'HOD Mathematics',
      level: 'Level 12 (₹78,800)',
      basic: 78800,
      da: 39400,
      hra: 21276,
      ta: 3600,
      epf: 9456,
      tax: 8400,
      status: 'Present (07:41 AM)',
      pan: 'CDEPS3456C',
      uan: '100987654323',
      bankAccount: 'ICIC0008910 - 0021948172',
    },
    {
      id: 'EMP-104',
      name: 'Coach R. Dinesh',
      role: 'Director of Physical Education',
      level: 'Level 10 (₹56,100)',
      basic: 56100,
      da: 28050,
      hra: 15147,
      ta: 3600,
      epf: 6732,
      tax: 3800,
      status: 'Present (07:15 AM)',
      pan: 'DEFPS4567D',
      uan: '100987654324',
      bankAccount: 'AXIS0001122 - 9182736450',
    },
    {
      id: 'EMP-105',
      name: 'G. Murugan',
      role: 'Senior Transport Pilot (Bus #12)',
      level: 'Level 4 (₹25,500)',
      basic: 25500,
      da: 12750,
      hra: 6885,
      ta: 1800,
      epf: 3060,
      tax: 0,
      status: 'On Route #14',
      pan: 'EFGPS5678E',
      uan: '100987654325',
      bankAccount: 'IOB0003344 - 1102938475',
    },
  ]);

  // Modals
  const [selectedStaffPayslip, setSelectedStaffPayslip] = useState<StaffMember | null>(null);
  const [showDisbursalModal, setShowDisbursalModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    level: 'Level 10 (₹56,100)',
    basic: 56100,
    pan: '',
    bankAccount: '',
  });

  const handleExportEPFChallan = () => {
    const ecrLines = [
      '# EPFO ECR Electronic File Specification Version 2.0',
      '# Est ID: DLCPM0019283000 | Wage Month: 02-2025',
      '# UAN#MEMBER_NAME#GROSS#EPF_WAGES#EPS_WAGES#EDLI_WAGES#EE_SHARE#ER_SHARE#EPS_SHARE#DIFF_EPF#NCP_DAYS',
      ...staff.map(s => {
        const gross = s.basic + s.da + s.hra + s.ta;
        const epfWages = Math.min(s.basic + s.da, 15000);
        const eeShare = Math.round(epfWages * 0.12);
        const epsShare = Math.round(epfWages * 0.0833);
        const diffEpf = eeShare - epsShare;
        return `${s.uan}#${s.name.toUpperCase()}#${gross}#${epfWages}#${epfWages}#${epfWages}#${eeShare}#${diffEpf}#${epsShare}#0#0`;
      })
    ].join('\n');

    const blob = new Blob([ecrLines], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `EPFO_ECR_CHALLAN_FEB2025.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('February 2025 EPFO Electronic Challan Return (ECR) exported for TRRN portal upload', 'success');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.role.trim()) {
      addToast('Name and role are required', 'warning');
      return;
    }
    const basic = Number(newStaff.basic) || 45000;
    const da = Math.round(basic * 0.50);
    const hra = Math.round(basic * 0.27);
    const ta = 3600;
    const epf = Math.round(basic * 0.12);
    const tax = Math.round(basic * 0.08);

    const created: StaffMember = {
      id: `EMP-${100 + staff.length + 1}`,
      name: newStaff.name,
      role: newStaff.role,
      level: newStaff.level,
      basic,
      da,
      hra,
      ta,
      epf,
      tax,
      status: 'Enrolled in Roster',
      pan: newStaff.pan || 'PANNOTREQ',
      uan: `100${Math.floor(100000000 + Math.random() * 900000000)}`,
      bankAccount: newStaff.bankAccount || 'SBI0001 - 123456789',
    };

    setStaff(prev => [...prev, created]);
    setShowAddStaffModal(false);
    setNewStaff({ name: '', role: '', level: 'Level 10 (₹56,100)', basic: 56100, pan: '', bankAccount: '' });
    addToast(`Added ${created.name} to 7th CPC Payroll Register`, 'success');
  };

  const handleRunBatchDisbursal = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDisbursalModal(false);
    addToast(`Batch NEFT / NACH payment initiated for ₹88.4 Lakh to 184 faculty bank accounts`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">groups</span>
            <span>Faculty Workforce & Statutory Payroll</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            7th Central Pay Commission (CPC) Payroll Command
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            184 Academic & Operations Staff • EPFO Electronic Challan Return (ECR) • Form 16 TDS Auto-Calculator
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Add Employee</span>
          </button>

          <button
            onClick={handleExportEPFChallan}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export EPFO / ESI Challan</span>
          </button>

          <button
            onClick={() => setShowDisbursalModal(true)}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            <span>Run Monthly Disbursal</span>
          </button>
        </div>
      </div>

      {/* Wage Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Monthly Gross Wage Bill</div>
          <div className="text-2xl font-bold font-display text-ink mt-0.5"><Figure prefix="₹" value="88.4" suffix=" Lakh" /></div>
          <div className="text-[11px] text-ink-soft">{staff.length} displayed (184 total on roll)</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-800">Statutory EPF Transfer</div>
          <div className="text-2xl font-bold font-display text-emerald-900 mt-0.5"><Figure prefix="₹" value="10.60" suffix=" Lakh" /></div>
          <div className="text-[11px] text-emerald-700 font-semibold"><Figure value="12" suffix="%" /> Employee + Employer</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">TDS Section 192 Deducted</div>
          <div className="text-2xl font-bold font-display text-ink mt-0.5"><Figure prefix="₹" value="7.20" suffix=" Lakh" /></div>
          <div className="text-[11px] text-ink-soft">TRACES 24Q Form Gen</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Staff In-Campus Today</div>
          <div className="text-2xl font-bold font-display text-emerald-700 mt-0.5">178 / 184</div>
          <div className="text-[11px] text-emerald-700 font-semibold"><Figure value="96.7" suffix="%" /> Biometric Present</div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
        <div className="p-4 bg-subtle border-b border-line flex items-center justify-between">
          <span className="text-xs font-bold text-ink">Staff Payroll Register (7th CPC Scale)</span>
          <span className="text-xs font-mono text-brand">Bank Disbursal: 1st of Month</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-subtle/60 text-ink-soft font-semibold border-b border-line">
              <tr>
                <th className="p-3">Staff Member & Designation</th>
                <th className="p-3">7th CPC Pay Scale</th>
                <th className="p-3">Basic + DA</th>
                <th className="p-3">EPF Contribution</th>
                <th className="p-3">Biometric Punch</th>
                <th className="p-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {staff.map(s => (
                <tr key={s.id} className="hover:bg-wash transition-colors">
                  <td className="p-3 font-bold text-ink">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-brand">{s.id}</span>
                      <span>{s.name}</span>
                    </div>
                    <div className="text-[10px] text-ink-muted font-normal">{s.role}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-brand">{s.level}</td>
                  <td className="p-3 font-mono text-ink"><Figure prefix="₹" value={(s.basic + s.da).toLocaleString()} /></td>
                  <td className="p-3 font-mono text-ink-soft"><Figure prefix="₹" value={s.epf.toLocaleString()} /></td>
                  <td className="p-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedStaffPayslip(s)}
                      className="text-brand font-semibold hover:underline bg-subtle px-2.5 py-1 rounded-lg"
                    >
                      View Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Payslip */}
      {selectedStaffPayslip && (
        <DialogShell open onClose={() => setSelectedStaffPayslip(null)} labelledBy={payslipTitleId} className="max-w-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div>
              <span className="text-[10px] font-mono text-brand font-bold">LUMENACADEMY · SALARY SLIP</span>
              <h3 id={payslipTitleId} className="font-bold text-base text-ink">{selectedStaffPayslip.name}</h3>
              <span className="text-xs text-ink-muted">{selectedStaffPayslip.role} • {selectedStaffPayslip.id}</span>
            </div>
            <DialogClose onClose={() => setSelectedStaffPayslip(null)} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-wash p-3 rounded-xl border border-line">
            <div>
              <span className="text-ink-muted block text-[10px]">PAN Number</span>
              <span className="font-mono font-bold text-ink">{selectedStaffPayslip.pan}</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px]">EPFO UAN</span>
              <span className="font-mono font-bold text-ink">{selectedStaffPayslip.uan}</span>
            </div>
            <div className="col-span-2">
              <span className="text-ink-muted block text-[10px]">Bank Account</span>
              <span className="font-mono font-semibold text-ink">{selectedStaffPayslip.bankAccount}</span>
            </div>
          </div>

          {/* Earnings vs Deductions Breakdown */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border border-emerald-200 bg-emerald-50/40 p-3 rounded-xl space-y-1.5">
              <div className="font-bold text-emerald-900 border-b border-emerald-200 pb-1">Earnings</div>
              <div className="flex justify-between"><span>Basic Pay:</span> <span className="font-mono font-semibold"><Figure prefix="₹" value={selectedStaffPayslip.basic.toLocaleString()} /></span></div>
              <div className="flex justify-between"><span>Dearness Allowance (DA 50%):</span> <span className="font-mono font-semibold"><Figure prefix="₹" value={selectedStaffPayslip.da.toLocaleString()} /></span></div>
              <div className="flex justify-between"><span>House Rent (HRA 27%):</span> <span className="font-mono font-semibold"><Figure prefix="₹" value={selectedStaffPayslip.hra.toLocaleString()} /></span></div>
              <div className="flex justify-between"><span>Transport Allowance:</span> <span className="font-mono font-semibold"><Figure prefix="₹" value={selectedStaffPayslip.ta.toLocaleString()} /></span></div>
              <div className="border-t border-emerald-200 pt-1 flex justify-between font-bold text-emerald-950">
                <span>Gross Pay:</span>
                <span className="font-mono">
                  <Figure prefix="₹" value={(selectedStaffPayslip.basic + selectedStaffPayslip.da + selectedStaffPayslip.hra + selectedStaffPayslip.ta).toLocaleString()} />
                </span>
              </div>
            </div>

            <div className="border border-red-200 bg-red-50/40 p-3 rounded-xl space-y-1.5">
              <div className="font-bold text-red-900 border-b border-red-200 pb-1">Deductions</div>
              <div className="flex justify-between"><span>Provident Fund (EPF):</span> <span className="font-mono font-semibold"><Figure prefix="₹" value={selectedStaffPayslip.epf.toLocaleString()} /></span></div>
              <div className="flex justify-between"><span>TDS (Sec 192):</span> <span className="font-mono font-semibold"><Figure prefix="₹" value={selectedStaffPayslip.tax.toLocaleString()} /></span></div>
              <div className="flex justify-between"><span>Professional Tax:</span> <span className="font-mono font-semibold"><Figure prefix="₹" value="200" /></span></div>
              <div className="border-t border-red-200 pt-1 flex justify-between font-bold text-red-950">
                <span>Total Deductions:</span>
                <span className="font-mono">
                  <Figure prefix="₹" value={(selectedStaffPayslip.epf + selectedStaffPayslip.tax + 200).toLocaleString()} />
                </span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="p-3.5 bg-subtle rounded-xl border border-line flex items-center justify-between text-xs">
            <div>
              <span className="text-brand font-bold text-sm block">Net Take-Home Salary</span>
              <span className="text-[11px] text-ink-soft">Direct NEFT Credit to Bank</span>
            </div>
            <div className="text-xl font-bold font-mono text-brand">
              <Figure prefix="₹" value={(
                selectedStaffPayslip.basic +
                selectedStaffPayslip.da +
                selectedStaffPayslip.hra +
                selectedStaffPayslip.ta -
                (selectedStaffPayslip.epf + selectedStaffPayslip.tax + 200)
              ).toLocaleString()} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={() => setSelectedStaffPayslip(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl font-semibold text-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                const slipText = `LumenAcademy 7th CPC Salary Slip\nEmployee: ${selectedStaffPayslip.name} (${selectedStaffPayslip.id})\nRole: ${selectedStaffPayslip.role}\nGross Pay: ₹${(selectedStaffPayslip.basic + selectedStaffPayslip.da + selectedStaffPayslip.hra + selectedStaffPayslip.ta).toLocaleString()}\nNet Disbursal: ₹${(selectedStaffPayslip.basic + selectedStaffPayslip.da + selectedStaffPayslip.hra + selectedStaffPayslip.ta - (selectedStaffPayslip.epf + selectedStaffPayslip.tax + 200)).toLocaleString()}`;
                const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Payslip_${selectedStaffPayslip.id}_FEB2025.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                addToast(`Downloaded PDF Payslip for ${selectedStaffPayslip.name}`, 'success');
              }}
              className="px-5 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download Payslip</span>
            </button>
          </div>
        </DialogShell>
      )}

      {/* Modal: Run Monthly Disbursal */}
      <DialogShell open={showDisbursalModal} onClose={() => setShowDisbursalModal(false)} labelledBy={disbursalTitleId} className="max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div>
            <h3 id={disbursalTitleId} className="font-bold text-base text-ink">Run Monthly Payroll Disbursal</h3>
            <span className="text-xs text-ink-muted">HDFC Corporate Banking NACH Portal</span>
          </div>
          <DialogClose onClose={() => setShowDisbursalModal(false)} />
        </div>

        <form onSubmit={handleRunBatchDisbursal} className="space-y-3 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
            <span className="font-bold block">Summary of Disbursal:</span>
            <div>Total Employees: 184</div>
            <div>Net Payment Volume: <strong><Figure prefix="₹" value="88,42,100" /></strong></div>
            <div>Statutory EPF & TDS Withholdings: <strong><Figure prefix="₹" value="17,80,000" /></strong></div>
          </div>

          <div>
            <label className="block font-bold text-ink-soft mb-1">Corporate Debit Account</label>
            <select className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink">
              <option>HDFC Bank Corporate Current A/c - 50200019284 (Balance: ₹1.45 Cr)</option>
              <option>State Bank of India Treasury A/c - 30192847291 (Balance: ₹85 Lakh)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-ink-soft mb-1">Disbursal Mode</label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" defaultChecked />
                <span>Direct Bank API Integration (Instant Host-to-Host NEFT)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" />
                <span>Generate Encrypted NACH / RTGS Batch TXT for Treasury Upload</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
            <button
              type="button"
              onClick={() => setShowDisbursalModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              Confirm & Disburse <Figure prefix="₹" value="88.4" suffix="L" />
            </button>
          </div>
        </form>
      </DialogShell>

      {/* Modal: Add Employee */}
      <DialogShell open={showAddStaffModal} onClose={() => setShowAddStaffModal(false)} labelledBy={addStaffTitleId} className="max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div>
            <h3 id={addStaffTitleId} className="font-bold text-base text-ink">Add Employee to Payroll</h3>
            <span className="text-xs text-ink-muted">7th CPC Grade Allotment</span>
          </div>
          <DialogClose onClose={() => setShowAddStaffModal(false)} />
        </div>

        <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-ink-soft mb-1">Employee Full Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Preeti Sharma"
              value={newStaff.name}
              onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
              className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-ink-soft mb-1">Designation / Role</label>
            <input
              type="text"
              placeholder="e.g. TGT Social Sciences"
              value={newStaff.role}
              onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
              className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink-soft mb-1">7th CPC Pay Scale</label>
              <select
                value={newStaff.level}
                onChange={e => {
                  const level = e.target.value;
                  let basic = 56100;
                  if (level.includes('Level 13A')) basic = 131400;
                  else if (level.includes('Level 12')) basic = 78800;
                  else if (level.includes('Level 11')) basic = 67700;
                  else if (level.includes('Level 4')) basic = 25500;
                  setNewStaff({ ...newStaff, level, basic });
                }}
                className="w-full bg-wash border border-line rounded-xl p-2 text-xs text-ink"
              >
                <option value="Level 13A (₹1,31,400)">Level 13A (₹1,31,400)</option>
                <option value="Level 12 (₹78,800)">Level 12 (₹78,800)</option>
                <option value="Level 11 (₹67,700)">Level 11 (₹67,700)</option>
                <option value="Level 10 (₹56,100)">Level 10 (₹56,100)</option>
                <option value="Level 4 (₹25,500)">Level 4 (₹25,500)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-ink-soft mb-1">PAN Card</label>
              <input
                type="text"
                placeholder="e.g. ABCPS1234D"
                value={newStaff.pan}
                onChange={e => setNewStaff({ ...newStaff, pan: e.target.value })}
                className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink-soft mb-1">Bank Name & A/c Number</label>
            <input
              type="text"
              placeholder="e.g. HDFC Bank - 50100291823"
              value={newStaff.bankAccount}
              onChange={e => setNewStaff({ ...newStaff, bankAccount: e.target.value })}
              className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
            <button
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl font-bold"
            >
              Enroll in Payroll
            </button>
          </div>
        </form>
      </DialogShell>
    </div>
  );
};
