import { AuthUser } from '../types';

export interface ParticipantPersona {
  id: string;
  name: string;
  role: AuthUser['role'];
  roleTitle: string;
  category: 'Administration' | 'Faculty' | 'Family' | 'Fleet Operations' | 'Learners' | 'Statutory Audit';
  email: string;
  phone: string;
  identifier: string;
  avatar: string;
  campusId: string;
  campusName: string;
  requiresMfa: boolean;
  mfaMethod?: 'TOTP Authenticator' | 'SMS OTP';
  description: string;
  featuresAccessible: string;
  defaultView?: string;
}

export const DEMO_PARTICIPANTS: ParticipantPersona[] = [
  {
    id: 'user-admin-arvind',
    name: 'Dr. Arvind Swaminathan',
    role: 'admin',
    roleTitle: 'Principal & Trust Secretary',
    category: 'Administration',
    email: 'principal@lumenacademy.edu.in',
    phone: '+91 94440 10001',
    identifier: 'ADM-1001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: true,
    mfaMethod: 'TOTP Authenticator',
    description: 'Full supervisory authority across all 37 modules, multi-campus governance, budget releases, and staff rosters.',
    featuresAccessible: 'All 699 Spec Capabilities • Multi-Branch RLS • DPDP Vault • CBSE Affiliation',
    defaultView: 'dashboard',
  },
  {
    id: 'user-faculty-lakshmi',
    name: 'Mrs. Lakshmi Iyer',
    role: 'faculty',
    roleTitle: 'PGT Mathematics & Class 10-A Mentor',
    category: 'Faculty',
    email: 'l.iyer@lumenacademy.edu.in',
    phone: '+91 98402 11223',
    identifier: 'TCH-204',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: false,
    description: 'Daily roll call, CBSE 5E lesson planning (NoL), marks entry, student behavioral diaries, and proxy substitutions.',
    featuresAccessible: 'Roll Call Register • 5E Lesson Plan Studio • Marksheet Submissions • 50h CPD Tracker',
    defaultView: 'schedule-home',
  },
  {
    id: 'user-parent-rajesh',
    name: 'Mr. Rajesh Sharma',
    role: 'parent',
    roleTitle: 'Parent of Aarav Sharma (Class 10-A)',
    category: 'Family',
    email: 'rajesh.sharma@tcs.com',
    phone: '+91 98401 23456',
    identifier: 'PAR-8812',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: false,
    description: 'Real-time bus tracking on Route #14, CBSE report cards, instant UPI fee clearance, and DPDP digital consent.',
    featuresAccessible: 'Live Bus GPS Telematics • Term Report Cards • Online Fee Gateway • PTM Booking',
    defaultView: 'parent-home',
  },
  {
    id: 'user-driver-murugan',
    name: 'Murugan K.',
    role: 'driver',
    roleTitle: 'Senior Fleet Captain (Bus #12 · Route 14)',
    category: 'Fleet Operations',
    email: 'murugan.fleet@lumenacademy.edu.in',
    phone: '+91 94440 91823',
    identifier: 'DRV-012',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: false,
    description: 'High-contrast mobile HUD, turn-by-turn stop advancement, student RFID boarding verification, and AIS-140 emergency SOS.',
    featuresAccessible: 'Live Route Stops • Boarding Scanner • Offline Cache • AIS-140 Panic SOS',
    defaultView: 'live-route',
  },
  {
    id: 'user-student-aarav',
    name: 'Aarav Sharma',
    role: 'student',
    roleTitle: 'Grade 10-A • Roll 14 • Falcon House',
    category: 'Learners',
    email: 'aarav.sharma2025@lumenacademy.edu.in',
    phone: '+91 98401 23456',
    identifier: 'APAAR-9842-3310-8841',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: false,
    description: 'Academic dashboard, class timetable, homework submission portal, CBSE board hall ticket, and DigiLocker certificates.',
    featuresAccessible: 'Timetable & Class Rooms • Homework Submissions • Hall Tickets • DigiLocker Certificates',
    defaultView: 'student-home',
  },
  {
    id: 'user-auditor-suresh',
    name: 'CA Suresh Ramanathan',
    role: 'admin',
    roleTitle: 'Statutory Auditor & Compliance Controller',
    category: 'Statutory Audit',
    email: 'audit.suresh@ramanathanca.in',
    phone: '+91 98840 99881',
    identifier: 'AUD-502',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
    campusId: 'chennai-main',
    campusName: 'Chennai Campus (CHN-01)',
    requiresMfa: true,
    mfaMethod: 'TOTP Authenticator',
    description: 'Read-only financial reconciliation, 10BD donation certification, fee register audit logs, and export provenance verification.',
    featuresAccessible: 'Financial Audit Logs • 10BD Trust Forms • Fee Reconciliation • Export Provenance',
    defaultView: 'financial-reports',
  },
];
