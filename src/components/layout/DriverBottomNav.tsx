import React from 'react';
import { useApp } from '../../context/AppContext';
import { DriverView } from '../../types';

export const DriverBottomNav: React.FC = () => {
  const { driverView, setDriverView, sosActive } = useApp();

  const tabs: { id: DriverView; label: string; icon: string; badge?: string }[] = [
    { id: 'live-route', label: 'Route HUD', icon: 'navigation', badge: 'Turn-by-turn' },
    { id: 'student-roster', label: 'Manifest', icon: 'badge', badge: 'NFC Scan' },
    { id: 'vehicle-inspection', label: 'Checklist', icon: 'checklist' },
    { id: 'sos-dispatch', label: 'Panic SOS', icon: 'emergency', badge: sosActive ? 'ACTIVE' : undefined },
  ];

  return (
    <nav className="bg-[#082b3d] border-t border-[#213145] text-white px-2 py-1.5 flex items-center justify-around sticky bottom-0 z-40 shadow-xl">
      {tabs.map(tab => {
        const isActive = driverView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setDriverView(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg relative transition-all min-w-[70px] ${
              isActive ? 'text-[#f59e0b] font-bold' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${isActive ? 'scale-110 text-[#f59e0b]' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            {tab.badge && (
              <span
                className={`absolute -top-1 right-2 text-[9px] px-1 py-0.2 rounded-full font-bold shadow-xs ${
                  tab.id === 'sos-dispatch' && sosActive
                    ? 'bg-rose-500 text-white animate-ping'
                    : 'bg-[#152438] text-[#f59e0b] border border-[#2c3e55]'
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
