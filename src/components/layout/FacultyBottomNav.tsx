import React from 'react';
import { useApp } from '../../context/AppContext';
import { FacultyView } from '../../types';

export const FacultyBottomNav: React.FC = () => {
  const { facultyView, setFacultyView } = useApp();

  const tabs: { id: FacultyView; label: string; icon: string; badge?: string }[] = [
    { id: 'schedule-home', label: 'Periods', icon: 'schedule', badge: 'P2 Now' },
    { id: 'attendance-roster', label: 'Roll Call', icon: 'how_to_reg', badge: '10-A' },
    { id: 'grades-gradebook', label: 'Gradebook', icon: 'grading' },
    { id: 'leave-faculty-profile', label: 'My Leave', icon: 'badge' },
  ];

  return (
    <nav className="bg-white border-t border-[#e0ecf4] px-2 py-1.5 flex items-center justify-around sticky bottom-0 z-40 shadow-lg">
      {tabs.map(tab => {
        const isActive = facultyView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setFacultyView(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg relative transition-all min-w-[70px] ${
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
                  tab.badge === 'P2 Now'
                    ? 'bg-emerald-600 text-white'
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
