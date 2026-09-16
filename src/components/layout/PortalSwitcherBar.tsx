import React from 'react';
import { useApp } from '../../context/AppContext';
import { PortalRole } from '../../types';

export const PortalSwitcherBar: React.FC = () => {
  const {
    role,
    setRole,
    previewDevice,
    setPreviewDevice,
    setSearchModalOpen,
    setQuickActionOpen,
    sosActive,
    currentUser,
    setShowLoginModal,
    setShowUsageGuide,
  } = useApp();

  const roles: { key: PortalRole; label: string; icon: string; badge?: string }[] = [
    { key: 'admin', label: 'Admin Command', icon: 'admin_panel_settings', badge: 'Multi-Campus' },
    { key: 'faculty', label: 'Faculty Roster', icon: 'school', badge: 'Period 2' },
    { key: 'parent', label: 'Parent Companion', icon: 'family_restroom', badge: 'Live App' },
    { key: 'student', label: 'Student Desk', icon: 'badge', badge: 'APAAR ID' },
    { key: 'driver', label: 'Fleet HUD', icon: 'directions_bus', badge: sosActive ? 'SOS ACTIVE' : 'AIS-140' },
    { key: 'design-system', label: 'Design Tokens', icon: 'palette' },
  ];

  return (
    <header className="bg-[#082b3d] text-white text-xs border-b border-[#213145] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 select-none z-50 sticky top-0 shadow-md">
      {/* Left: Brand Identity & Active Environment */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-sm text-white">
          <img
            src="/lumen-academy-logo.svg"
            alt="Lumen Academy Logo"
            referrerPolicy="no-referrer"
            className="w-5 h-5 object-contain drop-shadow-xs"
          />
          <span className="font-display">
            Lumen<span className="text-[#f59e0b]">Academy</span>
          </span>
          <span className="bg-[#d97706] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs tracking-wide">
            ENTERPRISE SMS
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[#cbdbf5] text-[11px] border-l border-[#354860] pl-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>AIS-140 & Biometric Engine Live</span>
        </div>
      </div>

      {/* Center: Dedicated Portals Switcher */}
      <div className="flex items-center bg-[#152438] p-0.5 rounded-lg border border-[#2c3e55] overflow-x-auto max-w-full">
        {roles.map(r => {
          const isActive = role === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all whitespace-nowrap text-[11px] font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-[#0e5d84] to-[#166d99] text-white shadow-sm font-semibold border-b-2 border-[#f59e0b]'
                  : 'text-[#dce9ff] hover:text-white hover:bg-[#213145]'
              }`}
            >
              <span className={`material-symbols-outlined text-sm ${isActive ? 'text-[#fcd34d]' : ''}`}>{r.icon}</span>
              <span>{r.label}</span>
              {r.badge && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    r.badge.includes('SOS')
                      ? 'bg-rose-500 text-white animate-bounce'
                      : isActive
                      ? 'bg-[#d97706] text-white'
                      : 'bg-[#213145] text-[#f59e0b]'
                  }`}
                >
                  {r.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Quick Tools, Steps Guide & Participant Switcher */}
      <div className="flex items-center gap-1.5">
        {/* Operational Steps & Usage Guide Button */}
        <button
          onClick={() => setShowUsageGuide(true)}
          className="flex items-center gap-1 bg-[#213145] hover:bg-[#2c3e55] text-[#f59e0b] hover:text-white px-2.5 py-1 rounded-md border border-[#354860] text-[11px] font-semibold transition-colors shadow-xs"
          title="How to Use Product Effectively"
        >
          <span className="material-symbols-outlined text-xs text-[#f59e0b]">menu_book</span>
          <span className="hidden sm:inline">How to Use</span>
        </button>

        {/* Universal Search shortcut button */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="hidden md:flex items-center gap-1 bg-[#213145] hover:bg-[#2c3e55] text-[#dce9ff] px-2 py-1 rounded border border-[#354860] text-[11px] transition-colors"
          title="Universal Search (⌘K)"
        >
          <span className="material-symbols-outlined text-xs">search</span>
          <span>Search</span>
          <kbd className="bg-[#082b3d] text-[9px] px-1 rounded text-slate-300">⌘K</kbd>
        </button>

        {/* Quick Action Drawer Button */}
        <button
          onClick={() => setQuickActionOpen(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-xs">bolt</span>
          <span className="hidden xl:inline">Action</span>
        </button>

        {/* Participant Profile & Login Switcher */}
        <button
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-1.5 bg-[#1b2b52] hover:bg-[#25396b] border border-[#354860] hover:border-[#f59e0b]/50 text-white px-2 py-0.5 rounded-lg text-[11px] transition-all"
          title="Change or Authenticate Participant (IAM-001)"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-[#f59e0b]/40"
          />
          <div className="text-left hidden sm:block max-w-[110px] truncate leading-tight">
            <div className="font-bold text-[10px] text-white truncate">{currentUser.name.split(' ')[0]}</div>
            <div className="text-[9px] text-[#bae6fd] truncate capitalize">{currentUser.role}</div>
          </div>
          <span className="material-symbols-outlined text-xs text-[#7dd3fc]">expand_more</span>
        </button>

        {/* Device Viewport Frame Toggle (Fluid vs Mobile Frame Preview) */}
        <div className="hidden lg:flex items-center bg-[#152438] rounded border border-[#2c3e55] p-0.5">
          <button
            onClick={() => setPreviewDevice('fluid')}
            className={`p-1 rounded ${previewDevice === 'fluid' ? 'bg-[#0e5d84] text-white' : 'text-[#cbdbf5] hover:text-white'}`}
            title="Fluid Web View (Desktop / Adaptive)"
          >
            <span className="material-symbols-outlined text-sm">desktop_windows</span>
          </button>
          <button
            onClick={() => setPreviewDevice('mobile-mock')}
            className={`p-1 rounded ${previewDevice === 'mobile-mock' ? 'bg-[#0e5d84] text-white' : 'text-[#cbdbf5] hover:text-white'}`}
            title="Simulated Mobile Frame (390px)"
          >
            <span className="material-symbols-outlined text-sm">smartphone</span>
          </button>
        </div>
      </div>
    </header>
  );
};
