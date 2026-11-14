import test from 'node:test';
import assert from 'node:assert/strict';
import { storyAfter, unpackAfter, windowCloses, type Trip } from '../src/finds';
import { allPingIds, planPings } from '../src/pings';

const at = 1_000_000;
const trip: Trip = { day: '2026-11-14', find: 'moonflower', at, chapter: 3 };

test('a new trip gets three pings: story, unpack and a last call', () => {
  const pings = planPings(trip, at);
  assert.deepEqual(pings.map((p) => p.at), [at + storyAfter, at + unpackAfter, at + windowCloses - 5 * 60_000]);
  assert.equal(pings[0].title, 'Chapter 3: The torn page');
});

test('only future pings are planned', () => {
  assert.equal(planPings(trip, at + unpackAfter).length, 1);
  assert.equal(planPings(trip, at + windowCloses).length, 0);
});

test('nothing is planned once the keepsake is unpacked', () => {
  assert.deepEqual(planPings({ ...trip, collected: true }, at), []);
});

test('revisits get a plain story ping', () => {
  const pings = planPings({ day: '2026-12-30', find: 'shell', at }, at);
  assert.equal(pings[0].title, 'Wupiko’s story is in');
  assert.match(pings[0].body, /Whale Song Bay/);
});

test('ping ids are stable so they can be cancelled', () => {
  assert.deepEqual(allPingIds(trip), planPings(trip, at).map((p) => p.id));
});
