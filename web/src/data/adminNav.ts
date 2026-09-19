// Navigation for the admin console, shared by the sidebar, global search and quick actions.
import type { AdminView } from '../types';

export interface NavItem {
  id: AdminView;
  label: string;
  icon: string;
  /** Sub-screens that should highlight this item */
  aliases?: AdminView[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/** Baseline (P1 MVP) modules, plus the ID card studio. */
export const BASELINE_GROUPS: NavGroup[] = [
  {
    id: 'students',
    label: 'Students',
    items: [
      { id: 'admissions', label: 'Admissions', icon: 'how_to_reg' },
      { id: 'students', label: 'Students', icon: 'groups', aliases: ['student-360'] },
      { id: 'attendance', label: 'Attendance', icon: 'fact_check' },
      { id: 'id-cards', label: 'ID Cards', icon: 'id_card' },
    ],
  },
  {
    id: 'academics',
    label: 'Academics',
    items: [
      { id: 'curriculum', label: 'Curriculum', icon: 'menu_book' },
      { id: 'timetable', label: 'Timetable', icon: 'calendar_month' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [{ id: 'fees', label: 'Fees', icon: 'payments' }],
  },
  {
    id: 'engagement',
    label: 'Communication',
    items: [
      { id: 'communication', label: 'Messages & Notices', icon: 'campaign' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    items: [
      { id: 'dpdpa-and-consent', label: 'Consent & Privacy', icon: 'verified_user' },
      { id: 'udise-and-apaar', label: 'UDISE+ & APAAR', icon: 'fingerprint' },
      { id: 'emis', label: 'TN EMIS', icon: 'id_card' },
      { id: 'integrations', label: 'Integrations', icon: 'extension' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { id: 'tenants', label: 'Campuses', icon: 'domain' },
      { id: 'users-and-roles', label: 'Users & Roles', icon: 'manage_accounts' },
      { id: 'access-grants', label: 'Access Grants', icon: 'admin_panel_settings' },
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
export const LATER_GROUPS: NavGroup[] = [
  {
    id: 'later-academics',
    label: 'Academics · later phases',
    items: [
      { id: 'exams', label: 'Examinations', icon: 'quiz' },
      { id: 'results', label: 'Report Cards', icon: 'grading' },
      { id: 'academics', label: 'Day Order & Proxy', icon: 'today' },
      { id: 'question-papers', label: 'Question Paper Generator', icon: 'quiz' },
      { id: 'question-bank', label: 'Question Bank', icon: 'database' },
      { id: 'lms', label: 'Digital Classroom', icon: 'play_lesson' },
      { id: 'assignments', label: 'Assignments', icon: 'assignment_turned_in' },
    ],
  },
  {
    id: 'later-people',
    label: 'Staff · later phases',
    items: [
      { id: 'teacher-management', label: 'Teachers', icon: 'school' },
      { id: 'non-teaching-staff', label: 'Support Staff', icon: 'badge' },
      { id: 'hr-and-payroll', label: 'HR & Payroll', icon: 'engineering' },
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

export const ALL_NAV_ITEMS: NavItem[] = [...BASELINE_GROUPS, ...LATER_GROUPS].flatMap(g => g.items);

export interface ViewMeta {
  label: string;
  icon: string;
  section: string;
}

const OVERVIEW: Partial<Record<AdminView, ViewMeta>> = {
  dashboard: { label: 'Dashboard', icon: 'space_dashboard', section: 'Overview' },
  'feature-spec-matrix': { label: 'Feature catalogue', icon: 'checklist', section: 'Overview' },
  'student-360': { label: 'Student profile', icon: 'badge', section: 'Students' },
};

/** Breadcrumb label, icon and sidebar section for a screen. */
export const viewMeta = (view: AdminView): ViewMeta => {
  if (OVERVIEW[view]) return OVERVIEW[view]!;
  for (const group of [...BASELINE_GROUPS, ...LATER_GROUPS]) {
    const item = group.items.find(i => i.id === view);
    if (item) return { label: item.label, icon: item.icon, section: group.label.replace(/ · later phases$/, '') };
  }
  return { label: 'Lumen Academy', icon: 'school', section: 'Overview' };
};
