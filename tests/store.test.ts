import test from 'node:test';
import assert from 'node:assert/strict';
import { createAlarmStore } from '../src/alarm-store';
import type { Alarm, AlarmEngine, NativeState } from '../src/types';

const alarm: Alarm = {
  id: '0653c557-ec43-44f1-bc19-5b2c11dcb667', hour: 7, minute: 15,
  days: [], label: 'Morning', sound: 'ripple', enabled: true, vibrate: true, nextAt: null,
};

function fixture(stored: string | null = null, overrides: Partial<AlarmEngine> = {}) {
  const rows = new Map<string, Alarm>();
  const engine: AlarmEngine = {
    getState: async (): Promise<NativeState> => ({
      alarms: [...rows.values()], permissions: { alarm: 'granted' }, ringingIds: [],
    }),
    saveAlarm: async value => { rows.set(value.id, { ...value, nextAt: value.enabled ? 98765 : null }); },
    deleteAlarm: async id => { rows.delete(id); },
    stopAlarm: async () => {}, requestPermission: async () => {}, openSettings: async () => {},
    ...overrides,
  };
  const store = createAlarmStore(engine, {
    read: async () => stored,
    write: async value => { stored = value; },
  });
  return { store, rows, engine, persisted: () => stored };
}

test('creation, edits, toggles and deletion publish the scheduler response', async () => {
  const { store } = fixture();
  await store.saveAlarm(alarm);
  assert.equal(store.getSnapshot().alarms[0].nextAt, 98765);
  await Promise.all([
    store.saveAlarm({ ...alarm, enabled: false, label: 'Weekend', days: [6, 7] }),
    store.refresh(),
  ]);
  assert.deepEqual(store.getSnapshot().alarms, [{ ...alarm, enabled: false, label: 'Weekend', days: [6, 7] }]);
  await store.saveAlarm({ ...alarm, enabled: true });
  assert.equal(store.getSnapshot().alarms[0].enabled, true);
  await store.deleteAlarm(alarm.id);
  assert.deepEqual(store.getSnapshot().alarms, []);
});

test('failed native mutation keeps authoritative data and does not poison following operations', async () => {
  const { store, engine } = fixture();
  await store.saveAlarm(alarm);
  engine.saveAlarm = async () => { throw new Error('Access denied'); };
  await assert.rejects(store.saveAlarm({ ...alarm, minute: 20 }), /Access denied/);
  assert.equal(store.getSnapshot().alarms[0].minute, 15);
  assert.equal(store.getSnapshot().error, 'Access denied');
  await store.deleteAlarm(alarm.id);
  assert.equal(store.getSnapshot().error, null);
});

test('concurrent preference changes merge with persisted preferences', async () => {
  const { store, persisted } = fixture('{"vibrate":false,"obsolete":true,"theme":"old"}');
  await Promise.all([store.updateSettings({ onboarded: true }), store.updateSettings({ sound: 'chime' })]);
  assert.deepEqual(JSON.parse(persisted()!), {
    vibrate: false, onboarded: true, sound: 'chime', theme: 'system',
  });
});

test('Stop reaches the OS immediately while a permission request is open', async () => {
  let finish!: () => void;
  let stopped = '';
  const { store } = fixture(null, {
    requestPermission: () => new Promise(resolve => { finish = resolve; }),
    stopAlarm: async id => { stopped = id; },
  });
  const permission = store.requestPermission();
  await Promise.resolve();
  const stop = store.stopAlarm(alarm.id);
  assert.equal(stopped, alarm.id);
  finish();
  await Promise.all([permission, stop]);
});

test('returning to the app reflects a one-time alarm already stopped by the system', async () => {
  const { store, rows } = fixture();
  await store.saveAlarm(alarm);
  rows.set(alarm.id, { ...alarm, enabled: false, nextAt: null });
  await store.refresh();
  assert.equal(store.getSnapshot().alarms[0].enabled, false);
  assert.equal(store.getSnapshot().alarms[0].nextAt, null);
});

test('a failed initial read keeps the loading recovery screen available until retry succeeds', async () => {
  const { store, engine } = fixture();
  const healthy = engine.getState;
  engine.getState = async () => { throw new Error('Catalog unavailable'); };
  await assert.rejects(store.refresh(), /Catalog unavailable/);
  assert.equal(store.getSnapshot().ready, false);
  assert.equal(store.getSnapshot().error, 'Catalog unavailable');
  engine.getState = healthy;
  await store.refresh();
  assert.equal(store.getSnapshot().ready, true);
  assert.equal(store.getSnapshot().error, null);
});
