/**
 * The morning find. Each night Wupiko travels somewhere; after the first wake-up
 * check-in of the day it shares the trip in three stages: the postcard right
 * away, the story a few minutes later, then the keepsake it brought back. The
 * keepsake can only be unpacked while the sunrise window is open, so going back
 * to sleep means missing it.
 */
import type { Phase } from './ui/theme';

export type KeepsakeId = 'bun' | 'marble' | 'moonflower' | 'ticket' | 'jar' | 'feather' | 'acorn' | 'star' | 'shell' | 'key';

export interface Find {
  id: KeepsakeId;
  place: string;
  /** The sky on the postcard. */
  phase: Phase;
  /** Wupiko's line on the front of the postcard. */
  postcard: string;
  story: string;
  keepsake: string;
  blurb: string;
  /** Rare finds turn up less often. */
  rare?: boolean;
}

export const finds: Find[] = [
  { id: 'bun', place: 'the Cloud Bakery', phase: 'dawn', keepsake: 'Cloud Bun', postcard: 'It smells like warm sky up here!',
    story: 'The bakers up here knead clouds before the sun comes up. I helped shape one into a bun, and it floated off the tray twice before it agreed to bake.',
    blurb: 'Still a little warm. Do not let go of it outside.' },
  { id: 'marble', place: 'the Lighthouse at World’s Edge', phase: 'night', keepsake: 'Sea-glass Marble', postcard: 'The keeper lets me turn the big light!',
    story: 'The lighthouse keeper is a very old crab who hates being late. Every night he polishes the lamp with a sock and tells the ships good night by name.',
    blurb: 'Hold it to the light and you can see a tiny sea inside.' },
  { id: 'moonflower', place: 'the Moth Library', phase: 'night', keepsake: 'Pressed Moonflower', postcard: 'Shhh! Everyone here reads by moonlight.',
    story: 'The moths only borrow books about lamps. I found one about the sun and they all gathered round to listen while I read it out loud.',
    blurb: 'A bookmark that glows faintly when you read past bedtime.' },
  { id: 'ticket', place: 'the Snail Express', phase: 'day', keepsake: 'Tiny Train Ticket', postcard: 'Next stop: somewhere slow and lovely.',
    story: 'It is the slowest train in the world, so nobody is ever in a rush. The conductor stamped my ticket so gently it took four minutes.',
    blurb: 'Valid for one very relaxing journey.' },
  { id: 'jar', place: 'the Firefly Market', phase: 'dusk', keepsake: 'Jar of Glow', postcard: 'Everything here is sold for a giggle.',
    story: 'The fireflies trade light for laughs. I told them the one about the sleepy cloud and they paid me in glow. I think I am rich now.',
    blurb: 'Open it on a gloomy morning for an instant sunrise.' },
  { id: 'feather', place: 'the Upside-down Lake', phase: 'dawn', keepsake: 'Silver Feather', postcard: 'The fish fly and the birds swim. Normal!',
    story: 'I went for a dip and fell up into the sky by accident. A heron caught me and gave me this feather so I could find my way down.',
    blurb: 'Light as a whisper. It always points to home.' },
  { id: 'acorn', place: 'Mushroom Village', phase: 'day', keepsake: 'Acorn Cap Hat', postcard: 'Every house here has a polka-dot roof.',
    story: 'The mushrooms throw a festival every time it rains. It rained three times, so I danced three times. My legs are tired but happy.',
    blurb: 'Fits Wupiko perfectly. Fits you not at all.' },
  { id: 'shell', place: 'Whale Song Bay', phase: 'day', keepsake: 'Humming Shell', postcard: 'The whales are singing good morning!',
    story: 'Every whale here has a different morning song. The smallest one sings off-key and everyone loves it most. We sang it together.',
    blurb: 'Put it to your ear: it hums the smallest whale’s song.' },
  { id: 'star', place: 'the Comet Slide', phase: 'night', keepsake: 'Star Pebble', postcard: 'WHEEEE! (Sorry, I’m still sliding.)', rare: true,
    story: 'Once a year a comet lets travelers slide down its tail. I went so fast I left my yawn behind. This pebble fell off right at the end.',
    blurb: 'A rare one! Still crackling with comet sparkles.' },
  { id: 'key', place: 'the Clock Tower of Lost Minutes', phase: 'dusk', keepsake: 'Golden Key', postcard: 'This is where all the snoozed minutes go…', rare: true,
    story: 'Every minute anyone snoozes ends up in this tower, piled in heaps. The caretaker gave me a key and said we should never need to visit again.',
    blurb: 'A rare one! It locks away snoozed minutes for good.' },
];

export const findById = (id: string) => finds.find((f) => f.id === id);

/** One night's trip, started by the first wake-up check-in of a day. */
export interface Trip {
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  find: KeepsakeId;
  /** When the trip started (the check-in), in milliseconds. */
  at: number;
  collected?: boolean;
}

export const storyAfter = 3 * 60_000;
export const unpackAfter = 8 * 60_000;
/** After this the sunrise window closes and Wupiko falls asleep holding the keepsake. */
export const windowCloses = 25 * 60_000;

export type Stage = 'postcard' | 'story' | 'unpack' | 'collected' | 'gone';

export function stageOf(trip: Trip, now: number): Stage {
  if (trip.collected) return 'collected';
  const age = now - trip.at;
  if (age >= windowCloses) return 'gone';
  if (age >= unpackAfter) return 'unpack';
  if (age >= storyAfter) return 'story';
  return 'postcard';
}

/** Milliseconds until the next stage opens, or null when nothing else is coming. */
export function untilNext(trip: Trip, now: number): number | null {
  const stage = stageOf(trip, now);
  if (stage === 'postcard') return trip.at + storyAfter - now;
  if (stage === 'story') return trip.at + unpackAfter - now;
  if (stage === 'unpack') return trip.at + windowCloses - now;
  return null;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Picks the day's destination. Places Wupiko hasn't brought a keepsake back
 * from come first; rare places turn up about one morning in five.
 */
export function pickFind(day: string, trips: Trip[]): KeepsakeId {
  const owned = new Set(trips.filter((t) => t.collected).map((t) => t.find));
  const h = hash(day);
  const rareMorning = h % 5 === 0;
  const fresh = finds.filter((f) => !owned.has(f.id));
  const pool = (fresh.length ? fresh : finds).filter((f) => !!f.rare === rareMorning);
  const options = pool.length ? pool : (fresh.length ? fresh : finds);
  return options[Math.floor(h / 5) % options.length].id;
}

/** Starts today's trip unless one already exists. Keeps the most recent 120 days. */
export function startTrip(trips: Trip[], day: string, now: number): Trip[] {
  if (trips.some((t) => t.day === day)) return trips;
  return [...trips, { day, find: pickFind(day, trips), at: now }].slice(-120);
}

/** Unpacks the keepsake, only while the unpack stage is open. */
export function collect(trips: Trip[], day: string, now: number): Trip[] {
  return trips.map((t) => (t.day === day && stageOf(t, now) === 'unpack' ? { ...t, collected: true } : t));
}

export function readTrips(raw: string | null): Trip[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((t) => typeof t?.day === 'string' && typeof t?.at === 'number' && findById(t?.find))
      : [];
  } catch {
    return [];
  }
}
