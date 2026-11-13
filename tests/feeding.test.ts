import test from 'node:test';
import assert from 'node:assert/strict';
import { feedSeconds, levelOf, smooth, warm } from '../src/feeding';

function feed(lux: number, seconds: number, start = 0) {
  let warmth = start;
  for (let t = 0; t < seconds; t += 0.25) warmth = warm(warmth, lux, 0.25);
  return warmth;
}

test('light levels separate a bedside lamp, room lights and daylight', () => {
  assert.equal(levelOf(5), 'dark');
  assert.equal(levelOf(90), 'dim');
  assert.equal(levelOf(350), 'bright');
  assert.equal(levelOf(5000), 'sunny');
});

test('steady room light feeds Wupiko in about the feeding time, daylight faster', () => {
  assert.ok(feed(350, feedSeconds - 5) < 1);
  assert.equal(feed(350, feedSeconds + 1), 1);
  assert.equal(feed(5000, feedSeconds * 0.7), 1);
});

test('a dim lamp never feeds Wupiko and darkness slowly cools it', () => {
  assert.equal(feed(90, 600), 0);
  const half = feed(350, feedSeconds / 2);
  assert.ok(feed(5, 10, half) < half);
  assert.ok(feed(5, 10, half) > 0);
});

test('a flick of light and a long pause between readings do not count', () => {
  assert.ok(feed(350, 2) < 0.15);
  assert.equal(warm(0, 5000, 600), warm(0, 5000, 1));
});

test('feeding fits before the first follow-up ring a minute after the alarm', () => {
  assert.ok(feedSeconds <= 20);
});

test('once fed, Wupiko stays fed', () => {
  assert.equal(warm(1, 0, 1), 1);
});

test('smoothing damps a single flash of light', () => {
  assert.equal(smooth(null, 20), 20);
  assert.ok(smooth(20, 5000) < 1600);
});
