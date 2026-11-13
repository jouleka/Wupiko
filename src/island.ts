/**
 * Wupiko's island: your mornings made visible. Every good morning (on time or a
 * little late) grows it, and nothing ever gets taken away. Missed mornings only
 * change the weather for a while, and good mornings clear it up again.
 */
import { dayKey } from './streak';
import type { Morning } from './types';

export type PieceId =
  | 'sprouts' | 'flowers' | 'bush' | 'bird' | 'tree' | 'pond' | 'butterflies'
  | 'mushrooms' | 'grove' | 'hut' | 'boat' | 'lighthouse' | 'rainbow';

export interface Piece { id: PieceId; at: number; title: string; blurb: string }

/** In the order they appear. `at` is the number of good mornings needed. */
export const pieces: Piece[] = [
  { id: 'sprouts', at: 1, title: 'First sprouts', blurb: 'Something green! It starts here.' },
  { id: 'flowers', at: 2, title: 'Morning flowers', blurb: 'They open when you do.' },
  { id: 'bush', at: 3, title: 'Berry bush', blurb: 'Wupiko keeps sneaking berries.' },
  { id: 'bird', at: 4, title: 'A sleepy bird', blurb: 'Heard there was a good alarm around here.' },
  { id: 'tree', at: 5, title: 'Sun tree', blurb: 'A tree that faces east, like you.' },
  { id: 'pond', at: 7, title: 'Little pond', blurb: 'One week of mornings, one pond.' },
  { id: 'butterflies', at: 9, title: 'Butterflies', blurb: 'They only come to sunny islands.' },
  { id: 'mushrooms', at: 11, title: 'Mushroom ring', blurb: 'The Mushroom Village sent a few cousins.' },
  { id: 'grove', at: 14, title: 'Second tree', blurb: 'Two weeks! The sun tree has a friend.' },
  { id: 'hut', at: 18, title: 'Wupiko’s hut', blurb: 'Finally, a place to keep all those keepsakes.' },
  { id: 'boat', at: 22, title: 'Little boat', blurb: 'For the night trips. Very small. Very brave.' },
  { id: 'lighthouse', at: 26, title: 'Lighthouse', blurb: 'The crab from World’s Edge approves.' },
  { id: 'rainbow', at: 30, title: 'Rainbow', blurb: 'A whole month of mornings. Look at that.' },
];

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
  const good = new Set(mornings.filter((m) => m.outcome !== 'missed').map((m) => dayKey(m.at)));
  const growth = good.size;
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
