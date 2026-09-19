// Attendance domain (LMN-SMS-FEAT-001 §18). ATT-001 – ATT-012 follow the catalogue text;
// ATT-013 – ATT-023 are derived from the feature names in the PDF feature list.
import { INITIAL_ROSTER, RosterStudent } from './students';

export const ATTENDANCE_AS_OF = '2024-09-16';
export const REGISTER_FROM = '2024-08-01';
export const AY_END = '2025-03-31';

// ---------------------------------------------------------------------------
// Configuration (ATT-001, ATT-003, ATT-015, MST-013)
// ---------------------------------------------------------------------------

export type StatusCode = 'P' | 'L' | 'HD' | 'A' | 'LV' | 'EX' | 'MD';

export interface StatusDef {
  code: StatusCode;
  label: string;
  /** Weight toward attendance percentage */
  weight: number;
  reason: 'none' | 'optional' | 'required';
  colour: string;
}

export const DEFAULT_STATUS_CODES: StatusDef[] = [
  { code: 'P', label: 'Present', weight: 1, reason: 'none', colour: 'bg-emerald-500' },
  { code: 'L', label: 'Late', weight: 1, reason: 'optional', colour: 'bg-lime-500' },
  { code: 'HD', label: 'Half-day', weight: 0.5, reason: 'optional', colour: 'bg-amber-400' },
  { code: 'A', label: 'Absent', weight: 0, reason: 'optional', colour: 'bg-rose-500' },
  { code: 'LV', label: 'Leave', weight: 0, reason: 'required', colour: 'bg-sky-500' },
  { code: 'EX', label: 'Excused (school duty)', weight: 1, reason: 'required', colour: 'bg-indigo-400' },
  { code: 'MD', label: 'Medical', weight: 0, reason: 'required', colour: 'bg-violet-500' },
];

export type AttendanceMode = 'Daily' | 'Period-wise';

export interface SectionConfig {
  key: string;
  classLevel: number;
  section: string;
  mode: AttendanceMode;
  classTeacher: string;
}

export const SECTION_CONFIG: SectionConfig[] = [
  { key: '10-A', classLevel: 10, section: 'A', mode: 'Daily', classTeacher: 'Mrs. Malini Iyer' },
  { key: '10-B', classLevel: 10, section: 'B', mode: 'Daily', classTeacher: 'Mr. S. Balaji' },
  { key: '9-A', classLevel: 9, section: 'A', mode: 'Daily', classTeacher: 'Ms. Clara D’Souza' },
  { key: '9-B', classLevel: 9, section: 'B', mode: 'Daily', classTeacher: 'Dr. V. Raghavan' },
  { key: '8-A', classLevel: 8, section: 'A', mode: 'Period-wise', classTeacher: 'Mr. K. Natarajan' },
  { key: '8-B', classLevel: 8, section: 'B', mode: 'Period-wise', classTeacher: 'Coach R. Dinesh' },
];

export interface Holiday {
  date: string;
  name: string;
}

export const HOLIDAYS: Holiday[] = [
  { date: '2024-08-15', name: 'Independence Day' },
  { date: '2024-08-26', name: 'Janmashtami' },
  { date: '2024-09-07', name: 'Ganesh Chaturthi' },
  { date: '2024-10-02', name: 'Gandhi Jayanti' },
  { date: '2024-10-11', name: 'Ayudha Puja' },
  { date: '2024-10-31', name: 'Deepavali' },
  { date: '2024-12-25', name: 'Christmas' },
  { date: '2025-01-14', name: 'Pongal' },
  { date: '2025-01-15', name: 'Thiruvalluvar Day' },
  { date: '2025-01-26', name: 'Republic Day' },
];

/** Working-day rule: Monday–Friday, plus Saturdays except the second Saturday of the month. */
export const SECOND_SATURDAY_OFF = true;

export const MARKING_CUTOFF = '09:30';
export const ALERT_SEND_TIME = '10:30';
export const CORRECTION_WINDOW_DAYS = 7;

// ---------------------------------------------------------------------------
// Calendar (ATT-015)
// ---------------------------------------------------------------------------

export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const dayOfWeek = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

export interface DayKind {
  date: string;
  working: boolean;
  /** Why the day is not a working day */
  reason?: string;
}

