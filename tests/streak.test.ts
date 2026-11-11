import test from 'node:test';
import assert from 'node:assert/strict';
import { justUnlocked, nextReward, summarize, unlocked, wornOutfit } from '../src/streak';
import type { Morning, Outcome } from '../src/types';

const at = (day: number, hour = 7) => new Date(2026, 10, day, hour).getTime();
const m = (day: number, outcome: Outcome, hour = 7): Morning => ({ alarmId: 'a', at: at(day, hour), outcome });

test('consecutive alarm days build a streak and days without alarms do not break it', () => {
  const s = summarize([m(2, 'onTime'), m(3, 'late'), m(5, 'onTime'), m(6, 'onTime')]);
  assert.equal(s.current, 4);
  assert.equal(s.best, 4);
  assert.equal(s.onTime, 3);
  assert.equal(s.latest?.outcome, 'onTime');
});

test('a missed morning resets the current streak but best is kept', () => {
  const s = summarize([m(1, 'onTime'), m(2, 'onTime'), m(3, 'onTime'), m(4, 'missed'), m(5, 'onTime')]);
  assert.equal(s.current, 1);
  assert.equal(s.best, 3);
});

test('a day is only as good as its worst alarm', () => {
  const s = summarize([m(1, 'onTime', 7), m(1, 'missed', 14)]);
  assert.equal(s.days.length, 1);
  assert.equal(s.days[0].outcome, 'missed');
  assert.equal(s.current, 0);
});

test('rewards unlock by best streak and are worn automatically or by choice', () => {
  assert.deepEqual(unlocked(7).map((r) => r.outfit), ['sprout', 'flowers']);
  assert.equal(nextReward(4)?.outfit, 'flowers');
  assert.equal(justUnlocked(6, 7)?.outfit, 'flowers');
  assert.equal(justUnlocked(7, 8), undefined);
  assert.equal(wornOutfit('auto', 8), 'flowers');
  assert.equal(wornOutfit('sprout', 8), 'sprout');
  assert.equal(wornOutfit('crown', 8), 'flowers', 'an outfit that is not earned yet falls back');
  assert.equal(wornOutfit('none', 30), 'none');
  assert.equal(wornOutfit('auto', 0), 'none');
});
