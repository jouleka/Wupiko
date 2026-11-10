import { getCalendars, getLocales } from 'expo-localization';

export const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const soundNames = { daybreak: 'Daybreak', ripple: 'Ripple', chime: 'Chime' } as const;

export function uses24Hours() {
  const calendar = getCalendars()[0];
  return calendar?.uses24hourClock ?? !new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12;
}

export function clockText(hour: number, minute: number) {
  const value = new Date(2024, 0, 15, hour, minute);
  const formatter = new Intl.DateTimeFormat(getLocales()[0]?.languageTag, {
    hour: uses24Hours() ? '2-digit' : 'numeric', minute: '2-digit', hourCycle: uses24Hours() ? 'h23' : 'h12',
  });
  const parts = formatter.formatToParts(value);
  return {
    time: parts.filter((p) => p.type !== 'dayPeriod').map((p) => p.value).join('').trim(),
    period: parts.find((p) => p.type === 'dayPeriod')?.value ?? '',
    full: formatter.format(value),
  };
}

export function daySummary(days: number[]) {
  const selection = [...days].sort().join('');
  if (!selection) return 'Once';
  if (selection === '1234567') return 'Every day';
  if (selection === '12345') return 'Weekdays';
  if (selection === '67') return 'Weekends';
  return [...days].sort().map((day) => dayNames[day - 1].slice(0, 3)).join(', ');
}

export function nextDay(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString(getLocales()[0]?.languageTag, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function nextDescription(timestamp: number) {
  const d = new Date(timestamp);
  return nextDay(timestamp) + ' at ' + clockText(d.getHours(), d.getMinutes()).full;
}
