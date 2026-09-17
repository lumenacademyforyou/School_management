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

/** One id per admin console screen. */
export type AdminView =
  | 'dashboard'
  | 'feature-spec-matrix'
  // Platform foundation
  | 'tenants'
  | 'users-and-roles'
  | 'access-grants'
  | 'workflows'
  | 'documents'
  | 'audit-log'
  | 'reports'
  | 'masters'
  | 'data-migration'
  // Core domain
  | 'admissions'
  | 'students'
  | 'student-360'
  | 'id-cards'
  | 'curriculum'
  | 'academics'
  | 'timetable'
  | 'attendance'
  | 'exams'
  | 'results'
  | 'fees'
  | 'accounting'
  // Operations
  | 'hr-and-payroll'
  | 'library'
  | 'transport'
  | 'hostel'
  | 'inventory'
  | 'procurement'
  | 'helpdesk'
  // Engagement & learning
  | 'communication'
  | 'lms'
  | 'assignments'
  | 'question-bank'
  | 'question-papers'
  // Compliance & integrations
  | 'dpdpa-and-consent'
  | 'udise-and-apaar'
  | 'emis'
  | 'certificates'
  | 'integrations'
  // People
  | 'teacher-management'
  | 'non-teaching-staff';

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
  emis?: string;
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
