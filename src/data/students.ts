// Student 360 roster and pure rules (LMN-SMS-FEAT-001 §13).
import { PRIMARY_STUDENT } from './mockData';
import { Student } from '../types';

export type StudentStatus = 'Active' | 'On leave' | 'Suspended' | 'TC issued' | 'Alumni' | 'Struck off';
export type Category = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
export type YearResult = 'Pass' | 'Compartment' | 'Detained';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface RosterStudent {
  id: string;
  name: string;
  admissionNo: string;
  classLevel: number;
  section: string;
  rollNo: number;
  gender: 'Male' | 'Female';
  dob: string;
  category: Category;
  house: string;
  status: StudentStatus;
  feeStatus: 'Paid' | 'Due' | 'Overdue';
  transportRoute?: string;
  pen: string;
  apaar: string;
  emis?: string;
  guardianName: string;
  guardianMobile: string;
  emergencyContacts: EmergencyContact[];
  healthNotes?: string;
  disciplineNotes?: string;
  campusId: string;
  yearResult: YearResult;
  avatar?: string;
  mergedInto?: string;
}

export interface ChangeRequest {
  id: string;
  studentId: string;
  field: 'guardianMobile' | 'name' | 'house' | 'transportRoute';
  label: string;
  after: string;
  requestedBy: string;
  requestedOn: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  studentId: string;
  before: string;
  after: string;
}

export const STUDENTS_AS_OF = '2024-09-16';

// ---------------------------------------------------------------------------
// Lifecycle (STU-008)
// ---------------------------------------------------------------------------

export const STATUS_TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  Active: ['On leave', 'Suspended', 'TC issued', 'Struck off'],
  'On leave': ['Active', 'TC issued'],
  Suspended: ['Active', 'Struck off'],
  'TC issued': ['Alumni'],
  Alumni: [],
  'Struck off': ['Active'],
};

export const STATUS_EFFECTS: Record<StudentStatus, string> = {
  Active: 'Full access: attendance, marks, parent app, ID card',
  'On leave': 'Kept on roll; excluded from daily absence alerts',
  Suspended: 'Parent app read-only; excluded from marks entry',
  'TC issued': 'Parent login deactivated; ID card revoked; record read-only',
  Alumni: 'Restricted fields only; no academic writes',
  'Struck off': 'Removed from rolls; can be readmitted under the same admission number',
};

export const canTransition = (from: StudentStatus, to: StudentStatus) => STATUS_TRANSITIONS[from].includes(to);

// ---------------------------------------------------------------------------
// Field-level visibility (STU-010, STU-018)
// ---------------------------------------------------------------------------

export type ViewerRole = 'Principal' | 'Counsellor' | 'Class teacher' | 'Accountant';

export const FIELD_VISIBILITY: Record<ViewerRole, { health: boolean; discipline: boolean; export: boolean }> = {
  Principal: { health: true, discipline: true, export: true },
  Counsellor: { health: true, discipline: true, export: false },
  'Class teacher': { health: true, discipline: false, export: false },
  Accountant: { health: false, discipline: false, export: true },
};

// ---------------------------------------------------------------------------
// Identifier validation (STU-003, STU-026, STU-027)
// ---------------------------------------------------------------------------

export const digitsOnly = (v: string) => v.replace(/\D/g, '');
export const isValidPen = (pen: string) => /^\d{11}$/.test(pen);
export const isValidApaar = (apaar: string) => /^\d{12}$/.test(digitsOnly(apaar)) && /^[\d\s-]+$/.test(apaar);

export interface IdentifierIssue {
  studentId: string;
  field: 'PEN' | 'APAAR' | 'EMIS';
  problem: string;
}

export const identifierIssues = (students: RosterStudent[]): IdentifierIssue[] => {
  const live = students.filter(s => !s.mergedInto);
  const issues: IdentifierIssue[] = [];
  const penCount = new Map<string, number>();
  const apaarCount = new Map<string, number>();
  live.forEach(s => {
    penCount.set(s.pen, (penCount.get(s.pen) ?? 0) + 1);
    const a = digitsOnly(s.apaar);
    if (a) apaarCount.set(a, (apaarCount.get(a) ?? 0) + 1);
  });
  live.forEach(s => {
    if (!isValidPen(s.pen)) issues.push({ studentId: s.id, field: 'PEN', problem: `“${s.pen}” is not 11 digits` });
    else if (penCount.get(s.pen)! > 1) issues.push({ studentId: s.id, field: 'PEN', problem: `PEN ${s.pen} is used by more than one student` });
    if (!s.apaar) issues.push({ studentId: s.id, field: 'APAAR', problem: 'APAAR ID not generated yet' });
    else if (!isValidApaar(s.apaar)) issues.push({ studentId: s.id, field: 'APAAR', problem: `“${s.apaar}” is not 12 digits` });
    else if (apaarCount.get(digitsOnly(s.apaar))! > 1) issues.push({ studentId: s.id, field: 'APAAR', problem: `APAAR ${s.apaar} is used by more than one student` });
    if (!s.emis) issues.push({ studentId: s.id, field: 'EMIS', problem: 'State EMIS number missing' });
  });
  return issues;
};

