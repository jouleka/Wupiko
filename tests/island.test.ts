import test from 'node:test';
import assert from 'node:assert/strict';
import { islandOf, pieces } from '../src/island';
import type { Morning, Outcome } from '../src/types';

const now = new Date(2026, 10, 20, 9).getTime();
const day = (daysAgo: number, outcome: Outcome, hour = 7): Morning =>
  ({ alarmId: 'a', at: new Date(2026, 10, 20 - daysAgo, hour).getTime(), outcome });

test('a new island is empty and sunny', () => {
  const island = islandOf([], now);
  assert.equal(island.growth, 0);
  assert.equal(island.earned.length, 0);
  assert.equal(island.next?.id, 'sprouts');
  assert.equal(island.weather, 'sunny');
});

test('good mornings grow the island, late ones count too', () => {
  const island = islandOf([day(3, 'onTime'), day(2, 'late'), day(1, 'onTime')], now);
  assert.equal(island.growth, 3);
  assert.deepEqual(island.earned.map((p) => p.id), ['sprouts', 'flowers', 'bush']);
  assert.equal(island.next?.id, 'bird');
});

test('missed mornings never take anything away, they only change the weather', () => {
  const good = Array.from({ length: 7 }, (_, i) => day(20 - i, 'onTime'));
  const before = islandOf(good, now);
  const after = islandOf([...good, day(2, 'missed'), day(1, 'missed')], now);
  assert.equal(after.growth, before.growth);
  assert.deepEqual(after.earned, before.earned);
  assert.equal(after.weather, 'gloomy');
  assert.equal(islandOf([...good, day(1, 'missed')], now).weather, 'cloudy');
});

test('the weather clears once misses are more than a week old', () => {
  assert.equal(islandOf([day(8, 'missed'), day(9, 'missed'), day(1, 'onTime')], now).weather, 'sunny');
  assert.equal(islandOf([day(6, 'missed')], now).weather, 'cloudy');
});

test('getting up after missing an earlier alarm still grows the island', () => {
  const island = islandOf([day(0, 'missed', 6), day(0, 'onTime', 8)], now);
  assert.equal(island.growth, 1);
  assert.equal(island.weather, 'cloudy');
});

test('two wake-ups on one day count as one good morning', () => {
  assert.equal(islandOf([day(1, 'onTime', 7), day(1, 'onTime', 15)], now).growth, 1);
});

test('a month of mornings earns everything', () => {
  const month = Array.from({ length: 30 }, (_, i) => day(40 - i, 'onTime'));
  const island = islandOf(month, now);
  assert.equal(island.earned.length, pieces.length);
  assert.equal(island.next, undefined);
});
