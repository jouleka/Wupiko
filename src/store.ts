import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { requireNativeModule, type NativeModule } from 'expo';
import Storage from 'expo-sqlite/kv-store';
import { createAlarmStore } from './alarm-store';
import type { AlarmEngine } from './types';

type AlarmEvents = { onAlarmChange: (event: Record<string, never>) => void };
const native = requireNativeModule<AlarmEngine & InstanceType<typeof NativeModule<AlarmEvents>>>('WupikoAlarm');
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
    refresh();
    unsubscribe = () => { lifecycle.remove(); updates.remove(); };
  }
  return () => { if (--subscribers === 0) unsubscribe(); };
}

export function useWupiko() {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(observeNative, []);
  return { ...store, ...snapshot };
}
