// Tamil Nadu EMIS (Educational Management Information System) desk: how the school's records line up with
// the state portal the government uses to track students, teachers and daily attendance.
// Pure rules and seed data; src/services/emisService.ts keeps the live state. The portal itself is mocked.
import { RosterStudent, StudentStatus, checkEmis, normaliseEmis } from './students';

export const EMIS_NOW = '2024-09-16 17:40';
export const EMIS_TODAY = EMIS_NOW.slice(0, 10);

export const SCHOOL_EMIS = {
  udiseCode: '33020701402',
  name: 'Lumen Academy Senior Secondary School',
  district: 'Chennai',
  block: 'Adyar',
  management: 'Private unaided',
  portal: 'emis.tnschools.gov.in',
};

// ---------------------------------------------------------------------------
// The state portal (mock)
// ---------------------------------------------------------------------------

/** What the state portal holds against one EMIS number. */
export interface StateRecord {
  emis: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female';
  classLevel: number;
  section: string;
  udiseCode: string;
  schoolName: string;
  /** Studying: on the rolls of `udiseCode`. In common pool: released by the previous school and free to admit. */
  status: 'Studying' | 'In common pool';
}

export type Portal = Record<string, StateRecord>;

const ours = (s: RosterStudent, patch: Partial<StateRecord> = {}): StateRecord => ({
  emis: normaliseEmis(s.emis ?? ''),
  name: s.name,
  dob: s.dob,
  gender: s.gender,
  classLevel: s.classLevel,
  section: s.section,
  udiseCode: SCHOOL_EMIS.udiseCode,
  schoolName: SCHOOL_EMIS.name,
  status: 'Studying',
  ...patch,
});

/** Portal records that differ from ours on purpose, so every desk state can be seen. */
const PORTAL_DRIFT: Record<string, Partial<StateRecord> | 'absent'> = {
  // Legal name on the state record differs (a name change request is also pending in Students)
  'ros-15': { name: 'Lakshmi Anand Rao' },
  // Date of birth typed wrongly at the previous school
  'ros-09': { dob: '2010-02-04' },
  // Detained in Class 8, but the portal promoted him automatically
  'ros-14': { classLevel: 9 },
  // Admitted this term; not uploaded yet
  'ros-18': 'absent',
};

/** Records held by other schools or released to the common pool (lookups and incoming transfers). */
export const OTHER_SCHOOL_RECORDS: StateRecord[] = [
  { emis: '3303150600112233', name: 'Janani P. Mohan', dob: '2011-11-02', gender: 'Female', classLevel: 8, section: 'A', udiseCode: '33020700815', schoolName: 'Govt. Girls HSS, Saidapet', status: 'In common pool' },
  { emis: '3303150600114455', name: 'Vishnu K. Raman', dob: '2011-08-19', gender: 'Male', classLevel: 8, section: 'B', udiseCode: '33020701977', schoolName: 'St. Mary’s Matric HSS, Velachery', status: 'In common pool' },
  { emis: '3302110400218841', name: 'Divya S. Kumar', dob: '2010-03-12', gender: 'Female', classLevel: 9, section: 'C', udiseCode: '33021100432', schoolName: 'Chennai Public School, Anna Nagar', status: 'Studying' },
  { emis: '3302110400218842', name: 'Rohan M. Das', dob: '2009-06-01', gender: 'Male', classLevel: 10, section: 'A', udiseCode: '33021100432', schoolName: 'Chennai Public School, Anna Nagar', status: 'Studying' },
];

export const seedPortal = (roster: RosterStudent[]): Portal => {
  const portal: Portal = {};
  for (const s of roster) {
    if (s.mergedInto || !s.emis || checkEmis(s.emis, s.id, roster).state !== 'valid') continue;
    const drift = PORTAL_DRIFT[s.id];
    if (drift === 'absent') continue;
    portal[normaliseEmis(s.emis)] = ours(s, drift);
  }
  for (const r of OTHER_SCHOOL_RECORDS) portal[r.emis] = r;
  return portal;
};

// ---------------------------------------------------------------------------
// Student status against the portal
// ---------------------------------------------------------------------------

const LEFT: StudentStatus[] = ['TC issued', 'Alumni'];
export const onRolls = (s: RosterStudent) => !s.mergedInto && !LEFT.includes(s.status) && s.status !== 'Struck off';

