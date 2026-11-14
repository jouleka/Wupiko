/**
 * The morning find. Each night Wupiko travels somewhere; after the first wake-up
 * check-in of the day it shares the trip in three stages: the postcard right
 * away, the story a few minutes later, then the keepsake it brought back. The
 * keepsake can only be unpacked while the sunrise window is open, so going back
 * to sleep means missing it.
 *
 * The first trips follow a season: one connected story, a chapter per morning,
 * each ending on a hook. After the season, Wupiko revisits places, starting with
 * the ones whose keepsake you missed.
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
  { id: 'star', place: 'the Comet Slide', phase: 'night', keepsake: 'Star Pebble', postcard: 'WHEEEE! (Sorry, I’m still sliding.)',
    story: 'Once a year a comet lets travelers slide down its tail. I went so fast I left my yawn behind. This pebble fell off right at the end.',
    blurb: 'Still crackling with comet sparkles.' },
  { id: 'key', place: 'the Clock Tower of Lost Minutes', phase: 'dusk', keepsake: 'Golden Key', postcard: 'This is where all the snoozed minutes go…',
    story: 'Every minute anyone snoozes ends up in this tower, piled in heaps. The caretaker gave me a key and said we should never need to visit again.',
    blurb: 'It locks away snoozed minutes for good.' },
];

export const findById = (id: string) => finds.find((f) => f.id === id);

export interface Chapter {
  find: KeepsakeId;
  title: string;
  postcard: string;
  story: string;
}

/** Season 1: The Missing Sunrise. One chapter per morning, in this order. */
export const season = {
  title: 'The Missing Sunrise',
  chapters: [
    { find: 'bun', title: 'A sunrise running late', postcard: 'Something is wrong with the mornings…',
      story: 'The cloud bakers are worried. The sunrise has been arriving a little later every day, and their buns won’t rise without it. The oldest baker pressed a crumb map into my paws. It points to the edge of the world. I’m going tonight.' },
    { find: 'marble', title: 'The dimming lamp', postcard: 'Made it to the edge of the world!',
      story: 'The crab who keeps the lighthouse says his lamp has been getting dimmer too. Last week he saw a glow drifting inland, as if a piece of the sunrise had wandered off. It floated toward a building full of tiny wings. Moths, maybe?' },
    { find: 'moonflower', title: 'The torn page', postcard: 'The moths found a book about it!',
      story: 'Deep in the stacks the moths found a book called Where Mornings Go. Every page was there except the last one, which was torn out. The librarian moth remembers who borrowed it: a passenger on the slowest train in the world.' },
    { find: 'ticket', title: 'The glowing suitcase', postcard: 'All aboard the Snail Express!',
      story: 'The snail conductor remembered the passenger at once: a hooded traveler with a suitcase that glowed. They got off at the Firefly Market. We should get there tomorrow… if the snail doesn’t stop for lunch again.' },
    { find: 'jar', title: 'Sunrise for sale', postcard: 'Everything here glows!',
      story: 'Bad news. A firefly admitted she traded a sliver of sunrise for three good jokes. Worse news: she sold it on to someone heading for a lake where everything is upside down. I bought a jar of glow, just in case.' },
    { find: 'feather', title: 'Upside-down mornings', postcard: 'I’m swimming in the sky?!',
      story: 'In the lake’s reflection the sunrise is upside down, and it has holes in it, like someone took pieces. The heron who rescued me says the mushrooms keep track of everything that goes missing. She gave me a feather to find the way.' },
    { find: 'acorn', title: 'What the mushrooms know', postcard: 'Every roof here has polka dots!',
      story: 'The mushrooms have heard of a tower where lost minutes pile up, every minute anyone ever snoozed. They think the sunrise got stuck under the pile. Nobody knows the way there. Only the whales sing about it.' },
    { find: 'shell', title: 'The whales’ song', postcard: 'The whales are singing the way!',
      story: 'The smallest whale sang me the directions, slightly off-key. The Clock Tower floats in the sky, and the only way up is to ride a comet. One passes tonight. I am very nervous and very excited.' },
    { find: 'star', title: 'Riding the comet', postcard: 'WHEEEE! Almost there!',
      story: 'I held on so tight. From the top of the comet I could see the tower, and it is buried in grey dusty minutes all the way to the roof. A little gold light flickers underneath. That has to be our sunrise!' },
    { find: 'key', title: 'Every minute you got up', postcard: 'We found it!',
      story: 'The pile was every minute anyone ever snoozed. But here is the thing: every morning you got up with me, one minute crumbled away. Today the last one under the sunrise cracked, and it rolled free. Mornings are on time again. Thank you. You did that.' },
  ] satisfies Chapter[],
};

/** One night's trip, started by the first wake-up check-in of a day. */
export interface Trip {
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  find: KeepsakeId;
  /** When the trip started (the check-in), in milliseconds. */
  at: number;
  collected?: boolean;
  /** 1-based season chapter. Missing on revisits and on trips from before seasons. */
  chapter?: number;
}

export const chapterOf = (trip: Trip) => (trip.chapter ? season.chapters[trip.chapter - 1] : undefined);

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

/** A revisit after the season: places whose keepsake you don't have yet come first. */
export function pickFind(day: string, trips: Trip[]): KeepsakeId {
  const owned = new Set(trips.filter((t) => t.collected).map((t) => t.find));
  const fresh = finds.filter((f) => !owned.has(f.id));
  const options = fresh.length ? fresh : finds;
  return options[hash(day) % options.length].id;
}

/** Starts today's trip unless one already exists: the next season chapter, then revisits. Keeps the most recent 120 days. */
export function startTrip(trips: Trip[], day: string, now: number): Trip[] {
  if (trips.some((t) => t.day === day)) return trips;
  const told = Math.max(0, ...trips.map((t) => t.chapter ?? 0));
  const next = told < season.chapters.length ? told + 1 : undefined;
  const trip: Trip = next
    ? { day, find: season.chapters[next - 1].find, at: now, chapter: next }
    : { day, find: pickFind(day, trips), at: now };
  // Season chapters are kept for good, so the story never restarts.
  const all = [...trips, trip];
  const rest = all.filter((t) => !t.chapter).slice(-120);
  return all.filter((t) => t.chapter || rest.includes(t));
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
