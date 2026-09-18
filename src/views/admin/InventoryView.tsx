import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface AssetRecord {
  sku: string;
  name: string;
  category: string;
  stock: number;
  threshold: number;
  value: string;
}

export const InventoryView: React.FC = () => {
  const { addToast } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<AssetRecord | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Form states
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Physics Lab');
  const [newStock, setNewStock] = useState('10');
  const [newValue, setNewValue] = useState('25,000');

  const [assets, setAssets] = useState<AssetRecord[]>([
    { sku: 'ASSET-PHY-042', name: 'Triangular Crown Glass Prisms (Pack of 10)', category: 'Physics Lab', stock: 45, threshold: 10, value: '₹14,500' },
    { sku: 'ASSET-IT-108', name: 'Apple iPad 10.9" (Student Digital Kit)', category: 'Robotics & STEM', stock: 120, threshold: 20, value: '₹42,00,000' },
    { sku: 'ASSET-CHE-214', name: 'Analytical Balance (0.001g Precision)', category: 'Chemistry Lab', stock: 12, threshold: 4, value: '₹1,44,000' },
    { sku: 'ASSET-BIO-305', name: 'Binocular Compound Microscope (1000x)', category: 'Biology Lab', stock: 28, threshold: 5, value: '₹3,36,000' },
  ]);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      addToast('Please enter asset name', 'error');
      return;
    }

    const sku = newSku.trim() || `ASSET-${newCategory.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newAsset: AssetRecord = {
      sku,
      name: newName.trim(),
      category: newCategory,
      stock: parseInt(newStock) || 1,
      threshold: 5,
      value: newValue.startsWith('₹') ? newValue : `₹${newValue}`,
    };

    setAssets([newAsset, ...assets]);
    setShowAddModal(false);
    setNewName('');
    setNewSku('');
    addToast(`Asset ${sku} enrolled into Fixed Asset Register (INV-001)`, 'success');
  };

  const handleExportCSV = () => {
    const csvContent = [
      'SKU Tag,Asset Description,Department,Current Stock,Threshold,Capitalized Book Value',
      ...assets.map(a => `"${a.sku}","${a.name}","${a.category}",${a.stock},${a.threshold},"${a.value}"`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Fixed_Asset_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Fixed Asset & Equipment Ledger (CSV)', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            <span>Fixed Assets & Central Warehouse (INV-001..012)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            Campus Asset Registry & QR Depreciation Tracking
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Total Capitalized Asset Value: ₹4.85 Cr • Straight-Line Depreciation • Automated Stock Alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
            <span>Audit Asset QR Tags</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Asset Register Table */}
      <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
        <div className="p-4 bg-subtle border-b border-line flex items-center justify-between">
          <span className="text-xs font-bold text-ink">High-Value Scientific & Academic Equipment</span>
          <span className="text-xs font-mono text-brand">100% Barcoded & RFID Tagged</span>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-subtle/60 text-ink-soft font-semibold border-b border-line">
            <tr>
              <th className="p-3">SKU & Code</th>
              <th className="p-3">Asset Description</th>
              <th className="p-3">Lab / Department</th>
              <th className="p-3">Current Stock</th>
              <th className="p-3">Book Value</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {assets.map(a => (
              <tr key={a.sku} className="hover:bg-wash">
                <td className="p-3 font-mono font-bold text-brand">{a.sku}</td>
                <td className="p-3 font-bold text-ink">{a.name}</td>
                <td className="p-3 text-ink-soft">{a.category}</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    {a.stock} units
                  </span>
                </td>
                <td className="p-3 font-mono font-bold text-ink">{a.value}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setShowQrModal(a)}
                    className="text-brand font-semibold hover:underline flex items-center gap-1 ml-auto"
                  >
                    <span className="material-symbols-outlined text-xs">qr_code</span>
                    <span>Print Tag</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Add New Asset */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">inventory_2</span>
                <h3 className="font-bold text-ink text-sm">Register Capitalized Asset (INV-001)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Asset Title / Equipment Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Olympus CX21i Binocular Microscope"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  >
                    <option value="Physics Lab">Physics Lab</option>
                    <option value="Chemistry Lab">Chemistry Lab</option>
                    <option value="Biology Lab">Biology Lab</option>
                    <option value="Robotics & STEM">Robotics & STEM</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Sports Complex">Sports Complex</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU / Code (Optional)</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={e => setNewSku(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity Stocked</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(e.target.value)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Book Value (₹)</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="50,000"
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QR Tag Label Preview */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-xs text-center ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3 text-left">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">qr_code_2</span>
                <h3 className="font-bold text-ink text-sm">Asset Barcode & QR Label</h3>
              </div>
              <button
                onClick={() => setShowQrModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl space-y-2 bg-slate-50">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Lumen Academy Institutional Asset
              </div>
              <div className="flex justify-center my-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    `LUMEN-ASSET:${showQrModal.sku}`
                  )}`}
                  alt="QR Code"
                  className="w-32 h-32 border border-slate-200 p-1 bg-white rounded-lg shadow-xs"
                />
              </div>
              <div className="font-mono font-bold text-sm text-ink">{showQrModal.sku}</div>
              <div className="font-bold text-xs text-slate-800">{showQrModal.name}</div>
              <div className="text-[11px] text-slate-500">{showQrModal.category} • Value: {showQrModal.value}</div>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                  addToast(`Dispatched print job for QR Label ${showQrModal.sku}`, 'success');
                }}
                className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print QR Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Audit Asset QR Tags */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">qr_code_scanner</span>
                <h3 className="font-bold text-ink text-sm">Bi-Annual Asset Physical Audit</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
                Hardware handheld scanners are paired on Channel 4. 205 of 205 items in Science Labs verified. Zero discrepancies or missing tags discovered.
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Physics Lab Audit Status</span>
                  <span className="text-emerald-700 font-mono">100% (45/45)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Robotics & iPad Lab Status</span>
                  <span className="text-emerald-700 font-mono">100% (120/120)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAuditModal(false);
                  addToast('Signed off physical asset verification ledger with digital auditor key', 'success');
                }}
                className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Sign-Off Audit Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
