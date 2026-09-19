import assert from 'node:assert/strict';
import { describe, test } from './harness';
import {
  DEFAULT_DETAILS,
  EMPTY_FILTER,
  INITIAL_BANK,
  INITIAL_PAPERS,
  QuestionPaper,
  addQuestion,
  answerKey,
  autoFill,
  blueprintTotals,
  buildSets,
  filterBank,
  mockGenerate,
  moveQuestion,
  moveQuestionTo,
  paperQuestions,
  paperStats,
  presetBlueprint,
  recentlyUsedFor,
  removeQuestion,
  replaceQuestion,
  alternativesFor,
  setOverlap,
  totalState,
  transitionPaper,
  validateBlueprint,
  validateContent,
  validateDetails,
} from '../src/data/questionPapers';
import { setMockLatency } from '../src/lib/store';
import { qpgStore, questionPaperService, failNextRequest } from '../src/services/questionPaperService';

setMockLatency(0);

const fullPaper = (): QuestionPaper => {
  const blueprint = presetBlueprint('CBSE');
  const { content } = autoFill(blueprint, DEFAULT_DETAILS, INITIAL_BANK, { seed: 'test', allowRepeats: true });
  return { id: 'QP-T', title: 't', details: DEFAULT_DETAILS, blueprint, content, sets: [], instructions: [], status: 'Draft', createdBy: 'Mr. Arun Prakash', createdOn: '2024-09-16', history: [] };
};

