import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminView, Campus } from '../../types';

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  theme: 'purple' | 'teal' | 'coral';
  items: {
    id: AdminView;
    label: string;
    icon: string;
    badge?: string;
  }[];
}

export const AdminSidebar: React.FC<{ collapsed?: boolean; onToggle?: () => void }> = ({
  collapsed = false,
  onToggle,
}) => {
  const { adminView, setAdminView, selectedCampus, setSelectedCampus, campuses, addToast } = useApp();
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    academics: true,
    people: true,
    finance: true,
    operations: false,
    engagement: false,
    compliance: true,
    foundation: false,
  });
  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);

  const campusSidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (campusSidebarRef.current && !campusSidebarRef.current.contains(e.target as Node)) {
        setCampusDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCampusDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'academics',
      label: 'ACADEMICS & STUDENTS',
      icon: 'school',
      theme: 'teal',
      items: [
        { id: 'admissions', label: 'Admissions Pipeline (ADM)', icon: 'how_to_reg', badge: '126 Leads' },
        { id: 'students', label: 'Students & 360° Profile (STU)', icon: 'badge', badge: '2,486' },
        { id: 'curriculum', label: 'Curriculum & Syllabus (CUR)', icon: 'menu_book' },
        { id: 'timetable', label: 'Timetable & Substitution (TTB)', icon: 'calendar_month', badge: 'Auto' },
        { id: 'academics', label: 'Day Order & Proxy (TTB)', icon: 'today' },
        { id: 'exams', label: 'Examinations & Results (EXM)', icon: 'quiz', badge: 'CBSE' },
        { id: 'question-papers', label: 'Question Paper Generator (QPG)', icon: 'auto_awesome' },
        { id: 'question-bank', label: 'Question Bank (QPG Bloom’s)', icon: 'database' },
        { id: 'results', label: 'Report Cards & HPC 360° (RCD)', icon: 'grading', badge: 'NEP 2020' },
        { id: 'attendance', label: 'Attendance Roll Call (ATT)', icon: 'fact_check', badge: '94.6%' },
        { id: 'lms', label: 'LMS Digital Classroom (LMS)', icon: 'play_lesson' },
        { id: 'assignments', label: 'Assignments Studio (LMS)', icon: 'assignment_turned_in' },
      ],
    },
    {
      id: 'people',
      label: 'FACULTY & STAFF',
      icon: 'groups',
      theme: 'teal',
      items: [
        { id: 'teacher-management', label: 'Teacher Management (TCH)', icon: 'school', badge: '34 Feats' },
        { id: 'non-teaching-staff', label: 'Non-Teaching Support (NTS)', icon: 'badge', badge: '30 Feats' },
        { id: 'hr-and-payroll', label: 'HR & 7th CPC Payroll (HRM/PAY)', icon: 'engineering', badge: '174 Staff' },
        { id: 'id-cards', label: 'ID Card Studio (STU/TCH/NTS)', icon: 'id_card', badge: 'Print' },
      ],
    },
    {
      id: 'finance',
      label: 'FINANCE & ACCOUNTS',
      icon: 'payments',
      theme: 'purple',
      items: [
        { id: 'fees', label: 'Fees & Dual Ledger (FEE)', icon: 'payments', badge: '₹18.4L Due' },
        { id: 'accounting', label: 'Accounting & Chart of Accts (ACC)', icon: 'account_balance', badge: 'ACC-20' },
      ],
    },
    {
      id: 'operations',
      label: 'CAMPUS OPERATIONS',
      icon: 'settings_suggest',
      theme: 'teal',
      items: [
        { id: 'transport', label: 'Transport Fleet & AIS-140 (TRN)', icon: 'directions_bus', badge: 'Live GPS' },
        { id: 'hostel', label: 'Hostel & Residential Halls (HST)', icon: 'night_shelter' },
        { id: 'library', label: 'Library & RFID Catalog (LIB)', icon: 'local_library' },
        { id: 'inventory', label: 'Store Inventory & 3-Way Match (INV)', icon: 'inventory_2' },
        { id: 'procurement', label: 'Procurement & Purchase Orders (PRC)', icon: 'shopping_bag' },
        { id: 'helpdesk', label: 'Helpdesk & Grievance SLA (HLP)', icon: 'support_agent', badge: 'SLA' },
      ],
    },
    {
      id: 'engagement',
      label: 'COMMUNITY & ENGAGEMENT',
      icon: 'campaign',
      theme: 'purple',
      items: [
        { id: 'communication', label: 'Notices & DLT Broadcast (COM/NOT)', icon: 'campaign' },
        { id: 'parent-app-preview', label: 'Parent Mobile App Companion (APP)', icon: 'smartphone' },
      ],
    },
    {
      id: 'compliance',
      label: 'STATUTORY & COMPLIANCE',
      icon: 'verified_user',
      theme: 'coral',
      items: [
        { id: 'dpdpa-and-consent', label: 'DPDPA 2023 Consent Hub (CNS/DPD)', icon: 'security', badge: 'Mandatory' },
        { id: 'udise-and-apaar', label: 'UDISE+ & APAAR Registry (GOV)', icon: 'fingerprint' },
        { id: 'certificates', label: 'DigiLocker & Transfer Cert (CRT)', icon: 'verified' },
        { id: 'integrations', label: 'Integrations & Telematics Hub (INT)', icon: 'webhook', badge: '17 APIs' },
      ],
    },
    {
      id: 'foundation',
      label: 'PLATFORM GOVERNANCE',
      icon: 'hub',
      theme: 'purple',
      items: [
        { id: 'tenants', label: 'Tenancy & Campuses (TEN)', icon: 'domain', badge: '4 Sites' },
        { id: 'users-and-roles', label: 'IAM & Dynamic RBAC (IAM/RBAC)', icon: 'admin_panel_settings', badge: '6 Roles' },
        { id: 'workflows', label: 'Approval Workflows (WFL)', icon: 'account_tree' },
        { id: 'reports', label: 'Reports & Analytics (RPT)', icon: 'analytics' },
        { id: 'documents', label: 'Document Vault & Verify (DOC)', icon: 'folder_managed', badge: 'DOC-15' },
        { id: 'audit-log', label: 'Immutable Audit Log (AUD)', icon: 'history_edu', badge: 'SHA-256' },
        { id: 'masters', label: 'Masters & Config (MST)', icon: 'tune' },
        { id: 'data-migration', label: 'Data Import & Migration (MIG)', icon: 'move_to_inbox', badge: 'Wizard' },
      ],
    },
  ];

  const filteredGroups = navGroups.map(group => {
    if (!searchFilter.trim()) return group;
    const items = group.items.filter(item =>
      item.label.toLowerCase().includes(searchFilter.toLowerCase())
    );
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  const getThemeStyles = (theme: 'purple' | 'teal' | 'coral', isActive: boolean) => {
    if (!isActive) return 'text-[#464555] hover:bg-[#f0f7fb] hover:text-[#082b3d]';
    switch (theme) {
      case 'coral':
        return 'bg-orange-50 text-orange-900 font-semibold border border-orange-200 shadow-2xs';
      case 'teal':
        return 'bg-teal-50 text-teal-900 font-semibold border border-teal-200 shadow-2xs';
      case 'purple':
      default:
        return 'bg-[#f0f7fb] text-[#0e5d84] font-semibold border border-[#cbe0ec] shadow-2xs';
    }
  };

  const getIconColor = (theme: 'purple' | 'teal' | 'coral', isActive: boolean) => {
    if (!isActive) return 'text-[#777587] group-hover:text-[#082b3d]';
    switch (theme) {
      case 'coral':
        return 'text-orange-600';
      case 'teal':
        return 'text-teal-700';
      case 'purple':
      default:
        return 'text-[#0e5d84]';
    }
  };

  return (
    <aside
      className={`bg-white border-r border-[#e0ecf4] h-full overflow-y-auto select-none transition-all duration-200 flex flex-col justify-between ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      <div className="py-2">
        {/* Multi-Tenant School Selector Header */}
        {collapsed ? (
          <div className="flex justify-center mb-3">
            <img
              src="/lumen-academy-logo.svg"
              alt="Lumen Academy"
              referrerPolicy="no-referrer"
              className="w-9 h-9 object-contain drop-shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title={`${selectedCampus.name} (${selectedCampus.code})`}
              onClick={() => onToggle?.()}
            />
          </div>
        ) : (
          <div className="px-3 mb-2 relative" ref={campusSidebarRef}>
            <div
              onClick={() => setCampusDropdownOpen(!campusDropdownOpen)}
              className="p-2 bg-[#f8f9ff] hover:bg-[#f0f7fb] border border-[#cbe0ec] rounded-xl cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/lumen-academy-logo.svg"
                  alt="Lumen Academy"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-contain shrink-0 drop-shadow-xs"
                />
                <div className="truncate">
                  <div className="text-xs font-bold text-[#082b3d] truncate">
                    {selectedCampus.name}
                  </div>
                  <div className="text-[10px] text-[#777587] flex items-center gap-1">
                    <span>{selectedCampus.academicYear}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">Online</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-sm text-[#777587]">
                {campusDropdownOpen ? 'expand_less' : 'unfold_more'}
              </span>
            </div>

            {/* School Switcher Dropdown */}
            {campusDropdownOpen && (
              <div className="absolute left-3 right-3 top-13 bg-white border border-[#cbe0ec] rounded-xl shadow-lg p-1 z-50 space-y-1 animate-dropdown">
                <div className="px-2 py-1 text-[10px] font-bold text-[#777587] uppercase">
                  LumenAcademy Group Campuses
                </div>
                {campuses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCampus(c);
                      setCampusDropdownOpen(false);
                      addToast(`Switched active tenant to ${c.name}`, 'info');
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      selectedCampus.id === c.id
                        ? 'bg-[#f0f7fb] text-[#0e5d84] font-bold'
                        : 'hover:bg-slate-50 text-[#082b3d]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-[10px] text-[#777587]">{c.studentsCount} Students • {c.code}</div>
                    </div>
                    {selectedCampus.id === c.id && (
                      <span className="material-symbols-outlined text-sm text-[#0e5d84]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Menu Filter Search */}
        {!collapsed && (
          <div className="px-3 mb-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-[#777587]">
                search
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Filter menu modules..."
                className="w-full bg-[#f8f9ff] border border-[#e0ecf4] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#082b3d] placeholder-[#777587] focus:outline-hidden focus:border-[#0e5d84]"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-2 text-[#777587] hover:text-[#082b3d] text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Direct Actions */}
        <div className="px-2 mb-2 space-y-1">
          <button
            onClick={() => setAdminView('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left group ${
              adminView === 'dashboard'
                ? 'bg-[#0e5d84] text-white shadow-xs'
                : 'text-[#082b3d] hover:bg-[#f0f7fb]'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              dashboard
            </span>
            {!collapsed && (
              <span className="flex-1 font-bold">Executive Overview</span>
            )}
          </button>

          <button
            onClick={() => setAdminView('feature-spec-matrix')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left group ${
              adminView === 'feature-spec-matrix'
                ? 'bg-[#0e5d84] text-white shadow-xs'
                : 'text-[#0e5d84] bg-[#f0f7fb] hover:bg-[#bae6fd]/70 border border-[#cbe0ec]/60'
            }`}
          >
            <span className="material-symbols-outlined text-base text-[#0e5d84] group-hover:rotate-45 transition-transform">
              fact_check
            </span>
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="font-bold truncate">Master Spec (699)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0e5d84] text-white font-bold shrink-0">
                  LMN-001
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Modular Navigation Groups */}
        <div className="space-y-1 px-2">
          {filteredGroups.map(group => {
            const isExpanded = expandedGroups[group.id] || !!searchFilter;
            return (
              <div key={group.id} className="pt-1">
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-[#777587] hover:text-[#082b3d] uppercase tracking-wider rounded transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{group.label}</span>
                      <span className="text-[9px] font-normal text-[#94a3b8] lowercase font-mono">
                        ({group.items.length})
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-xs text-[#777587]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                ) : (
                  <div className="h-px bg-[#e0ecf4] my-1 mx-2" />
                )}

                {/* Sub-items */}
                {(isExpanded || collapsed) && (
                  <nav className="space-y-0.5 mt-0.5">
                    {group.items.map(item => {
                      const isActive =
                        adminView === item.id ||
                        (item.id === 'students' && (adminView === 'student-360' || adminView === 'students')) ||
                        (item.id === 'tenants' && (adminView === 'tenancy-and-campuses' || adminView === 'tenants')) ||
                        (item.id === 'users-and-roles' && (adminView === 'auth-and-rbac' || adminView === 'users-and-roles')) ||
                        (item.id === 'fees' && (adminView === 'fees-and-finance' || adminView === 'fees' || adminView === 'payments' || adminView === 'invoices')) ||
                        (item.id === 'lms' && (adminView === 'lms-and-courses' || adminView === 'lms')) ||
                        (item.id === 'assignments' && (adminView === 'assignment-studio' || adminView === 'assignments')) ||
                        (item.id === 'curriculum' && (adminView === 'subjects' || adminView === 'curriculum')) ||
                        (item.id === 'academics' && (adminView === 'academics' || adminView === 'classes')) ||
                        (item.id === 'timetable' && adminView === 'timetable') ||
                        (item.id === 'exams' && adminView === 'exams') ||
                        (item.id === 'results' && (adminView === 'report-cards' || adminView === 'results')) ||
                        (item.id === 'teacher-management' && (adminView === 'teachers' || adminView === 'teacher-management')) ||
                        (item.id === 'non-teaching-staff' && (adminView === 'employees' || adminView === 'non-teaching-staff')) ||
                        (item.id === 'hr-and-payroll' && (adminView === 'payroll' || adminView === 'hr-and-payroll')) ||
                        (item.id === 'communication' && (adminView === 'notifications' || adminView === 'broadcast-sms' || adminView === 'communication')) ||
                        (item.id === 'question-bank' && adminView === 'question-bank');

                      return (
                        <button
                          key={item.id}
                          onClick={() => setAdminView(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left group ${getThemeStyles(
                            group.theme,
                            isActive
                          )}`}
                          title={collapsed ? item.label : undefined}
                        >
                          <span
                            className={`material-symbols-outlined text-base transition-colors ${getIconColor(
                              group.theme,
                              isActive
                            )}`}
                          >
                            {item.icon}
                          </span>
                          {!collapsed && (
                            <span className="flex-1 truncate">{item.label}</span>
                          )}
                          {!collapsed && item.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                                item.badge === 'Live' || item.badge === 'Live GPS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.badge === 'Mandatory' || item.badge === 'CBSE'
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.badge.includes('₹')
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* System Status Footer */}
      {!collapsed && (
        <div className="p-3 m-2 bg-[#f8f9ff] rounded-xl border border-[#e0ecf4] text-xs">
          <div className="flex items-center justify-between text-[#082b3d] font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Central Cloud Sync</span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-mono px-1 rounded">18ms</span>
          </div>
          <div className="text-[11px] text-[#464555] flex justify-between">
            <span>UDISE+ Gateway</span>
            <span className="font-mono text-[10px] text-emerald-700 font-bold">CONNECTED</span>
          </div>
          <div className="text-[11px] text-[#464555] flex justify-between mt-0.5">
            <span>Merkle Tree Root</span>
            <span className="font-mono text-[10px] text-[#0e5d84]">0x8F3C...A12</span>
          </div>
        </div>
      )}
    </aside>
  );
};
