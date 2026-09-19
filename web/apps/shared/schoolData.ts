// Reference data shared by the parent and teacher apps.
// Deterministic: everything is derived from fixed tables or a string hash.
import { INITIAL_ROSTER, RosterStudent } from '../../src/data/students';
import { SECTION_CONFIG } from '../../src/data/attendance';
import { INITIAL_GUARDIANS, NO_PHOTO_CONSENT, Recipient } from '../../src/data/messaging';
import { CONSENT_PURPOSES } from '../../src/data/admissions';

export const APP_TODAY = '2024-09-16';
export const APP_NOW = '10:05';

const hash = (s: string) => {
  let h = 5381;
  for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h;
};

export const liveChildren = () => INITIAL_ROSTER.filter(s => !s.mergedInto && ['Active', 'On leave', 'Suspended'].includes(s.status));
export const sectionOf = (s: RosterStudent) => `${s.classLevel}-${s.section}`;

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export interface ParentAccount {
  guardian: Recipient;
  children: RosterStudent[];
}

/** One login per guardian mobile; siblings appear under the same login (IAM-012). */
export const PARENT_ACCOUNTS: ParentAccount[] = INITIAL_GUARDIANS.filter(g => g.primary).map(g => ({
  guardian: g,
  children: liveChildren().filter(s => s.guardianMobile === g.mobile),
}));

export const DEMO_OTP = '412890';

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  designation: string;
  classTeacherOf?: string;
  teaches: { section: string; subject: string }[];
}

export const TEACHER_ACCOUNTS: TeacherAccount[] = [
  {
    id: 'T-malini',
    name: 'Mrs. Malini Iyer',
    email: 'malini.iyer@lumenacademy.edu.in',
    designation: 'PGT Physics · Class teacher 10-A',
    classTeacherOf: '10-A',
    teaches: [
      { section: '10-A', subject: 'Science' },
      { section: '10-B', subject: 'Science' },
    ],
  },
  {
    id: 'T-natarajan',
    name: 'Mr. K. Natarajan',
    email: 'natarajan@lumenacademy.edu.in',
    designation: 'TGT Science · Class teacher 8-A',
    classTeacherOf: '8-A',
    teaches: [
      { section: '8-A', subject: 'Science' },
      { section: '8-B', subject: 'Science' },
      { section: '9-A', subject: 'Science' },
    ],
  },
  {
    id: 'T-clara',
    name: 'Ms. Clara D’Souza',
    email: 'clara@lumenacademy.edu.in',
    designation: 'TGT English · Class teacher 9-A',
    classTeacherOf: '9-A',
    teaches: [
      { section: '9-A', subject: 'English' },
      { section: '10-A', subject: 'English' },
      { section: '8-A', subject: 'English' },
    ],
  },
];

export const DEMO_PASSWORD = 'Lumen@2024';

export const classTeacherFor = (section: string) => SECTION_CONFIG.find(c => c.key === section)?.classTeacher ?? 'Class teacher';

// ---------------------------------------------------------------------------
// Timetable (APP-006, TCH-007)
// ---------------------------------------------------------------------------

