import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CLASS_10A_STUDENTS } from '../../data/mockData';
import { FeatureTags, PhaseNotice, downloadCsv } from '../../components/common/FeatureTags';

// ---------------------------------------------------------------------------
// Domain model
// ---------------------------------------------------------------------------

type EntryStage = 'Draft' | 'Submitted' | 'Moderated' | 'Locked';
type RetestPolicy = 'higher' | 'retest' | 'original';
type ResultStatus = 'Pass' | 'Compartment' | 'Fail';

interface ExamDefinition {
  id: string;
  name: string;
  type: 'Unit test' | 'Term' | 'Half-yearly' | 'Annual' | 'Pre-board' | 'Practical' | 'Internal';
  term: string;
  classes: string;
  weightage: number;
  status: 'Scheduled' | 'In progress' | 'Completed';
}

interface ScheduleSlot {
  id: string;
  subject: string;
  date: string;
  start: string;
  durationMin: number;
  room: string;
  invigilator: string;
}

interface MarkRow {
  studentId: string;
  theory: string;
  internal: string;
  retest: string;
}

interface Component {
  name: string;
  max: number;
  enteredBy: string;
}

const EXAM_TYPES: ExamDefinition['type'][] = ['Unit test', 'Term', 'Half-yearly', 'Annual', 'Pre-board', 'Practical', 'Internal'];

const EXAMS: ExamDefinition[] = [
  { id: 'ex-ut1', name: 'Unit Test 1', type: 'Unit test', term: 'Term 1', classes: 'Class 6–10', weightage: 10, status: 'Completed' },
  { id: 'ex-hy', name: 'Half-Yearly Examination', type: 'Half-yearly', term: 'Term 1', classes: 'Class 6–12', weightage: 30, status: 'In progress' },
  { id: 'ex-pb1', name: 'Pre-Board 1', type: 'Pre-board', term: 'Term 2', classes: 'Class 10, 12', weightage: 0, status: 'Scheduled' },
  { id: 'ex-ann', name: 'Annual Examination', type: 'Annual', term: 'Term 2', classes: 'Class 6–12', weightage: 60, status: 'Scheduled' },
];

const SCHEDULE: ScheduleSlot[] = [
  { id: 's1', subject: 'English', date: '2024-09-23', start: '09:30', durationMin: 180, room: 'Hall A', invigilator: 'Ms. Clara D’Souza' },
  { id: 's2', subject: 'Mathematics', date: '2024-09-25', start: '09:30', durationMin: 180, room: 'Hall A', invigilator: 'Mr. S. Balaji' },
  { id: 's3', subject: 'Science', date: '2024-09-27', start: '09:30', durationMin: 180, room: 'Hall B', invigilator: 'Mr. S. Balaji' },
  { id: 's4', subject: 'Social Science', date: '2024-09-27', start: '10:00', durationMin: 180, room: 'Hall A', invigilator: 'Mr. S. Balaji' },
  { id: 's5', subject: 'Hindi', date: '2024-09-30', start: '09:30', durationMin: 180, room: 'Hall A', invigilator: 'Coach R. Dinesh' },
];

const SCIENCE_COMPONENTS: Component[] = [
  { name: 'Theory', max: 80, enteredBy: 'Mrs. Malini Iyer (subject teacher)' },
  { name: 'Internal assessment', max: 20, enteredBy: 'Mr. K. Natarajan (lab in-charge)' },
];
const SCIENCE_MAX = SCIENCE_COMPONENTS.reduce((s, c) => s + c.max, 0);

// CBSE 9-point grading scale (EXM-005)
const GRADE_SCALE = [
  { grade: 'A1', min: 91, points: 10 },
  { grade: 'A2', min: 81, points: 9 },
  { grade: 'B1', min: 71, points: 8 },
  { grade: 'B2', min: 61, points: 7 },
  { grade: 'C1', min: 51, points: 6 },
  { grade: 'C2', min: 41, points: 5 },
  { grade: 'D', min: 33, points: 4 },
  { grade: 'E', min: 0, points: 0 },
];

const CO_SCHOLASTIC = [
  { area: 'Work Education', descriptor: 'A — Outstanding' },
  { area: 'Art Education', descriptor: 'B — Very good' },
  { area: 'Health & Physical Education', descriptor: 'A — Outstanding' },
  { area: 'Discipline', descriptor: 'A — Outstanding' },
];

const PASS_PCT = 33;
const MAX_COMPARTMENT_SUBJECTS = 2;

