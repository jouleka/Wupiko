import test from 'node:test';
import assert from 'node:assert/strict';
import { collect, finds, pickFind, readTrips, stageOf, startTrip, storyAfter, unpackAfter, untilNext, windowCloses, type Trip } from '../src/finds';

const at = 1_000_000;
const trip: Trip = { day: '2026-11-14', find: 'bun', at };

test('the find unfolds in stages and the keepsake is lost once the window closes', () => {
  assert.equal(stageOf(trip, at), 'postcard');
  assert.equal(stageOf(trip, at + storyAfter), 'story');
  assert.equal(stageOf(trip, at + unpackAfter), 'unpack');
  assert.equal(stageOf(trip, at + windowCloses), 'gone');
  assert.equal(stageOf({ ...trip, collected: true }, at + windowCloses * 10), 'collected');
});

test('the countdown points at the next stage', () => {
  assert.equal(untilNext(trip, at + 60_000), storyAfter - 60_000);
  assert.equal(untilNext(trip, at + storyAfter), unpackAfter - storyAfter);
  assert.equal(untilNext(trip, at + windowCloses), null);
});

test('only the first wake-up of a day starts a trip', () => {
  const once = startTrip([], '2026-11-14', at);
  assert.equal(once.length, 1);
  assert.equal(startTrip(once, '2026-11-14', at + 5000), once);
  assert.equal(startTrip(once, '2026-11-15', at + 86_400_000).length, 2);
});

test('the keepsake can only be unpacked while the unpack stage is open', () => {
  assert.equal(collect([trip], trip.day, at + storyAfter)[0].collected, undefined);
  assert.equal(collect([trip], trip.day, at + unpackAfter)[0].collected, true);
  assert.equal(collect([trip], trip.day, at + windowCloses)[0].collected, undefined);
});

test('new places come before repeats', () => {
  const owned: Trip[] = finds.filter((f) => f.id !== 'shell' && !f.rare).map((f, i) => ({ day: `d${i}`, find: f.id, at, collected: true }));
  const days = Array.from({ length: 40 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`);
  for (const day of days) {
    const pick = pickFind(day, owned);
    assert.ok(['shell', 'star', 'key'].includes(pick), `${day} picked ${pick}`);
  }
});

test('rare places turn up on some mornings but not most', () => {
  const days = Array.from({ length: 200 }, (_, i) => `2027-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}-${i}`);
  const rare = days.filter((d) => finds.find((f) => f.id === pickFind(d, []))?.rare).length;
  assert.ok(rare > 10 && rare < 80, `rare ${rare}`);
});

test('stored trips survive bad data', () => {
  assert.deepEqual(readTrips(null), []);
  assert.deepEqual(readTrips('nope'), []);
  assert.deepEqual(readTrips(JSON.stringify([trip, { day: 'x', find: 'dragon', at }])), [trip]);
});
