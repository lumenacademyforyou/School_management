import assert from 'node:assert/strict';
import { describe, test } from './harness';
import { achievementsFor, classMarks, ordinal, rankOf, termResultsFor } from '../src/data/hallOfFame';
import { allocationFor, tripState } from '../src/data/transport';
import { hostelFor } from '../src/data/hostel';
import { PARENT_ACCOUNTS } from '../apps/shared/schoolData';
import { hallOfFameService } from '../src/services/hallOfFameService';
import { transportService } from '../src/services/transportService';
import { hostelService } from '../src/services/hostelService';
import { setMockLatency } from '../src/lib/store';

setMockLatency(0);

const KAVIN = 'ros-07';
const KAVYA = 'ros-08';
const AARAV = 'ros-01';
const ANANYA = 'ros-02';

describe('Parent app', () => {
  describe('Hall of Fame', () => {
    test('rank 1 — gold', () => {
      const [best] = achievementsFor(KAVIN);
      assert.equal(best.rank, 1);
      assert.equal(best.tier, 'gold');
      assert.equal(best.subject, 'Mathematics');
      assert.deepEqual([best.marks, best.max, best.percentage, best.academicYear], [98, 100, 98, 2024 + '–25']);
    });
    test('a child can hold several places', () => {
      assert.deepEqual(
        achievementsFor(KAVIN).map(a => `${a.rank}:${a.subject}`),
        ['1:Mathematics', '3:Science']
      );
    });
    test('rank 2 — silver', () => {
      const list = achievementsFor(AARAV);
      assert.deepEqual(list.map(a => [a.rank, a.tier, a.subject]), [[2, 'silver', 'Science']]);
    });
    test('rank 3 — bronze', () => {
      const list = achievementsFor(ANANYA);
      assert.deepEqual(list.map(a => [a.rank, a.tier, a.subject]), [[3, 'bronze', 'Mathematics']]);
    });
    test('a child outside the top three gets no achievement', () => {
      assert.deepEqual(achievementsFor(KAVYA), []);
      assert.ok(termResultsFor(KAVYA).every(r => r.rank > 3));
    });
    test('ranks are across the whole class and ties share a rank', () => {
      assert.equal(classMarks(9, 'Mathematics').length, 64);
      assert.equal(rankOf(90, [95, 90, 90, 80]), 2);
      assert.equal(ordinal(1) + ordinal(2) + ordinal(3) + ordinal(11) + ordinal(22), '1st2nd3rd11th22nd');
    });
    test('switching child changes the result (twins share one login)', async () => {
      const twins = PARENT_ACCOUNTS.find(a => a.children.some(c => c.id === KAVIN))!;
      assert.deepEqual(twins.children.map(c => c.id).sort(), [KAVIN, KAVYA]);
      const [a, b] = await Promise.all(twins.children.map(c => hallOfFameService.achievements(c.id)));
      assert.notDeepEqual(a.length, b.length);
    });
  });

  describe('Transport', () => {
    test('assigned transport for both twins', async () => {
      for (const id of [KAVIN, KAVYA]) {
        const a = await transportService.allocation(id);
        assert.ok(a, id);
        assert.equal(a!.route.number, 'Route 3');
        assert.equal(a!.vehicle.registration, 'TN 09 BX 4521');
        assert.equal(a!.pickup.name, 'Adyar Signal');
        assert.equal(a!.drop.name, 'School Main Gate');
        assert.ok(a!.driver.name && a!.attendant.name);
      }
    });
    test('no transport', async () => assert.equal(await transportService.allocation(ANANYA), null));
    test('trip phases follow the clock', () => {
      const a = allocationFor(KAVIN)!;
      assert.equal(tripState(a.route, '06:30', a.pickup).phase, 'Not started');
      const onRoute = tripState(a.route, '07:28', a.pickup);
      assert.equal(onRoute.phase, 'On route');
      assert.equal(onRoute.lastStop?.name, 'Kotturpuram MRTS');
      assert.equal(tripState(a.route, '10:05', a.pickup).phase, 'Reached school');
      const drop = tripState(a.route, '16:02', a.pickup);
      assert.equal(drop.phase, 'Drop trip on route');
      assert.equal(drop.etaMinutes, 13);
      assert.equal(tripState(a.route, '17:00', a.pickup).phase, 'All dropped');
    });
    test('the pickup ETA counts down before the bus arrives', () => {
      const a = allocationFor(KAVIN)!;
      assert.equal(tripState(a.route, '07:10', a.pickup).etaMinutes, 5);
      assert.equal(tripState(a.route, '07:20', a.pickup).etaMinutes, undefined);
    });
  });

  describe('Hostel', () => {
    test('hostel assigned', async () => {
      const h = await hostelService.forStudent(KAVIN);
      assert.ok(h);
      assert.deepEqual([h!.residence.block, h!.residence.room, h!.residence.bed, h!.residence.status], ['A Block', 'A-204', 'Bed 03', 'Active resident']);
      assert.equal(h!.hostel.warden.name, 'Mr. R. Senthil Kumar');
    });
    test('roll call ignores outpass nights', () => {
      const h = hostelFor(KAVIN)!;
      assert.equal(h.rollCalls.length, 7);
      assert.equal(h.attendancePct, 100);
    });
    test('the next approved outpass is shown', () => assert.equal(hostelFor(KAVIN)!.currentOutpass?.id, 'OP-2310'));
    test('no hostel', async () => assert.equal(await hostelService.forStudent(KAVYA), null));
  });
});
