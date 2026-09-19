import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { viewMeta } from '../../data/adminNav';
import { ExportMenu } from './ExportMenu';

export const AdminHeader: React.FC = () => {
  const {
    adminView,
    selectedCampus,
    setSelectedCampus,
    campuses,
    setSearchModalOpen,
    setQuickActionOpen,
    sidebarOpen,
    toggleSidebar,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    addToast,
    currentUser,
    logout,
  } = useApp();

  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const campusRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-close for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (campusRef.current && !campusRef.current.contains(e.target as Node)) {
        setCampusDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCampusDropdownOpen(false);
        setNotificationsOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const meta = viewMeta(adminView);

  return (
    <header className="relative bg-surface/95 backdrop-blur border-b border-line-soft px-3 md:px-4 py-2 flex items-center justify-between gap-3 shrink-0 z-40 shadow-xs">
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
      {/* Left: Mobile Menu Toggle, Multi-Campus Selector & Dynamic Breadcrumb */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Desktop: hide or show the sidebar (Ctrl+B) */}
        <button
          onClick={toggleSidebarCollapsed}
          className="hidden md:inline-flex p-1.5 rounded-lg text-ink-soft hover:bg-subtle hover:text-brand transition-colors"
          title={`${sidebarCollapsed ? 'Show' : 'Hide'} the menu (Ctrl+B)`}
          aria-label={sidebarCollapsed ? 'Show menu' : 'Hide menu'}
          aria-pressed={sidebarCollapsed}
          data-sidebar-toggle
        >
          <span className="material-symbols-outlined text-2xl">{sidebarCollapsed ? 'left_panel_open' : 'left_panel_close'}</span>
        </button>

        {/* Mobile Hamburger Menu */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg text-ink-soft hover:bg-subtle hover:text-brand transition-colors"
          title="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {sidebarOpen ? 'menu_open' : 'menu'}
          </span>
        </button>

        {/* Campus Dropdown */}
        <div className="relative" ref={campusRef}>
          <button
            onClick={() => setCampusDropdownOpen(!campusDropdownOpen)}
            aria-expanded={campusDropdownOpen}
            aria-haspopup="menu"
            aria-label={`Switch campus. Current campus: ${selectedCampus.name}`}
            className="flex items-center gap-2 bg-surface hover:bg-subtle border border-line rounded-xl px-2.5 py-1.5 text-left shadow-xs transition-colors"
          >
            <img
              src="/lumen-academy-logo.svg"
              alt="Lumen Academy"
              referrerPolicy="no-referrer"
              className="w-7 h-7 object-contain shrink-0 drop-shadow-2xs"
            />
            <div className="leading-tight">
              <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span>{selectedCampus.name}</span>
                <span className="bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200 text-[10px] font-semibold px-1 rounded">
                  {selectedCampus.code}
                </span>
              </div>
              <div className="text-[10px] text-ink-soft flex items-center gap-1">
                <span>{selectedCampus.studentsCount} Students</span>
                <span>•</span>
                <span>{selectedCampus.affiliationNumber}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-ink-muted text-sm ml-0.5">arrow_drop_down</span>
          </button>

          {campusDropdownOpen && (
            <div role="menu" aria-label="Campuses" className="absolute left-0 mt-1.5 w-72 bg-surface rounded-xl shadow-xl border border-line-soft py-2 z-50 animate-dropdown">
              <div className="px-3 py-1 text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                Switch Campus Node
              </div>
              {campuses.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCampus(c);
                    setCampusDropdownOpen(false);
                    addToast(`Switched active context to ${c.name}`, 'info');
                  }}
                  role="menuitemradio"
                  aria-checked={selectedCampus.id === c.id}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-subtle transition-colors ${
                    selectedCampus.id === c.id ? 'bg-line-soft font-semibold text-brand' : 'text-ink'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-[11px] text-ink-soft">{c.location}</div>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section & Active Module Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 border-l border-line-soft pl-3 text-xs">
          <span className="text-ink-muted font-semibold text-[11px] uppercase tracking-wider">{meta.section}</span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-ink flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-brand">{meta.icon}</span>
            <span>{meta.label}</span>
          </span>
        </div>

        {/* Academic Session Pill */}
        <div className="hidden 2xl:flex items-center gap-1.5 bg-lumen-50 text-lumen-700 ring-1 ring-inset ring-lumen-200 px-2.5 py-1 rounded-full text-xs font-semibold">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <span>AY 2024–25 (Term 3)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="w-full flex items-center justify-between bg-wash hover:bg-surface border border-line hover:border-lumen-300 rounded-lg px-3 py-1.5 text-xs text-ink-muted shadow-inner shadow-lumen-950/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-brand">search</span>
            <span>Search screens and students…</span>
          </div>
          <kbd className="bg-surface border border-line border-b-2 text-[10px] font-mono px-1.5 py-0.5 rounded text-ink-soft">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action, Alerts & User Profile */}
      <div className="flex items-center gap-2.5">
        <ExportMenu />
        <button
          onClick={() => setQuickActionOpen(true)}
          className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(7_32_47/0.24)] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span className="hidden sm:inline">New Entry</span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            aria-label="Notifications"
            className="p-2 rounded-lg text-ink-soft hover:bg-subtle hover:text-brand relative transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-surface rounded-xl shadow-xl border border-line-soft p-3 z-50 animate-dropdown">
              <div className="pb-2 border-b border-subtle">
                <span className="text-xs font-bold text-ink">Notifications</span>
              </div>
              <p className="py-6 text-center text-xs text-ink-muted">You're all caught up.</p>
            </div>
          )}
        </div>

        {/* User Profile Capsule & Participant Menu */}
        <div className="relative pl-2 border-l border-line-soft flex items-center gap-1.5" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-label="Account menu"
            aria-expanded={profileDropdownOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-subtle transition-colors text-left"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-gold-300 ring-offset-1 ring-offset-surface"
            />
            <div className="hidden xl:block text-left leading-tight">
              <div className="text-xs font-bold text-ink flex items-center gap-1">
                <span>{currentUser.name}</span>
                <span className="material-symbols-outlined text-xs text-ink-muted">expand_more</span>
              </div>
              <div className="text-[10px] text-brand font-medium">{currentUser.roleTitle}</div>
            </div>
          </button>

          {/* Quick 1-Click Sign Out to Login Page */}
          <button
            onClick={logout}
            className="flex items-center gap-1 text-ink-muted hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            title="Sign Out to Login Page"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden lg:inline">Sign Out</span>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-surface rounded-xl shadow-xl border border-line-soft p-3 z-50 animate-dropdown space-y-3">
              <div className="flex items-center gap-3 pb-2.5 border-b border-subtle">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-brand/20"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-ink truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-brand font-semibold truncate">{currentUser.roleTitle}</div>
                  <div className="text-[10px] font-mono text-ink-muted truncate">{currentUser.identifier || currentUser.email}</div>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Sign out</span>
                </button>
              </div>

              <div className="pt-2 border-t border-subtle flex items-center justify-between text-[10px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  RLS Tenant Context
                </span>
                <span className="font-mono font-bold text-ink">{selectedCampus.code}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
