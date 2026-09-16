import React from 'react';
import { useApp } from '../../context/AppContext';
import { ParentView } from '../../types';

export const ParentBottomNav: React.FC = () => {
  const { parentView, setParentView, invoices } = useApp();

  const dueInvoice = invoices.find(inv => inv.status === 'Due' || inv.status === 'Overdue');

  const tabs: { id: ParentView; label: string; icon: string; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'academics', label: 'Academics', icon: 'auto_stories', badge: 'GPA 9.2' },
    { id: 'bus', label: 'Bus', icon: 'directions_bus' },
    { id: 'fees', label: 'Fees', icon: 'payments', badge: dueInvoice ? '₹24.5k' : undefined },
    { id: 'ptm', label: 'PTM', icon: 'groups' },
  ];

  return (
    <nav className="bg-white border-t border-[#e0ecf4] px-2 py-1.5 flex items-center justify-around sticky bottom-0 z-40 shadow-lg">
      {tabs.map(tab => {
        const isActive = parentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setParentView(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg relative transition-all min-w-[64px] ${
              isActive ? 'text-[#0e5d84] font-bold' : 'text-[#777587] hover:text-[#082b3d]'
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${isActive ? 'scale-110 text-[#0e5d84]' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            {tab.badge && (
              <span
                className={`absolute -top-1 right-2 text-[9px] px-1 py-0.2 rounded-full font-bold shadow-xs ${
                  tab.id === 'fees'
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-[#f0f7fb] text-[#0e5d84] border border-[#cbe0ec]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
