import test from 'node:test';
import assert from 'node:assert/strict';
import { kindOf, suggestKind } from '../src/kind';

test('early hours suggest a wake-up and the rest of the day a nudge', () => {
  assert.equal(suggestKind(6, ''), 'wake');
  assert.equal(suggestKind(4, ''), 'wake');
  assert.equal(suggestKind(10, 'Rise & shine'), 'wake');
  assert.equal(suggestKind(11, ''), 'nudge');
  assert.equal(suggestKind(13, ''), 'nudge');
  assert.equal(suggestKind(2, ''), 'nudge');
});

test('reminder-like names suggest a nudge even in the morning', () => {
  assert.equal(suggestKind(8, 'Take meds'), 'nudge');
  assert.equal(suggestKind(9, 'Drink water'), 'nudge');
  assert.equal(suggestKind(7, 'Gym time'), 'nudge');
  assert.equal(suggestKind(7, 'Wake up'), 'wake');
});

test('names about getting up suggest a wake-up at any hour', () => {
  assert.equal(suggestKind(15, 'Nap’s over'), 'wake');
  assert.equal(suggestKind(14, 'Wake up for night shift'), 'wake');
  assert.equal(suggestKind(13, 'Lunch'), 'nudge');
});

test('alarms saved before kinds existed are wake-ups', () => {
  assert.equal(kindOf({}), 'wake');
  assert.equal(kindOf({ kind: 'nudge' }), 'nudge');
});
