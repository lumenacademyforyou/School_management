// Unit-test paper requests: a teacher asks the exam coordinator for a paper, the coordinator prepares it
// (question bank, AI generation or both), sends it back for the teacher's approval, and the teacher
// conducts the test once they have approved it. Pure rules; paperRequestService keeps the state.
import {
  BankQuestion,
  BlueprintSection,
  QPG_TODAY,
  QuestionPaper,
  UNIT_TEST_PATTERN,
  paperCounts,
  questionText,
} from './questionPapers';

export type RequestStatus = 'Requested' | 'In preparation' | 'Awaiting teacher approval' | 'Changes requested' | 'Approved' | 'Conducted' | 'Declined';

/** Words a teacher sees for each status (plain language, no workflow jargon). */
export const STATUS_TEXT: Record<RequestStatus, string> = {
  Requested: 'Sent to the exam coordinator',
  'In preparation': 'The exam coordinator is preparing the paper',
  'Awaiting teacher approval': 'Ready for you to check',
  'Changes requested': 'You asked for changes',
  Approved: 'Approved — ready for the test',
  Conducted: 'Test conducted',
  Declined: 'The exam coordinator could not prepare this paper',
};

export interface RequestEvent {
  at: string;
  by: string;
  action: 'Requested' | 'Started preparing' | 'Sent for approval' | 'Asked for changes' | 'Approved' | 'Marked as conducted' | 'Declined';
  comment?: string;
}

/** A frozen copy of the paper as sent to the teacher, so the teacher app can show it without the question bank. */
export interface PaperSnapshot {
  paperId: string;
  title: string;
  totalMarks: number;
  durationMinutes: number;
  instructions: string[];
  sections: { title: string; questions: { number: number; text: string; marks: number; options?: string[]; answer: string }[] }[];
  sentOn: string;
  sentBy: string;
}

export interface PaperRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  /** e.g. 10-A */
  section: string;
  classLevel: number;
  subject: string;
  testName: string;
  chapters: string;
  maxMarks: 25 | 50;
  durationMinutes: number;
  testDate: string;
  notes: string;
  requestedOn: string;
  status: RequestStatus;
  paperId?: string;
  paper?: PaperSnapshot;
  conductedOn?: string;
  history: RequestEvent[];
}

export type NewRequest = Pick<PaperRequest, 'section' | 'subject' | 'testName' | 'chapters' | 'maxMarks' | 'durationMinutes' | 'testDate' | 'notes'>;

export const MARK_OPTIONS = [25, 50] as const;
export const DURATION_OPTIONS = [40, 60, 90] as const;
/** The coordinator needs a few school days to prepare and send the paper back. */
export const MIN_NOTICE_DAYS = 3;

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const earliestTestDate = (today: string) => addDays(today, MIN_NOTICE_DAYS);

/** What is wrong with a new request, in words for the teacher. Empty when it can be sent. */
export const requestProblems = (r: NewRequest, today: string): Partial<Record<keyof NewRequest, string>> => {
  const p: Partial<Record<keyof NewRequest, string>> = {};
  if (!r.section || !r.subject) p.section = 'Choose the class and subject.';
  if (!r.testName.trim()) p.testName = 'Give the test a name, for example “Unit Test 3”.';
  if (r.chapters.trim().length < 3) p.chapters = 'Write which chapters or lessons the test should cover.';
  if (!r.testDate) p.testDate = 'Choose the date of the test.';
  else if (r.testDate < earliestTestDate(today)) p.testDate = `The exam coordinator needs at least ${MIN_NOTICE_DAYS} days. Choose ${earliestTestDate(today)} or later.`;
  return p;
};

export const classOf = (section: string) => Number(section.split('-')[0]);

export const createRequest = (id: string, r: NewRequest, teacher: { id: string; name: string }, today: string): PaperRequest => ({
  id,
  teacherId: teacher.id,
  teacherName: teacher.name,
  section: r.section,
  classLevel: classOf(r.section),
  subject: r.subject,
  testName: r.testName.trim(),
  chapters: r.chapters.trim(),
  maxMarks: r.maxMarks,
  durationMinutes: r.durationMinutes,
  testDate: r.testDate,
  notes: r.notes.trim(),
  requestedOn: today,
  status: 'Requested',
  history: [{ at: today, by: teacher.name, action: 'Requested' }],
});

type Result = PaperRequest | { error: string };
const event = (r: PaperRequest, e: RequestEvent, patch: Partial<PaperRequest>): PaperRequest => ({ ...r, ...patch, history: [...r.history, e] });

/** Coordinator starts (or restarts) the paper for a request. */
export const startPreparing = (r: PaperRequest, paperId: string, by: string, at: string): Result =>
  r.status === 'Requested' || r.status === 'In preparation' || r.status === 'Changes requested'
    ? event(r, { at, by, action: 'Started preparing' }, { status: r.status === 'Changes requested' ? 'Changes requested' : 'In preparation', paperId })
    : { error: `This request is ${r.status.toLowerCase()} and cannot be started again.` };

/** Coordinator sends the finished paper to the teacher. */
export const sendForApproval = (r: PaperRequest, paper: PaperSnapshot, by: string, at: string): Result => {
  if (r.status !== 'In preparation' && r.status !== 'Changes requested') return { error: 'Only a paper that is being prepared can be sent to the teacher.' };
  if (paper.totalMarks !== r.maxMarks) return { error: `The paper has ${paper.totalMarks} marks but the teacher asked for ${r.maxMarks}.` };
  return event(r, { at, by, action: 'Sent for approval' }, { status: 'Awaiting teacher approval', paper, paperId: paper.paperId });
};

