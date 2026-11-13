/**
 * Feeding Wupiko light: the wake-up check-in. Wupiko only warms up while the
 * light around the phone stays bright, so a quick flick of a bedside lamp does
 * nothing and a few steady seconds by a window or under room lights does it.
 */
export type LightLevel = 'dark' | 'dim' | 'bright' | 'sunny';

/** Lux boundaries. A bedside lamp at arm's length reads dim; room lights read bright; daylight reads sunny. */
export const lightLevels = { dim: 40, bright: 200, sunny: 1200 };

/**
 * Seconds of steady bright light it takes to fill the warmth meter. Short enough
 * to finish well before the first follow-up ring (one minute after the alarm).
 */
export const feedSeconds = 15;

/** Longest gap between readings that still counts, so a pause or lag never feeds Wupiko. */
const maxStep = 1;

export function levelOf(lux: number): LightLevel {
  if (lux >= lightLevels.sunny) return 'sunny';
  if (lux >= lightLevels.bright) return 'bright';
  if (lux >= lightLevels.dim) return 'dim';
  return 'dark';
}

// Warmth gained (or lost) per second at each level, as a share of the full meter.
const rate: Record<LightLevel, number> = {
  dark: -0.5 / feedSeconds,
  dim: 0,
  bright: 1 / feedSeconds,
  sunny: 1.6 / feedSeconds,
};

/** Warmth after `seconds` at `lux`. Warmth runs 0 (frozen) to 1 (fed). Once fed, it stays fed. */
export function warm(warmth: number, lux: number, seconds: number): number {
  if (warmth >= 1) return 1;
  const dt = Math.min(Math.max(seconds, 0), maxStep);
  return Math.min(1, Math.max(0, warmth + rate[levelOf(lux)] * dt));
}

/** Smooths sensor readings so one flash of light doesn't count as a bright room. */
export function smooth(previous: number | null, lux: number, weight = 0.3): number {
  if (previous == null || !Number.isFinite(previous)) return lux;
  return previous + (lux - previous) * weight;
}

export const lightLines: Record<LightLevel, string> = {
  dark: 'Brrr… it’s so dark. Find me some light!',
  dim: 'That’s just a candle… I need real light!',
  bright: 'Ooh, warm! Keep me right here…',
  sunny: 'SUNSHINE! Om nom nom!',
};