export type PortalState = 'linked' | 'mismatch' | 'class' | 'not-uploaded' | 'missing' | 'fix' | 'release' | 'released';

export interface PortalStatus {
  state: PortalState;
  label: string;
  detail: string;
  diffs: { field: 'Name' | 'Date of birth' | 'Gender'; ours: string; portal: string }[];
}

export const PORTAL_LABEL: Record<PortalState, string> = {
  linked: 'Linked',
  mismatch: 'Details differ',
  class: 'Class differs',
  'not-uploaded': 'Not on portal',
  missing: 'No EMIS',
  fix: 'Fix number',
  release: 'Release pending',
  released: 'Released',
};

const sameName = (a: string, b: string) => a.toLowerCase().replace(/[^a-z]/g, '') === b.toLowerCase().replace(/[^a-z]/g, '');

export const detailDiffs = (s: RosterStudent, r: StateRecord): PortalStatus['diffs'] => [
  ...(sameName(s.name, r.name) ? [] : [{ field: 'Name' as const, ours: s.name, portal: r.name }]),
  ...(s.dob === r.dob ? [] : [{ field: 'Date of birth' as const, ours: s.dob, portal: r.dob }]),
  ...(s.gender === r.gender ? [] : [{ field: 'Gender' as const, ours: s.gender, portal: r.gender }]),
];

export const portalStatus = (s: RosterStudent, roster: RosterStudent[], portal: Portal): PortalStatus => {
  const make = (state: PortalState, detail: string, diffs: PortalStatus['diffs'] = []): PortalStatus => ({ state, label: PORTAL_LABEL[state], detail, diffs });
  const check = checkEmis(s.emis, s.id, roster);
  const record = check.state === 'valid' ? portal[normaliseEmis(s.emis!)] : undefined;
  const atOurSchool = record?.udiseCode === SCHOOL_EMIS.udiseCode;
  if (LEFT.includes(s.status)) {
    if (atOurSchool && record!.status === 'Studying') return make('release', 'Left the school, but still on our rolls in EMIS. Release to the common pool so the next school can admit.');
    return make('released', 'Not on our rolls in EMIS.');
  }
  if (check.state === 'empty') return make('missing', 'No EMIS number recorded. Find the student in the common pool, or request a new number.');
  if (check.state !== 'valid') return make('fix', check.message);
  if (!record || !atOurSchool) {
    return make('not-uploaded', record ? `On the portal under ${record.schoolName} (${record.status.toLowerCase()}). Upload to move the student to our school.` : 'The portal has no record for this number yet. Upload to add it.');
  }
  const diffs = detailDiffs(s, record);
  if (diffs.length) return make('mismatch', `${diffs.map(d => d.field).join(' and ')} on the portal differ from the school record.`, diffs);
  if (record.classLevel !== s.classLevel || record.section !== s.section) return make('class', `Portal shows Class ${record.classLevel}-${record.section}; school record is ${s.classLevel}-${s.section}.`);
  return make('linked', 'School and portal records match.');
};

// ---------------------------------------------------------------------------
// Upload queue
// ---------------------------------------------------------------------------

export type ChangeKind = 'add' | 'class' | 'release' | 'correct';

export const CHANGE_LABEL: Record<ChangeKind, string> = {
  add: 'Add to school',
  class: 'Update class',
  release: 'Release to common pool',
  correct: 'Correct details',
};

export interface Correction {
  studentId: string;
  field: 'Name' | 'Date of birth' | 'Gender';
  value: string;
  requestedBy: string;
  requestedOn: string;
}

export interface PendingChange {
  id: string;
  kind: ChangeKind;
  studentId: string;
  studentName: string;
  emis: string;
  summary: string;
  /** Set on corrections. */
  field?: Correction['field'];
}

const correctionId = (c: Pick<Correction, 'studentId' | 'field'>) => `correct-${c.studentId}-${c.field.replace(/\s/g, '')}`;

