/**
 * Gentle pings for the morning find, so nobody misses the story or the keepsake:
 * the story is in, the bag is ready, and a last call before the window closes.
 */
import { chapterOf, findById, storyAfter, unpackAfter, windowCloses, type Trip } from './finds';

export interface Ping { id: string; at: number; title: string; body: string }

const lastCall = windowCloses - 5 * 60_000;

/** The pings still to come for a trip. Nothing once the keepsake is unpacked. */
export function planPings(trip: Trip, now: number): Ping[] {
  if (trip.collected) return [];
  const chapter = chapterOf(trip);
  const place = findById(trip.find)?.place ?? 'its trip';
  const pings: Ping[] = [
    { id: pingId(trip, 'story'), at: trip.at + storyAfter,
      title: chapter ? `Chapter ${trip.chapter}: ${chapter.title}` : 'Wupiko’s story is in',
      body: chapter ? 'Wupiko is ready to tell you what happened next.' : `Come hear what happened at ${place}.` },
    { id: pingId(trip, 'unpack'), at: trip.at + unpackAfter,
      title: 'Wupiko brought you something!', body: 'Its bag is ready to unpack.' },
    { id: pingId(trip, 'last'), at: trip.at + lastCall,
      title: 'Wupiko is getting sleepy…', body: 'Five minutes left to unpack today’s keepsake.' },
  ];
  return pings.filter((p) => p.at > now);
}

export const pingId = (trip: Trip, kind: 'story' | 'unpack' | 'last') => `trip-${trip.day}-${kind}`;
export const allPingIds = (trip: Trip) => (['story', 'unpack', 'last'] as const).map((kind) => pingId(trip, kind));
