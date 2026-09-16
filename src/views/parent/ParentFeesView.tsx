import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const ParentFeesView: React.FC = () => {
  const { invoices, payInvoice, addToast } = useApp();
  const [paying, setPaying] = useState(false);

  const aaravInvoice = invoices.find(inv => inv.studentName.includes('Aarav')) || invoices[0];

  const handlePayment = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      payInvoice(aaravInvoice.id);
      addToast('Payment successful via Razorpay UPI! Receipt #REC-2025-098 generated.', 'success');
    }, 1200);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">payments</span>
            <span>Parent Fee Desk & Dual-Entry Receipts</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            School Fees & Academic Term Invoices
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Aarav S. Ramanathan • Class 10-A • HDFC Virtual Escrow Gateway
          </p>
        </div>

        <button
          onClick={() => addToast('Downloaded consolidated annual tax certificate (Sec 80C)', 'info')}
          className="flex items-center gap-1.5 bg-[#f0f7fb] text-[#0e5d84] border border-[#cbe0ec] text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#e0ecf4] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">receipt</span>
          <span>Section 80C Tax Certificate</span>
        </button>
      </div>

      {/* Active Term Invoice Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-4">
          <div>
            <div className="text-xs font-bold text-[#777587] uppercase tracking-wider">Invoice Demand #{aaravInvoice.invoiceNo}</div>
            <div className="text-lg font-bold text-[#082b3d] mt-0.5">Term 3 Fee Installment (AY 2024-25)</div>
            <div className="text-xs text-[#464555]">Due Date: {aaravInvoice.dueDate}</div>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold ${
              aaravInvoice.status === 'Paid'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {aaravInvoice.status}
          </span>
        </div>

        {/* Itemized Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
            <span>Tuition & Laboratory Fee (Physics/Chemistry/Computer)</span>
            <span className="font-mono font-bold text-[#082b3d]">₹35,000</span>
          </div>
          <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
            <span>Library, Digital LMS & Examination Assessment</span>
            <span className="font-mono font-bold text-[#082b3d]">₹4,500</span>
          </div>
          <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
            <span>Air-Conditioned Transport (Bus Route #14 - Velachery Corridor)</span>
            <span className="font-mono font-bold text-[#082b3d]">₹3,000</span>
          </div>
          <div className="flex justify-between p-3 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec] text-sm font-bold text-[#0e5d84]">
            <span>Total Payable Amount</span>
            <span className="font-mono">₹42,500</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          {aaravInvoice.status !== 'Paid' ? (
            <button
              onClick={handlePayment}
              disabled={paying}
              className="bg-[#0e5d84] hover:bg-[#083a4f] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">{paying ? 'sync' : 'lock'}</span>
              <span>{paying ? 'Processing UPI Payment...' : 'Pay ₹42,500 via UPI / Card'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Paid in full! Receipt #REC-2025-098 issued.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
