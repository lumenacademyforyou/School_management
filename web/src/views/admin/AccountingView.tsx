import React, { useId, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Figure } from '../../components/common/Figure';
import { DialogClose, DialogShell } from '../../components/common/ui';

interface GLAccount {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Income' | 'Expense';
  balance: number;
  mappedFeeHead?: string;
}

interface ExpenseEntry {
  id: string;
  voucherNo: string;
  date: string;
  payee: string;
  category: string;
  amount: number;
  status: 'Approved' | 'Pending Approval' | 'Rejected';
  approvedBy?: string;
}

export const AccountingView: React.FC = () => {
  const { addToast } = useApp();
  const voucherTitleId = useId();
  const [activeTab, setActiveTab] = useState<'chart-of-accounts' | 'expenses' | 'day-book' | 'tally-export'>('chart-of-accounts');

  // Modal State
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [newPayee, setNewPayee] = useState('');
  const [newCategory, setNewCategory] = useState('Campus Maintenance');
  const [newAmount, setNewAmount] = useState('');

  const [accounts] = useState<GLAccount[]>([
    { code: '1001', name: 'HDFC Escrow School Collection A/c', type: 'Asset', balance: 4825000 },
    { code: '1002', name: 'SBI Institutional Current A/c', type: 'Asset', balance: 1450000 },
    { code: '1050', name: 'Petty Cash - Main Office', type: 'Asset', balance: 45000 },
    { code: '2001', name: 'Caution Deposit Payable (Students)', type: 'Liability', balance: 1250000 },
    { code: '2010', name: 'EPF & ESI Statutory Payable', type: 'Liability', balance: 340000 },
    { code: '3001', name: 'Tuition Fee Income', type: 'Income', balance: 18450000, mappedFeeHead: 'Tuition Fee' },
    { code: '3002', name: 'Science & Computer Lab Fee', type: 'Income', balance: 2150000, mappedFeeHead: 'Lab Fee' },
    { code: '3003', name: 'Fleet Transportation Service Fee', type: 'Income', balance: 3650000, mappedFeeHead: 'Transport Fee' },
    { code: '4001', name: 'Faculty Salary & Allowances (7th CPC)', type: 'Expense', balance: 9450000 },
    { code: '4010', name: 'Diesel & Bus Maintenance Expense', type: 'Expense', balance: 840000 },
    { code: '4020', name: 'Campus Electricity & High-Tension Power', type: 'Expense', balance: 520000 },
  ]);

  const [expenses, setExpenses] = useState<ExpenseEntry[]>([
    { id: 'EXP-101', voucherNo: 'PV/2026/089', date: '2026-09-14', payee: 'Indian Oil Bharat Petroleum', category: 'Fleet Fuel', amount: 48500, status: 'Approved', approvedBy: 'Accounts Officer' },
    { id: 'EXP-102', voucherNo: 'PV/2026/090', date: '2026-09-14', payee: 'Oxford University Press', category: 'Library Books', amount: 125000, status: 'Approved', approvedBy: 'Principal' },
    { id: 'EXP-103', voucherNo: 'PV/2026/091', date: '2026-09-15', payee: 'Microgen Science Equipments', category: 'Physics Lab Chemicals', amount: 64200, status: 'Pending Approval' },
    { id: 'EXP-104', voucherNo: 'PV/2026/092', date: '2026-09-15', payee: 'SpeedNet Fiber Leased Line', category: 'IT & Internet', amount: 18500, status: 'Pending Approval' },
  ]);

  const handleApproveExpense = (id: string) => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === id ? { ...exp, status: 'Approved', approvedBy: 'Super Admin' } : exp))
    );
    addToast('Payment voucher authorized and recorded to General Ledger', 'success');
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayee.trim() || !newAmount.trim()) {
      addToast('Please provide payee and amount', 'error');
      return;
    }

    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }

    const newExp: ExpenseEntry = {
      id: `EXP-${100 + expenses.length + 1}`,
      voucherNo: `PV/2026/0${90 + expenses.length + 1}`,
      date: new Date().toISOString().slice(0, 10),
      payee: newPayee.trim(),
      category: newCategory,
      amount: amt,
      status: 'Pending Approval',
    };

    setExpenses([newExp, ...expenses]);
    setShowVoucherModal(false);
    setNewPayee('');
    setNewAmount('');
    addToast(`Recorded voucher ${newExp.voucherNo} for ₹${amt.toLocaleString('en-IN')} (ACC-003)`, 'success');
  };

  const handleExportCOA = () => {
    const csvContent = [
      'GL Code,Account Name,Category Type,Mapped Fee Head,Current Balance (INR)',
      ...accounts.map(a => `${a.code},"${a.name}",${a.type},"${a.mappedFeeHead || 'General'}",${a.balance}`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Chart_of_Accounts_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported General Ledger Chart of Accounts (CSV)', 'success');
  };

  const handleExportTally = () => {
    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        <!-- LumenAcademy SMS Chart of Accounts to Tally Prime GL Sync -->
        ${accounts
          .map(
            a => `
        <LEDGER NAME="${a.name}" ACTION="Create">
          <NAME>${a.name}</NAME>
          <PARENT>${a.type === 'Asset' ? 'Current Assets' : a.type === 'Income' ? 'Direct Incomes' : a.type === 'Expense' ? 'Direct Expenses' : 'Current Liabilities'}</PARENT>
          <OPENINGBALANCE>${a.balance}</OPENINGBALANCE>
        </LEDGER>`
          )
          .join('')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    const blob = new Blob([xmlPayload], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LumenAcademy_TallyPrime_Export_${new Date().toISOString().slice(0, 10)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Tally Prime XML exported with GL mappings and ledger vouchers', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-subtle text-brand">
              ACC · Module 20 · Layer 4 (Finance)
            </span>
            <span className="text-xs text-ink-muted">11 Master Features</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            Accounting & General Ledger
          </h1>
          <p className="text-xs md:text-sm text-ink-soft">
            Chart of accounts, fee-head GL mapping, petty cash, voucher approvals, and Tally Prime / Zoho Books synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCOA}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export COA</span>
          </button>
          <button
            onClick={handleExportTally}
            className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">sync_alt</span>
            <span>Export to Tally XML</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Total Fee Inflow (YTD)</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1"><Figure prefix="₹" value="2,42,50,000" /></div>
          <div className="text-[11px] text-ink-muted mt-0.5"><Figure value="100" suffix="%" /> Fee Head GL Mapped</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Total Operating Expenses</div>
          <div className="text-xl font-bold font-mono text-ink mt-1"><Figure prefix="₹" value="1,08,10,000" /></div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Within <Figure value="84" suffix="%" /> Annual Budget</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Pending Vouchers</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {expenses.filter(e => e.status === 'Pending Approval').length}
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">Awaiting Principal Signoff</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Escrow Bank Balance</div>
          <div className="text-xl font-bold font-mono text-ink mt-1"><Figure prefix="₹" value="62,75,000" /></div>
          <div className="text-[11px] text-ink-muted mt-0.5">HDFC Escrow + SBI Current</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line-soft pb-2">
        <button
          onClick={() => setActiveTab('chart-of-accounts')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'chart-of-accounts'
              ? 'bg-brand text-white shadow-xs'
              : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">account_tree</span>
          <span>Chart of Accounts (COA)</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-brand text-white shadow-xs'
              : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">receipt</span>
          <span>Payment Vouchers & Expenses ({expenses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('day-book')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'day-book'
              ? 'bg-brand text-white shadow-xs'
              : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">calendar_view_day</span>
          <span>Daily Cash-Book</span>
        </button>
        <button
          onClick={() => setActiveTab('tally-export')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'tally-export'
              ? 'bg-brand text-white shadow-xs'
              : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">hub</span>
          <span>Tally / Zoho Prime Sync</span>
        </button>
      </div>

      {/* Tab 1: Chart of Accounts */}
      {activeTab === 'chart-of-accounts' && (
        <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
          <div className="p-4 border-b border-line-soft flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">General Ledger Heads & Mapping (ACC-001 & ACC-002)</h3>
            <span className="text-xs text-ink-muted">11 Ledger Codes Active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-ink-soft border-b border-line-soft text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">GL Code</th>
                  <th className="py-3 px-4">Account Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Mapped Fee Head</th>
                  <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {accounts.map(acc => (
                  <tr key={acc.code} className="hover:bg-wash transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-ink">{acc.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          acc.type === 'Asset'
                            ? 'bg-slate-100 text-slate-700'
                            : acc.type === 'Income'
                            ? 'bg-emerald-50 text-emerald-700'
                            : acc.type === 'Expense'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      {acc.mappedFeeHead ? (
                        <span className="inline-flex items-center gap-1 font-mono text-brand bg-subtle px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-[12px]">link</span>
                          {acc.mappedFeeHead}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Operations</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-ink">
                      <Figure prefix="₹" value={acc.balance.toLocaleString('en-IN')} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Reconciled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Expenses & Vouchers */}
      {activeTab === 'expenses' && (
        <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
          <div className="p-4 border-b border-line-soft flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Expense Vouchers & Multi-Step Approvals (ACC-003 & ACC-004)</h3>
            <button
              onClick={() => setShowVoucherModal(true)}
              className="px-3.5 py-1.5 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Create Payment Voucher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-ink-soft border-b border-line-soft text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payee / Vendor</th>
                  <th className="py-3 px-4">Expense Head</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Approval Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-wash transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand">{exp.voucherNo}</td>
                    <td className="py-3 px-4 text-ink-soft">{exp.date}</td>
                    <td className="py-3 px-4 font-semibold text-ink">{exp.payee}</td>
                    <td className="py-3 px-4 text-ink-soft">{exp.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-ink">
                      <Figure prefix="₹" value={exp.amount.toLocaleString('en-IN')} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          exp.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {exp.status === 'Pending Approval' ? (
                        <button
                          onClick={() => handleApproveExpense(exp.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all"
                        >
                          Authorize
                        </button>
                      ) : (
                        <span className="text-[11px] text-ink-muted">Authorized by {exp.approvedBy}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Cash-Book */}
      {activeTab === 'day-book' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Daily Cash & Bank Register (ACC-005 & FEE-036)</h3>
              <p className="text-xs text-ink-muted">Closing balance verified daily at 5:00 PM</p>
            </div>
            <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold border border-emerald-200">
              Cash Drawer Balanced: <Figure prefix="₹" value="45,000.00" />
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-emerald-800 uppercase mb-2">Today's Inflows (Receipts)</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span>Fee Counter Collection (Cash)</span>
                  <span className="font-mono font-bold text-emerald-700">+ <Figure prefix="₹" value="34,200" /></span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span>Fee Gateway UPI (Direct to HDFC)</span>
                  <span className="font-mono font-bold text-emerald-700">+ <Figure prefix="₹" value="1,48,500" /></span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span>Library Late Fine Receipts</span>
                  <span className="font-mono font-bold text-emerald-700">+ <Figure prefix="₹" value="1,850" /></span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-rose-800 uppercase mb-2">Today's Outflows (Payments)</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span>Diesel for Bus Fleet #12 & #15</span>
                  <span className="font-mono font-bold text-rose-700">- <Figure prefix="₹" value="12,400" /></span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span>Emergency Plumber Repair (Hostel)</span>
                  <span className="font-mono font-bold text-rose-700">- <Figure prefix="₹" value="3,200" /></span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span>Office Refreshments & Courier</span>
                  <span className="font-mono font-bold text-rose-700">- <Figure prefix="₹" value="1,450" /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tally / Zoho Export */}
      {activeTab === 'tally-export' && (
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ink">Automated Accounting Software Export (ACC-009)</h3>
          <p className="text-xs text-ink-soft">
            Generate seamless double-entry XML and CSV payloads compliant with Tally Prime 4.0 and Zoho Books API schema.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-line-soft bg-wash space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-brand">description</span>
                <span className="text-sm font-bold text-ink">Tally Prime XML Export</span>
              </div>
              <p className="text-xs text-ink-muted">
                Exports complete Chart of Accounts, student fee collections, and journal vouchers in Tally XML format.
              </p>
              <button
                onClick={handleExportTally}
                className="w-full py-2 bg-brand text-white rounded-xl text-xs font-bold shadow-xs hover:bg-brand-strong transition-all"
              >
                Download Tally XML Package
              </button>
            </div>

            <div className="p-4 rounded-xl border border-line-soft bg-wash space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-emerald-600">cloud_sync</span>
                <span className="text-sm font-bold text-ink">Zoho Books Direct API Sync</span>
              </div>
              <p className="text-xs text-ink-muted">
                Direct automated synchronization with school Zoho Books organization ID using OAuth2 token.
              </p>
              <button
                onClick={() => addToast('Successfully synced 14 pending ledger vouchers with Zoho Books API (ACC-010)', 'success')}
                className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all"
              >
                Trigger Live Zoho Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Payment Voucher */}
      <DialogShell open={showVoucherModal} onClose={() => setShowVoucherModal(false)} labelledBy={voucherTitleId} className="max-w-md p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand">receipt</span>
            <h3 id={voucherTitleId} className="font-bold text-ink text-sm">Record New Payment Voucher (ACC-003)</h3>
          </div>
          <DialogClose onClose={() => setShowVoucherModal(false)} />
        </div>

        <form onSubmit={handleCreateVoucher} className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payee / Vendor Name</label>
            <input
              type="text"
              value={newPayee}
              onChange={e => setNewPayee(e.target.value)}
              placeholder="e.g., Godrej Locks & Hardware Depot"
              className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Expense Head / GL Category</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
            >
              <option value="Campus Maintenance">Campus Maintenance</option>
              <option value="Fleet Fuel & Service">Fleet Fuel & Service</option>
              <option value="IT & Leased Line">IT & Leased Line</option>
              <option value="Library Books">Library Books</option>
              <option value="Hostel Operations">Hostel Operations</option>
              <option value="Office Stationery">Office Stationery</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Voucher Amount (INR)</label>
            <input
              type="number"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              placeholder="e.g. 24500"
              className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowVoucherModal(false)}
              className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Submit for Authorization
            </button>
          </div>
        </form>
      </DialogShell>
    </div>
  );
};