// Marks already locked for other Class 10-A subjects, out of 100 each
const OTHER_SUBJECTS = ['English', 'Mathematics', 'Social Science', 'Hindi'] as const;
const LOCKED_MARKS: Record<string, number[]> = {
  'stu-01': [92, 95, 88, 90],
  'stu-02': [94, 89, 91, 93],
  'stu-03': [71, 58, 66, 74],
  'stu-04': [85, 92, 79, 81],
  'stu-05': [64, 29, 52, 70],
  'stu-06': [88, 76, 84, 86],
  'stu-07': [69, 81, 73, 65],
  'stu-08': [90, 87, 93, 88],
  'stu-09': [56, 31, 28, 61],
  'stu-10': [95, 98, 90, 94],
};

const INITIAL_MARKS: MarkRow[] = [
  { studentId: 'stu-01', theory: '74', internal: '19', retest: '' },
  { studentId: 'stu-02', theory: '71', internal: '20', retest: '' },
  { studentId: 'stu-03', theory: '48', internal: '15', retest: '' },
  { studentId: 'stu-04', theory: '69', internal: '18', retest: '' },
  { studentId: 'stu-05', theory: 'AB', internal: '14', retest: '41' },
  { studentId: 'stu-06', theory: '63', internal: '17', retest: '' },
  { studentId: 'stu-07', theory: 'EX', internal: 'EX', retest: '' },
  { studentId: 'stu-08', theory: '77', internal: '19', retest: '' },
  { studentId: 'stu-09', theory: '22', internal: '9', retest: '' },
  { studentId: 'stu-10', theory: '', internal: '', retest: '' },
];

// Publication consent from the consent ledger (CNS-009) — required to appear on merit lists
const MERIT_PUBLICATION_CONSENT: Record<string, boolean> = {
  'stu-01': true, 'stu-02': true, 'stu-03': true, 'stu-04': false, 'stu-05': true,
  'stu-06': true, 'stu-07': true, 'stu-08': true, 'stu-09': true, 'stu-10': false,
};

// Science % in earlier assessments, for the term-over-term trend (EXM-025)
const SCIENCE_HISTORY: Record<string, { label: string; pct: number }[]> = {
  'stu-01': [{ label: 'UT1', pct: 88 }, { label: 'UT2', pct: 90 }],
  'stu-02': [{ label: 'UT1', pct: 84 }, { label: 'UT2', pct: 93 }],
  'stu-03': [{ label: 'UT1', pct: 58 }, { label: 'UT2', pct: 61 }],
  'stu-04': [{ label: 'UT1', pct: 80 }, { label: 'UT2', pct: 86 }],
  'stu-05': [{ label: 'UT1', pct: 49 }, { label: 'UT2', pct: 44 }],
  'stu-06': [{ label: 'UT1', pct: 72 }, { label: 'UT2', pct: 78 }],
  'stu-07': [{ label: 'UT1', pct: 70 }, { label: 'UT2', pct: 74 }],
  'stu-08': [{ label: 'UT1', pct: 91 }, { label: 'UT2', pct: 94 }],
  'stu-09': [{ label: 'UT1', pct: 40 }, { label: 'UT2', pct: 35 }],
  'stu-10': [{ label: 'UT1', pct: 96 }, { label: 'UT2', pct: 97 }],
};

// ---------------------------------------------------------------------------
// Pure computation (EXM-007, EXM-011, EXM-012, EXM-015 – EXM-018)
// ---------------------------------------------------------------------------

type ParsedMark = { kind: 'score'; value: number } | { kind: 'AB' } | { kind: 'EX' } | { kind: 'empty' };

export const parseMark = (raw: string): ParsedMark | { kind: 'invalid' } => {
  const v = raw.trim().toUpperCase();
  if (v === '') return { kind: 'empty' };
  if (v === 'AB') return { kind: 'AB' };
  if (v === 'EX') return { kind: 'EX' };
  if (!/^\d+(\.5)?$/.test(v)) return { kind: 'invalid' };
  return { kind: 'score', value: Number(v) };
};

export const validateMark = (raw: string, max: number): string | null => {
  const p = parseMark(raw);
  if (p.kind === 'invalid') return 'Use a number, AB (absent) or EX (exempt)';
  if (p.kind === 'score' && p.value > max) return `Exceeds maximum of ${max}`;
  return null;
};

export const gradeFor = (pct: number) => GRADE_SCALE.find(g => pct >= g.min)!.grade;

interface ScienceScore {
  status: 'scored' | 'absent' | 'exempt' | 'incomplete';
  marks: number;
  usedRetest: boolean;
}