describe('Question Paper Generator', () => {
  describe('exam details', () => {
    test('defaults are valid', () => assert.deepEqual(validateDetails(DEFAULT_DETAILS, '2024-09-16'), {}));
    test('duration, marks and past dates are rejected', () => {
      const e = validateDetails({ ...DEFAULT_DETAILS, durationMinutes: 10, maxMarks: 0, examDate: '2024-01-01' }, '2024-09-16');
      assert.ok(e.durationMinutes && e.maxMarks && e.examDate);
    });
  });

  describe('blueprint calculation', () => {
    test('every board preset adds up to 100 marks', () => {
      for (const board of ['CBSE', 'State Board (Tamil Nadu)', 'ICSE']) assert.equal(blueprintTotals(presetBlueprint(board)).marks, 100, board);
    });
    test('CBSE preset: 40 questions, total matches', () => {
      const t = blueprintTotals(presetBlueprint('CBSE'));
      assert.deepEqual(t, { questions: 40, marks: 100 });
      assert.equal(totalState(t.marks, 100), 'match');
    });
    test('under and over the maximum', () => {
      assert.equal(totalState(90, 100), 'under');
      assert.equal(totalState(104, 100), 'over');
    });
    test('validation flags a total mismatch, duplicate titles and bank shortfall', () => {
      const bp = presetBlueprint('CBSE');
      bp[0] = { ...bp[0], count: 10 };
      bp[1] = { ...bp[1], title: bp[2].title };
      bp[3] = { ...bp[3], count: 30 };
      const issues = validateBlueprint(bp, DEFAULT_DETAILS, INITIAL_BANK).map(i => i.text);
      assert.ok(issues.some(t => t.includes('add up to')));
      assert.ok(issues.some(t => t.includes('Two sections')));
      assert.ok(issues.some(t => t.includes('the bank has')));
    });
  });

  describe('question bank', () => {
    test('search matches text, topic, chapter and tags', () => {
      assert.ok(filterBank(INITIAL_BANK, { ...EMPTY_FILTER, query: 'hcf' }).some(q => q.id === 'QB-M10-001'));
      assert.ok(filterBank(INITIAL_BANK, { ...EMPTY_FILTER, query: 'section formula' }).length > 0);
    });
    test('filters combine', () => {
      const rows = filterBank(INITIAL_BANK, { ...EMPTY_FILTER, subject: 'Mathematics', type: 'Long answer', difficulty: 'Hard' });
      assert.ok(rows.length >= 4);
      assert.ok(rows.every(q => q.type === 'Long answer' && q.difficulty === 'Hard'));
    });
    test('language filter keeps translated questions only', () => {
      const tamil = filterBank(INITIAL_BANK, { ...EMPTY_FILTER, language: 'Tamil' });
      assert.ok(tamil.length > 0 && tamil.every(q => q.translations?.ta));
    });
    test('used / unused filter', () => {
      const unused = filterBank(INITIAL_BANK, { ...EMPTY_FILTER, usage: 'Unused' });
      assert.ok(unused.length > 0 && unused.every(q => q.usageCount === 0));
    });
  });

  describe('paper building', () => {
    test('auto-fill completes the CBSE blueprint', () => {
      const p = fullPaper();
      assert.deepEqual(validateContent(p), []);
      assert.equal(paperStats(p.content, INITIAL_BANK).marks, 100);
    });
    test('repetition control skips questions from the last published paper', () => {
      const recent = recentlyUsedFor(INITIAL_PAPERS, DEFAULT_DETAILS);
      assert.ok(recent.size > 0);
      const { content } = autoFill(presetBlueprint('CBSE'), DEFAULT_DETAILS, INITIAL_BANK, { seed: 'x', recentlyUsed: recent });
      assert.ok(paperQuestions(content).every(q => !recent.has(q.questionId)));
    });
    test('adding the same question twice is ignored', () => {
      const p = fullPaper();
      const id = paperQuestions(p.content)[0].questionId;
      assert.equal(addQuestion(p.content, p.blueprint[0].id, id, 1), p.content);
    });
    test('selection adds a question to its section', () => {
      const bp = presetBlueprint('CBSE');
      const next = addQuestion([], bp[0].id, 'QB-M10-001', 1);
      assert.deepEqual(paperQuestions(next).map(q => q.questionId), ['QB-M10-001']);
    });
    test('removal', () => {
      const p = fullPaper();
      const key = p.content[0].questions[0].key;
      const next = removeQuestion(p.content, key);
      assert.equal(paperQuestions(next).length, 39);
      assert.ok(validateContent({ ...p, content: next }).some(i => i.text.includes('19 of 20')));
    });
    test('reordering with buttons and drag and drop', () => {
      const p = fullPaper();
      const [a, b, c] = p.content[0].questions;
      const up = moveQuestion(p.content, b.key, -1)[0].questions.map(q => q.key);
      assert.deepEqual(up.slice(0, 2), [b.key, a.key]);
      assert.deepEqual(moveQuestion(p.content, a.key, -1)[0].questions.map(q => q.key), p.content[0].questions.map(q => q.key), 'the first question cannot move up');
      const dragged = moveQuestionTo(p.content, c.key, a.key)[0].questions.map(q => q.key);
      assert.deepEqual(dragged.slice(0, 3), [c.key, a.key, b.key]);
    });
    test('replace uses an unused alternative only', () => {
      const p = fullPaper();
      const alt = alternativesFor(p.content, p.blueprint[0], p.details, INITIAL_BANK)[0];
      const key = p.content[0].questions[0].key;
      const next = replaceQuestion(p.content, key, alt.id);
      assert.equal(next[0].questions[0].questionId, alt.id);
      const taken = p.content[0].questions[1].questionId;
      assert.equal(replaceQuestion(p.content, key, taken), p.content);
    });
  });

  describe('mock AI generation', () => {
    const req = { subject: 'Mathematics' as const, classLevel: 10, chapter: 'Statistics', topic: 'Median', type: 'MCQ' as const, difficulty: 'Easy' as const, marks: 1, language: 'English' as const, count: 3 };
    test('returns drafts marked as AI generated', () => {
      const qs = mockGenerate(req, 1);
      assert.equal(qs.length, 3);
      assert.ok(qs.every(q => q.source === 'AI generated' && q.status === 'Draft' && q.options?.includes(q.answer)));
    });
    test('is repeatable for the same attempt and changes on regenerate', () => {
      assert.deepEqual(mockGenerate(req, 1), mockGenerate(req, 1));
      assert.notDeepEqual(mockGenerate(req, 1).map(q => q.id), mockGenerate(req, 2).map(q => q.id));
    });
    test('count is capped at 10', () => assert.equal(mockGenerate({ ...req, count: 50 }, 1).length, 10));
  });

  describe('multiple sets and answer key', () => {
    test('four sets keep the same questions and marks', () => {
      const p = fullPaper();
      const sets = buildSets(p, INITIAL_BANK, 4);
      assert.deepEqual(sets.map(s => s.label), ['Set A', 'Set B', 'Set C', 'Set D']);
      for (const s of sets) assert.deepEqual([paperStats(s.sections, INITIAL_BANK).questions, paperStats(s.sections, INITIAL_BANK).marks], [40, 100]);
      assert.ok(setOverlap(sets[0], sets[1]) < 100, 'Set B should differ from Set A');
    });
    test('answer key lists every question with its answer', () => {
      const p = fullPaper();
      const key = answerKey(p, p.content, INITIAL_BANK);
      assert.equal(key.length, 40);
      assert.ok(key.every(r => r.correctAnswer && r.markingScheme));
      assert.equal(key[0].number, 1);
    });
  });

  describe('approval workflow', () => {
    test('draft → under review → approved → published', () => {
      let p: QuestionPaper | { error: string } = fullPaper();
      p = transitionPaper(p as QuestionPaper, 'submit', 'Mr. Arun Prakash', '2024-09-16');
      assert.equal((p as QuestionPaper).status, 'Under review');
      p = transitionPaper(p as QuestionPaper, 'approve', 'Dr. Arvind Swaminathan', '2024-09-17');
      assert.equal((p as QuestionPaper).status, 'Approved');
      assert.equal((p as QuestionPaper).reviewedBy, 'Dr. Arvind Swaminathan');
      p = transitionPaper(p as QuestionPaper, 'publish', 'Mr. Arun Prakash', '2024-09-18');
      assert.equal((p as QuestionPaper).status, 'Published');
      assert.deepEqual((p as QuestionPaper).history.map(h => h.action), ['Submitted for review', 'Approved', 'Published']);
    });
    test('an author cannot review their own paper', () => {
      const p = transitionPaper(fullPaper(), 'submit', 'Mr. Arun Prakash', 'd') as QuestionPaper;
      assert.deepEqual(transitionPaper(p, 'approve', 'Mr. Arun Prakash', 'd'), { error: 'You cannot review a paper you created.' });
    });
    test('reject and request changes need a comment', () => {
      const p = transitionPaper(fullPaper(), 'submit', 'Mr. Arun Prakash', 'd') as QuestionPaper;
      assert.ok('error' in transitionPaper(p, 'reject', 'Dr. Arvind Swaminathan', 'd'));
      const back = transitionPaper(p, 'requestChanges', 'Dr. Arvind Swaminathan', 'd', 'Fix Q3') as QuestionPaper;
      assert.equal(back.status, 'Changes requested');
      assert.equal('error' in transitionPaper(back, 'submit', 'Mr. Arun Prakash', 'd'), false);
    });
    test('an incomplete paper cannot be submitted', () => {
      const p = fullPaper();
      const r = transitionPaper({ ...p, content: removeQuestion(p.content, p.content[0].questions[0].key) }, 'submit', 'Mr. Arun Prakash', 'd');
      assert.ok('error' in r && r.error.includes('19 of 20'));
    });
    test('illegal jumps are refused', () => assert.ok('error' in transitionPaper(fullPaper(), 'publish', 'Mr. Arun Prakash', 'd')));
  });

  describe('service', () => {
    test('create, submit, approve and publish update the store and usage counts', async () => {
      qpgStore.reset();
      const draft = fullPaper();
      const created = await questionPaperService.createPaper({ ...draft, id: undefined } as unknown as QuestionPaper);
      assert.match(created.id, /^QP-2024-\d{3}$/);
      await questionPaperService.transition(created.id, 'submit', 'Mr. Arun Prakash');
      await assert.rejects(questionPaperService.transition(created.id, 'approve', 'Mr. Arun Prakash'), /cannot review/);
      await questionPaperService.transition(created.id, 'approve', 'Dr. Arvind Swaminathan');
      const qid = paperQuestions(created.content)[0].questionId;
      const before = qpgStore.get().bank.find(q => q.id === qid)!.usageCount;
      await questionPaperService.transition(created.id, 'publish', 'Mr. Arun Prakash');
      assert.equal(qpgStore.get().bank.find(q => q.id === qid)!.usageCount, before + 1);
      qpgStore.reset();
    });
    test('new paper IDs continue after the highest saved paper', async () => {
      qpgStore.reset();
      qpgStore.set(s => ({ ...s, papers: [{ ...fullPaper(), id: 'QP-2024-125' }, ...s.papers] }));
      const created = await questionPaperService.createPaper({ ...fullPaper(), id: undefined } as unknown as QuestionPaper);
      assert.equal(created.id, 'QP-2024-126');
      qpgStore.reset();
    });
    test('a failed request rejects with the friendly message', async () => {
      failNextRequest();
      await assert.rejects(questionPaperService.listPapers(), /Something went wrong/);
      assert.ok((await questionPaperService.listPapers()).length > 0);
    });
  });
});
