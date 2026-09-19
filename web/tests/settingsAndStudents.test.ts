import assert from 'node:assert/strict';
import { describe, test } from './harness';
import { INITIAL_ROSTER, checkEmis, formatEmis, identifierIssues, matchesSearch } from '../src/data/students';
import { rosterStore, studentService } from '../src/services/studentService';
import { setMockLatency } from '../src/lib/store';
import { THEME_STORAGE_KEY, resolveTheme, settingsService } from '../apps/shared/settingsService';
import { FEATURE_GRANTS, can, ownershipViolations } from '../src/data/permissions';
import { canView } from '../src/data/staffAccess';

setMockLatency(0);

/** In-memory stand-in for the browser's localStorage. */
const installStorage = () => {
  const data = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
  return data;
};

describe('Theme selection', () => {
  test('light, dark and school apply as chosen', () => {
    assert.equal(resolveTheme('light', true), 'light');
    assert.equal(resolveTheme('dark', false), 'dark');
    assert.equal(resolveTheme('school', true), 'school');
  });
  test('system follows the device', () => {
    assert.equal(resolveTheme('system', true), 'dark');
    assert.equal(resolveTheme('system', false), 'light');
  });
  test('the choice is saved and restored', () => {
    const data = installStorage();
    settingsService.setTheme('dark');
    assert.equal(data.get(THEME_STORAGE_KEY), 'dark');
    data.set(THEME_STORAGE_KEY, 'school');
    settingsService.reload();
    assert.equal(settingsService.getTheme(), 'school');
  });
  test('a corrupt saved value falls back to light', () => {
    const data = installStorage();
    data.set(THEME_STORAGE_KEY, 'neon');
    settingsService.reload();
    assert.equal(settingsService.getTheme(), 'light');
  });
});

describe('EMIS number', () => {
  const aarav = INITIAL_ROSTER[0];
  test('valid', () => assert.equal(checkEmis(aarav.emis, aarav.id, INITIAL_ROSTER).state, 'valid'));
  test('empty', () => assert.equal(checkEmis('', aarav.id, INITIAL_ROSTER).state, 'empty'));
  test('invalid: wrong length, wrong state code, letters', () => {
    assert.match(checkEmis('33123', aarav.id, INITIAL_ROSTER).message, /16 digits/);
    assert.match(checkEmis('1234567890123456', aarav.id, INITIAL_ROSTER).message, /start with 33/);
    assert.equal(checkEmis('33AB567890123456', aarav.id, INITIAL_ROSTER).state, 'invalid');
  });
  test('duplicate within the school', () => {
    const r = checkEmis(INITIAL_ROSTER[1].emis, aarav.id, INITIAL_ROSTER);
    assert.equal(r.state, 'duplicate');
    assert.equal(r.conflictWith, INITIAL_ROSTER[1].id);
  });
  test('mock duplicate from the state registry', () => assert.equal(checkEmis('3302 1104 0021 8841', aarav.id, INITIAL_ROSTER).state, 'duplicate'));
  test('spaces and dashes are ignored; display groups in fours', () => {
    assert.equal(checkEmis(formatEmis(aarav.emis!), aarav.id, INITIAL_ROSTER).state, 'valid');
    assert.equal(formatEmis('3300001102000000'), '3300 0011 0200 0000');
  });
  test('search finds a student by EMIS', () => assert.ok(matchesSearch(aarav, aarav.emis!.slice(-8))));
  test('missing EMIS is reported as a data-quality issue', () => {
    assert.ok(identifierIssues(INITIAL_ROSTER).some(i => i.field === 'EMIS' && i.studentId === 'ros-13'));
  });
  test('the service refuses duplicates and saves valid numbers', async () => {
    rosterStore.reset();
    await assert.rejects(studentService.updateIdentifiers('ros-13', { emis: INITIAL_ROSTER[0].emis!, apaar: '' }), /Already used by/);
    const saved = await studentService.updateIdentifiers('ros-13', { emis: '3300 0011 0299 9999', apaar: '' });
    assert.equal(saved.emis, '3300001102999999');
    assert.equal(rosterStore.get().find(s => s.id === 'ros-13')!.emis, '3300001102999999');
    rosterStore.reset();
  });
  test('adding a student checks identifiers', async () => {
    rosterStore.reset();
    const base = { name: 'Test Child', gender: 'Female' as const, dob: '2011-02-02', classLevel: 8, section: 'A', admissionNo: 'ADM-2018-9999', guardianName: 'Test Parent', guardianMobile: '+91 90000 00000', apaar: '' };
    await assert.rejects(studentService.create({ ...base, emis: '12' }), /start with 33/);
    const s = await studentService.create({ ...base, emis: '3300009999999999' });
    assert.equal(s.id, `ros-${INITIAL_ROSTER.length + 1}`);
    rosterStore.reset();
  });
});

describe('Access grants', () => {
  test('every feature still has at most one owner', () => assert.deepEqual(ownershipViolations(), []));
  test('the exam coordinator owns question papers; the Principal approves', () => {
    assert.ok(can('exam-coordinator', 'QPG-003', 'C'));
    assert.ok(!can('principal', 'QPG-003', 'C'));
    assert.ok(can('principal', 'QPG-012', 'A'));
    assert.ok(!can('exam-coordinator', 'QPG-012', 'A'));
    assert.ok(can('exam-coordinator', 'QPG-009', 'E'));
  });
  test('only the admissions officer edits EMIS', () => {
    const owners = FEATURE_GRANTS.find(f => f.id === 'STU-026')!.rows.filter(r => r.verbs.includes('U')).map(r => r.role);
    assert.deepEqual(owners, ['admissions']);
  });
  test('screens follow the grants', () => {
    assert.ok(canView('exam-coordinator', 'question-papers'));
    assert.ok(canView('exam-coordinator', 'question-bank'));
    assert.ok(!canView('exam-coordinator', 'fees'));
    assert.ok(canView('principal', 'question-papers'));
    assert.ok(!canView('accountant', 'question-papers'));
  });
});
