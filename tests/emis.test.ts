import assert from 'node:assert/strict';
import { describe, test } from './harness';
import { setMockLatency } from '../src/lib/store';
import { INITIAL_ROSTER } from '../src/data/students';
import { OTHER_SCHOOL_RECORDS, applyUpload, emisSummary, exportRows, lookupEmis, pendingChanges, poolMatchesFor, portalStatus, seedPortal, checkTeacherId, STAFF_EMIS } from '../src/data/emis';
import { emisService, emisStore } from '../src/services/emisService';
import { rosterStore, studentService } from '../src/services/studentService';
import { can } from '../src/data/permissions';
import { canView } from '../src/data/staffAccess';
import { installStatus } from '../apps/shared/webApp';

setMockLatency(0);

const fresh = () => {
  rosterStore.reset();
  emisService.reset();
};
const byName = (name: string) => rosterStore.get().find(s => s.name === name && s.status !== 'TC issued')!;
const stateOf = (name: string) => {
  const roster = rosterStore.get();
  return portalStatus(byName(name), roster, emisStore.get().portal);
};

describe('TN EMIS desk', () => {
  test('seed covers every portal state', () => {
    fresh();
    const roster = rosterStore.get();
    const portal = emisStore.get().portal;
    const states = new Set(roster.map(s => portalStatus(s, roster, portal).state));
    for (const s of ['linked', 'mismatch', 'class', 'not-uploaded', 'missing', 'release'] as const) assert.ok(states.has(s), `missing state ${s}`);
    assert.equal(stateOf('Aarav S. Ramanathan').state, 'linked');
    assert.equal(stateOf('Janani P. Mohan').state, 'missing');
    assert.equal(stateOf('Karthik V. Iyer').state, 'class');
    assert.equal(stateOf('Nila S. Varghese').state, 'not-uploaded');
    const lakshmi = stateOf('Lakshmi A. Rao');
    assert.equal(lakshmi.state, 'mismatch');
    assert.deepEqual(lakshmi.diffs.map(d => d.field), ['Name']);
    assert.deepEqual(stateOf('Farah N. Siddiqui').diffs.map(d => d.field), ['Date of birth']);
    const leaver = roster.find(s => s.status === 'TC issued')!;
    assert.equal(portalStatus(leaver, roster, portal).state, 'release');
  });

  test('an invalid number needs fixing before anything is uploaded', () => {
    fresh();
    rosterStore.set(list => list.map(s => (s.name === 'Harini R. Krishnan' ? { ...s, emis: '1234' } : s)));
    assert.equal(stateOf('Harini R. Krishnan').state, 'fix');
    const queue = pendingChanges(rosterStore.get(), emisStore.get().portal, []);
    assert.ok(!queue.some(c => c.studentName === 'Harini R. Krishnan'));
  });

  test('queue lists additions, class updates and releases', () => {
    fresh();
    const queue = pendingChanges(rosterStore.get(), emisStore.get().portal, []);
    assert.deepEqual(queue.map(c => `${c.kind}:${c.studentName}`).sort(), ['add:Nila S. Varghese', 'class:Karthik V. Iyer', 'release:Mohammed Rafi']);
  });

  test('upload applies accepted changes and keeps rejected ones visible', async () => {
    fresh();
    await emisService.requestCorrection({ studentId: byName('Lakshmi A. Rao').id, field: 'Name', value: 'Lakshmi A. Rao', requestedBy: 'Test' });
    await emisService.requestCorrection({ studentId: byName('Farah N. Siddiqui').id, field: 'Date of birth', value: '2010-02-14', requestedBy: 'Test' });
    assert.equal(pendingChanges(rosterStore.get(), emisStore.get().portal, emisStore.get().corrections).length, 5);
    const log = await emisService.uploadPending('Ms. Priya Venkat');
    assert.equal(log.results.length, 5);
    assert.deepEqual(log.results.filter(r => !r.ok).map(r => r.studentName), ['Farah N. Siddiqui']);
    assert.equal(stateOf('Nila S. Varghese').state, 'linked');
    assert.equal(stateOf('Karthik V. Iyer').state, 'linked');
    assert.equal(stateOf('Lakshmi A. Rao').state, 'linked');
    assert.equal(stateOf('Farah N. Siddiqui').state, 'mismatch');
    const roster = rosterStore.get();
    assert.equal(portalStatus(roster.find(s => s.status === 'TC issued')!, roster, emisStore.get().portal).state, 'released');
    const left = pendingChanges(roster, emisStore.get().portal, emisStore.get().corrections);
    assert.equal(left.length, 1);
    assert.match(emisStore.get().lastResult[left[0].id].message, /Block Resource Centre/);
    assert.equal(emisStore.get().uploads[0].id, log.id);
  });

  test('a student still at another school cannot be added', () => {
    fresh();
    const roster = rosterStore.get().map(s => (s.name === 'Ishaan S. Menon' ? { ...s, emis: '3302110400218841' } : s));
    const change = { id: 'add-x', kind: 'add' as const, studentId: byName('Ishaan S. Menon').id, studentName: 'Ishaan S. Menon', emis: '3302110400218841', summary: '' };
    const { results } = applyUpload(roster, emisStore.get().portal, [change], []);
    assert.equal(results[0].ok, false);
    assert.match(results[0].message, /Chennai Public School/);
  });

  test('lookup: invalid, not found, common pool, another school, ours', () => {
    fresh();
    const roster = rosterStore.get();
    const portal = emisStore.get().portal;
    assert.equal(lookupEmis('12345', roster, portal).state, 'invalid');
    assert.equal(lookupEmis('3399 0000 0000 0000', roster, portal).state, 'not-found');
    const pool = lookupEmis('3303 1506 0011 4455', roster, portal);
    assert.ok(pool.state === 'found' && pool.relation === 'pool' && pool.record.name === 'Vishnu K. Raman');
    const other = lookupEmis('3302110400218841', roster, portal);
    assert.ok(other.state === 'found' && other.relation === 'other-school');
    const ours = lookupEmis('3300 0011 0200 0000', roster, portal);
    assert.ok(ours.state === 'found' && ours.relation === 'ours' && ours.linkedTo?.name === 'Aarav S. Ramanathan');
  });

  test('a pool match is linked, then moved to this school on upload', async () => {
    fresh();
    const janani = byName('Janani P. Mohan');
    const [match] = poolMatchesFor(janani, emisStore.get().portal);
    assert.equal(match.emis, '3303150600112233');
    await emisService.linkNumber(janani.id, match.emis);
    assert.equal(stateOf('Janani P. Mohan').state, 'not-uploaded');
    const log = await emisService.uploadPending('Test');
    const result = log.results.find(r => r.studentName === 'Janani P. Mohan')!;
    assert.ok(result.ok);
    assert.match(result.message, /common pool/);
    assert.equal(stateOf('Janani P. Mohan').state, 'linked');
  });

  test('admitting from the pool creates a student with that number', async () => {
    fresh();
    const s = await studentService.create({ name: 'Vishnu K. Raman', gender: 'Male', dob: '2011-08-19', classLevel: 8, section: 'B', admissionNo: 'ADM-2018-9999', guardianName: 'K. Raman', guardianMobile: '+91 98765 11111', emis: '3303150600114455', apaar: '' });
    const roster = rosterStore.get();
    assert.equal(portalStatus(s, roster, emisStore.get().portal).state, 'not-uploaded');
    await emisService.uploadPending('Test');
    assert.equal(portalStatus(s, rosterStore.get(), emisStore.get().portal).state, 'linked');
  });

  test('attendance upload marks the day and notes a late upload', async () => {
    fresh();
    const today = await emisService.uploadAttendance('2024-09-16');
    assert.equal(today.status, 'Uploaded');
    assert.match(today.note ?? '', /cut-off/);
    const retry = await emisService.uploadAttendance('2024-09-13');
    assert.match(retry.note ?? '', /failed attempt/);
    assert.ok(emisStore.get().attendance.every(d => d.status === 'Uploaded'));
  });

  test('summary, staff IDs and export', () => {
    fresh();
    const roster = rosterStore.get();
    const summary = emisSummary(roster, emisStore.get().portal, []);
    assert.equal(summary.onRolls, roster.filter(s => s.status !== 'TC issued').length);
    assert.equal(summary.missing, 1);
    assert.equal(summary.toFix, 2);
    assert.equal(summary.pending, 3);
    assert.equal(summary.staffLinked, 6);
    assert.deepEqual(STAFF_EMIS.map(s => checkTeacherId(s.teacherId)).filter(x => x !== 'valid').sort(), ['invalid', 'missing']);
    const rows = exportRows(roster, emisStore.get().portal);
    assert.equal(rows.length, roster.length);
    assert.equal(rows[0][0], '3300001102000000');
    assert.equal(rows[0][8], 'Linked');
  });

  test('portal holds every numbered student except the new admission, plus other schools', () => {
    assert.equal(Object.keys(seedPortal(INITIAL_ROSTER)).length, INITIAL_ROSTER.length - 2 + OTHER_SCHOOL_RECORDS.length);
  });

  test('failed portal calls reject with a message', async () => {
    const { failNextEmisRequest } = await import('../src/services/emisService');
    failNextEmisRequest();
    await assert.rejects(emisService.sync(), /did not respond/);
    const synced = await emisService.sync();
    assert.equal(synced.lastSync, '2024-09-16 17:40');
  });

  test('grants: admissions operates, principal and auditor read, accountant has no EMIS desk', () => {
    assert.ok(can('admissions', 'STU-026', 'U'));
    assert.ok(can('admissions', 'STU-026', 'E'));
    assert.ok(!can('principal', 'STU-026', 'U'));
    assert.ok(can('principal', 'STU-026', 'R'));
    assert.ok(can('auditor', 'STU-026', 'E'));
    assert.ok(!can('auditor', 'STU-026', 'U'));
    assert.ok(canView('admissions', 'emis'));
    assert.ok(canView('principal', 'emis'));
    assert.ok(canView('auditor', 'emis'));
    assert.ok(!canView('accountant', 'emis'));
    assert.ok(!canView('exam-coordinator', 'emis'));
  });
});

describe('Web app install', () => {
  test('without a browser prompt the app explains how to install', () => {
    assert.equal(installStatus(), 'manual');
  });
});