// ---------------------------------------------------------------------------
// Search (STU-021) and duplicates (STU-025)
// ---------------------------------------------------------------------------

const normalise = (v: string) => v.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export const editDistance = (a: string, b: string) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
};

/** Matches name (typo-tolerant: one edit per word of 4+ letters), admission no, mobile, PEN or APAAR. */
export const matchesSearch = (s: RosterStudent, query: string) => {
  const q = normalise(query);
  if (!q) return true;
  const qDigits = digitsOnly(query);
  if (qDigits.length >= 4 && [s.guardianMobile, s.pen, s.apaar, s.admissionNo].some(v => digitsOnly(v).includes(qDigits))) return true;
  if (normalise(s.admissionNo).includes(q) || normalise(s.name).includes(q)) return true;
  const nameTokens = normalise(s.name).split(' ');
  const tokenMatches = (t: string, n: string) => n.startsWith(t) || (t.length >= 4 && (editDistance(t, n) <= 1 || editDistance(t, n.slice(0, t.length)) <= 1));
  return q.split(' ').every(t => nameTokens.some(n => tokenMatches(t, n)));
};

/** Probable duplicates: same name, date of birth and guardian mobile. Twins differ by name and are never paired. */
export const duplicatePairs = (students: RosterStudent[]) => {
  const live = students.filter(s => !s.mergedInto);
  const pairs: [RosterStudent, RosterStudent][] = [];
  live.forEach((a, i) =>
    live.slice(i + 1).forEach(b => {
      if (normalise(a.name) === normalise(b.name) && a.dob === b.dob && digitsOnly(a.guardianMobile).slice(-10) === digitsOnly(b.guardianMobile).slice(-10)) pairs.push([a, b]);
    })
  );
  return pairs;
};

// ---------------------------------------------------------------------------
// Promotion (STU-013)
// ---------------------------------------------------------------------------

export interface PromotionLine {
  student: RosterStudent;
  outcome: 'Promote' | 'Detain' | 'Hold';
  toClass: number;
  note: string;
}

/** Pass → next class; Detained → same class; Compartment → held until the supplementary result. */
export const planPromotion = (students: RosterStudent[], classLevel: number): PromotionLine[] =>
  students
    .filter(s => s.classLevel === classLevel && s.status === 'Active' && !s.mergedInto)
    .sort((a, b) => a.section.localeCompare(b.section) || a.rollNo - b.rollNo)
    .map(s =>
      s.yearResult === 'Pass'
        ? { student: s, outcome: 'Promote', toClass: classLevel + 1, note: 'Result: Pass' }
        : s.yearResult === 'Detained'
          ? { student: s, outcome: 'Detain', toClass: classLevel, note: 'Result: Detained' }
          : { student: s, outcome: 'Hold', toClass: classLevel, note: 'Awaiting supplementary exam' }
    );

// ---------------------------------------------------------------------------
// Mapping to the Student 360 profile
// ---------------------------------------------------------------------------

export const toProfile = (s: RosterStudent): Student => ({
  ...PRIMARY_STUDENT,
  id: s.id,
  name: s.name,
  avatar: s.avatar ?? PRIMARY_STUDENT.avatar,
  rollNo: String(s.rollNo),
  class: `Class ${s.classLevel}`,
  section: s.section,
  house: s.house,
  apaarId: s.apaar,
  pen: s.pen,
  admissionNo: s.admissionNo,
  gender: s.gender,
  dob: s.dob,
  feeStatus: s.feeStatus,
  transportRoute: s.transportRoute ?? 'Own transport',
  guardianName: s.guardianName,
  guardianPhone: s.guardianMobile,
  guardianAltName: s.emergencyContacts[0]?.name,
  guardianAltPhone: s.emergencyContacts[0]?.phone,
});

// ---------------------------------------------------------------------------
// Seed roster
// ---------------------------------------------------------------------------

