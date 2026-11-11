import type { Alarm, AlarmEngine, NativeState, Settings } from './types';

const defaults: Settings = { onboarded: false, theme: 'system', sound: 'daybreak', vibrate: true, outfit: 'auto' };
const outfits = ['none', 'sprout', 'flowers', 'shades', 'crown'];

interface Preferences {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}

export interface AppState extends NativeState {
  ready: boolean;
  error: string | null;
  settings: Settings;
}

function readSettings(raw: string | null): Settings {
  if (!raw) return { ...defaults };
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ...defaults };
  }
  return {
    onboarded: value?.onboarded === true,
    theme: ['light', 'dark'].includes(value?.theme) ? value.theme : defaults.theme,
    sound: ['ripple', 'chime'].includes(value?.sound) ? value.sound : defaults.sound,
    vibrate: typeof value?.vibrate === 'boolean' ? value.vibrate : defaults.vibrate,
    outfit: outfits.includes(value?.outfit) ? value.outfit : defaults.outfit,
  };
}

export function createAlarmStore(engine: AlarmEngine, prefs: Preferences) {
  let state: AppState = {
    ready: false, error: null, alarms: [], ringingIds: [], checkInIds: [], followUpIds: [], mornings: [],
    permissions: { alarm: 'undetermined' }, settings: { ...defaults },
  };
  const listeners = new Set<() => void>();
  let pending = Promise.resolve();
  let preferencesLoaded = false;

  function publish(patch: Partial<AppState>) {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  }

  // Serialize snapshots, edits and foreground refreshes. A late snapshot must
  // never replace the result of a newer native mutation.
  function enqueue(work: () => Promise<void>) {
    const result = pending.then(work).catch((failure: unknown) => {
      publish({ error: failure instanceof Error ? failure.message : String(failure) });
      throw failure;
    });
    pending = result.catch(() => {});
    return result;
  }

  async function loadPreferences() {
    if (preferencesLoaded) return;
    const settings = readSettings(await prefs.read());
    preferencesLoaded = true;
    publish({ settings });
  }

  async function sync() {
    const native = await engine.getState();
    publish({ checkInIds: [], followUpIds: [], mornings: [], ...native, ready: true, error: null });
  }

  function mutate(action: () => Promise<void>) {
    return enqueue(async () => {
      try {
        await action();
      } catch (error) {
        // Permissions or part of the OS state may have changed during the call.
        await sync().catch(() => {});
        throw error;
      }
      await sync();
    });
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    refresh: () => enqueue(async () => { await loadPreferences(); await sync(); }),
    saveAlarm: (alarm: Alarm) => mutate(() => engine.saveAlarm(alarm)),
    deleteAlarm: (id: string) => mutate(() => engine.deleteAlarm(id)),
    // Dismissal goes directly to the OS even if a permission dialog is pending.
    stopAlarm: async (id: string) => {
      try {
        await engine.stopAlarm(id);
      } catch (error) {
        publish({ error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
      await enqueue(sync);
    },
    checkIn: (id: string) => mutate(async () => { await engine.checkIn?.(id); }),
    requestPermission: () => mutate(() => engine.requestPermission()),
    openSettings: () => engine.openSettings(),
    updateSettings: (patch: Partial<Settings>) => enqueue(async () => {
      await loadPreferences();
      const settings = { ...state.settings, ...patch };
      await prefs.write(JSON.stringify(settings));
      publish({ settings });
    }),
  };
}
