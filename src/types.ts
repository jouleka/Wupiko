export type Sound = 'daybreak' | 'ripple' | 'chime';
export type Theme = 'system' | 'light' | 'dark';

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
  /** Native scheduler's next occurrence in milliseconds since the Unix epoch. */
  nextAt: number | null;
}

export interface Settings {
  onboarded: boolean;
  theme: Theme;
  sound: Sound;
  vibrate: boolean;
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
}

export interface AlarmEngine {
  getState(): Promise<NativeState>;
  saveAlarm(alarm: Alarm): Promise<void>;
  deleteAlarm(id: string): Promise<void>;
  stopAlarm(id: string): Promise<void>;
  requestPermission(): Promise<void>;
  openSettings(): Promise<void>;
}
