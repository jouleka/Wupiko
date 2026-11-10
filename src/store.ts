import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { requireNativeModule, type NativeModule } from 'expo';
import Storage from 'expo-sqlite/kv-store';
import { createAlarmStore } from './alarm-store';
import type { AlarmEngine, Theme } from './types';

type RingAppearance = { setRingTheme?: (theme: Theme) => Promise<void> };
type AlarmEvents = { onAlarmChange: (event: Record<string, never>) => void };
const native = requireNativeModule<AlarmEngine & RingAppearance & InstanceType<typeof NativeModule<AlarmEvents>>>('WupikoAlarm');
const storageKey = 'wupiko.preferences.v1';
const store = createAlarmStore(native, {
  read: () => Storage.getItem(storageKey),
  write: value => Storage.setItem(storageKey, value),
});

let subscribers = 0;
let unsubscribe = () => {};
function observeNative() {
  if (++subscribers === 1) {
    const refresh = () => { void store.refresh().catch(() => {}); };
    const lifecycle = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    const updates = native.addListener('onAlarmChange', refresh);
    let ringTheme: Theme | undefined;
    const appearance = store.subscribe(() => {
      const { ready, settings } = store.getSnapshot();
      if (Platform.OS === 'android' && ready && native.setRingTheme && ringTheme !== settings.theme) {
        ringTheme = settings.theme;
        // A locked-boot activity cannot access the UI's credential-protected SQLite store.
        void Promise.resolve().then(() => native.setRingTheme?.(settings.theme))
          .catch(() => { ringTheme = undefined; });
      }
    });
    refresh();
    unsubscribe = () => { lifecycle.remove(); updates.remove(); appearance(); };
  }
  return () => { if (--subscribers === 0) unsubscribe(); };
}

export function useWupiko() {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(observeNative, []);
  return { ...store, ...snapshot };
}
