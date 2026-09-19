import assert from 'node:assert/strict';
import { describe, test } from './harness';
import { setMockLatency } from '../src/lib/store';
import { DEFAULT_DETAILS, DEFAULT_INSTRUCTIONS, INITIAL_BANK, QuestionPaper, autoFill, newSectionId } from '../src/data/questionPapers';
import {
  INITIAL_REQUESTS,
  NewRequest,
  PaperRequest,
  UNIT_TEST_25_PATTERN,
  createRequest,
  declineRequest,
  detailsFromRequest,
  earliestTestDate,
  markConducted,
  patternFor,
  requestProblems,
  sendForApproval,
  snapshotPaper,
  startPreparing,
  teacherApprove,
  teacherRequestChanges,
} from '../src/data/paperRequests';
import { currentRequests, paperRequestService } from '../src/services/paperRequestService';

setMockLatency(0);

const TODAY = '2024-09-16';
const MALINI = { id: 'T-malini', name: 'Mrs. Malini Iyer' };
const ok = (r: PaperRequest | { error: string }) => {
  if ('error' in r) throw new Error(r.error);
  return r;
};
const input = (patch: Partial<NewRequest> = {}): NewRequest => ({
  section: '10-A',
  // The bank has full Class 10 Mathematics coverage, so these papers fill without AI.
  subject: 'Mathematics',
  testName: 'Unit Test 4',
  chapters: 'Quadratic equations',
  maxMarks: 50,
  durationMinutes: 90,
  testDate: '2024-09-30',
  notes: '',
  ...patch,
});

/** A complete paper for a request, filled from the question bank. */
const paperFor = (r: PaperRequest): QuestionPaper => {
  const details = { ...DEFAULT_DETAILS, ...detailsFromRequest(r) } as QuestionPaper['details'];
  const blueprint = patternFor(r.maxMarks).map(s => ({ ...s, id: newSectionId() }));
  const { content } = autoFill(blueprint, details, INITIAL_BANK, { seed: r.id, allowRepeats: true });
  return { id: 'QP-2024-099', title: 'Unit test', details, blueprint, content, sets: [], instructions: DEFAULT_INSTRUCTIONS, status: 'Draft', createdBy: 'Mr. Arun Prakash', createdOn: TODAY, history: [] };
};

describe('Unit-test paper requests', () => {
  test('a request needs class, name, chapters and a date at least 3 days away', () => {
    assert.deepEqual(requestProblems(input(), TODAY), {});
    const p = requestProblems(input({ testName: ' ', chapters: '', testDate: '2024-09-17' }), TODAY);
    assert.ok(p.testName && p.chapters && p.testDate);
    assert.match(p.testDate!, /at least 3 days/);
    assert.equal(earliestTestDate(TODAY), '2024-09-19');
  });

  test('full path: requested → preparing → sent → approved → conducted', () => {
    let r = createRequest('UTR-X', input(), MALINI, TODAY);
    assert.equal(r.status, 'Requested');
    r = ok(startPreparing(r, 'QP-2024-099', 'Mr. Arun Prakash', TODAY));
    assert.equal(r.status, 'In preparation');
    const snap = snapshotPaper(paperFor(r), INITIAL_BANK, 'Mr. Arun Prakash', TODAY);
    assert.equal(snap.totalMarks, 50);
    assert.ok(snap.sections.every(s => s.questions.every(q => q.text && q.marks > 0)));
    r = ok(sendForApproval(r, snap, 'Mr. Arun Prakash', TODAY));
    assert.equal(r.status, 'Awaiting teacher approval');
    r = ok(teacherApprove(r, 'T-malini', TODAY));
    assert.equal(r.status, 'Approved');
    assert.match((markConducted(r, 'T-malini', TODAY) as { error: string }).error, /on that day or later/);
    r = ok(markConducted(r, 'T-malini', '2024-09-30'));
    assert.equal(r.status, 'Conducted');
    assert.deepEqual(r.history.map(h => h.action), ['Requested', 'Started preparing', 'Sent for approval', 'Approved', 'Marked as conducted']);
  });

  test('only the requesting teacher approves; sending back needs a comment', () => {
    let r = ok(startPreparing(createRequest('UTR-Y', input(), MALINI, TODAY), 'QP-2024-099', 'Coord', TODAY));
    r = ok(sendForApproval(r, snapshotPaper(paperFor(r), INITIAL_BANK, 'Coord', TODAY), 'Coord', TODAY));
    assert.match((teacherApprove(r, 'T-clara', TODAY) as { error: string }).error, /Only the teacher/);
    assert.match((teacherRequestChanges(r, 'T-malini', 'no', TODAY) as { error: string }).error, /Write what should change/);
    r = ok(teacherRequestChanges(r, 'T-malini', 'Question 4 is off-syllabus', TODAY));
    assert.equal(r.status, 'Changes requested');
    // The coordinator can send the corrected paper again
    r = ok(sendForApproval(r, snapshotPaper(paperFor(r), INITIAL_BANK, 'Coord', TODAY), 'Coord', TODAY));
    assert.equal(r.status, 'Awaiting teacher approval');
  });

  test('a paper whose marks do not match the request is not sent', () => {
    const r = ok(startPreparing(createRequest('UTR-Z', input({ maxMarks: 25 }), MALINI, TODAY), 'QP-2024-099', 'Coord', TODAY));
    const fifty = snapshotPaper(paperFor({ ...r, maxMarks: 50 }), INITIAL_BANK, 'Coord', TODAY);
    assert.match((sendForApproval(r, fifty, 'Coord', TODAY) as { error: string }).error, /50 marks but the teacher asked for 25/);
    assert.equal(UNIT_TEST_25_PATTERN.reduce((n, s) => n + s.count * s.marksEach, 0), 25);
    assert.equal(snapshotPaper(paperFor(r), INITIAL_BANK, 'Coord', TODAY).totalMarks, 25);
  });

  test('declining needs a reason and closes the request', () => {
    const r = createRequest('UTR-D', input(), MALINI, TODAY);
    assert.match((declineRequest(r, 'Coord', '', TODAY) as { error: string }).error, /why/);
    assert.equal(ok(declineRequest(r, 'Coord', 'Clashes with the half-yearly exams', TODAY)).status, 'Declined');
  });

  test('service: teacher submits, the request is saved and numbered', async () => {
    paperRequestService.reset();
    assert.equal(currentRequests().length, INITIAL_REQUESTS.length);
    const r = await paperRequestService.submit(input(), MALINI, TODAY);
    assert.equal(r.id, 'UTR-2024-002');
    assert.equal(currentRequests()[0].id, r.id);
    await assert.rejects(paperRequestService.submit(input({ chapters: '' }), MALINI, TODAY), /chapters/);
    await assert.rejects(paperRequestService.approve(r.id, MALINI.id, TODAY), /no paper waiting/);
    paperRequestService.reset();
  });
});
