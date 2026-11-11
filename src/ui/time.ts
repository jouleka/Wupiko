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

/** "in 7h 12m" style countdown to a timestamp. */
export function countdown(timestamp: number, now = Date.now()) {
  const minutes = Math.max(0, Math.ceil((timestamp - now) / 60000));
  if (minutes < 1) return 'any second now';
  const d = Math.floor(minutes / 1440), h = Math.floor((minutes % 1440) / 60), m = minutes % 60;
  if (d) return `in ${d}d ${h}h`;
  if (h) return m ? `in ${h}h ${m}m` : `in ${h}h`;
  return `in ${m} min`;
}

export function greeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Sleep tight';
}

/** Wupiko's opinion on a wake-up time. */
export function hourQuip(hour: number, minute = 0) {
  if (hour < 4) return 'Whoa… even the moon is asleep!';
  if (hour < 6) return 'Before the birds? Brave!';
  if (hour < 7) return 'Early bird mode: on';
  if (hour < 9) return minute === 0 ? 'A lovely round hour' : 'A perfectly cosy hour';
  if (hour < 11) return 'A slow & sunny start';
  if (hour < 14) return 'Nap’s over, sleepyhead?';
  if (hour < 17) return 'Afternoon reminder? I got you';
  if (hour < 21) return 'An evening jingle!';
  return 'A late-night ping ✦';
}
