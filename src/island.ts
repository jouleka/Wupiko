/**
 * Wupiko's island: the one place your mornings add up. Every good morning (on
 * time or a little late) grows it, some milestones also bring Wupiko an outfit,
 * and nothing ever gets taken away. Missed mornings only change the weather for
 * a while, and good mornings clear it up again.
 */
import type { Morning } from './types';
import type { Outfit } from './ui/Mascot';

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type PieceId =
  | 'sprouts' | 'flowers' | 'bush' | 'bird' | 'tree' | 'pond' | 'butterflies'
  | 'mushrooms' | 'grove' | 'hut' | 'boat' | 'lighthouse' | 'rainbow';

export interface Piece {
  id: PieceId; at: number; title: string; blurb: string;
  /** An outfit Wupiko gets at this milestone, kept forever. */
  outfit?: { id: Exclude<Outfit, 'none'>; title: string };
}

/** In the order they appear. `at` is the number of good mornings needed. */
export const pieces: Piece[] = [
  { id: 'sprouts', at: 1, title: 'First sprouts', blurb: 'Something green! It starts here.' },
  { id: 'flowers', at: 2, title: 'Morning flowers', blurb: 'They open when you do.' },
  { id: 'bush', at: 3, title: 'Berry bush', blurb: 'Wupiko keeps sneaking berries.', outfit: { id: 'sprout', title: 'Lucky sprout' } },
  { id: 'bird', at: 4, title: 'A sleepy bird', blurb: 'Heard there was a good alarm around here.' },
  { id: 'tree', at: 5, title: 'Sun tree', blurb: 'A tree that faces east, like you.' },
  { id: 'pond', at: 7, title: 'Little pond', blurb: 'One week of mornings, one pond.', outfit: { id: 'flowers', title: 'Flower crown' } },
  { id: 'butterflies', at: 9, title: 'Butterflies', blurb: 'They only come to sunny islands.' },
  { id: 'mushrooms', at: 11, title: 'Mushroom ring', blurb: 'The Mushroom Village sent a few cousins.' },
  { id: 'grove', at: 14, title: 'Second tree', blurb: 'Two weeks! The sun tree has a friend.', outfit: { id: 'shades', title: 'Cool sunnies' } },
  { id: 'hut', at: 18, title: 'Wupiko’s hut', blurb: 'Finally, a place to keep all those keepsakes.' },
  { id: 'boat', at: 22, title: 'Little boat', blurb: 'For the night trips. Very small. Very brave.' },
  { id: 'lighthouse', at: 26, title: 'Lighthouse', blurb: 'The crab from World’s Edge approves.' },
  { id: 'rainbow', at: 30, title: 'Rainbow', blurb: 'A whole month of mornings. Look at that.', outfit: { id: 'crown', title: 'Golden crown' } },
];

/** How many good mornings so far: days on which any wake-up succeeded. */
export function goodMornings(mornings: Morning[]) {
  return new Set(mornings.filter((m) => m.outcome !== 'missed').map((m) => dayKey(m.at))).size;
}

/** Outfits earned at island milestones, in order. */
export function outfitsEarned(growth: number) {
  return pieces.filter((p) => p.outfit && growth >= p.at).map((p) => p.outfit!);
}

/** What Wupiko wears: the chosen outfit if earned, otherwise the newest one earned. */
export function wornOutfit(choice: Outfit | 'auto', growth: number): Outfit {
  const earned = outfitsEarned(growth);
  if (choice === 'none') return 'none';
  if (choice !== 'auto' && earned.some((o) => o.id === choice)) return choice;
  return earned[earned.length - 1]?.id ?? 'none';
}

/** Pieces that appeared between two growth counts, for the check-in celebration. */
export function newPieces(before: number, after: number) {
  return pieces.filter((p) => before < p.at && after >= p.at);
}

export type Weather = 'sunny' | 'cloudy' | 'gloomy';

export interface Island {
  /** Good mornings ever. Only ever goes up. */
  growth: number;
  earned: Piece[];
  next?: Piece;
  weather: Weather;
  /** Missed mornings in the last seven days. */
  missedThisWeek: number;
}

const week = 7 * 86_400_000;

/**
 * A day grows the island if you got up for any wake-up that day, even after
 * missing an earlier one. Missed mornings only count toward the weather.
 */
export function islandOf(mornings: Morning[], now = Date.now()): Island {
  const growth = goodMornings(mornings);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const since = today.getTime() - week + 86_400_000;
  const missedThisWeek = new Set(mornings.filter((m) => m.outcome === 'missed' && m.at >= since).map((m) => dayKey(m.at))).size;
  const weather: Weather = missedThisWeek === 0 ? 'sunny' : missedThisWeek === 1 ? 'cloudy' : 'gloomy';
  return {
    growth,
    earned: pieces.filter((p) => growth >= p.at),
    next: pieces.find((p) => growth < p.at),
    weather,
    missedThisWeek,
  };
}

export const weatherLine: Record<Weather, string> = {
  sunny: 'Sunny skies. No missed mornings this week.',
  cloudy: 'A little cloudy after a missed morning. Good mornings clear it up.',
  gloomy: 'Gloomy this week, and the flowers are drooping. A few good mornings will bring the sun back.',
};
