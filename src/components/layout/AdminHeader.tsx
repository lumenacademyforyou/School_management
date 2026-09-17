import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

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

  const getViewMeta = () => {
    switch (adminView) {
      case 'dashboard':
        return { label: 'Dashboard', icon: 'space_dashboard', section: 'Overview' };
      case 'feature-spec-matrix':
        return { label: 'Feature catalogue', icon: 'checklist', section: 'Overview' };
      case 'admissions':
        return { label: 'Admissions', icon: 'how_to_reg', section: 'Students' };
      case 'students':
        return { label: 'Students', icon: 'groups', section: 'Students' };
      case 'student-360':
        return { label: 'Student profile', icon: 'badge', section: 'Students' };
      case 'subjects':
      case 'curriculum':
        return { label: 'Curriculum', icon: 'menu_book', section: 'Academics' };
      case 'classes':
      case 'academics':
        return { label: 'Day Order & Proxy', icon: 'today', section: 'Academics' };
      case 'timetable':
        return { label: 'Timetable', icon: 'calendar_month', section: 'Academics' };
      case 'exams':
        return { label: 'Examinations', icon: 'quiz', section: 'Academics' };
      case 'question-papers':
        return { label: 'Question Papers', icon: 'auto_awesome', section: 'Academics' };
      case 'question-bank':
        return { label: 'Question Bank', icon: 'database', section: 'Academics' };
      case 'results':
      case 'report-cards':
        return { label: 'Report Cards', icon: 'grading', section: 'Academics' };
      case 'attendance':
        return { label: 'Attendance', icon: 'fact_check', section: 'Students' };
      case 'lms':
      case 'lms-and-courses':
        return { label: 'Digital Classroom', icon: 'play_lesson', section: 'Academics' };
      case 'assignments':
      case 'assignment-studio':
        return { label: 'Assignments', icon: 'assignment_turned_in', section: 'Academics' };
      case 'teacher-management':
      case 'teachers':
        return { label: 'Teachers', icon: 'school', section: 'Staff' };
      case 'non-teaching-staff':
      case 'employees':
        return { label: 'Support Staff', icon: 'badge', section: 'Staff' };
      case 'hr-and-payroll':
      case 'payroll':
        return { label: 'HR & Payroll', icon: 'engineering', section: 'Staff' };
      case 'id-cards':
        return { label: 'ID Cards', icon: 'id_card', section: 'Students' };
      case 'fees':
      case 'fees-and-finance':
        return { label: 'Fees', icon: 'payments', section: 'Finance' };
      case 'accounting':
        return { label: 'Accounting', icon: 'account_balance', section: 'Finance' };
      case 'transport':
        return { label: 'Transport', icon: 'directions_bus', section: 'Operations' };
      case 'hostel':
        return { label: 'Hostel', icon: 'night_shelter', section: 'Operations' };
      case 'library':
        return { label: 'Library', icon: 'local_library', section: 'Operations' };
      case 'inventory':
        return { label: 'Inventory', icon: 'inventory_2', section: 'Operations' };
      case 'procurement':
        return { label: 'Procurement', icon: 'shopping_bag', section: 'Operations' };
      case 'helpdesk':
        return { label: 'Helpdesk', icon: 'support_agent', section: 'Operations' };
      case 'communication':
      case 'notifications':
        return { label: 'Messages & Notices', icon: 'campaign', section: 'Communication' };
      case 'dpdpa-and-consent':
        return { label: 'Consent & Privacy', icon: 'verified_user', section: 'Compliance' };
      case 'udise-and-apaar':
        return { label: 'UDISE+ & APAAR', icon: 'fingerprint', section: 'Compliance' };
      case 'certificates':
        return { label: 'Certificates', icon: 'workspace_premium', section: 'Compliance' };
      case 'integrations':
        return { label: 'Integrations', icon: 'extension', section: 'Compliance' };
      case 'tenants':
      case 'tenancy-and-campuses':
        return { label: 'Campuses', icon: 'domain', section: 'Administration' };
      case 'users-and-roles':
      case 'auth-and-rbac':
        return { label: 'Users & Roles', icon: 'admin_panel_settings', section: 'Administration' };
      case 'workflows':
        return { label: 'Approvals', icon: 'account_tree', section: 'Administration' };
      case 'reports':
        return { label: 'Reports', icon: 'analytics', section: 'Administration' };
      case 'documents':
        return { label: 'Documents', icon: 'folder_open', section: 'Administration' };
      case 'audit-log':
        return { label: 'Audit Log', icon: 'history', section: 'Administration' };
      case 'masters':
        return { label: 'Masters & Settings', icon: 'tune', section: 'Administration' };
      case 'data-migration':
        return { label: 'Data Import', icon: 'upload_file', section: 'Administration' };
      default:
        return { label: 'Lumen Academy', icon: 'school', section: 'Overview' };
    }
  };

  const viewMeta = getViewMeta();

  return (
    <header className="bg-[#ffffff] border-b border-[#e0ecf4] px-3 md:px-4 py-2 flex items-center justify-between gap-3 shrink-0 z-40 shadow-2xs">
      {/* Left: Mobile Menu Toggle, Multi-Campus Selector & Dynamic Breadcrumb */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Hamburger Menu */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg text-[#464555] hover:bg-[#f0f7fb] hover:text-[#0e5d84] transition-colors"
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
            className="flex items-center gap-2 bg-[#f0f7fb] hover:bg-[#e0ecf4] border border-[#cbe0ec] rounded-xl px-2.5 py-1.5 text-left transition-colors"
          >
            <img
              src="/lumen-academy-logo.svg"
              alt="Lumen Academy"
              referrerPolicy="no-referrer"
              className="w-7 h-7 object-contain shrink-0 drop-shadow-2xs"
            />
            <div className="leading-tight">
              <div className="text-xs font-bold text-[#082b3d] flex items-center gap-1.5">
                <span>{selectedCampus.name}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1 rounded">
                  {selectedCampus.code}
                </span>
              </div>
              <div className="text-[10px] text-[#464555] flex items-center gap-1">
                <span>{selectedCampus.studentsCount} Students</span>
                <span>•</span>
                <span>{selectedCampus.affiliationNumber}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#777587] text-sm ml-0.5">arrow_drop_down</span>
          </button>

          {campusDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-[#cbe0ec] py-2 z-50 animate-dropdown">
              <div className="px-3 py-1 text-[11px] font-bold text-[#777587] uppercase tracking-wider">
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
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#f0f7fb] transition-colors ${
                    selectedCampus.id === c.id ? 'bg-[#e0ecf4] font-semibold text-[#0e5d84]' : 'text-[#082b3d]'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-[11px] text-[#464555]">{c.location}</div>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section & Active Module Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 border-l border-[#e0ecf4] pl-3 text-xs">
          <span className="text-[#777587] font-semibold text-[11px] uppercase tracking-wider">{viewMeta.section}</span>
          <span className="text-[#c7c4d8]">/</span>
          <span className="font-bold text-[#082b3d] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#0e5d84]">{viewMeta.icon}</span>
            <span>{viewMeta.label}</span>
          </span>
        </div>

        {/* Academic Session Pill */}
        <div className="hidden 2xl:flex items-center gap-1.5 bg-[#f0f7fb] text-[#0e5d84] border border-[#cbe0ec] px-2.5 py-1 rounded-full text-xs font-semibold">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <span>AY 2024–25 (Term 3)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="w-full flex items-center justify-between bg-[#f0f7fb] hover:bg-[#e0ecf4] border border-[#cbe0ec] rounded-lg px-3 py-1.5 text-xs text-[#777587] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#0e5d84]">search</span>
            <span>Search screens and students…</span>
          </div>
          <kbd className="bg-white border border-[#cbe0ec] text-[10px] font-mono px-1.5 py-0.5 rounded text-[#464555]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action, Alerts & User Profile */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setQuickActionOpen(true)}
          className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span className="hidden sm:inline">New Entry</span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-[#464555] hover:bg-[#f0f7fb] hover:text-[#0e5d84] relative transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-[#cbe0ec] p-3 z-50 animate-dropdown">
              <div className="flex items-center justify-between pb-2 border-b border-[#f0f7fb]">
                <span className="text-xs font-bold text-[#082b3d]">Notifications</span>
                
              </div>
              <p className="py-6 text-center text-xs text-[#777587]">You're all caught up.</p>
            </div>
          )}
        </div>

        {/* User Profile Capsule & Participant Menu */}
        <div className="relative pl-2 border-l border-[#e0ecf4] flex items-center gap-1.5" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-label="Account menu"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#f0f7fb] transition-colors text-left"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#cbe0ec]"
            />
            <div className="hidden xl:block text-left leading-tight">
              <div className="text-xs font-bold text-[#082b3d] flex items-center gap-1">
                <span>{currentUser.name}</span>
                <span className="material-symbols-outlined text-xs text-[#777587]">expand_more</span>
              </div>
              <div className="text-[10px] text-[#0e5d84] font-medium">{currentUser.roleTitle}</div>
            </div>
          </button>

          {/* Quick 1-Click Sign Out to Login Page */}
          <button
            onClick={logout}
            className="flex items-center gap-1 text-[#777587] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            title="Sign Out to Login Page"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden lg:inline">Sign Out</span>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-[#cbe0ec] p-3 z-50 animate-dropdown space-y-3">
              <div className="flex items-center gap-3 pb-2.5 border-b border-[#f0f7fb]">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0e5d84]/20"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#082b3d] truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-[#0e5d84] font-semibold truncate">{currentUser.roleTitle}</div>
                  <div className="text-[10px] font-mono text-[#777587] truncate">{currentUser.identifier || currentUser.email}</div>
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

              <div className="pt-2 border-t border-[#f0f7fb] flex items-center justify-between text-[10px] text-[#777587]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  RLS Tenant Context
                </span>
                <span className="font-mono font-bold text-[#082b3d]">{selectedCampus.code}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