/** Changes the school still has to send to the portal. Derived from the records, so fixing a record updates the queue. */
export const pendingChanges = (roster: RosterStudent[], portal: Portal, corrections: Correction[]): PendingChange[] => {
  const out: PendingChange[] = [];
  for (const s of roster) {
    if (s.mergedInto) continue;
    const st = portalStatus(s, roster, portal);
    const emis = normaliseEmis(s.emis ?? '');
    const base = { studentId: s.id, studentName: s.name, emis };
    if (st.state === 'not-uploaded') out.push({ ...base, id: `add-${s.id}`, kind: 'add', summary: `Add to ${SCHOOL_EMIS.name}, Class ${s.classLevel}-${s.section}` });
    if (st.state === 'class') out.push({ ...base, id: `class-${s.id}`, kind: 'class', summary: `${st.detail} Send ${s.classLevel}-${s.section}.` });
    if (st.state === 'release') out.push({ ...base, id: `release-${s.id}`, kind: 'release', summary: `${s.status} — release to the common pool` });
  }
  for (const c of corrections) {
    const s = roster.find(x => x.id === c.studentId);
    if (!s) continue;
    out.push({ id: correctionId(c), kind: 'correct', studentId: s.id, studentName: s.name, emis: normaliseEmis(s.emis ?? ''), summary: `${c.field} → ${c.value}`, field: c.field });
  }
  return out;
};

export interface UploadResult {
  id: string;
  kind: ChangeKind;
  studentName: string;
  ok: boolean;
  message: string;
}

/** What the portal does with each change (mock rules). Returns the new portal and one result per change. */
export const applyUpload = (roster: RosterStudent[], portal: Portal, changes: PendingChange[], corrections: Correction[]) => {
  const next: Portal = { ...portal };
  const results: UploadResult[] = [];
  const done = (c: PendingChange, ok: boolean, message: string) => results.push({ id: c.id, kind: c.kind, studentName: c.studentName, ok, message });
  for (const c of changes) {
    const s = roster.find(x => x.id === c.studentId)!;
    const record = next[c.emis];
    if (c.kind === 'add') {
      if (record && record.udiseCode !== SCHOOL_EMIS.udiseCode && record.status === 'Studying') {
        done(c, false, `Still on the rolls of ${record.schoolName}. Ask that school to release the student to the common pool.`);
      } else {
        next[c.emis] = ours(s);
        done(c, true, record ? `Moved from the common pool to ${SCHOOL_EMIS.name}.` : 'Added to the portal.');
      }
    } else if (c.kind === 'class') {
      next[c.emis] = { ...record!, classLevel: s.classLevel, section: s.section };
      done(c, true, `Class updated to ${s.classLevel}-${s.section}.`);
    } else if (c.kind === 'release') {
      next[c.emis] = { ...record!, status: 'In common pool' };
      done(c, true, 'Released to the common pool.');
    } else {
      const fix = corrections.find(x => correctionId(x) === c.id)!;
      if (fix.field === 'Date of birth') {
        done(c, false, 'Date of birth changes are approved by the Block Resource Centre. Upload the birth certificate on the portal.');
      } else if (record) {
        next[c.emis] = { ...record, ...(fix.field === 'Name' ? { name: fix.value } : { gender: fix.value as StateRecord['gender'] }) };
        done(c, true, `${fix.field} corrected.`);
      } else {
        done(c, false, 'The portal has no record for this number. Upload the student first.');
      }
    }
  }
  return { portal: next, results };
};

/** Corrections that the upload did not settle stay queued. */
export const remainingCorrections = (corrections: Correction[], results: UploadResult[]) =>
  corrections.filter(c => !results.some(r => r.id === correctionId(c) && r.ok));

// ---------------------------------------------------------------------------
// Lookups (common pool)
// ---------------------------------------------------------------------------

export type Lookup =
  | { state: 'invalid'; message: string }
  | { state: 'not-found' }
  | { state: 'found'; record: StateRecord; relation: 'ours' | 'pool' | 'other-school'; linkedTo?: RosterStudent };

export const lookupEmis = (value: string, roster: RosterStudent[], portal: Portal): Lookup => {
  const v = normaliseEmis(value);
  if (!/^33\d{14}$/.test(v)) return { state: 'invalid', message: 'Enter a 16-digit Tamil Nadu EMIS number (starts with 33).' };
  const record = portal[v];
  if (!record) return { state: 'not-found' };
  const linkedTo = roster.find(s => !s.mergedInto && normaliseEmis(s.emis ?? '') === v);
  const relation = record.udiseCode === SCHOOL_EMIS.udiseCode ? 'ours' : record.status === 'In common pool' ? 'pool' : 'other-school';
  return { state: 'found', record, relation, linkedTo };
};