const HOUSES = ['Emerald Falcon', 'Sapphire Tiger', 'Ruby Eagle', 'Topaz Lion'];
const GUARDIAN_TITLES = ['Mr.', 'Mrs.'];
const CONTACT_NAMES = ['K. Subramanian', 'L. Fernandes', 'M. Qureshi', 'N. Chatterjee', 'P. Gopal', 'R. Thangaraj', 'S. D’Mello', 'T. Kulkarni', 'V. Anand'];

type Seed = [string, 'M' | 'F', number, string, string, Category, StudentStatus, 'Paid' | 'Due' | 'Overdue', YearResult];

// name, gender, class, section, dob, category, status, fee, year result
const SEEDS: Seed[] = [
  ['Aarav S. Ramanathan', 'M', 10, 'A', '2009-10-14', 'General', 'Active', 'Due', 'Pass'],
  ['Ananya S. Iyer', 'F', 10, 'A', '2009-06-02', 'General', 'Active', 'Paid', 'Pass'],
  ['Arjun K. Nair', 'M', 10, 'A', '2009-03-19', 'OBC', 'Active', 'Paid', 'Pass'],
  ['Bhavna K. Menon', 'F', 10, 'B', '2009-08-25', 'General', 'Active', 'Paid', 'Pass'],
  ['Chetan R. Varma', 'M', 10, 'B', '2009-12-11', 'EWS', 'On leave', 'Due', 'Compartment'],
  ['Deepika S. Pillai', 'F', 10, 'B', '2009-01-07', 'SC', 'Active', 'Overdue', 'Pass'],
  ['Kavin R. Selvan', 'M', 9, 'A', '2010-05-30', 'OBC', 'Active', 'Paid', 'Pass'],
  ['Kavya R. Selvan', 'F', 9, 'A', '2010-05-30', 'OBC', 'Active', 'Paid', 'Pass'],
  ['Farah N. Siddiqui', 'F', 9, 'A', '2010-02-14', 'General', 'Active', 'Paid', 'Pass'],
  ['Gautham M. Sundaram', 'M', 9, 'B', '2010-09-09', 'General', 'Suspended', 'Due', 'Detained'],
  ['Harini R. Krishnan', 'F', 9, 'B', '2010-04-21', 'ST', 'Active', 'Paid', 'Pass'],
  ['Ishaan S. Menon', 'M', 8, 'A', '2011-07-17', 'General', 'Active', 'Paid', 'Pass'],
  ['Janani P. Mohan', 'F', 8, 'A', '2011-11-02', 'OBC', 'Active', 'Overdue', 'Compartment'],
  ['Karthik V. Iyer', 'M', 8, 'A', '2011-01-26', 'General', 'Active', 'Paid', 'Detained'],
  ['Lakshmi A. Rao', 'F', 8, 'B', '2011-03-08', 'EWS', 'Active', 'Paid', 'Pass'],
  ['Mohammed Rafi', 'M', 8, 'B', '2011-06-15', 'OBC', 'TC issued', 'Paid', 'Pass'],
  ['Mohammed Rafi', 'M', 8, 'B', '2011-06-15', 'OBC', 'Active', 'Paid', 'Pass'],
  ['Nila S. Varghese', 'F', 8, 'B', '2011-10-30', 'General', 'Active', 'Due', 'Pass'],
];

const SEED_EXTRAS: Record<number, Partial<RosterStudent>> = {
  0: { pen: PRIMARY_STUDENT.pen, apaar: PRIMARY_STUDENT.apaarId, avatar: PRIMARY_STUDENT.avatar, guardianName: PRIMARY_STUDENT.guardianName, guardianMobile: PRIMARY_STUDENT.guardianPhone, healthNotes: 'Mild dust allergy; carries antihistamine', transportRoute: 'Route 14' },
  4: { healthNotes: 'Recovering from viral fever — medical leave till 30 Sep', apaar: '' },
  5: { pen: '2023109941', disciplineNotes: 'Counsellor sessions fortnightly (exam anxiety)' },
  6: { guardianMobile: '+91 90030 45521', guardianName: 'R. Selvan' },
  7: { guardianMobile: '+91 90030 45521', guardianName: 'R. Selvan' },
  9: { disciplineNotes: 'Suspended 10–20 Sep: repeated bullying incident; parents informed' },
  10: { apaar: '4410-2231-0099' },
  11: { apaar: '4410-2231-0099', guardianMobile: '+91 98840 90124', guardianName: 'Suresh Menon' },
  12: { emis: undefined },
  15: { guardianMobile: '+91 99400 11200', guardianName: 'Abdul Rafi', transportRoute: 'Route 6' },
  16: { guardianMobile: '+91 99400 11200', guardianName: 'Abdul Rafi', transportRoute: 'Route 6' },
};