export const scienceScore = (row: MarkRow, policy: RetestPolicy): ScienceScore => {
  const theory = parseMark(row.theory);
  const internal = parseMark(row.internal);
  const retest = parseMark(row.retest);
  if (theory.kind === 'EX' && internal.kind === 'EX') return { status: 'exempt', marks: 0, usedRetest: false };
  if (theory.kind === 'empty' || internal.kind === 'empty' || theory.kind === 'invalid' || internal.kind === 'invalid') {
    return { status: 'incomplete', marks: 0, usedRetest: false };
  }
  const internalMarks = internal.kind === 'score' ? internal.value : 0;
  const originalTheory = theory.kind === 'score' ? theory.value : null;
  const retestTheory = retest.kind === 'score' ? retest.value : null;

  let theoryMarks = originalTheory;
  let usedRetest = false;
  if (retestTheory !== null && policy !== 'original') {
    if (policy === 'retest' || originalTheory === null || retestTheory > originalTheory) {
      theoryMarks = retestTheory;
      usedRetest = true;
    }
  }
  if (theoryMarks === null) return { status: 'absent', marks: internalMarks, usedRetest: false };
  return { status: 'scored', marks: theoryMarks + internalMarks, usedRetest };
};

interface StudentResult {
  studentId: string;
  name: string;
  rollNo: string;
  total: number;
  max: number;
  pct: number;
  grade: string;
  failedSubjects: string[];
  status: ResultStatus;
  rank: number | null;
  incomplete: boolean;
  usedRetest: boolean;
}

export const computeResults = (marks: MarkRow[], policy: RetestPolicy): StudentResult[] => {
  const base = CLASS_10A_STUDENTS.map(s => {
    const row = marks.find(m => m.studentId === s.studentId)!;
    const sci = scienceScore(row, policy);
    const subjectScores: { subject: string; marks: number; max: number }[] = OTHER_SUBJECTS.map((subject, i) => ({
      subject,
      marks: LOCKED_MARKS[s.studentId][i],
      max: 100,
    }));
    if (sci.status !== 'exempt') subjectScores.push({ subject: 'Science', marks: sci.marks, max: SCIENCE_MAX });

    const total = subjectScores.reduce((sum, x) => sum + x.marks, 0);
    const max = subjectScores.reduce((sum, x) => sum + x.max, 0);
    const pct = Math.round((total / max) * 1000) / 10;
    const failedSubjects = subjectScores.filter(x => (x.marks / x.max) * 100 < PASS_PCT).map(x => x.subject);
    const status: ResultStatus =
      failedSubjects.length === 0 && pct >= PASS_PCT ? 'Pass' : failedSubjects.length <= MAX_COMPARTMENT_SUBJECTS && pct >= PASS_PCT ? 'Compartment' : 'Fail';

    return {
      studentId: s.studentId,
      name: s.name,
      rollNo: s.rollNo,
      total,
      max,
      pct,
      grade: gradeFor(pct),
      failedSubjects,
      status,
      rank: null as number | null,
      incomplete: sci.status === 'incomplete',
      usedRetest: sci.usedRetest,
    };
  });

  // Standard competition ranking over complete results: equal % share a rank, next rank skips (EXM-018)
  const ranked = base.filter(r => !r.incomplete).sort((a, b) => b.pct - a.pct || a.rollNo.localeCompare(b.rollNo));
  ranked.forEach((r, i) => {
    r.rank = i > 0 && ranked[i - 1].pct === r.pct ? ranked[i - 1].rank : i + 1;
  });
  return base;
};

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

type Tab = 'exams' | 'structure' | 'entry' | 'results' | 'analytics';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'exams', label: 'Exams & Schedule', icon: 'event_note', ids: ['EXM-001', 'EXM-002', 'EXM-003', 'EXM-021', 'EXM-022'] },
  { id: 'structure', label: 'Structure & Rules', icon: 'rule', ids: ['EXM-004', 'EXM-005', 'EXM-012', 'EXM-014', 'EXM-015', 'EXM-017'] },
  { id: 'entry', label: 'Marks Entry', icon: 'edit_square', ids: ['EXM-006', 'EXM-007', 'EXM-008', 'EXM-010', 'EXM-011', 'EXM-013'] },
  { id: 'results', label: 'Results & Publish', icon: 'workspace_premium', ids: ['EXM-016', 'EXM-017', 'EXM-018', 'EXM-019', 'EXM-020'] },
  { id: 'analytics', label: 'Analytics', icon: 'insights', ids: ['EXM-024', 'EXM-025', 'EXM-026'] },
];

