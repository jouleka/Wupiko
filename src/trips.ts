import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { requireNativeModule } from 'expo';
import Storage from 'expo-sqlite/kv-store';
import { collect, readTrips, startTrip, type Trip } from './finds';
import { dayKey } from './island';
import { allPingIds, planPings } from './pings';

export type PingStatus = 'granted' | 'denied' | 'undetermined';
const native = requireNativeModule<{
  pingStatus(): Promise<PingStatus>;
  requestPings(): Promise<boolean>;
  schedulePing(id: string, at: number, title: string, body: string): Promise<void>;
  cancelPings(ids: string[]): Promise<void>;
}>('WupikoAlarm');

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

/** Schedules the pings still to come for a trip, if notifications are allowed. Never throws. */
async function schedulePings(trip: Trip, now = Date.now()) {
  try {
    if (await native.pingStatus() !== 'granted') return;
    for (const ping of planPings(trip, now)) await native.schedulePing(ping.id, ping.at, ping.title, ping.body);
  } catch {
    // Pings are a nicety. The trip works without them.
  }
}

/** The first wake-up check-in of the day sends Wupiko's night trip home. Returns whether a new trip started. */
export async function beginTodaysTrip(now = Date.now()) {
  const day = dayKey(now);
  await load();
  const fresh = !trips.some((t) => t.day === day);
  await save((current) => startTrip(current, day, now));
  const trip = trips.find((t) => t.day === day);
  if (fresh && trip) await schedulePings(trip, now);
  return fresh;
}

export async function unpack(day: string, now = Date.now()) {
  await save((current) => collect(current, day, now));
  const trip = trips.find((t) => t.day === day);
  if (trip?.collected) await native.cancelPings(allPingIds(trip)).catch(() => {});
}

/** Whether pings are allowed, and a way to ask (then schedule today's pings). */
export function usePings(trip?: Trip) {
  const [status, setStatus] = useState<PingStatus | null>(null);
  useEffect(() => { void native.pingStatus().then(setStatus, () => setStatus('denied')); }, []);
  const enable = useCallback(async () => {
    await native.requestPings().catch(() => false);
    const next = await native.pingStatus().catch(() => 'denied' as const);
    setStatus(next);
    if (next === 'granted' && trip) await schedulePings(trip);
  }, [trip]);
  return { status, enable };
}

export function useTrips() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    void load();
    return () => { listeners.delete(listener); };
  }, () => trips);
}
