import type { StaffRole } from './data/staffAccess';

export interface AuthUser {
  id: string;
  name: string;
  staffRole: StaffRole;
  roleTitle: string;
  email?: string;
  phone?: string;
  avatar: string;
  campusId: string;
  campusName: string;
  identifier?: string;
  mfaVerified?: boolean;
}

export type AdminView =
  | 'dashboard'
  | 'feature-spec-matrix'
  | 'access-grants'
  // LAYER 1: PLATFORM FOUNDATION
  | 'tenants'
  | 'users-and-roles'
  | 'workflows'
  | 'documents'
  | 'audit-log'
  | 'reports'
  | 'masters'
  | 'data-migration'
  // LAYER 2: CORE DOMAIN
  | 'admissions'
  | 'students'
  | 'parents'
  | 'teachers'
  | 'employees'
  | 'classes'
  | 'subjects'
  | 'curriculum'
  | 'timetable'
  | 'attendance'
  | 'exams'
  | 'report-cards'
  | 'results'
  | 'fees'
  | 'payments'
  | 'invoices'
  | 'financial-reports'
  | 'accounting'
  // LAYER 3: OPERATIONS
  | 'hr-and-payroll'
  | 'payroll'
  | 'library'
  | 'transport'
  | 'hostel'
  | 'inventory'
  | 'procurement'
  // LAYER 4: ENGAGEMENT & LEARNING
  | 'communication'
  | 'notifications'
  | 'lms'
  | 'assignments'
  | 'question-bank'
  | 'question-papers'
  | 'helpdesk'
  // LAYER 5: COMPLIANCE & INTEGRATIONS
  | 'dpdpa-and-consent'
  | 'udise-and-apaar'
  | 'certificates'
  | 'integrations'
  | 'settings'
  // LAYER 6: PEOPLE (MODULES 36 & 37)
  | 'teacher-management'
  | 'non-teaching-staff'
  | 'id-cards'
  // Legacy aliases
  | 'student-360'
  | 'tenancy-and-campuses'
  | 'auth-and-rbac'
  | 'fees-and-finance'
  | 'lms-and-courses'
  | 'assignment-studio'
  | 'broadcast-sms'
  | 'academics';

export interface Campus {
  id: string;
  name: string;
  code: string;
  affiliationNumber: string;
  location: string;
  academicYear: string;
  studentsCount: number;
  staffCount: number;
  clusterId: string;
  storageGb: number;
  status: 'Online' | 'Standby';
  logo?: string;
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  rollNo: string;
  class: string;
  section: string;
  house: string;
  apaarId: string;
  pen: string;
  admissionNo: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  gpa: number;
  cgpa?: number;
  mentor?: string;
  attendancePct: number;
  feeStatus: 'Paid' | 'Due' | 'Overdue';
  transportRoute: string;
  busSeat: string;
  hostelRoom?: string;
  guardianName: string;
  guardianPhone: string;
  guardianAltName?: string;
  guardianAltPhone?: string;
  address: string;
  prevSchool?: string;
}

export interface AttendanceRecord {
  studentId: string;
  name: string;
  rollNo: string;
  avatar: string;
  status: 'P' | 'L' | 'A' | 'E'; // Present, Late, Absent, Excused
  telemetrySource: string;
  time: string;
  notes?: string;
  streakDays?: number;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentName: string;
  studentClass: string;
  avatar: string;
  components: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Due' | 'Overdue' | 'Partial' | 'Scholarship';
  channel: string;
  receiptNo?: string;
  balance?: number;
}

export interface QuestionItem {
  id: string;
  code: string;
  chapter: string;
  section: string;
  marks: number;
  bloomTier: string; // e.g. L3 Applying
  difficulty: 'Easy' | 'Medium' | 'Hard';
  stemEn: string;
  stemHi?: string;
  options?: string[];
  correctAnswer?: string;
  formulaLatex?: string;
  diagramUrl?: string;
  verifiedBy: string;
}
