import type { Morning, Outcome } from './types';

export interface Day {
  /** Local calendar day, YYYY-MM-DD. */
  key: string;
  /** Start of the local day in milliseconds. */
  date: number;
  outcome: Outcome;
}

export interface Summary {
  /** Consecutive alarm days, newest first, without a missed morning. Days without alarms don't break it. */
  current: number;
  best: number;
  /** On-time mornings ever, for the garden's size. */
  onTime: number;
  days: Day[];
  latest?: Day;
}

export type Outfit = 'none' | 'sprout' | 'flowers' | 'shades' | 'crown';

/** Streak milestones, in order. Each unlocks something for Wupiko to wear. */
export const rewards: { days: number; outfit: Exclude<Outfit, 'none'>; title: string; blurb: string }[] = [
  { days: 3, outfit: 'sprout', title: 'Lucky sprout', blurb: 'A tiny leaf for a tiny habit.' },
  { days: 7, outfit: 'flowers', title: 'Flower crown', blurb: 'One whole week of sunny mornings!' },
  { days: 14, outfit: 'shades', title: 'Cool sunnies', blurb: 'Two weeks. Too bright to look at.' },
  { days: 30, outfit: 'crown', title: 'Golden crown', blurb: 'A month! Royalty of mornings.' },
];

export function dayKey(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const rank: Record<Outcome, number> = { onTime: 0, late: 1, missed: 2 };

export function summarize(mornings: Morning[]): Summary {
  const byDay = new Map<string, Day>();
  for (const m of mornings) {
    const key = dayKey(m.at);
    const start = new Date(m.at);
    start.setHours(0, 0, 0, 0);
    const day = byDay.get(key);
    // A day is only as good as its worst alarm.
    if (!day || rank[m.outcome] > rank[day.outcome]) byDay.set(key, { key, date: start.getTime(), outcome: m.outcome });
  }
  const days = [...byDay.values()].sort((a, b) => a.date - b.date);
  let best = 0, run = 0;
  for (const day of days) {
    run = day.outcome === 'missed' ? 0 : run + 1;
    best = Math.max(best, run);
  }
  return { current: run, best, onTime: days.filter((d) => d.outcome === 'onTime').length, days, latest: days[days.length - 1] };
}

/** Outfits unlocked by the best streak ever reached. Once earned, always kept. */
export function unlocked(best: number) {
  return rewards.filter((r) => best >= r.days);
}

/** The next milestone to chase, if any. */
export function nextReward(current: number) {
  return rewards.find((r) => current < r.days);
}

/** A reward reached exactly by this streak, for a one-time celebration. */
export function justUnlocked(before: number, after: number) {
  return rewards.find((r) => before < r.days && after >= r.days);
}

/** What Wupiko wears: the chosen outfit if earned, otherwise the best one earned. */
export function wornOutfit(choice: Outfit | 'auto', best: number): Outfit {
  const earned = unlocked(best);
  if (choice === 'none') return 'none';
  if (choice !== 'auto' && earned.some((r) => r.outfit === choice)) return choice;
  return earned[earned.length - 1]?.outfit ?? 'none';
}
