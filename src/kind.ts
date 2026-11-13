import type { AlarmKind } from './types';

// Names that are about getting up, at any hour (naps, night shifts).
const wakeWords = /\b(wake|waking|rise|nap|get up|morning)\b/i;
// Names that read like a daytime reminder rather than getting out of bed.
const reminderWords = /\b(lunch|dinner|breakfast|eat|snack|food|water|drink|hydrate|meds?|medicine|pills?|vitamins?|stretch|break|walk|call|meeting|pick ?up|school|gym|workout|study|homework|bedtime|sleep)\b/i;

/**
 * The kind a new alarm starts as until the user picks one: early hours are
 * wake-ups, the rest of the day and reminder-like names are nudges.
 */
export function suggestKind(hour: number, label: string): AlarmKind {
  if (wakeWords.test(label)) return 'wake';
  if (reminderWords.test(label)) return 'nudge';
  return hour >= 4 && hour < 11 ? 'wake' : 'nudge';
}

/** Alarms saved before kinds existed are wake-ups. */
export const kindOf = (alarm: { kind?: AlarmKind }): AlarmKind => alarm.kind ?? 'wake';
