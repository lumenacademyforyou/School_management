// Navigation for the admin console, shared by the sidebar, global search and quick actions.
import type { AdminView } from '../types';

export interface NavItem {
  id: AdminView;
  label: string;
  icon: string;
  /** Other view ids that should highlight this item */
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
      { id: 'users-and-roles', label: 'Users & Roles', icon: 'manage_accounts', aliases: ['auth-and-rbac'] },
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

export const ALL_NAV_ITEMS: NavItem[] = [...BASELINE_GROUPS, ...LATER_GROUPS].flatMap(g => g.items);