/** Pool records that look like a roster student with no EMIS number (same name and date of birth). */
export const poolMatchesFor = (s: RosterStudent, portal: Portal) =>
  Object.values(portal).filter(r => r.status === 'In common pool' && sameName(r.name, s.name) && r.dob === s.dob);

// ---------------------------------------------------------------------------
// Staff and daily attendance
// ---------------------------------------------------------------------------

export interface StaffEmis {
  id: string;
  name: string;
  role: string;
  teacherId: string;
}

export const TEACHER_ID_RULE = '8 digits, starting with 33 (demo rule).';
export const checkTeacherId = (v: string) => (!v ? 'missing' : /^33\d{6}$/.test(v) ? 'valid' : 'invalid');

export const STAFF_EMIS: StaffEmis[] = [
  { id: 'st-01', name: 'Mrs. Malini Iyer', role: 'PGT Mathematics · Class teacher 10-A', teacherId: '33010456' },
  { id: 'st-02', name: 'Mr. K. Natarajan', role: 'TGT Science · Class teacher 9-A', teacherId: '33010457' },
  { id: 'st-03', name: 'Ms. Clara D’Souza', role: 'TGT English', teacherId: '33010502' },
  { id: 'st-04', name: 'Mrs. Revathi Subramanian', role: 'PGT Physics', teacherId: '33010519' },
  { id: 'st-05', name: 'Ms. Farzana Begum', role: 'TGT Tamil', teacherId: '33010533' },
  { id: 'st-06', name: 'Mr. Joseph Antony', role: 'PGT Computer Science', teacherId: '3301054' },
  { id: 'st-07', name: 'Mr. P. Senthil Nathan', role: 'Physical Education', teacherId: '' },
  { id: 'st-08', name: 'Mrs. Kavitha Raman', role: 'Special Educator', teacherId: '33010561' },
];

export interface AttendanceUpload {
  date: string;
  onRoll: number;
  present: number;
  status: 'Uploaded' | 'Pending' | 'Failed';
  at?: string;
  note?: string;
}

/** Daily school-wide attendance is due on the portal by 10:30 AM (demo rule). */
export const ATTENDANCE_DUE = '10:30';

export const INITIAL_ATTENDANCE: AttendanceUpload[] = [
  { date: '2024-09-16', onRoll: 2450, present: 2371, status: 'Pending' },
  { date: '2024-09-13', onRoll: 2450, present: 2338, status: 'Failed', note: 'Portal timed out at 10:12 AM' },
  { date: '2024-09-12', onRoll: 2450, present: 2362, status: 'Uploaded', at: '2024-09-12 10:05' },
  { date: '2024-09-11', onRoll: 2450, present: 2355, status: 'Uploaded', at: '2024-09-11 09:58' },
  { date: '2024-09-10', onRoll: 2449, present: 2340, status: 'Uploaded', at: '2024-09-10 10:21' },
  { date: '2024-09-09', onRoll: 2449, present: 2297, status: 'Uploaded', at: '2024-09-09 11:02', note: 'Uploaded after the 10:30 AM cut-off' },
];

// ---------------------------------------------------------------------------
// Summary and export
// ---------------------------------------------------------------------------

export const emisSummary = (roster: RosterStudent[], portal: Portal, corrections: Correction[]) => {
  const current = roster.filter(onRolls);
  const states = current.map(s => portalStatus(s, roster, portal).state);
  const count = (...xs: PortalState[]) => states.filter(x => xs.includes(x)).length;
  return {
    onRolls: current.length,
    withEmis: current.filter(s => checkEmis(s.emis, s.id, roster).state === 'valid').length,
    linked: count('linked'),
    missing: count('missing'),
    toFix: count('fix', 'mismatch'),
    pending: pendingChanges(roster, portal, corrections).length,
    staffLinked: STAFF_EMIS.filter(s => checkTeacherId(s.teacherId) === 'valid').length,
    staff: STAFF_EMIS.length,
  };
};

export const EXPORT_HEADERS = ['EMIS No', 'Student Name', 'Gender', 'Date of Birth', 'Class', 'Section', 'Admission No', 'School Status', 'Portal Status'];

export const exportRows = (roster: RosterStudent[], portal: Portal) =>
  roster
    .filter(s => !s.mergedInto)
    .map(s => [normaliseEmis(s.emis ?? ''), s.name, s.gender, s.dob, s.classLevel, s.section, s.admissionNo, s.status, portalStatus(s, roster, portal).label]);
