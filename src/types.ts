export type Sound = 'daybreak' | 'ripple' | 'chime';
export type Theme = 'system' | 'light' | 'dark';
export type Outcome = 'onTime' | 'late' | 'missed';
/** A wake-up runs the full Wupiko check-in; a nudge is a plain reminder that Stop ends. */
export type AlarmKind = 'wake' | 'nudge';
export type OutfitChoice = 'auto' | 'none' | 'sprout' | 'flowers' | 'shades' | 'crown';

/** How one alarm occurrence ended: checked in before a follow-up, after one, or never. */
export interface Morning {
  alarmId: string;
  /** The occurrence time in milliseconds. */
  at: number;
  outcome: Outcome;
}

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  /** ISO weekdays, Monday = 1. An empty list means once. */
  days: number[];
  label: string;
  sound: Sound;
  vibrate: boolean;
  enabled: boolean;
  /** Missing on alarms saved before kinds existed, which are wake-ups. */
  kind?: AlarmKind;
  /** Native scheduler's next occurrence in milliseconds since the Unix epoch. */
  nextAt: number | null;
  /** When the next follow-up rings if the user has not checked in yet. */
  nagAt?: number | null;
}

export interface Settings {
  onboarded: boolean;
  theme: Theme;
  sound: Sound;
  vibrate: boolean;
  /** Which unlocked outfit Wupiko wears. */
  outfit: OutfitChoice;
}

export interface AlarmPermissions {
  alarm: 'granted' | 'denied' | 'undetermined';
  fullScreen?: boolean;
  notifications?: boolean;
}

export interface NativeState {
  alarms: Alarm[];
  permissions: AlarmPermissions;
  ringingIds: string[];
  /** Alarms that rang and are waiting for the user to check in. */
  checkInIds?: string[];
  /** Alarms whose current ring is a follow-up: the user silenced the alarm without checking in. */
  followUpIds?: string[];
  /** How recent alarm occurrences ended, oldest first. */
  mornings?: Morning[];
}

export interface AlarmEngine {
  getState(): Promise<NativeState>;
  saveAlarm(alarm: Alarm): Promise<void>;
  deleteAlarm(id: string): Promise<void>;
  stopAlarm(id: string): Promise<void>;
  /** Cancels the remaining follow-ups for an alarm that already rang. */
  checkIn?(id: string): Promise<void>;
  requestPermission(): Promise<void>;
  openSettings(): Promise<void>;
}