export const INITIAL_ROSTER: RosterStudent[] = SEEDS.map(([name, g, classLevel, section, dob, category, status, feeStatus, yearResult], i) => {
  const surname = name.split(' ').slice(-1)[0];
  const base: RosterStudent = {
    id: `ros-${String(i + 1).padStart(2, '0')}`,
    name,
    admissionNo: `ADM-${2014 + (12 - classLevel)}-${String(300 + i * 7).padStart(4, '0')}`,
    classLevel,
    section,
    rollNo: 0,
    gender: g === 'M' ? 'Male' : 'Female',
    dob,
    category,
    house: HOUSES[i % HOUSES.length],
    status,
    feeStatus,
    transportRoute: i % 3 === 0 ? `Route ${(i % 5) + 2}` : undefined,
    pen: `2023${String(1000000 + i * 1379).slice(-7)}`,
    apaar: `${String(5100 + i * 3)}-${String(2200 + i * 11)}-${String(7000 + i * 17)}`,
    emis: i === 12 ? undefined : `33${String(1102000000 + i * 97).padStart(14, '0')}`,
    guardianName: `${GUARDIAN_TITLES[i % 2]} ${String.fromCharCode(65 + (i % 20))}. ${surname}`,
    guardianMobile: `+91 9${String(8400000000 + i * 104729).slice(-9, -5)} ${String(8400000000 + i * 104729).slice(-5)}`,
    emergencyContacts: [
      { name: CONTACT_NAMES[i % CONTACT_NAMES.length], relation: 'Grandparent', phone: `+91 94440 ${String(50000 + i * 13).slice(-5)}` },
      { name: CONTACT_NAMES[(i + 4) % CONTACT_NAMES.length], relation: 'Family friend', phone: `+91 95000 ${String(60000 + i * 29).slice(-5)}` },
    ],
    campusId: 'chennai-main',
    yearResult,
  };
  return { ...base, ...SEED_EXTRAS[i] };
}).map((s, _i, all) => ({
  ...s,
  rollNo: all.filter(x => x.classLevel === s.classLevel && x.section === s.section && x.id <= s.id).length,
}));

export const INITIAL_CHANGE_REQUESTS: ChangeRequest[] = [
  { id: 'cr-1', studentId: 'ros-02', field: 'guardianMobile', label: 'Guardian mobile', after: '+91 98402 77110', requestedBy: 'Parent app · S. Iyer', requestedOn: '2024-09-14', status: 'Pending' },
  { id: 'cr-2', studentId: 'ros-09', field: 'transportRoute', label: 'Transport route', after: 'Route 4', requestedBy: 'Parent app · N. Siddiqui', requestedOn: '2024-09-15', status: 'Pending' },
  { id: 'cr-3', studentId: 'ros-15', field: 'name', label: 'Legal name', after: 'Lakshmi Anand Rao', requestedBy: 'Parent app · A. Rao', requestedOn: '2024-09-12', status: 'Pending' },
];

export const fieldValue = (s: RosterStudent, field: ChangeRequest['field']) => (s[field] as string | undefined) ?? '—';

/** Configurable export columns (STU-024); restricted columns follow field-level visibility. */
export const EXPORT_COLUMNS: { key: string; label: string; restricted?: 'health' | 'discipline'; value: (s: RosterStudent) => string | number }[] = [
  { key: 'admissionNo', label: 'Admission no', value: s => s.admissionNo },
  { key: 'name', label: 'Name', value: s => s.name },
  { key: 'class', label: 'Class', value: s => `${s.classLevel}-${s.section}` },
  { key: 'rollNo', label: 'Roll no', value: s => s.rollNo },
  { key: 'gender', label: 'Gender', value: s => s.gender },
  { key: 'dob', label: 'Date of birth', value: s => s.dob },
  { key: 'category', label: 'Category', value: s => s.category },
  { key: 'status', label: 'Status', value: s => s.status },
  { key: 'pen', label: 'PEN', value: s => s.pen },
  { key: 'apaar', label: 'APAAR', value: s => s.apaar },
  { key: 'guardian', label: 'Guardian', value: s => s.guardianName },
  { key: 'mobile', label: 'Guardian mobile', value: s => s.guardianMobile },
  { key: 'fee', label: 'Fee status', value: s => s.feeStatus },
  { key: 'health', label: 'Health notes', restricted: 'health', value: s => s.healthNotes ?? '' },
  { key: 'discipline', label: 'Discipline notes', restricted: 'discipline', value: s => s.disciplineNotes ?? '' },
];
