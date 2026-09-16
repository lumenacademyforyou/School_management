import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminView, PortalRole } from '../../types';

export const GlobalSearchModal: React.FC = () => {
  const {
    searchModalOpen,
    setSearchModalOpen,
    setRole,
    setAdminView,
    setParentView,
    addToast,
  } = useApp();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
      }
      if (e.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  if (!searchModalOpen) return null;

  interface SearchItem {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    icon: string;
    action: () => void;
  }

  const items: SearchItem[] = [
    // Students
    {
      id: 'stu-aarav',
      title: 'Aarav S. Ramanathan',
      subtitle: 'Class 10-A • Roll 14 • APAAR: 9842-3310-8841',
      category: 'Students',
      icon: 'person',
      action: () => {
        setRole('admin');
        setAdminView('student-360');
        setSearchModalOpen(false);
        addToast('Opened Student 360 profile for Aarav S. Ramanathan', 'info');
      },
    },
    {
      id: 'stu-bhavna',
      title: 'Bhavna K. Menon',
      subtitle: 'Class 10-A • Roll 04 • Boarding House Kaveri',
      category: 'Students',
      icon: 'person',
      action: () => {
        setRole('admin');
        setAdminView('attendance');
        setSearchModalOpen(false);
      },
    },
    // Modules & Pages
    {
      id: 'page-attendance',
      title: 'Classroom Roll Call & Biometric Registers',
      subtitle: 'Real-time hardware sync, P/L/A marks & WhatsApp alerts',
      category: 'Navigation',
      icon: 'fact_check',
      action: () => {
        setRole('admin');
        setAdminView('attendance');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'page-fees',
      title: 'Fees & Dual-Entry Financial Ledger',
      subtitle: 'Term 3 invoices, razorpay reconciliation & defaulter notices',
      category: 'Navigation',
      icon: 'account_balance_wallet',
      action: () => {
        setRole('admin');
        setAdminView('fees-and-finance');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'page-transport',
      title: 'Transport Fleet & AIS-140 Live Radar',
      subtitle: 'Bus #12 (Route #14) with G. Murugan, speed 38 km/h',
      category: 'Navigation',
      icon: 'directions_bus',
      action: () => {
        setRole('admin');
        setAdminView('transport');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'page-hostel',
      title: 'Hostel & Campus Housing Command',
      subtitle: 'Godavari, Kaveri, Yamuna, Ganga room allocation & 21:00 curfew',
      category: 'Navigation',
      icon: 'night_shelter',
      action: () => {
        setRole('admin');
        setAdminView('hostel');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'page-question-paper',
      title: 'AI Question Paper Studio & CBSE Blueprint',
      subtitle: 'Bloom’s cognitive taxonomy, LaTeX equations & bilingual prints',
      category: 'Navigation',
      icon: 'quiz',
      action: () => {
        setRole('admin');
        setAdminView('question-papers');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'page-dpdpa',
      title: 'DPDPA 2023 Statutory Minor Consent Hub',
      subtitle: 'Parental biometric & CCTV consent ledger with SHA-256 audit logs',
      category: 'Compliance',
      icon: 'verified_user',
      action: () => {
        setRole('admin');
        setAdminView('dpdpa-and-consent');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'page-udise',
      title: 'UDISE+ & APAAR National Student ID Command',
      subtitle: 'DCF 41-section checklist & Aadhaar remediation queue',
      category: 'Compliance',
      icon: 'fingerprint',
      action: () => {
        setRole('admin');
        setAdminView('udise-and-apaar');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'parent-portal',
      title: 'Aarav’s Parent Portal Mobile App',
      subtitle: 'Direct view into parent companion with fees, RFID gate-in & PTM',
      category: 'Portals',
      icon: 'family_restroom',
      action: () => {
        setRole('parent');
        setParentView('home');
        setSearchModalOpen(false);
      },
    },
  ];

  const filtered = query.trim()
    ? items.filter(
        i =>
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          i.category.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4 fade-in" onClick={() => setSearchModalOpen(false)}>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#cbe0ec] overflow-hidden zoom-in" onClick={e => e.stopPropagation()}>
        {/* Search input bar */}
        <div className="p-3 border-b border-[#f0f7fb] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#0e5d84] text-xl">search</span>
          <input
            type="text"
            placeholder="Search students, staff, roll numbers, fees, modules, routes..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="flex-1 text-sm outline-hidden text-[#082b3d] placeholder-[#777587]"
          />
          <button
            onClick={() => setSearchModalOpen(false)}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-[#464555]"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#f0f7fb]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#777587]">
              No records match "{query}". Try searching "Aarav", "Fees", "Hostel", or "CBSE".
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full text-left p-2.5 rounded-xl hover:bg-[#f0f7fb] flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f7fb] text-[#0e5d84] flex items-center justify-center group-hover:bg-[#0e5d84] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#082b3d] group-hover:text-[#0e5d84]">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#464555]">{item.subtitle}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium text-[#777587]">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Quick Tips */}
        <div className="bg-[#f0f7fb] px-4 py-2 text-[11px] text-[#464555] flex items-center justify-between">
          <span>Navigate with ↵ or click to open page instantly</span>
          <span className="font-mono text-[#0e5d84]">LumenSearch v2.4</span>
        </div>
      </div>
    </div>
  );
};