export const classifyDay = (date: string, holidays: Holiday[]): DayKind => {
  const dow = dayOfWeek(date);
  const holiday = holidays.find(h => h.date === date);
  if (holiday) return { date, working: false, reason: holiday.name };
  if (dow === 0) return { date, working: false, reason: 'Sunday' };
  if (dow === 6 && SECOND_SATURDAY_OFF) {
    const nth = Math.ceil(Number(date.slice(8, 10)) / 7);
    if (nth === 2) return { date, working: false, reason: 'Second Saturday' };
  }
  return { date, working: true };
};

export const dateRange = (from: string, to: string) => {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};

export const workingDays = (from: string, to: string, holidays: Holiday[]) => dateRange(from, to).filter(d => classifyDay(d, holidays).working);

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export interface Mark {
  code: StatusCode;
  reason?: string;
  arrivedAt?: string;
  markedBy: string;
  markedAt: string;
}

export type Register = Record<string, Mark>;
export const markKey = (studentId: string, date: string) => `${studentId}|${date}`;

const hash = (s: string) => {
  let h = 5381;
  for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h;
};

/** Per-student absence and lateness tendency for the generated history (percent chance). */
const PROFILE: Record<string, { absent: number; late: number }> = {
  'ros-13': { absent: 22, late: 4 },
  'ros-14': { absent: 6, late: 30 },
  'ros-10': { absent: 12, late: 6 },
  'ros-02': { absent: 1, late: 1 },
};

const sectionKey = (s: RosterStudent) => `${s.classLevel}-${s.section}`;

/** Deterministic history from 1 Aug to the day before the operating date, plus today's partial marking. */
const buildHistory = (): Register => {
  const reg: Register = {};
  const days = workingDays(REGISTER_FROM, addDays(ATTENDANCE_AS_OF, -1), HOLIDAYS);
  INITIAL_ROSTER.filter(s => ['Active', 'On leave', 'Suspended'].includes(s.status) && !s.mergedInto).forEach(s => {
    const teacher = SECTION_CONFIG.find(c => c.key === sectionKey(s))?.classTeacher ?? 'Class teacher';
    const p = PROFILE[s.id] ?? { absent: 3, late: 5 };
    days.forEach(d => {
      const roll = hash(`${s.id}${d}`) % 100;
      let mark: Mark = { code: 'P', markedBy: teacher, markedAt: '09:05' };
      if (s.id === 'ros-05' && d >= '2024-09-02') mark = { code: 'MD', reason: 'Viral fever — medical certificate on file', markedBy: teacher, markedAt: '09:05' };
      else if (s.id === 'ros-10' && d >= '2024-09-10') mark = { code: 'A', reason: 'Suspended (disciplinary)', markedBy: teacher, markedAt: '09:05' };
      else if (roll < p.absent) mark = { code: 'A', markedBy: teacher, markedAt: '09:05' };
      else if (roll < p.absent + p.late) mark = { code: 'L', arrivedAt: `08:${String(10 + (roll % 40)).padStart(2, '0')}`, markedBy: teacher, markedAt: '09:05' };
      else if (roll === 97) mark = { code: 'HD', reason: 'Left after lunch — parent pickup', markedBy: teacher, markedAt: '09:05' };
      else if (roll === 98) mark = { code: 'EX', reason: 'Inter-school sports meet', markedBy: teacher, markedAt: '09:05' };
      reg[markKey(s.id, d)] = mark;
    });
  });
  // Today: 10-A and 9-A marked before the cut-off, 10-B marked late, 8-A / 8-B / 9-B not yet
  INITIAL_ROSTER.filter(s => ['10-A', '9-A', '10-B'].includes(sectionKey(s)) && s.status !== 'TC issued' && !s.mergedInto).forEach(s => {
    const teacher = SECTION_CONFIG.find(c => c.key === sectionKey(s))!.classTeacher;
    const at = sectionKey(s) === '10-B' ? '09:48' : '09:02';
    reg[markKey(s.id, ATTENDANCE_AS_OF)] =
      s.id === 'ros-05'
        ? { code: 'MD', reason: 'Viral fever — medical certificate on file', markedBy: teacher, markedAt: at }
        : s.id === 'ros-03'
          ? { code: 'A', markedBy: teacher, markedAt: at }
          : { code: 'P', markedBy: teacher, markedAt: at };
  });
  return reg;
};

export const INITIAL_REGISTER: Register = buildHistory();

