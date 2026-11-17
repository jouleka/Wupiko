import { useEffect } from 'react';
import { requireNativeModule } from 'expo';
import type { Sound } from './types';

const native = requireNativeModule<{
  startSiren(sound: Sound): Promise<void>;
  stopSiren(): Promise<void>;
}>('WupikoAlarm');

/**
 * Wupiko's own ring while `active`. On iPhone it takes over from the system alert:
 * it ignores the silent switch, holds the volume up and plays on when the phone is
 * locked. Android's alarm service already rings until the check-in, so this does
 * nothing there.
 */
export function useSiren(active: boolean, sound: Sound) {
  useEffect(() => {
    if (!active) return;
    void native.startSiren(sound).catch(() => {});
    return () => { void native.stopSiren().catch(() => {}); };
  }, [active, sound]);
}
