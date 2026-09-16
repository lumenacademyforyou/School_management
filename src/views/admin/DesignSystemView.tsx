import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const DesignSystemView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'tokens' | 'typography' | 'components' | 'statutory' | 'accessibility'>('tokens');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    addToast(`Copied ${label}: ${text}`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* View Header */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">palette</span>
            <span>Enterprise Design System & Token Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-700 font-bold lowercase text-[11px]">WCAG 2.1 AA Compliant</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-[#082b3d]">
            LumenAcademy Design System (LMN-DS-01)
          </h1>
          <p className="text-xs md:text-sm text-[#464555] mt-0.5">
            Color tokens, typography ratios, statutory status badges, and institutional component guidelines aligned with NEP 2020 standards.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-[#f0f7fb] p-1.5 rounded-xl border border-[#cbe0ec]">
          {(['tokens', 'typography', 'components', 'statutory', 'accessibility'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                activeTab === tab
                  ? 'bg-[#0e5d84] text-white shadow-xs'
                  : 'text-[#464555] hover:text-[#082b3d] hover:bg-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Color Tokens */}
      {activeTab === 'tokens' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Primary / Brand Scales */}
          <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs">
            <h2 className="text-sm font-bold text-[#082b3d] mb-3 flex items-center justify-between">
              <span>Official Institutional Palette (Logo Crest Blue & Sunburst Gold)</span>
              <span className="text-xs text-[#777587] font-mono font-normal">Brand System: Blue & Gold</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { name: 'Crest Blue 500', hex: '#0e5d84', role: 'Brand Core / CTAs', text: 'text-white' },
                { name: 'Midnight Navy', hex: '#082b3d', role: 'Institutional Header', text: 'text-white' },
                { name: 'Sunburst Gold', hex: '#f59e0b', role: 'Primary Accent & Badges', text: 'text-[#082b3d]' },
                { name: 'Amber Gold', hex: '#d97706', role: 'High Contrast Gold Text', text: 'text-white' },
                { name: 'Ice Sky Fill', hex: '#f0f7fb', role: 'Subtle Input / Active Card', text: 'text-[#082b3d]' },
                { name: 'Warm Gold Tint', hex: '#fef3c7', role: 'Gold Accent Container', text: 'text-[#78350f]' },
              ].map(c => (
                <div
                  key={c.name}
                  onClick={() => copyToClipboard(c.hex, c.name)}
                  className="p-3 rounded-xl border border-slate-200 cursor-pointer hover:scale-[1.02] transition-transform shadow-2xs"
                  style={{ backgroundColor: c.hex }}
                >
                  <div className={`text-xs font-bold ${c.text}`}>{c.name}</div>
                  <div className={`text-[11px] font-mono mt-2 font-semibold ${c.text}`}>{c.hex}</div>
                  <div className={`text-[10px] opacity-90 mt-0.5 ${c.text}`}>{c.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Functional Semantics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Secondary: Teal (Academics & Success) */}
            <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#006a61]">Secondary · Academic Teal</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">Core Domain</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Teal Core', hex: '#006a61', bg: 'bg-[#006a61] text-white' },
                  { name: 'Teal Container', hex: '#f59e0b', bg: 'bg-[#f59e0b] text-[#00201d]' },
                  { name: 'Teal Fixed Dim', hex: '#6bd8cb', bg: 'bg-[#6bd8cb] text-[#00201d]' },
                ].map(item => (
                  <div
                    key={item.name}
                    onClick={() => copyToClipboard(item.hex, item.name)}
                    className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer ${item.bg}`}
                  >
                    <span className="text-xs font-bold">{item.name}</span>
                    <span className="text-[11px] font-mono font-semibold">{item.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tertiary: Terracotta / Amber (Alerts & Caution) */}
            <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#822c00]">Tertiary · Indian Terracotta</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Operations</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Terracotta Core', hex: '#822c00', bg: 'bg-[#822c00] text-white' },
                  { name: 'Terracotta Container', hex: '#ffd1c1', bg: 'bg-[#ffd1c1] text-[#370e00]' },
                  { name: 'Amber Notice', hex: '#d97706', bg: 'bg-[#d97706] text-white' },
                ].map(item => (
                  <div
                    key={item.name}
                    onClick={() => copyToClipboard(item.hex, item.name)}
                    className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer ${item.bg}`}
                  >
                    <span className="text-xs font-bold">{item.name}</span>
                    <span className="text-[11px] font-mono font-semibold">{item.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error & Security (DPDP & Audit) */}
            <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-rose-800">Critical & Statutory Alert</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">Security</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Error Core', hex: '#ba1a1a', bg: 'bg-[#ba1a1a] text-white' },
                  { name: 'Error Container', hex: '#ffdad6', bg: 'bg-[#ffdad6] text-[#93000a]' },
                  { name: 'SOS Active Alert', hex: '#e11d48', bg: 'bg-[#e11d48] text-white' },
                ].map(item => (
                  <div
                    key={item.name}
                    onClick={() => copyToClipboard(item.hex, item.name)}
                    className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer ${item.bg}`}
                  >
                    <span className="text-xs font-bold">{item.name}</span>
                    <span className="text-[11px] font-mono font-semibold">{item.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Typography */}
      {activeTab === 'typography' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#082b3d]">Institutional Typographic Scale (Major Second 1.125 / Perfect Fourth)</h2>
            <div className="divide-y divide-[#f0f7fb]">
              <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#777587]">Display / H1 · 32px · Bold</span>
                  <div className="text-2xl md:text-3xl font-bold font-display text-[#082b3d]">
                    Delhi Central Senior Secondary School
                  </div>
                </div>
                <span className="text-xs font-mono text-[#0e5d84] bg-[#f0f7fb] px-2 py-1 rounded self-start">
                  Plus Jakarta Sans (700)
                </span>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#777587]">Title / H2 · 22px · Semibold</span>
                  <div className="text-lg md:text-xl font-bold font-display text-[#082b3d]">
                    Class 10-A Board Examination Roll Call & Hall Tickets
                  </div>
                </div>
                <span className="text-xs font-mono text-[#0e5d84] bg-[#f0f7fb] px-2 py-1 rounded self-start">
                  Plus Jakarta Sans (600)
                </span>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#777587]">Section / H3 · 16px · Bold</span>
                  <div className="text-base font-bold text-[#082b3d]">
                    Dual-Ledger Reconciliation & Bank Account Transfer Details
                  </div>
                </div>
                <span className="text-xs font-mono text-[#0e5d84] bg-[#f0f7fb] px-2 py-1 rounded self-start">
                  Plus Jakarta Sans (700)
                </span>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#777587]">Body Regular · 14px · Line Height 1.6</span>
                  <div className="text-sm text-[#464555] max-w-2xl leading-relaxed">
                    Under statutory mandate DPDPA 2023 Rule 8, guardian verifiable consent must be logged in an append-only ledger prior to biometric enrollment or public directory publication.
                  </div>
                </div>
                <span className="text-xs font-mono text-[#0e5d84] bg-[#f0f7fb] px-2 py-1 rounded self-start">
                  Inter (400)
                </span>
              </div>

              <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#777587]">Code & Currency · 12px · Monospace</span>
                  <div className="font-mono text-xs text-[#082b3d]">
                    TXN-8849-2025 • ₹18,400.00 • SHA256: 0x8F3C...A12
                  </div>
                </div>
                <span className="text-xs font-mono text-[#0e5d84] bg-[#f0f7fb] px-2 py-1 rounded self-start">
                  Inter Monospace
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Component UI Kit */}
      {activeTab === 'components' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Buttons Matrix */}
          <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#082b3d]">Interactive Button Variants</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => addToast('Primary Action Executed', 'success')}
                className="bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Primary Action</span>
              </button>

              <button
                onClick={() => addToast('Secondary Action Executed', 'info')}
                className="bg-[#f0f7fb] hover:bg-[#dbeafe] text-[#0e5d84] border border-[#cbe0ec] text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                <span>Secondary Action</span>
              </button>

              <button
                onClick={() => addToast('Neutral Filter Clicked', 'info')}
                className="bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                <span>Neutral Action</span>
              </button>

              <button
                onClick={() => addToast('Destructive Warning Triggered', 'warning')}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                <span>Destructive Action</span>
              </button>

              <button
                onClick={() => addToast('JIT Privilege Elevation Requested', 'warning')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">key</span>
                <span>JIT Elevation</span>
              </button>
            </div>
          </div>

          {/* Form Controls */}
          <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#082b3d]">Form Inputs & Selectors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#464555] mb-1">Standard Text Field</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav S. Ramanathan"
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl px-3 py-2 text-xs text-[#082b3d] focus:outline-hidden focus:border-[#0e5d84]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#464555] mb-1">Interactive Select</label>
                <select className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl px-3 py-2 text-xs text-[#082b3d] focus:outline-hidden focus:border-[#0e5d84]">
                  <option>CBSE Senior Secondary (11-12)</option>
                  <option>CBSE Secondary (9-10)</option>
                  <option>Middle School (6-8)</option>
                  <option>Foundational Stage (Nursery-2)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#464555] mb-1">Search Input with Prefix</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-[#777587]">search</span>
                  <input
                    type="text"
                    placeholder="Search APAAR ID, Pen No..."
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl pl-8 pr-3 py-2 text-xs text-[#082b3d] focus:outline-hidden focus:border-[#0e5d84]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Statutory Badges */}
      {activeTab === 'statutory' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#082b3d]">Statutory Compliance & Indian Regulatory Badges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>DPDPA 2023 Verified</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#777587]">CNS-002</span>
                </div>
                <p className="text-xs text-[#464555]">
                  Indicates that maternal/paternal legal guardian consent has been recorded with an immutable cryptographic timestamp.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#e0f2fe] text-[#0e5d84] font-bold px-2 py-0.5 rounded border border-[#93d5ea] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">fingerprint</span>
                    <span>APAAR Registry Synced</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#777587]">GOV-014</span>
                </div>
                <p className="text-xs text-[#464555]">
                  Automated validation against Ministry of Education's Automated Permanent Academic Account Registry.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">directions_bus</span>
                    <span>AIS-140 Telematics Live</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#777587]">TRN-005</span>
                </div>
                <p className="text-xs text-[#464555]">
                  Automotive Industry Standard 140 compliance with dual IRNSS/GPS and panic emergency button integration.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#e0f2fe] text-[#082b3d] font-bold px-2 py-0.5 rounded border border-[#bae6fd] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">history_edu</span>
                    <span>CBSE DigiLocker DSC Signed</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#777587]">CRT-004</span>
                </div>
                <p className="text-xs text-[#464555]">
                  Principal Class-3 USB Token digital signature certificate applied directly to transfer certificates and marksheets.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Accessibility */}
      {activeTab === 'accessibility' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#082b3d]">Accessibility (WCAG 2.1 AA) & Keyboard Navigation Guidelines</h2>
            <div className="space-y-3 text-xs text-[#464555]">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-emerald-700">check_circle</span>
                <div>
                  <div className="font-bold">Contrast Ratio Guarantee (Min 4.5:1 for Body, 3:1 for Large Text)</div>
                  <div className="text-[11px] mt-0.5">
                    All text elements are styled against designated surface containers with strict optical luminance separation.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#f0f7fb] rounded-xl border border-[#cbe0ec] text-[#082b3d] flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-[#0e5d84]">keyboard</span>
                <div>
                  <div className="font-bold">Universal Keyboard Shortcuts</div>
                  <div className="text-[11px] mt-0.5">
                    Press <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#93d5ea] font-mono text-[10px]">⌘K</kbd> or <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#93d5ea] font-mono text-[10px]">Ctrl+K</kbd> anywhere to open Universal Search. Press <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#93d5ea] font-mono text-[10px]">Esc</kbd> to dismiss dialogs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