export interface Period {
  period: number;
  start: string;
  end: string;
  subject: string;
  teacher: string;
  room: string;
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const BELLS = [
  ['08:00', '08:40'],
  ['08:40', '09:20'],
  ['09:20', '10:00'],
  ['10:15', '10:55'],
  ['10:55', '11:35'],
  ['11:35', '12:15'],
  ['13:00', '13:40'],
];

const SUBJECT_TEACHERS: Record<string, Record<string, string>> = {
  '10-A': { English: 'Ms. Clara D’Souza', Maths: 'Dr. V. Raghavan', Science: 'Mrs. Malini Iyer', 'Social Science': 'Mrs. Priya Mohan', Hindi: 'Mr. Ravi Shankar', PE: 'Coach R. Dinesh' },
  '10-B': { English: 'Mrs. Leela Thomas', Maths: 'Dr. V. Raghavan', Science: 'Mrs. Malini Iyer', 'Social Science': 'Mrs. Priya Mohan', Hindi: 'Mr. Ravi Shankar', PE: 'Coach R. Dinesh' },
  '9-A': { English: 'Ms. Clara D’Souza', Maths: 'Mr. Arun Prakash', Science: 'Mr. K. Natarajan', 'Social Science': 'Mrs. Priya Mohan', Tamil: 'Ms. Anitha Selvi', PE: 'Coach R. Dinesh' },
  '9-B': { English: 'Mrs. Leela Thomas', Maths: 'Mr. Arun Prakash', Science: 'Mr. S. Balaji', 'Social Science': 'Mr. Joseph Antony', Tamil: 'Ms. Anitha Selvi', PE: 'Coach R. Dinesh' },
  '8-A': { English: 'Ms. Clara D’Souza', Maths: 'Mr. Arun Prakash', Science: 'Mr. K. Natarajan', 'Social Science': 'Mr. Joseph Antony', Tamil: 'Ms. Anitha Selvi', PE: 'Coach R. Dinesh' },
  '8-B': { English: 'Mrs. Leela Thomas', Maths: 'Mr. Arun Prakash', Science: 'Mr. K. Natarajan', 'Social Science': 'Mr. Joseph Antony', Hindi: 'Mr. Ravi Shankar', PE: 'Coach R. Dinesh' },
};

const ROTATION = ['English', 'Maths', 'Science', 'Social Science', 'LANG', 'Maths', 'Science', 'English', 'PE', 'Social Science', 'LANG', 'Science'];

/** Weekly timetable for a section; Saturday has four periods. */
export const timetableFor = (section: string): Record<Weekday, Period[]> => {
  const teachers = SUBJECT_TEACHERS[section] ?? SUBJECT_TEACHERS['10-A'];
  const lang = teachers.Hindi ? 'Hindi' : 'Tamil';
  const offset = hash(section) % ROTATION.length;
  const out = {} as Record<Weekday, Period[]>;
  WEEKDAYS.forEach((day, d) => {
    const count = day === 'Sat' ? 4 : BELLS.length;
    out[day] = Array.from({ length: count }, (_, p) => {
      const raw = ROTATION[(offset + d * 3 + p) % ROTATION.length];
      const subject = raw === 'LANG' ? lang : raw;
      return {
        period: p + 1,
        start: BELLS[p][0],
        end: BELLS[p][1],
        subject,
        teacher: teachers[subject],
        room: subject === 'Science' ? 'Science Lab 2' : subject === 'PE' ? 'Ground' : `Room ${section.replace('-', '')}`,
      };
    });
  });
  return out;
};

export const weekdayOf = (iso: string): Weekday | null => {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return dow === 0 ? null : WEEKDAYS[dow - 1];
};

/** A teacher's own periods on a day, across every section. */
export const teacherDay = (teacher: string, day: Weekday) =>
  Object.keys(SUBJECT_TEACHERS)
    .flatMap(section => timetableFor(section)[day].filter(p => p.teacher === teacher).map(p => ({ ...p, section })))
    .sort((a, b) => a.start.localeCompare(b.start));

// ---------------------------------------------------------------------------
// Published results (APP-005)
// ---------------------------------------------------------------------------

export interface PublishedExam {
  id: string;
  name: string;
  publishedOn: string;
  max: number;
}

export const PUBLISHED_EXAMS: PublishedExam[] = [
  { id: 'UT1', name: 'Unit Test 1', publishedOn: '2024-07-05', max: 25 },
  { id: 'UT2', name: 'Unit Test 2', publishedOn: '2024-08-23', max: 25 },
];

export const subjectsFor = (section: string) => Object.keys(SUBJECT_TEACHERS[section] ?? {}).filter(s => s !== 'PE');

const TENDENCY: Record<string, number> = { 'ros-13': -7, 'ros-10': -5, 'ros-05': -3, 'ros-02': 3, 'ros-11': 2 };

export const resultFor = (studentId: string, section: string, examId: string) =>
  subjectsFor(section).map(subject => {
    const base = 17 + (hash(`${studentId}${examId}${subject}`) % 8) + (TENDENCY[studentId] ?? 0);
    return { subject, marks: Math.max(5, Math.min(25, base)) };
  });

export const gradeFor = (pct: number) => (pct >= 91 ? 'A1' : pct >= 81 ? 'A2' : pct >= 71 ? 'B1' : pct >= 61 ? 'B2' : pct >= 51 ? 'C1' : pct >= 41 ? 'C2' : pct >= 33 ? 'D' : 'E');

// ---------------------------------------------------------------------------
// Documents (APP-011)
// ---------------------------------------------------------------------------

export const documentsFor = (studentId: string) => {
  const h = hash(studentId);
  return [
    { name: 'Birth certificate', status: 'Verified' },
    { name: 'Aadhaar', status: 'Verified' },
    { name: 'Transfer certificate (previous school)', status: h % 5 === 0 ? 'Pending verification' : 'Verified' },
    { name: 'Immunisation record', status: h % 4 === 0 ? 'Expired — upload the latest' : 'Verified' },
    { name: 'Passport photo', status: 'Verified' },
  ];
};

// ---------------------------------------------------------------------------
// Assessments the teacher app enters marks for (EXM-006)
// ---------------------------------------------------------------------------

export interface Assessment {
  id: string;
  section: string;
  subject: string;
  title: string;
  max: number;
  dueOn: string;
}

export const ASSESSMENTS: Assessment[] = [
  { id: 'UT3-SCI-10A', section: '10-A', subject: 'Science', title: 'Unit Test 3 · Light', max: 25, dueOn: '2024-09-20' },
  { id: 'UT3-SCI-10B', section: '10-B', subject: 'Science', title: 'Unit Test 3 · Light', max: 25, dueOn: '2024-09-20' },
  { id: 'UT3-SCI-8A', section: '8-A', subject: 'Science', title: 'Unit Test 3 · Crop production', max: 25, dueOn: '2024-09-19' },
  { id: 'UT3-SCI-9A', section: '9-A', subject: 'Science', title: 'Unit Test 3 · Motion', max: 25, dueOn: '2024-09-19' },
  { id: 'UT3-ENG-9A', section: '9-A', subject: 'English', title: 'Unit Test 3 · Grammar', max: 25, dueOn: '2024-09-21' },
];

// ---------------------------------------------------------------------------
// Homework (APP-007, LMS-003)
// ---------------------------------------------------------------------------

export interface Homework {
  id: string;
  section: string;
  subject: string;
  title: string;
  details: string;
  dueOn: string;
  postedBy: string;
  postedOn: string;
}

export const INITIAL_HOMEWORK: Homework[] = [
  { id: 'HW-101', section: '10-A', subject: 'Science', title: 'Ray diagrams — concave mirror', details: 'Draw the six ray diagrams from page 142 in your notebook.', dueOn: '2024-09-18', postedBy: 'Mrs. Malini Iyer', postedOn: '2024-09-13' },
  { id: 'HW-102', section: '10-A', subject: 'English', title: 'Letter to the editor', details: 'Write a letter on plastic waste near the school (150 words).', dueOn: '2024-09-17', postedBy: 'Ms. Clara D’Souza', postedOn: '2024-09-12' },
  { id: 'HW-103', section: '9-A', subject: 'Science', title: 'Distance–time graphs', details: 'Exercise 8.2, questions 1–5.', dueOn: '2024-09-19', postedBy: 'Mr. K. Natarajan', postedOn: '2024-09-16' },
  { id: 'HW-104', section: '8-A', subject: 'Science', title: 'Crop calendar chart', details: 'Make a chart of kharif and rabi crops grown in Tamil Nadu.', dueOn: '2024-09-20', postedBy: 'Mr. K. Natarajan', postedOn: '2024-09-14' },
  { id: 'HW-105', section: '10-B', subject: 'Science', title: 'Ray diagrams — concave mirror', details: 'Draw the six ray diagrams from page 142 in your notebook.', dueOn: '2024-09-18', postedBy: 'Mrs. Malini Iyer', postedOn: '2024-09-13' },
];

// ---------------------------------------------------------------------------
// Consent ledger (APP-012, CNS-002, CNS-007) — append-only
// ---------------------------------------------------------------------------

export interface ConsentRow {
  id: string;
  guardianId: string;
  studentId: string;
  purpose: string;
  action: 'Granted' | 'Withdrawn';
  at: string;
  method: 'Admission form' | 'Parent app';
  noticeVersion: string;
}

export const PRIVACY_NOTICE_VERSION = 'v2.1 (1 Jun 2024)';

export const INITIAL_CONSENT: ConsentRow[] = PARENT_ACCOUNTS.flatMap(a =>
  a.children.flatMap(c =>
    CONSENT_PURPOSES.map((purpose, i) => ({
      id: `CR-${c.id}-${i}`,
      guardianId: a.guardian.id,
      studentId: c.id,
      purpose,
      action: purpose.startsWith('Photo') && NO_PHOTO_CONSENT.has(c.id) ? ('Withdrawn' as const) : ('Granted' as const),
      at: '2024-04-02 10:00',
      method: 'Admission form' as const,
      noticeVersion: 'v2.0 (1 Mar 2024)',
    }))
  )
);

export const currentConsent = (rows: ConsentRow[], studentId: string, purpose: string) =>
  rows.filter(r => r.studentId === studentId && r.purpose === purpose).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)).pop();

// ---------------------------------------------------------------------------
// Class announcements from teachers
// ---------------------------------------------------------------------------

export interface ClassAnnouncement {
  id: string;
  section: string;
  title: string;
  body: string;
  by: string;
  on: string;
  ackRequired: boolean;
}

export const INITIAL_ANNOUNCEMENTS: ClassAnnouncement[] = [
  { id: 'CA-01', section: '10-A', title: 'Science lab coat', body: 'Please send a white lab coat from Wednesday for practicals.', by: 'Mrs. Malini Iyer', on: '2024-09-15', ackRequired: true },
  { id: 'CA-02', section: '8-A', title: 'Field visit consent', body: 'Farm visit on 27 Sep. Please acknowledge to confirm participation.', by: 'Mr. K. Natarajan', on: '2024-09-14', ackRequired: true },
];
