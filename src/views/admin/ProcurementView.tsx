import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Figure } from '../../components/common/Figure';

interface PurchaseOrder {
  poNo: string;
  vendor: string;
  items: string;
  amount: number;
  grnStatus: 'Verified (100%)' | 'Pending GRN' | 'Discrepancy';
  invoiceStatus: 'Matched' | 'Awaiting Invoice';
  paymentStatus: 'Pending Payment' | 'Paid & Released';
  utr?: string;
}

export const ProcurementView: React.FC = () => {
  const { addToast } = useApp();
  const [showCreatePoModal, setShowCreatePoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form state
  const [vendorName, setVendorName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [poAmount, setPoAmount] = useState('');

  const [orders, setOrders] = useState<PurchaseOrder[]>([
    {
      poNo: 'PO-2026-089',
      vendor: 'Scientific Instruments India Ltd',
      items: '50x Crown Glass Optical Prisms',
      amount: 17110,
      grnStatus: 'Verified (100%)',
      invoiceStatus: 'Matched',
      paymentStatus: 'Pending Payment',
    },
    {
      poNo: 'PO-2026-090',
      vendor: 'Microgen Chemistry Reagents',
      items: 'Laboratory Hydrochloric & Nitric Acids (AR Grade)',
      amount: 42500,
      grnStatus: 'Verified (100%)',
      invoiceStatus: 'Matched',
      paymentStatus: 'Paid & Released',
      utr: 'HDFCR2026091408192410',
    },
  ]);

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !itemDescription.trim() || !poAmount.trim()) {
      addToast('Please fill all purchase order details', 'error');
      return;
    }

    const amt = parseFloat(poAmount) || 0;
    const newPo: PurchaseOrder = {
      poNo: `PO-2026-0${90 + orders.length + 1}`,
      vendor: vendorName.trim(),
      items: itemDescription.trim(),
      amount: amt,
      grnStatus: 'Pending GRN',
      invoiceStatus: 'Awaiting Invoice',
      paymentStatus: 'Pending Payment',
    };

    setOrders([newPo, ...orders]);
    setShowCreatePoModal(false);
    setVendorName('');
    setItemDescription('');
    setPoAmount('');
    addToast(`Issued Purchase Order ${newPo.poNo} to ${newPo.vendor} (PRO-001)`, 'success');
  };

  const handleReleasePaymentConfirm = () => {
    const randomUtr = `HDFCR${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(100000 + Math.random() * 900000)}`;
    setOrders(prev =>
      prev.map(o => (o.poNo === 'PO-2026-089' ? { ...o, paymentStatus: 'Paid & Released', utr: randomUtr } : o))
    );
    setShowPaymentModal(false);
    addToast(`RTGS Funds Released! UTR ${randomUtr} dispatched to vendor (PRO-004)`, 'success');
  };

  const handleExportProcurement = () => {
    const csvContent = [
      'PO Number,Vendor Name,Item Description,Amount (INR),GRN Verification,GST Invoice Status,Payment Status,Bank UTR',
      ...orders.map(
        o =>
          `"${o.poNo}","${o.vendor}","${o.items}",${o.amount},"${o.grnStatus}","${o.invoiceStatus}","${o.paymentStatus}","${o.utr || 'N/A'}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Procurement_Purchase_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Procurement & 3-Way Match Register (CSV)', 'success');
  };

  const activePo = orders[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            <span>Procurement & Accounts Payable (PRO-001..010)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            3-Way Match Verification & Purchase Order Audit
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Reconciliation of Purchase Order (PO) ↔ Goods Receipt Note (GRN) ↔ Vendor GST Invoice
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportProcurement}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowCreatePoModal(true)}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Create PO</span>
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Approve & Release Payment</span>
          </button>
        </div>
      </div>

      {/* 3-Way Match Dossier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Document 1: Purchase Order */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <span className="text-xs font-bold text-ink">1. Purchase Order (PO)</span>
            <span className="text-[10px] font-mono bg-lumen-100 text-ink font-bold px-2 py-0.5 rounded">
              {activePo.poNo}
            </span>
          </div>
          <div className="text-xs space-y-1 text-ink-soft">
            <div>Vendor: <strong>{activePo.vendor}</strong></div>
            <div>Item: {activePo.items}</div>
            <div>Approved Rate: <Figure prefix="₹" value="290" /> / unit</div>
            <div className="font-bold text-ink pt-1">Total PO: <Figure prefix="₹" value={activePo.amount.toLocaleString('en-IN')} /> (incl. GST)</div>
          </div>
        </div>

        {/* Document 2: Goods Receipt Note */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <span className="text-xs font-bold text-ink">2. Goods Receipt Note (GRN)</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              GRN-9412
            </span>
          </div>
          <div className="text-xs space-y-1 text-ink-soft">
            <div>Received by: <strong>Lab Assistant K. Natarajan</strong></div>
            <div>Quantity Counted: 50 / 50 Verified</div>
            <div>Damage / Rejections: 0 Units (100% Quality Pass)</div>
            <div className="font-bold text-emerald-700 pt-1">Physical Inspection: PASSED</div>
          </div>
        </div>

        {/* Document 3: Vendor GST Tax Invoice */}
        <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <span className="text-xs font-bold text-ink">3. Vendor GST Invoice</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              INV-GST-4410
            </span>
          </div>
          <div className="text-xs space-y-1 text-ink-soft">
            <div>GSTIN: <strong>33AAAC1234F1Z5 (Tamil Nadu)</strong></div>
            <div>GSTR-2B ITC Match: <strong>Auto-Reconciled</strong></div>
            <div>Invoice Amount: <Figure prefix="₹" value={activePo.amount.toLocaleString('en-IN')} /></div>
            <div className="font-bold text-emerald-700 pt-1">Rate & Quantity Match: <Figure value="100" suffix="%" /></div>
          </div>
        </div>
      </div>

      {/* Match Confirmation Banner */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600">verified</span>
          <span><strong>Automated Audit:</strong> {activePo.poNo}, GRN #9412, and Vendor Invoice #4410 match completely without variance. Safe to release RTGS.</span>
        </div>
        <span className="font-bold font-mono text-emerald-800 shrink-0">
          STATUS: {activePo.paymentStatus.toUpperCase()}
        </span>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
        <div className="p-4 bg-subtle border-b border-line flex items-center justify-between">
          <span className="text-xs font-bold text-ink">Purchase Orders & 3-Way Match History</span>
          <span className="text-xs text-ink-muted font-mono">{orders.length} Records</span>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-subtle/60 text-ink-soft font-semibold border-b border-line">
            <tr>
              <th className="p-3">PO Number</th>
              <th className="p-3">Vendor</th>
              <th className="p-3">Item Description</th>
              <th className="p-3 text-right">Amount (₹)</th>
              <th className="p-3">GRN Status</th>
              <th className="p-3">Payment Status</th>
              <th className="p-3">Bank UTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {orders.map(o => (
              <tr key={o.poNo} className="hover:bg-wash">
                <td className="p-3 font-mono font-bold text-brand">{o.poNo}</td>
                <td className="p-3 font-semibold text-ink">{o.vendor}</td>
                <td className="p-3 text-ink-soft">{o.items}</td>
                <td className="p-3 text-right font-mono font-bold text-ink">
                  <Figure prefix="₹" value={o.amount.toLocaleString('en-IN')} />
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {o.grnStatus}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      o.paymentStatus === 'Paid & Released'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="p-3 font-mono text-[11px] text-ink-muted">
                  {o.utr || 'Pending'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Create Purchase Order */}
      {showCreatePoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">receipt_long</span>
                <h3 className="font-bold text-ink text-sm">Issue Purchase Order (PRO-001)</h3>
              </div>
              <button
                onClick={() => setShowCreatePoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                  placeholder="e.g. Navneet Educational Publications Ltd"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Description & Specifications</label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={e => setItemDescription(e.target.value)}
                  placeholder="e.g. 500x Standard Graph Notebooks & Log Tables"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estimated Total Amount (₹)</label>
                <input
                  type="number"
                  value={poAmount}
                  onChange={e => setPoAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Generate PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Release Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">payments</span>
                <h3 className="font-bold text-ink text-sm">Authorize RTGS Vendor Payment</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-2">
              <div className="font-bold text-sm">Releasing <Figure prefix="₹" value={activePo.amount.toLocaleString('en-IN')} /></div>
              <div className="text-[11px]">Payee: {activePo.vendor}</div>
              <div className="text-[11px]">Debit A/c: HDFC Escrow Institutional #401099238</div>
              <div className="text-[11px]">3-Way Match Verification: <strong className="text-emerald-800"><Figure value="100" suffix="%" /> PASSED</strong></div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReleasePaymentConfirm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Confirm RTGS Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
