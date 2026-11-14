import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterOf, collect, finds, pickFind, readTrips, season, stageOf, startTrip, storyAfter, type Trip, unpackAfter, untilNext, windowCloses } from '../src/finds';

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

test('revisits after the season start with places whose keepsake is missing', () => {
  const owned: Trip[] = finds.filter((f) => f.id !== 'shell').map((f, i) => ({ day: `d${i}`, find: f.id, at, collected: true }));
  for (let i = 1; i <= 28; i++) assert.equal(pickFind(`2026-12-${String(i).padStart(2, '0')}`, owned), 'shell');
});

test('mornings tell the season in order, one chapter per day', () => {
  let trips: Trip[] = [];
  for (let i = 0; i < season.chapters.length; i++) trips = startTrip(trips, `2026-12-${String(i + 1).padStart(2, '0')}`, at + i * 86_400_000);
  assert.deepEqual(trips.map((t) => t.chapter), season.chapters.map((_, i) => i + 1));
  assert.deepEqual(trips.map((t) => t.find), season.chapters.map((c) => c.find));
  assert.equal(chapterOf(trips[2])?.title, season.chapters[2].title);
  const after = startTrip(trips, '2026-12-20', at + 30 * 86_400_000);
  assert.equal(after[after.length - 1].chapter, undefined);
});

test('a second wake-up on the same day does not skip a chapter', () => {
  const once = startTrip([], '2026-12-01', at);
  assert.equal(startTrip(once, '2026-12-01', at + 3_600_000), once);
  assert.equal(startTrip(once, '2026-12-02', at + 86_400_000)[1].chapter, 2);
});

test('trips from before seasons start the story from chapter one', () => {
  const old: Trip[] = [{ day: '2026-11-13', find: 'moonflower', at, collected: true }];
  assert.equal(startTrip(old, '2026-11-14', at + 86_400_000)[1].chapter, 1);
});

test('the season is never forgotten, even after a long history', () => {
  let trips: Trip[] = [];
  for (let i = 0; i < 200; i++) trips = startTrip(trips, `day-${i}`, at + i * 86_400_000);
  assert.equal(trips.filter((t) => t.chapter).length, season.chapters.length);
  assert.equal(startTrip(trips, 'day-200', at + 200 * 86_400_000).filter((t) => t.chapter).length, season.chapters.length);
});

test('every chapter points at a real place', () => {
  for (const c of season.chapters) assert.ok(finds.some((f) => f.id === c.find));
});

test('stored trips survive bad data', () => {
  assert.deepEqual(readTrips(null), []);
  assert.deepEqual(readTrips('nope'), []);
  assert.deepEqual(readTrips(JSON.stringify([trip, { day: 'x', find: 'dragon', at }])), [trip]);
});
