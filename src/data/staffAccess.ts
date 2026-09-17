/// <reference types="vite/client" />
// Staff accounts for the admin console and the screens each role is allotted (RBAC-001, RBAC-003, RBAC-010).
// Parents and teachers use their own apps (apps/parent, apps/teacher); they have no access here.
import type { AdminView } from '../types';
import { SMS_MODULES } from './featureCatalog';
import { canChangeModule, hasModuleAccess } from './permissions';

export type StaffRole = 'principal' | 'accountant' | 'admissions' | 'auditor';

export interface StaffAccount {
  id: string;
  name: string;
  staffRole: StaffRole;
  roleTitle: string;
  email: string;
  phone: string;
  identifier: string;
  avatar: string;
  campusId: string;
  campusName: string;
  /** IAM-004: privileged roles must pass a second factor */
  requiresMfa: boolean;
  summary: string;
}

export const DEMO_STAFF_PASSWORD = 'Lumen@2024';
export const DEMO_TOTP = '529148';

export const STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'user-admin-arvind',
    name: 'Dr. Arvind Swaminathan',
    staffRole: 'principal',
    roleTitle: 'Principal',
    email: 'principal@lumenacademy.edu.in',
    phone: '+91 94440 10001',
    identifier: 'ADM-1001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: true,
    summary: 'Every module, approvals and settings',
  },
  {
    id: 'user-acc-lakshmi',
    name: 'Mrs. Lakshmi Narayanan',
    staffRole: 'accountant',
    roleTitle: 'Accountant',
    email: 'accounts@lumenacademy.edu.in',
    phone: '+91 94440 10021',
    identifier: 'ACC-2104',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: true,
    summary: 'Fees, concessions and refunds, fee messages, finance reports',
  },
  {
    id: 'user-ao-priya',
    name: 'Ms. Priya Venkat',
    staffRole: 'admissions',
    roleTitle: 'Admissions Officer',
    email: 'admissions@lumenacademy.edu.in',
    phone: '+91 94440 10035',
    identifier: 'AO-3310',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: false,
    summary: 'Enquiries to enrolment, student records, documents, ID cards',
  },
  {
    id: 'user-auditor-suresh',
    name: 'CA Suresh Ramanathan',
    staffRole: 'auditor',
    roleTitle: 'Auditor (read-only)',
    email: 'audit.suresh@ramanathanca.in',
    phone: '+91 98840 99881',
    identifier: 'AUD-502',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: true,
    summary: 'Audit log, fee records, compliance and reports',
  },
];

/** Alternate view ids that open the same screen. */
const CANONICAL: Partial<Record<AdminView, AdminView>> = {
  'student-360': 'students',
  parents: 'students',
  subjects: 'curriculum',
  'fees-and-finance': 'fees',
  payments: 'fees',
  invoices: 'fees',
  'financial-reports': 'fees',
  notifications: 'communication',
  'broadcast-sms': 'communication',
  'tenancy-and-campuses': 'tenants',
  settings: 'tenants',
  'auth-and-rbac': 'users-and-roles',
  'report-cards': 'results',
  classes: 'academics',
  'lms-and-courses': 'lms',
  'assignment-studio': 'assignments',
  teachers: 'teacher-management',
  employees: 'non-teaching-staff',
  payroll: 'hr-and-payroll',
};

export const canonicalView = (view: AdminView): AdminView => CANONICAL[view] ?? view;

/** Which catalogue modules a screen serves. Screens that serve no module are for the Principal only. */
const EXTRA_VIEW_MODULES: Partial<Record<AdminView, string[]>> = {
  'id-cards': ['CRT'],
};

const VIEW_MODULES: Partial<Record<AdminView, string[]>> = (() => {
  const map: Partial<Record<AdminView, string[]>> = {};
  for (const m of SMS_MODULES) {
    const view = canonicalView(m.targetView as AdminView);
    map[view] = [...(map[view] ?? []), m.code];
  }
  for (const [view, codes] of Object.entries(EXTRA_VIEW_MODULES)) map[view as AdminView] = [...(map[view as AdminView] ?? []), ...codes!];
  return map;
})();

export const viewModules = (view: AdminView): string[] => VIEW_MODULES[canonicalView(view)] ?? [];

/**
 * A role may open a screen when the access-grant matrix gives it any verb on a feature the screen serves
 * (RBAC-010). The dashboard is everyone's landing page; the feature catalogue is for the Principal and the auditor.
 */
export const canView = (role: StaffRole, view: AdminView): boolean => {
  if (view === 'dashboard') return true;
  if (view === 'feature-spec-matrix') return role === 'principal' || role === 'auditor';
  const modules = viewModules(view);
  if (!modules.length) return role === 'principal';
  return modules.some(m => hasModuleAccess(role, m));
};

/** Whether the role may change anything on the screen (holds C, U or D on one of its modules). */
export const canChangeView = (role: StaffRole, view: AdminView): boolean => {
  const modules = viewModules(view);
  if (!modules.length) return role === 'principal';
  return modules.some(m => canChangeModule(role, m));
};

export const ROLE_LABEL: Record<StaffRole, string> = {
  principal: 'Principal',
  accountant: 'Accountant',
  admissions: 'Admissions Officer',
  auditor: 'Auditor',
};

/** Where each role lands after signing in. */
export const HOME_VIEW: Record<StaffRole, AdminView> = {
  principal: 'dashboard',
  accountant: 'fees',
  admissions: 'admissions',
  auditor: 'audit-log',
};

/** Links to the separate apps (configurable per deployment). */
export const PARENT_APP_URL = import.meta.env?.VITE_PARENT_APP_URL ?? 'http://localhost:3001/';
export const TEACHER_APP_URL = import.meta.env?.VITE_TEACHER_APP_URL ?? 'http://localhost:3002/';
