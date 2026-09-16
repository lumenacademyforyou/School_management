import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeeInvoice } from '../../types';

export const FeesView: React.FC = () => {
  const { invoices, payInvoice, addToast } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'Due' | 'Paid' | 'Overdue' | 'Scholarship'>('ALL');
  
  // Modals state
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<FeeInvoice | null>(null);
  const [showDefaulterModal, setShowDefaulterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNewDemandModal, setShowNewDemandModal] = useState(false);
  
  // Payment confirmation state
  const [paymentInvoice, setPaymentInvoice] = useState<FeeInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NetBanking' | 'Cash' | 'Cheque / DD'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');

  // Defaulter notices form state
  const [defaulterChannel, setDefaulterChannel] = useState<'WhatsApp + SMS' | 'WhatsApp Only' | 'SMS Only' | 'Email'>('WhatsApp + SMS');
  const [defaulterTemplate, setDefaulterTemplate] = useState('CBSE-FEE-REMINDER-01 (TRAI DLT #10072189)');
  const [defaulterDispatched, setDefaulterDispatched] = useState<string[]>([]);

  // New demand form state
  const [demandStudentName, setDemandStudentName] = useState('');
  const [demandClass, setDemandClass] = useState('Grade 10-A');
  const [demandComponents, setDemandComponents] = useState('Term 3 Composite Tuition & Science Lab Fee');
  const [demandAmount, setDemandAmount] = useState('42500');
  const [demandDueDate, setDemandDueDate] = useState('28 Feb 2025');

  const filtered = filter === 'ALL' ? invoices : invoices.filter(inv => inv.status === filter);
  const defaulterList = invoices.filter(inv => inv.status === 'Overdue' || inv.status === 'Due');

  const handleConfirmPayment = () => {
    if (!paymentInvoice) return;
    payInvoice(paymentInvoice.id);
    addToast(`Payment of ₹${paymentInvoice.amount.toLocaleString('en-IN')} recorded via ${paymentMethod} (Ref: ${paymentRef || 'TXN-' + Math.floor(100000 + Math.random() * 900000)})`, 'success');
    setPaymentInvoice(null);
    setPaymentRef('');
  };

  const handleDispatchDefaulters = () => {
    const studentNames = defaulterList.map(d => d.studentName);
    setDefaulterDispatched(studentNames);
    addToast(`Dispatched fee overdue notices to ${defaulterList.length} parents via ${defaulterChannel}`, 'success');
    setTimeout(() => {
      setShowDefaulterModal(false);
    }, 1200);
  };

  const handleDownloadLedger = (format: 'csv' | 'xml' | 'json') => {
    let content = '';
    let mimeType = 'text/csv';
    let ext = 'csv';

    if (format === 'csv') {
      const headers = ['Invoice No', 'Student Name', 'Class', 'Components', 'Amount (INR)', 'Due Date', 'Status', 'Payment Channel', 'Receipt No'];
      const rows = invoices.map(i => [
        i.invoiceNo,
        `"${i.studentName}"`,
        `"${i.studentClass}"`,
        `"${i.components}"`,
        i.amount,
        i.dueDate,
        i.status,
        `"${i.channel || ''}"`,
        `"${i.receiptNo || ''}"`
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      mimeType = 'text/csv';
      ext = 'csv';
    } else if (format === 'xml') {
      mimeType = 'application/xml';
      ext = 'xml';
      content = `<?xml version="1.0" encoding="UTF-8"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n    <INSTITUTION>Lumen Academy Senior Secondary School</INSTITUTION>\n    <AFFILIATION>CBSE-1930412</AFFILIATION>\n  </HEADER>\n  <BODY>\n    <INVOICES>\n${invoices.map(i => `      <VOUCHER>\n        <VOUCHERNUMBER>${i.invoiceNo}</VOUCHERNUMBER>\n        <DATE>${i.dueDate}</DATE>\n        <PARTYNAME>${i.studentName}</PARTYNAME>\n        <AMOUNT>${i.amount}</AMOUNT>\n        <STATUS>${i.status}</STATUS>\n        <RECEIPTNO>${i.receiptNo || ''}</RECEIPTNO>\n      </VOUCHER>`).join('\n')}\n    </INVOICES>\n  </BODY>\n</ENVELOPE>`;
    } else {
      mimeType = 'application/json';
      ext = 'json';
      content = JSON.stringify({ institution: 'Lumen Academy', exportedAt: new Date().toISOString(), invoices }, null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LumenAcademy_FeeLedger_${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`Exported fee ledger in ${format.toUpperCase()} format`, 'success');
    setShowExportModal(false);
  };

  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandStudentName.trim()) {
      addToast('Please specify a student name', 'warning');
      return;
    }
    const newInv: FeeInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-2025-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: demandStudentName.trim(),
      studentClass: demandClass,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      components: demandComponents,
      amount: parseFloat(demandAmount) || 35000,
      dueDate: demandDueDate,
      status: 'Due',
      channel: 'Pending Collection (Razorpay/Escrow)',
    };
    invoices.unshift(newInv);
    addToast(`Issued new fee demand ${newInv.invoiceNo} for ${newInv.studentName}`, 'success');
    setShowNewDemandModal(false);
    setDemandStudentName('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            <span>Financial Operations & Dual-Entry Ledger</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Student Fee Accounts & Reconciliation
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Term 3 Invoices • Razorpay / HDFC Gateway Sync • RTE 25% State Subsidy Ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewDemandModal(true)}
            className="flex items-center gap-1.5 bg-[#f0f7fb] hover:bg-[#dbeafe] text-[#0e5d84] border border-[#cbe0ec] text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>+ Issue Demand</span>
          </button>
          <button
            onClick={() => setShowDefaulterModal(true)}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">notification_important</span>
            <span>Issue Defaulter Notices ({defaulterList.length})</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Tally / Ledger</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#e0ecf4] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#777587]">Total Demand (AY 24-25)</div>
          <div className="text-2xl font-bold font-display text-[#082b3d] mt-0.5">₹1.55 Cr</div>
          <div className="text-[11px] text-[#464555]">2,450 students enrolled</div>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
          <div className="text-[10px] uppercase font-bold text-emerald-800">Collected & Cleared</div>
          <div className="text-2xl font-bold font-display text-emerald-900 mt-0.5">₹1.42 Cr</div>
          <div className="text-[11px] text-emerald-700 font-semibold">91.4% Realized</div>
        </div>
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
          <div className="text-[10px] uppercase font-bold text-amber-800">Pending Term 3 Due</div>
          <div className="text-2xl font-bold font-display text-amber-900 mt-0.5">₹13.20 Lakh</div>
          <div className="text-[11px] text-amber-700 font-semibold">Due 28 Feb 2025</div>
        </div>
        <div className="bg-[#f0f7fb] p-4 rounded-xl border border-[#cbe0ec]">
          <div className="text-[10px] uppercase font-bold text-[#082b3d]">RTE / Scholarship Subsidy</div>
          <div className="text-2xl font-bold font-display text-[#082b3d] mt-0.5">₹6.40 Lakh</div>
          <div className="text-[11px] text-[#0e5d84] font-semibold">State Treasury Direct Credit</div>
        </div>
      </div>

      {/* Invoices Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#082b3d]">Recent Invoice Demands ({filtered.length})</span>
            <div className="flex gap-1 ml-2">
              {(['ALL', 'Due', 'Paid', 'Overdue', 'Scholarship'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                    filter === f ? 'bg-[#0e5d84] text-white font-semibold' : 'bg-white text-[#464555] hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-[#464555]">HDFC Bank Virtual Escrow A/C #9011</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f0f7fb]/60 text-[#464555] font-semibold border-b border-[#cbe0ec]">
              <tr>
                <th className="p-3">Invoice No.</th>
                <th className="p-3">Student & Class</th>
                <th className="p-3">Components Breakdown</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment Channel</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#082b3d]">{inv.invoiceNo}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={inv.avatar}
                        alt={inv.studentName}
                        className="w-7 h-7 rounded-full object-cover border border-[#cbe0ec]"
                      />
                      <div>
                        <div className="font-bold text-[#082b3d]">{inv.studentName}</div>
                        <div className="text-[10px] text-[#777587]">{inv.studentClass}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-[#464555]">{inv.components}</td>
                  <td className="p-3 font-mono font-bold text-xs">
                    {inv.amount === 0 ? 'Exempt (₹0)' : `₹${inv.amount.toLocaleString('en-IN')}`}
                  </td>
                  <td className="p-3 text-[#464555]">{inv.dueDate}</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'Due'
                          ? 'bg-amber-100 text-amber-800'
                          : inv.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-[#e0f2fe] text-[#082b3d]'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-[#464555]">
                    {inv.channel}
                    {inv.receiptNo && (
                      <span className="block font-mono text-[9px] text-emerald-700">{inv.receiptNo}</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {inv.status !== 'Paid' && inv.status !== 'Scholarship' ? (
                      <button
                        onClick={() => setPaymentInvoice(inv)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded text-[11px] transition-colors shadow-xs"
                      >
                        Record Payment
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedReceiptInvoice(inv)}
                        className="text-[#0e5d84] hover:underline font-semibold text-[11px] flex items-center gap-1 justify-end ml-auto"
                      >
                        <span className="material-symbols-outlined text-xs">receipt_long</span>
                        <span>View Receipt</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Official Fee Receipt Preview & Print */}
      {selectedReceiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e5d84]">verified</span>
                <h3 className="font-bold text-[#082b3d] text-sm">Official Institutional Fee Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceiptInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Printable Receipt Canvas */}
            <div className="border border-slate-300 rounded-xl p-6 bg-[#fafcff] space-y-4 font-sans text-xs">
              <div className="text-center border-b pb-3 space-y-0.5">
                <div className="font-black text-base text-[#082b3d] tracking-tight">LUMEN ACADEMY SENIOR SECONDARY SCHOOL</div>
                <div className="text-[11px] text-[#464555]">(Affiliated to CBSE, New Delhi • Affiliation No. 1930412 • School Code 55192)</div>
                <div className="text-[10px] text-[#777587]">Guindy Institutional Corridor, Chennai - 600032 • Trust PAN: AABTL9021C</div>
                <div className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold">
                  STUDENT FEE RECEIPT • AY 2024-25
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Receipt No: <strong className="font-mono">{selectedReceiptInvoice.receiptNo || 'RCP-2025-0814'}</strong></div>
                <div className="text-right">Date: <strong>26 Feb 2025</strong></div>
                <div>Invoice No: <strong className="font-mono">{selectedReceiptInvoice.invoiceNo}</strong></div>
                <div className="text-right">Student: <strong>{selectedReceiptInvoice.studentName}</strong></div>
                <div>Class & Section: <strong>{selectedReceiptInvoice.studentClass}</strong></div>
                <div className="text-right">Mode: <strong className="text-emerald-700">{selectedReceiptInvoice.channel}</strong></div>
              </div>

              <div className="border-t border-b py-2 space-y-1">
                <div className="flex justify-between font-semibold text-slate-600 text-[11px]">
                  <span>Fee Component / Head</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-800">
                  <span>{selectedReceiptInvoice.components}</span>
                  <span className="font-mono">₹{selectedReceiptInvoice.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>GST / Educational Service Tax (Nil as per Sec 66D)</span>
                  <span className="font-mono">₹0.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-sm font-bold text-[#082b3d]">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-emerald-700 text-base">₹{selectedReceiptInvoice.amount.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-2 border-t text-[10px] text-slate-500 flex justify-between items-end">
                <div>
                  <div>Payment Status: <strong>CLEARED & CREDITED</strong></div>
                  <div>Virtual Escrow Ref: HDFC-ESC-9011-LMN</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[9px] text-slate-400">Digitally Authenticated by Accounts Officer</div>
                  <div className="font-bold text-slate-700">Lumen Accounts Cell</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => {
                  window.print();
                  addToast('Dispatched to system print dialog', 'info');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Official Copy</span>
              </button>
              <button
                onClick={() => {
                  addToast(`Receipt PDF saved for ${selectedReceiptInvoice.studentName}`, 'success');
                  setSelectedReceiptInvoice(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Payment Dialog */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-[#082b3d] text-sm">Record Fee Collection</h3>
              <button
                onClick={() => setPaymentInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Student:</span> <strong className="text-slate-900">{paymentInvoice.studentName}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Class:</span> <span className="text-slate-700">{paymentInvoice.studentClass}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Due:</span> <strong className="text-emerald-700 font-mono text-sm">₹{paymentInvoice.amount.toLocaleString('en-IN')}</strong></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['UPI', 'NetBanking', 'Cash', 'Cheque / DD'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-lg border text-left font-semibold ${
                        paymentMethod === m ? 'bg-[#0e5d84] text-white border-[#0e5d84]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/2025/89127 or HDFC-CHQ-10492"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm & Issue Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Defaulter Notices Broadcast */}
      {showDefaulterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">notification_important</span>
                <h3 className="font-bold text-[#082b3d] text-sm">Issue Fee Defaulter Warning Notices</h3>
              </div>
              <button
                onClick={() => setShowDefaulterModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <span className="font-bold text-slate-700">Target Defaulter Accounts ({defaulterList.length} Students):</span>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y mt-1.5">
                  {defaulterList.map(d => (
                    <div key={d.id} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{d.studentName} ({d.studentClass})</div>
                        <div className="text-[10px] text-slate-500">{d.invoiceNo} • Due: {d.dueDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-700">₹{d.amount.toLocaleString('en-IN')}</div>
                        {defaulterDispatched.includes(d.studentName) && (
                          <span className="text-[9px] text-emerald-700 font-bold">Dispatched ✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dispatch Channels</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['WhatsApp + SMS', 'WhatsApp Only', 'SMS Only', 'Email'] as const).map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setDefaulterChannel(ch)}
                      className={`p-2 rounded-lg border text-center font-bold text-[11px] ${
                        defaulterChannel === ch ? 'bg-[#0e5d84] text-white border-[#0e5d84]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">DLT Template</label>
                <select
                  value={defaulterTemplate}
                  onChange={e => setDefaulterTemplate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option>CBSE-FEE-REMINDER-01 (TRAI DLT #10072189) - Gentle Reminder</option>
                  <option>CBSE-FEE-FINAL-02 (TRAI DLT #10072190) - Final Warning before Admit Card Hold</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowDefaulterModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchDefaulters}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Send Real-Time Defaulter Alerts</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Export Financial Ledger */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-[#082b3d] text-sm">Export Financial Ledger & Journal</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select your accounting package or format for export. Includes complete transaction IDs, tax exemption tags, and reconciliation timestamps.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleDownloadLedger('xml')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#0e5d84] hover:bg-[#f0f7fb] flex items-center justify-between text-xs font-bold text-slate-800 transition-all text-left"
              >
                <div>
                  <div>Tally Prime / ERP 9 XML</div>
                  <div className="text-[10px] text-slate-500 font-normal">Standard XML voucher format for direct import into Tally</div>
                </div>
                <span className="material-symbols-outlined text-[#0e5d84]">download</span>
              </button>

              <button
                onClick={() => handleDownloadLedger('csv')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#0e5d84] hover:bg-[#f0f7fb] flex items-center justify-between text-xs font-bold text-slate-800 transition-all text-left"
              >
                <div>
                  <div>Microsoft Excel / CSV Ledger</div>
                  <div className="text-[10px] text-slate-500 font-normal">Complete tabular ledger with formulas and student headers</div>
                </div>
                <span className="material-symbols-outlined text-[#0e5d84]">download</span>
              </button>

              <button
                onClick={() => handleDownloadLedger('json')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#0e5d84] hover:bg-[#f0f7fb] flex items-center justify-between text-xs font-bold text-slate-800 transition-all text-left"
              >
                <div>
                  <div>JSON Audit Ledger & 10BD Format</div>
                  <div className="text-[10px] text-slate-500 font-normal">Structured schema for statutory audit reporting and IT returns</div>
                </div>
                <span className="material-symbols-outlined text-[#0e5d84]">download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Issue New Fee Demand */}
      {showNewDemandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-[#082b3d] text-sm">Issue New Fee Demand</h3>
              <button
                onClick={() => setShowNewDemandModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDemand} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Varun K. Menon"
                  value={demandStudentName}
                  onChange={e => setDemandStudentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class & Section</label>
                  <select
                    value={demandClass}
                    onChange={e => setDemandClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option>Grade 10-A</option>
                    <option>Grade 11-A</option>
                    <option>Grade 12-B</option>
                    <option>Grade 9-B</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={demandAmount}
                    onChange={e => setDemandAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fee Components</label>
                <input
                  type="text"
                  value={demandComponents}
                  onChange={e => setDemandComponents(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="text"
                  value={demandDueDate}
                  onChange={e => setDemandDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewDemandModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Post Demand to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
