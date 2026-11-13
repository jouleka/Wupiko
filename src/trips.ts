import { useSyncExternalStore } from 'react';
import Storage from 'expo-sqlite/kv-store';
import { collect, readTrips, startTrip, type Trip } from './finds';
import { dayKey } from './island';

const key = 'wupiko.trips.v1';
let trips: Trip[] = [];
let loaded: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: Trip[]) {
  trips = next;
  listeners.forEach((listener) => listener());
}

function load() {
  loaded ??= Storage.getItem(key).then((raw) => publish(readTrips(raw)), () => {});
  return loaded;
}

async function save(update: (current: Trip[]) => Trip[]) {
  await load();
  const next = update(trips);
  if (next === trips) return;
  publish(next);
  await Storage.setItem(key, JSON.stringify(next));
}

/** The first wake-up check-in of the day sends Wupiko's night trip home. Returns whether a new trip started. */
export async function beginTodaysTrip(now = Date.now()) {
  const before = trips.length;
  await save((current) => startTrip(current, dayKey(now), now));
  return trips.length > before;
}

export const unpack = (day: string, now = Date.now()) => save((current) => collect(current, day, now));

export function useTrips() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    void load();
    return () => { listeners.delete(listener); };
  }, () => trips);
}