const STAGES: EntryStage[] = ['Draft', 'Submitted', 'Moderated', 'Locked'];

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const ExaminationsView: React.FC = () => {
  const { addToast } = useApp();
  const [tab, setTab] = useState<Tab>('entry');
  const [marks, setMarks] = useState<MarkRow[]>(INITIAL_MARKS);
  const [stage, setStage] = useState<EntryStage>('Draft');
  const [unlockRequested, setUnlockRequested] = useState(false);
  const [policy, setPolicy] = useState<RetestPolicy>('higher');
  const [suppressRank, setSuppressRank] = useState(false);
  const [withheld, setWithheld] = useState<Record<string, string>>({});
  const [withholdTarget, setWithholdTarget] = useState<string | null>(null);
  const [withholdReason, setWithholdReason] = useState('Fee dues pending');
  const [approved, setApproved] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [importText, setImportText] = useState('roll,theory,internal\n10,79,20\n03,85,18\n11,60,15\n09,abc,10');
  const [importReport, setImportReport] = useState<{ line: number; message: string; ok: boolean }[] | null>(null);
  const [hallTicketsIssued, setHallTicketsIssued] = useState(false);
  const [trendStudent, setTrendStudent] = useState('stu-01');

  const locked = stage === 'Locked';
  const editable = stage === 'Draft';
  const nameOf = (id: string) => CLASS_10A_STUDENTS.find(s => s.studentId === id)?.name ?? id;

  const results = useMemo(() => computeResults(marks, policy), [marks, policy]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    marks.forEach(m => {
      const t = validateMark(m.theory, SCIENCE_COMPONENTS[0].max);
      const i = validateMark(m.internal, SCIENCE_COMPONENTS[1].max);
      const r = m.retest ? validateMark(m.retest, SCIENCE_COMPONENTS[0].max) : null;
      if (t) e[`${m.studentId}-theory`] = t;
      if (i) e[`${m.studentId}-internal`] = i;
      if (r) e[`${m.studentId}-retest`] = r;
    });
    return e;
  }, [marks]);

  const incompleteCount = results.filter(r => r.incomplete).length;
  const errorCount = Object.keys(errors).length;

  const clashes = useMemo(() => {
    const found: string[] = [];
    SCHEDULE.forEach((a, i) =>
      SCHEDULE.slice(i + 1).forEach(b => {
        if (a.date !== b.date) return;
        const overlap = toMinutes(a.start) < toMinutes(b.start) + b.durationMin && toMinutes(b.start) < toMinutes(a.start) + a.durationMin;
        if (!overlap) return;
        if (a.invigilator === b.invigilator) found.push(`${a.invigilator} is assigned to ${a.subject} and ${b.subject} on ${a.date}`);
        if (a.room === b.room) found.push(`${a.room} is double-booked for ${a.subject} and ${b.subject} on ${a.date}`);
      })
    );
    return found;
  }, []);

  const updateMark = (studentId: string, field: 'theory' | 'internal' | 'retest', value: string) => {
    if (!editable) return;
    setMarks(prev => prev.map(m => (m.studentId === studentId ? { ...m, [field]: value } : m)));
  };

  const advanceStage = () => {
    if (stage === 'Draft') {
      if (errorCount > 0 || incompleteCount > 0) {
        addToast('Cannot submit marks', 'error', `${errorCount} invalid and ${incompleteCount} incomplete entries — EXM-007`);
        return;
      }
      setStage('Submitted');
      addToast('Marks submitted for HOD moderation', 'success');
    } else if (stage === 'Submitted') {
      setStage('Moderated');
      addToast('HOD moderation complete', 'success');
    } else if (stage === 'Moderated') {
      setStage('Locked');
      addToast('Marks locked — further edits need approval', 'info');
    }
  };

  const approveUnlock = () => {
    setStage('Draft');
    setUnlockRequested(false);
    setApproved(false);
    setPublishedAt(null);
    addToast('Post-lock edit approved; marks reopened and result approval reset', 'warning');
  };

  const runImport = () => {
    const lines = importText.trim().split('\n');
    const report: { line: number; message: string; ok: boolean }[] = [];
    const updates: Record<string, { theory: string; internal: string }> = {};
    lines.slice(1).forEach((line, idx) => {
      const lineNo = idx + 2;
      const [roll, theory = '', internal = ''] = line.split(',').map(c => c.trim());
      const student = CLASS_10A_STUDENTS.find(s => s.rollNo === roll.padStart(2, '0'));
      if (!student) return report.push({ line: lineNo, message: `Roll ${roll} not found in Class 10-A`, ok: false });
      const tErr = validateMark(theory, SCIENCE_COMPONENTS[0].max);
      const iErr = validateMark(internal, SCIENCE_COMPONENTS[1].max);
      if (tErr || iErr) return report.push({ line: lineNo, message: `${student.name}: ${tErr ?? iErr}`, ok: false });
      updates[student.studentId] = { theory, internal };
      report.push({ line: lineNo, message: `${student.name}: theory ${theory}, internal ${internal}`, ok: true });
    });
    setImportReport(report);
    const okCount = Object.keys(updates).length;
    if (okCount && editable) {
      setMarks(prev => prev.map(m => (updates[m.studentId] ? { ...m, ...updates[m.studentId] } : m)));
    }
    addToast(`Import: ${okCount} rows applied, ${report.length - okCount} rejected`, okCount ? 'success' : 'warning');
  };

  const confirmWithhold = () => {
    if (!withholdTarget || !withholdReason.trim()) return;
    setWithheld(prev => ({ ...prev, [withholdTarget]: withholdReason.trim() }));
    addToast(`Result withheld for ${nameOf(withholdTarget)}`, 'warning', withholdReason.trim());
    setWithholdTarget(null);
  };

  const releaseWithheld = (id: string) => {
    setWithheld(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    addToast(`Withhold released for ${nameOf(id)}`, 'info');
  };

  const publish = () => {
    const stamp = new Date().toLocaleString('en-IN');
    setPublishedAt(stamp);
    const count = results.length - Object.keys(withheld).length;
    addToast(`Results published to ${count} parents`, 'success', `${Object.keys(withheld).length} withheld`);
  };

  const exportResults = () => {
    downloadCsv(
      `Class10A_HalfYearly_Results_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Roll', 'Student', 'Total', 'Max', 'Percent', 'Grade', 'Status', 'Rank', 'Withheld'],
      results.map(r => [r.rollNo, r.name, r.total, r.max, r.pct, r.grade, r.status, suppressRank ? '' : r.rank ?? '', withheld[r.studentId] ?? ''])
    );
    addToast(`Exported ${results.length} result rows`, 'success', 'Export event logged — AUD-003');
  };

  // Analytics (EXM-024): absent and exempt are excluded from the subject average (EXM-011)
  const analytics = useMemo(() => {
    const scored = marks.map(m => scienceScore(m, policy)).filter(s => s.status === 'scored');
    const avg = scored.length ? Math.round((scored.reduce((s, x) => s + x.marks, 0) / scored.length) * 10) / 10 : 0;
    const complete = results.filter(r => !r.incomplete);
    const passPct = complete.length ? Math.round((complete.filter(r => r.status === 'Pass').length / complete.length) * 100) : 0;
    const distribution = GRADE_SCALE.map(g => ({ grade: g.grade, count: complete.filter(r => r.grade === g.grade).length }));
    const subjectAverages = OTHER_SUBJECTS.map((subject, i) => ({
      subject,
      avg: Math.round((CLASS_10A_STUDENTS.reduce((s, st) => s + LOCKED_MARKS[st.studentId][i], 0) / CLASS_10A_STUDENTS.length) * 10) / 10,
    }));
    subjectAverages.push({ subject: 'Science', avg: Math.round((avg / SCIENCE_MAX) * 1000) / 10 });
    const toppers = complete
      .filter(r => MERIT_PUBLICATION_CONSENT[r.studentId] && !withheld[r.studentId])
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .slice(0, 3);
    const hiddenForConsent = complete.filter(r => !MERIT_PUBLICATION_CONSENT[r.studentId]).length;
    return { scoredCount: scored.length, avg, passPct, distribution, subjectAverages, toppers, hiddenForConsent };
  }, [marks, policy, results, withheld]);

  const trend = useMemo(() => {
    const row = marks.find(m => m.studentId === trendStudent)!;
    const sci = scienceScore(row, policy);
    const current = sci.status === 'scored' ? Math.round((sci.marks / SCIENCE_MAX) * 100) : null;
    return [...SCIENCE_HISTORY[trendStudent], { label: 'Half-yearly', pct: current }];
  }, [marks, policy, trendStudent]);

  const maxDistribution = Math.max(1, ...analytics.distribution.map(d => d.count));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">quiz</span>
            <span>Module 16 · Examination & Assessment (EXM)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">Half-Yearly Examination · Class 10-A</h1>
          <p className="text-xs text-[#464555] mt-1">AY 2024–25 · CBSE · Science marks stage: {stage}</p>
        </div>
        <div className="flex items-center gap-1">
          {STAGES.map((s, i) => (
            <React.Fragment key={s}>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  STAGES.indexOf(stage) >= i ? 'bg-[#0e5d84] text-white' : 'bg-slate-100 text-[#777587]'
                }`}
              >
                {s}
              </span>
              {i < STAGES.length - 1 && <span className="w-3 h-px bg-[#cbe0ec]" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#e0ecf4]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-[#0e5d84] text-[#0e5d84]' : 'border-transparent text-[#777587] hover:text-[#082b3d]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <FeatureTags ids={TABS.find(t => t.id === tab)!.ids} />

      {tab === 'exams' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap gap-1 items-center justify-between">
              <span className="text-xs font-bold text-[#082b3d]">Exam definitions · AY 2024–25</span>
              <div className="flex flex-wrap gap-1">
                {EXAM_TYPES.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#cbe0ec] text-[#464555]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[#464555]">
                  <tr>
                    {['Exam', 'Type', 'Term', 'Classes', 'Weightage', 'Status'].map(h => (
                      <th key={h} className="text-left p-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f7fb]">
                  {EXAMS.map(e => (
                    <tr key={e.id}>
                      <td className="p-3 font-semibold text-[#082b3d]">{e.name}</td>
                      <td className="p-3">{e.type}</td>
                      <td className="p-3">{e.term}</td>
                      <td className="p-3">{e.classes}</td>
                      <td className="p-3">{e.weightage}%</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            e.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : e.status === 'In progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#082b3d]">Half-yearly schedule · Class 10</span>
              <button
                onClick={() => {
                  setHallTicketsIssued(true);
                  addToast(`Hall tickets generated for ${CLASS_10A_STUDENTS.length} students`, 'success');
                }}
                disabled={hallTicketsIssued}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0e5d84] text-white hover:bg-[#083a4f] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                {hallTicketsIssued ? 'Hall tickets issued' : 'Generate hall tickets'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[#464555]">
                  <tr>
                    {['Subject', 'Date', 'Start', 'Duration', 'Room', 'Invigilator'].map(h => (
                      <th key={h} className="text-left p-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f7fb]">
                  {SCHEDULE.map(s => (
                    <tr key={s.id}>
                      <td className="p-3 font-semibold text-[#082b3d]">{s.subject}</td>
                      <td className="p-3 font-mono">{s.date}</td>
                      <td className="p-3 font-mono">{s.start}</td>
                      <td className="p-3">{s.durationMin / 60} h</td>
                      <td className="p-3">{s.room}</td>
                      <td className="p-3">{s.invigilator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {clashes.length > 0 && (
              <div className="p-3 border-t border-rose-200 bg-rose-50 space-y-1">
                {clashes.map(c => (
                  <p key={c} className="text-[11px] text-rose-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Clash: {c}
                  </p>
                ))}
              </div>
            )}
          </div>
          <PhaseNotice ids={['EXM-023', 'EXM-027']} phase="Phase 3" note="Answer-script bundle tracking and parent re-evaluation requests arrive with the operations release." />
        </div>
      )}

      {tab === 'structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
            <p className="text-xs font-bold text-[#082b3d]">Assessment structure · Science</p>
            {SCIENCE_COMPONENTS.map(c => (
              <div key={c.name} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50">
                <div>
                  <p className="font-semibold text-[#082b3d]">{c.name}</p>
                  <p className="text-[10px] text-[#777587]">Entered by {c.enteredBy}</p>
                </div>
                <span className="font-mono font-bold">{c.max}</span>
              </div>
            ))}
            <p className="text-[11px] text-right text-[#464555]">Subject maximum: {SCIENCE_MAX}</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
            <p className="text-xs font-bold text-[#082b3d]">Grading scale · CBSE 9-point (Class 9–10)</p>
            <div className="grid grid-cols-4 gap-2">
              {GRADE_SCALE.map((g, i) => (
                <div key={g.grade} className="text-center p-2 rounded-lg border border-[#e0ecf4]">
                  <p className="font-bold text-[#0e5d84]">{g.grade}</p>
                  <p className="text-[10px] text-[#777587]">
                    {g.min}–{i === 0 ? 100 : GRADE_SCALE[i - 1].min - 1}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
            <p className="text-xs font-bold text-[#082b3d]">Board computation & promotion rules</p>
            <ul className="text-[11px] text-[#464555] space-y-1 list-disc pl-4">
              <li>Pass mark: {PASS_PCT}% in every subject and {PASS_PCT}% overall</li>
              <li>Failing 1–{MAX_COMPARTMENT_SUBJECTS} subjects with {PASS_PCT}% overall → Compartment (supplementary exam)</li>
              <li>Failing more than {MAX_COMPARTMENT_SUBJECTS} subjects → Fail</li>
              <li>Exempt (EX) subjects are removed from the total and maximum</li>
              <li>Absent (AB) scores zero for the student and is excluded from the class average</li>
            </ul>
            <label className="block text-[11px] font-semibold text-[#082b3d]">Re-test policy</label>
            <select value={policy} onChange={e => setPolicy(e.target.value as RetestPolicy)} className="w-full text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5">
              <option value="higher">Higher of original and re-test counts</option>
              <option value="retest">Re-test always replaces original</option>
              <option value="original">Original always counts</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-2">
            <p className="text-xs font-bold text-[#082b3d]">Co-scholastic descriptors · Aarav S. Ramanathan</p>
            {CO_SCHOLASTIC.map(c => (
              <div key={c.area} className="flex justify-between text-xs p-2 rounded-lg bg-slate-50">
                <span className="text-[#082b3d]">{c.area}</span>
                <span className="font-semibold text-[#0e5d84]">{c.descriptor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'entry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#082b3d]">Science · Theory /80 · Internal /20 · Re-test /80</p>
                <p className="text-[10px] text-[#777587]">Type a number, AB for absent or EX for exempt · {errorCount} invalid · {incompleteCount} incomplete</p>
              </div>
              <div className="flex gap-2">
                {locked && !unlockRequested && (
                  <button onClick={() => { setUnlockRequested(true); addToast('Post-lock edit request sent to Principal', 'info'); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">
                    Request edit
                  </button>
                )}
                {locked && unlockRequested && (
                  <button onClick={approveUnlock} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600">
                    Approve edit (Principal)
                  </button>
                )}
                {!locked && (
                  <button onClick={advanceStage} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0e5d84] text-white hover:bg-[#083a4f]">
                    {stage === 'Draft' ? 'Submit for moderation' : stage === 'Submitted' ? 'Complete moderation (HOD)' : 'Lock marks'}
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[#464555]">
                  <tr>
                    <th className="text-left p-3 font-semibold">Roll</th>
                    <th className="text-left p-3 font-semibold">Student</th>
                    <th className="p-3 font-semibold">Theory</th>
                    <th className="p-3 font-semibold">Internal</th>
                    <th className="p-3 font-semibold">Re-test</th>
                    <th className="p-3 font-semibold text-right">Total /{SCIENCE_MAX}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f7fb]">
                  {marks.map(m => {
                    const sci = scienceScore(m, policy);
                    const student = CLASS_10A_STUDENTS.find(s => s.studentId === m.studentId)!;
                    return (
                      <tr key={m.studentId}>
                        <td className="p-3 font-mono">{student.rollNo}</td>
                        <td className="p-3 font-medium text-[#082b3d]">{student.name}</td>
                        {(['theory', 'internal', 'retest'] as const).map(field => {
                          const err = errors[`${m.studentId}-${field}`];
                          return (
                            <td key={field} className="p-1.5 text-center">
                              <input
                                value={m[field]}
                                onChange={e => updateMark(m.studentId, field, e.target.value)}
                                disabled={!editable}
                                title={err}
                                aria-label={`${student.name} ${field}`}
                                aria-invalid={Boolean(err)}
                                className={`w-16 text-center font-mono px-1 py-1 rounded-md border outline-none focus:ring-2 focus:ring-[#0e5d84]/30 disabled:bg-slate-50 disabled:text-[#777587] ${
                                  err ? 'border-rose-400 bg-rose-50' : 'border-[#cbe0ec]'
                                }`}
                              />
                            </td>
                          );
                        })}
                        <td className="p-3 text-right font-mono font-bold">
                          {sci.status === 'scored' && (
                            <>
                              {sci.marks}
                              {sci.usedRetest && <span className="ml-1 text-[9px] text-amber-700">RT</span>}
                            </>
                          )}
                          {sci.status === 'absent' && <span className="text-rose-600">AB</span>}
                          {sci.status === 'exempt' && <span className="text-[#777587]">EX</span>}
                          {sci.status === 'incomplete' && <span className="text-[#777587]">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
            <p className="text-xs font-bold text-[#082b3d]">Bulk marks import · paste CSV (roll, theory, internal)</p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              rows={5}
              className="w-full font-mono text-xs border border-[#cbe0ec] rounded-lg p-2"
            />
            <button
              onClick={runImport}
              disabled={!editable}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0e5d84] text-white hover:bg-[#083a4f] disabled:opacity-50"
            >
              Validate & apply
            </button>
            {!editable && <p className="text-[11px] text-[#777587]">Import is available only while marks are in Draft.</p>}
            {importReport && (
              <ul className="text-[11px] space-y-1">
                {importReport.map(r => (
                  <li key={r.line} className={r.ok ? 'text-emerald-700' : 'text-rose-700'}>
                    Line {r.line}: {r.ok ? '✓' : '✕'} {r.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <PhaseNotice ids={['EXM-009']} phase="Phase 3" note="Offline marks entry with conflict surfacing ships with the offline-first teacher app." />
        </div>
      )}

      {tab === 'results' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-[#082b3d]">
              <input type="checkbox" checked={suppressRank} onChange={e => setSuppressRank(e.target.checked)} className="accent-[#0e5d84]" />
              Suppress rank on published result
            </label>
            <div className="flex-1" />
            <button onClick={exportResults} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">
              Export CSV
            </button>
            <button
              onClick={() => {
                setApproved(true);
                addToast('Results approved by Principal', 'success');
              }}
              disabled={!locked || approved || incompleteCount > 0}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {approved ? 'Approved' : 'Principal approval'}
            </button>
            <button
              onClick={publish}
              disabled={!approved || Boolean(publishedAt)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0e5d84] text-white hover:bg-[#083a4f] disabled:opacity-50"
            >
              {publishedAt ? 'Published' : 'Publish to parents'}
            </button>
          </div>
          {!locked && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              Approval is blocked until Science marks are locked (current stage: {stage}).
            </p>
          )}
          {publishedAt && <p className="text-[11px] text-emerald-700">Published {publishedAt}</p>}

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[#464555]">
                <tr>
                  {['Roll', 'Student', 'Total', '%', 'Grade', 'Result', 'Rank', ''].map(h => (
                    <th key={h} className="text-left p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f7fb]">
                {results.map(r => (
                  <tr key={r.studentId} className={withheld[r.studentId] ? 'bg-slate-50' : ''}>
                    <td className="p-3 font-mono">{r.rollNo}</td>
                    <td className="p-3">
                      <p className="font-medium text-[#082b3d]">{r.name}</p>
                      {r.failedSubjects.length > 0 && <p className="text-[10px] text-rose-600">Below pass: {r.failedSubjects.join(', ')}</p>}
                      {withheld[r.studentId] && <p className="text-[10px] text-amber-700">Withheld: {withheld[r.studentId]}</p>}
                    </td>
                    <td className="p-3 font-mono">{r.incomplete ? '—' : `${r.total}/${r.max}`}</td>
                    <td className="p-3 font-mono">{r.incomplete ? '—' : r.pct}</td>
                    <td className="p-3 font-bold text-[#0e5d84]">{r.incomplete ? '—' : r.grade}</td>
                    <td className="p-3">
                      {r.incomplete ? (
                        <span className="text-[#777587]">Pending marks</span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'Pass' ? 'bg-emerald-50 text-emerald-700' : r.status === 'Compartment' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">{suppressRank ? '—' : r.rank ?? '—'}</td>
                    <td className="p-3 text-right">
                      {withheld[r.studentId] ? (
                        <button onClick={() => releaseWithheld(r.studentId)} className="text-[11px] font-semibold text-[#0e5d84] hover:underline">
                          Release
                        </button>
                      ) : (
                        <button onClick={() => setWithholdTarget(r.studentId)} className="text-[11px] font-semibold text-amber-700 hover:underline">
                          Withhold
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
            <p className="text-xs font-bold text-[#082b3d]">Class 10-A summary</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-50">
                <p className="text-lg font-bold text-[#082b3d]">{analytics.passPct}%</p>
                <p className="text-[10px] text-[#777587]">Pass rate</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <p className="text-lg font-bold text-[#082b3d]">{analytics.avg}</p>
                <p className="text-[10px] text-[#777587]">Science avg /{SCIENCE_MAX}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <p className="text-lg font-bold text-[#082b3d]">{analytics.scoredCount}</p>
                <p className="text-[10px] text-[#777587]">Science scripts counted</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#082b3d] pt-2">Subject averages (%)</p>
            {analytics.subjectAverages.map(s => (
              <div key={s.subject}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span>{s.subject}</span>
                  <span className="font-mono">{s.avg}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0e5d84]" style={{ width: `${s.avg}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
            <p className="text-xs font-bold text-[#082b3d]">Grade distribution</p>
            <div className="flex items-end gap-2 h-36">
              {analytics.distribution.map(d => (
                <div key={d.grade} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-mono mb-0.5">{d.count}</span>
                  <div className="w-full bg-[#0e5d84] rounded-t" style={{ height: `${(d.count / maxDistribution) * 100}%` }} />
                  <span className="text-[10px] font-bold mt-1">{d.grade}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#082b3d]">Science trend</p>
              <select value={trendStudent} onChange={e => setTrendStudent(e.target.value)} className="text-xs border border-[#cbe0ec] rounded-lg px-2 py-1">
                {CLASS_10A_STUDENTS.map(s => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-4 h-32">
              {trend.map(t => (
                <div key={t.label} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-mono mb-0.5">{t.pct === null ? 'n/a' : `${t.pct}%`}</span>
                  <div className="w-full bg-amber-400 rounded-t" style={{ height: `${t.pct ?? 0}%` }} />
                  <span className="text-[10px] mt-1">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-2">
            <p className="text-xs font-bold text-[#082b3d]">Merit list (top 3)</p>
            {analytics.toppers.map(t => (
              <div key={t.studentId} className="flex justify-between text-xs p-2 rounded-lg bg-slate-50">
                <span>
                  #{t.rank} {t.name}
                </span>
                <span className="font-mono font-bold">{t.pct}%</span>
              </div>
            ))}
            <p className="text-[10px] text-[#777587]">
              {analytics.hiddenForConsent} student(s) left out because guardians have not consented to publication. Withheld results are also left out.
            </p>
          </div>
        </div>
      )}

      {withholdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setWithholdTarget(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-[#082b3d]">Withhold result · {nameOf(withholdTarget)}</h3>
            <label className="block text-[11px] font-semibold text-[#464555]">Reason (required)</label>
            <select value={withholdReason} onChange={e => setWithholdReason(e.target.value)} className="w-full text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5">
              <option>Fee dues pending</option>
              <option>Disciplinary review</option>
              <option>Document verification pending</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setWithholdTarget(null)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100">
                Cancel
              </button>
              <button onClick={confirmWithhold} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white">
                Withhold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
