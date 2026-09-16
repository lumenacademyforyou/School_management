import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminView } from '../../types';

interface NavItem {
  id: AdminView;
  label: string;
  icon: string;
  /** Other view ids that should highlight this item */
  aliases?: AdminView[];
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/** Baseline (P1 MVP) modules, plus the ID card studio. */
const BASELINE_GROUPS: NavGroup[] = [
  {
    id: 'students',
    label: 'Students',
    items: [
      { id: 'admissions', label: 'Admissions', icon: 'how_to_reg' },
      { id: 'students', label: 'Students', icon: 'groups', aliases: ['student-360', 'parents'] },
      { id: 'attendance', label: 'Attendance', icon: 'fact_check' },
      { id: 'id-cards', label: 'ID Cards', icon: 'id_card' },
    ],
  },
  {
    id: 'academics',
    label: 'Academics',
    items: [
      { id: 'curriculum', label: 'Curriculum', icon: 'menu_book', aliases: ['subjects'] },
      { id: 'timetable', label: 'Timetable', icon: 'calendar_month' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [{ id: 'fees', label: 'Fees', icon: 'payments', aliases: ['fees-and-finance', 'payments', 'invoices', 'financial-reports'] }],
  },
  {
    id: 'engagement',
    label: 'Communication',
    items: [
      { id: 'communication', label: 'Messages & Notices', icon: 'campaign', aliases: ['notifications', 'broadcast-sms'] },
      { id: 'parent-app-preview', label: 'Parent App', icon: 'smartphone' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    items: [
      { id: 'dpdpa-and-consent', label: 'Consent & Privacy', icon: 'verified_user' },
      { id: 'udise-and-apaar', label: 'UDISE+ & APAAR', icon: 'fingerprint' },
      { id: 'integrations', label: 'Integrations', icon: 'extension' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { id: 'tenants', label: 'Campuses', icon: 'domain', aliases: ['tenancy-and-campuses', 'settings'] },
      { id: 'users-and-roles', label: 'Users & Roles', icon: 'admin_panel_settings', aliases: ['auth-and-rbac'] },
      { id: 'workflows', label: 'Approvals', icon: 'account_tree' },
      { id: 'reports', label: 'Reports', icon: 'analytics' },
      { id: 'documents', label: 'Documents', icon: 'folder_open' },
      { id: 'audit-log', label: 'Audit Log', icon: 'history' },
      { id: 'masters', label: 'Masters & Settings', icon: 'tune' },
      { id: 'data-migration', label: 'Data Import', icon: 'upload_file' },
    ],
  },
];

/** Screens for modules whose features start in phase 2 or later. Hidden by default. */
const LATER_GROUPS: NavGroup[] = [
  {
    id: 'later-academics',
    label: 'Academics · later phases',
    items: [
      { id: 'exams', label: 'Examinations', icon: 'quiz' },
      { id: 'results', label: 'Report Cards', icon: 'grading', aliases: ['report-cards'] },
      { id: 'academics', label: 'Day Order & Proxy', icon: 'today', aliases: ['classes'] },
      { id: 'question-papers', label: 'Question Papers', icon: 'auto_awesome' },
      { id: 'question-bank', label: 'Question Bank', icon: 'database' },
      { id: 'lms', label: 'Digital Classroom', icon: 'play_lesson', aliases: ['lms-and-courses'] },
      { id: 'assignments', label: 'Assignments', icon: 'assignment_turned_in', aliases: ['assignment-studio'] },
    ],
  },
  {
    id: 'later-people',
    label: 'Staff · later phases',
    items: [
      { id: 'teacher-management', label: 'Teachers', icon: 'school', aliases: ['teachers'] },
      { id: 'non-teaching-staff', label: 'Support Staff', icon: 'badge', aliases: ['employees'] },
      { id: 'hr-and-payroll', label: 'HR & Payroll', icon: 'engineering', aliases: ['payroll'] },
    ],
  },
  {
    id: 'later-operations',
    label: 'Operations · later phases',
    items: [
      { id: 'accounting', label: 'Accounting', icon: 'account_balance' },
      { id: 'transport', label: 'Transport', icon: 'directions_bus' },
      { id: 'hostel', label: 'Hostel', icon: 'night_shelter' },
      { id: 'library', label: 'Library', icon: 'local_library' },
      { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
      { id: 'procurement', label: 'Procurement', icon: 'shopping_bag' },
      { id: 'helpdesk', label: 'Helpdesk', icon: 'support_agent' },
      { id: 'certificates', label: 'Certificates', icon: 'workspace_premium' },
    ],
  },
];

const LATER_KEY = 'lumen.sidebar.showLater';

const readLaterPref = () => {
  try {
    return window.localStorage.getItem(LATER_KEY) === '1';
  } catch {
    return false;
  }
};

const isItemActive = (item: NavItem, view: AdminView) => item.id === view || Boolean(item.aliases?.includes(view));

export const AdminSidebar: React.FC<{ collapsed?: boolean; onToggle?: () => void }> = ({ collapsed = false }) => {
  const { adminView, setAdminView } = useApp();
  const [filter, setFilter] = useState('');
  const [showLater, setShowLater] = useState<boolean>(readLaterPref);

  const groupOf = (view: AdminView) => [...BASELINE_GROUPS, ...LATER_GROUPS].find(g => g.items.some(i => isItemActive(i, view)))?.id;
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const active = groupOf(adminView);
    return { students: true, ...(active ? { [active]: true } : {}) };
  });

  // Opening a screen from elsewhere (search, dashboard) expands its group and reveals later-phase screens
  useEffect(() => {
    const active = groupOf(adminView);
    if (active) setOpen(prev => (prev[active] ? prev : { ...prev, [active]: true }));
    if (LATER_GROUPS.some(g => g.id === active)) setShowLater(true);
  }, [adminView]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LATER_KEY, showLater ? '1' : '0');
    } catch {
      // Storage unavailable (private mode); the preference simply is not remembered
    }
  }, [showLater]);

  const groups = useMemo(() => {
    const source = showLater || filter.trim() ? [...BASELINE_GROUPS, ...LATER_GROUPS] : BASELINE_GROUPS;
    const q = filter.trim().toLowerCase();
    return source.map(g => ({ ...g, items: q ? g.items.filter(i => i.label.toLowerCase().includes(q)) : g.items })).filter(g => g.items.length);
  }, [showLater, filter]);

  const laterCount = LATER_GROUPS.reduce((n, g) => n + g.items.length, 0);

  const itemButton = (item: NavItem) => {
    const active = isItemActive(item, adminView);
    return (
      <button
        key={item.id}
        onClick={() => setAdminView(item.id)}
        title={collapsed ? item.label : undefined}
        data-nav={item.id}
        aria-current={active ? 'page' : undefined}
        className={`w-full flex items-center gap-3 rounded-lg text-[13px] transition-colors ${collapsed ? 'justify-center p-2' : 'px-3 py-2'} ${
          active ? 'bg-[#0e5d84] text-white font-semibold shadow-xs' : 'text-[#34495a] hover:bg-[#f0f7fb] hover:text-[#082b3d]'
        }`}
      >
        <span className={`material-symbols-outlined text-[18px] ${active ? 'text-white' : 'text-[#6b8394]'}`}>{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside className={`bg-white border-r border-[#e0ecf4] h-full flex flex-col select-none ${collapsed ? 'w-16' : 'w-64'}`}>
      {!collapsed && (
        <div className="p-3 pb-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#8aa0ae]">search</span>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Find a screen"
              aria-label="Find a screen"
              className="w-full bg-[#f5f8fb] border border-transparent focus:border-[#cbe0ec] focus:bg-white rounded-lg pl-8 pr-2 py-1.5 text-xs text-[#082b3d] placeholder-[#8aa0ae] outline-none"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-1" aria-label="Main">
        {itemButton({ id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard' })}

        {groups.map(group => {
          const expanded = collapsed || Boolean(filter.trim()) || open[group.id];
          const hasActive = group.items.some(i => isItemActive(i, adminView));
          return (
            <div key={group.id} className="pt-2">
              {!collapsed && (
                <button
                  onClick={() => setOpen(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                  aria-expanded={expanded}
                  className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8aa0ae] hover:text-[#082b3d]"
                >
                  <span className={hasActive && !expanded ? 'text-[#0e5d84]' : ''}>{group.label}</span>
                  <span className="material-symbols-outlined text-[16px]">{expanded ? 'expand_less' : 'expand_more'}</span>
                </button>
              )}
              {collapsed && <div className="h-px bg-[#e0ecf4] mx-2 my-1" />}
              {expanded && <div className="space-y-0.5 mt-0.5">{group.items.map(itemButton)}</div>}
            </div>
          );
        })}

        {groups.length === 0 && <p className="px-3 py-4 text-xs text-[#8aa0ae]">No screen matches “{filter}”.</p>}
      </nav>

      {!collapsed && (
        <div className="border-t border-[#e0ecf4] p-2 space-y-1">
          <label className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-[#34495a] cursor-pointer rounded-lg hover:bg-[#f5f8fb]">
            <span>
              Show later-phase modules <span className="text-[#8aa0ae]">({laterCount})</span>
            </span>
            <input type="checkbox" checked={showLater} onChange={e => setShowLater(e.target.checked)} className="accent-[#0e5d84]" aria-label="Show later-phase modules" />
          </label>
          <button
            onClick={() => setAdminView('feature-spec-matrix')}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs ${
              adminView === 'feature-spec-matrix' ? 'bg-[#f0f7fb] text-[#0e5d84] font-semibold' : 'text-[#6b8394] hover:bg-[#f5f8fb]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">checklist</span>
            Feature catalogue (699)
          </button>
        </div>
      )}
    </aside>
  );
};