/** Teacher approves the paper they asked for. Only the requesting teacher can approve. */
export const teacherApprove = (r: PaperRequest, teacherId: string, at: string): Result => {
  if (teacherId !== r.teacherId) return { error: 'Only the teacher who asked for this paper can approve it.' };
  if (r.status !== 'Awaiting teacher approval') return { error: 'There is no paper waiting for your approval.' };
  return event(r, { at, by: r.teacherName, action: 'Approved' }, { status: 'Approved' });
};

/** Teacher sends the paper back with what to change. */
export const teacherRequestChanges = (r: PaperRequest, teacherId: string, comment: string, at: string): Result => {
  if (teacherId !== r.teacherId) return { error: 'Only the teacher who asked for this paper can send it back.' };
  if (r.status !== 'Awaiting teacher approval') return { error: 'There is no paper waiting for your approval.' };
  if (comment.trim().length < 5) return { error: 'Write what should change so the exam coordinator can fix it.' };
  return event(r, { at, by: r.teacherName, action: 'Asked for changes', comment: comment.trim() }, { status: 'Changes requested' });
};

/** Teacher records that the test has been held (on or after the test date, once approved). */
export const markConducted = (r: PaperRequest, teacherId: string, today: string): Result => {
  if (teacherId !== r.teacherId) return { error: 'Only the teacher who asked for this paper can mark the test as conducted.' };
  if (r.status !== 'Approved') return { error: 'Approve the paper before the test.' };
  if (today < r.testDate) return { error: `The test is on ${r.testDate}. You can mark it as conducted on that day or later.` };
  return event(r, { at: today, by: r.teacherName, action: 'Marked as conducted' }, { status: 'Conducted', conductedOn: today });
};

/** Coordinator declines a request, with the reason. */
export const declineRequest = (r: PaperRequest, by: string, reason: string, at: string): Result => {
  if (r.status !== 'Requested' && r.status !== 'In preparation') return { error: 'This request can no longer be declined.' };
  if (reason.trim().length < 5) return { error: 'Tell the teacher why, so they know what to do next.' };
  return event(r, { at, by, action: 'Declined', comment: reason.trim() }, { status: 'Declined' });
};

/** The teacher's latest comment, for the coordinator to act on. */
export const lastComment = (r: PaperRequest) => [...r.history].reverse().find(e => e.comment)?.comment;

// ---------------------------------------------------------------------------
// Paper for a request
// ---------------------------------------------------------------------------

/** A 25-mark unit test (the 50-mark one is UNIT_TEST_PATTERN). */
export const UNIT_TEST_25_PATTERN: Omit<BlueprintSection, 'id'>[] = [
  { title: 'Section A', type: 'MCQ', count: 5, marksEach: 1, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
  { title: 'Section B', type: 'Very short answer', count: 4, marksEach: 2, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
  { title: 'Section C', type: 'Short answer', count: 3, marksEach: 4, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
];

export const patternFor = (maxMarks: 25 | 50) => (maxMarks === 25 ? UNIT_TEST_25_PATTERN : UNIT_TEST_PATTERN);

/** Exam details prefilled from the teacher's request. */
export const detailsFromRequest = (r: PaperRequest) => ({
  classLevel: r.classLevel,
  section: r.section.split('-')[1] ?? 'All sections',
  subject: r.subject,
  examType: 'Unit test' as const,
  exam: r.testName,
  examDate: r.testDate,
  durationMinutes: r.durationMinutes,
  maxMarks: r.maxMarks,
});

/** Freezes a paper for the teacher to read in the teacher app. */
export const snapshotPaper = (paper: QuestionPaper, bank: BankQuestion[], sentBy: string, sentOn = QPG_TODAY): PaperSnapshot => {
  const byId = new Map(bank.map(q => [q.id, q]));
  let n = 0;
  const sections = paper.blueprint.map(b => {
    const content = paper.content.find(c => c.sectionId === b.id);
    return {
      title: `${b.title} · ${b.type}`,
      questions: (content?.questions ?? []).map(pq => {
        const q = byId.get(pq.questionId);
        n += 1;
        return { number: n, text: q ? questionText(q, paper.details.language) : `Question ${pq.questionId}`, marks: pq.marks, options: q?.options, answer: q?.answer ?? '' };
      }),
    };
  });
  return {
    paperId: paper.id,
    title: paper.title,
    totalMarks: paperCounts(paper).marks,
    durationMinutes: paper.details.durationMinutes,
    instructions: paper.instructions,
    sections: sections.filter(s => s.questions.length),
    sentOn,
    sentBy,
  };
};

// ---------------------------------------------------------------------------
// Seed: one request waiting for the coordinator
// ---------------------------------------------------------------------------

export const INITIAL_REQUESTS: PaperRequest[] = [
  {
    ...createRequest(
      'UTR-2024-001',
      {
        section: '10-A',
        subject: 'Science',
        testName: 'Unit Test 3',
        chapters: 'Light – reflection and refraction; the human eye',
        maxMarks: 50,
        durationMinutes: 90,
        testDate: '2024-09-27',
        notes: 'Include two diagram-based questions on ray diagrams, please.',
      },
      { id: 'T-malini', name: 'Mrs. Malini Iyer' },
      '2024-09-13'
    ),
  },
];