// ---------------------------------------------------------------------------
// Leave (ATT-011, ATT-012)
// ---------------------------------------------------------------------------

export interface LeaveRequest {
  id: string;
  studentId: string;
  from: string;
  to: string;
  reason: string;
  document?: string;
  appliedOn: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  decidedBy?: string;
}

export const INITIAL_LEAVES: LeaveRequest[] = [
  { id: 'LV-0041', studentId: 'ros-09', from: '2024-09-18', to: '2024-09-20', reason: 'Family wedding in Hyderabad', appliedOn: '2024-09-12', status: 'Approved', decidedBy: 'Ms. Clara D’Souza' },
  { id: 'LV-0042', studentId: 'ros-12', from: '2024-09-17', to: '2024-09-17', reason: 'Dental surgery', document: 'dentist-appointment.pdf', appliedOn: '2024-09-15', status: 'Pending' },
  { id: 'LV-0043', studentId: 'ros-15', from: '2024-09-16', to: '2024-09-16', reason: 'Passport appointment', appliedOn: '2024-09-13', status: 'Approved', decidedBy: 'Coach R. Dinesh' },
];

/** Approved leave covering a date. */
export const plannedAbsence = (leaves: LeaveRequest[], studentId: string, date: string) =>
  leaves.find(l => l.studentId === studentId && l.status === 'Approved' && l.from <= date && l.to >= date);

// ---------------------------------------------------------------------------
// Calculations (ATT-009, ATT-014, ATT-017 – ATT-021)
// ---------------------------------------------------------------------------

export const attendancePct = (register: Register, studentId: string, days: string[], codes: StatusDef[]) => {
  const marked = days.map(d => register[markKey(studentId, d)]).filter(Boolean);
  if (!marked.length) return null;
  const score = marked.reduce((s, m) => s + (codes.find(c => c.code === m.code)?.weight ?? 0), 0);
  return { pct: Math.round((score / marked.length) * 1000) / 10, score, days: marked.length };
};

/**
 * ATT-018: extra full days a student must attend (out of the working days left in the year)
 * to reach the threshold. null means the threshold can no longer be reached.
 */
export const daysNeeded = (score: number, daysSoFar: number, remaining: number, thresholdPct: number) => {
  const need = Math.ceil((thresholdPct / 100) * (daysSoFar + remaining) - score - 1e-9);
  if (need <= 0) return 0;
  return need > remaining ? null : need;
};

/** ATT-019: chronic absence — 3+ consecutive working-day absences, or 4+ absences in the last 30 days. */
export const chronicAbsence = (register: Register, studentId: string, holidays: Holiday[], asOf: string) => {
  const recent = workingDays(addDays(asOf, -30), asOf, holidays);
  const absentCodes: StatusCode[] = ['A'];
  const absences = recent.filter(d => absentCodes.includes(register[markKey(studentId, d)]?.code));
  let run = 0;
  let longest = 0;
  recent.forEach(d => {
    if (absentCodes.includes(register[markKey(studentId, d)]?.code)) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (register[markKey(studentId, d)]) run = 0;
  });
  const reasons: string[] = [];
  if (longest >= 3) reasons.push(`${longest} days absent in a row`);
  if (absences.length >= 4) reasons.push(`${absences.length} absences in the last 30 days`);
  return reasons;
};

/** ATT-009: late arrivals in a month. */
export const lateCount = (register: Register, studentId: string, month: string) =>
  Object.entries(register).filter(([k, m]) => k.startsWith(`${studentId}|${month}`) && m.code === 'L').length;

export const studentsInSection = (students: RosterStudent[], key: string) =>
  students
    .filter(s => `${s.classLevel}-${s.section}` === key && ['Active', 'On leave', 'Suspended'].includes(s.status) && !s.mergedInto)
    .sort((a, b) => a.rollNo - b.rollNo);

/** ATT-014: marking status of a section on a date. */
export const markingStatus = (register: Register, students: RosterStudent[], key: string, date: string) => {
  const list = studentsInSection(students, key);
  const marks = list.map(s => register[markKey(s.id, date)]).filter(Boolean);
  if (!marks.length) return { state: 'Not marked' as const, at: undefined, by: undefined };
  const at = marks.map(m => m.markedAt).sort()[0];
  return { state: at <= MARKING_CUTOFF ? ('On time' as const) : ('Late' as const), at, by: marks[0].markedBy };
};
