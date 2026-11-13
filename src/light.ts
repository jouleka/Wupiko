import { useCallback, useEffect, useState } from 'react';
import { requireNativeModule, type NativeModule } from 'expo';

export type LightAvailability = 'ready' | 'undetermined' | 'denied' | 'unavailable';

type LightEvents = { onLight: (event: { lux: number }) => void };
type LightModule = InstanceType<typeof NativeModule<LightEvents>> & {
  lightAvailability(): Promise<LightAvailability>;
  requestLightAccess(): Promise<boolean>;
  startLight(): Promise<void>;
  stopLight(): Promise<void>;
};

const native = requireNativeModule<LightModule>('WupikoAlarm');

/** Whether Wupiko can measure light here, and a way to ask for camera access on iOS. */
export function useLightAvailability() {
  const [availability, setAvailability] = useState<LightAvailability | null>(null);
  const check = useCallback(() => native.lightAvailability()
    .then(setAvailability, () => setAvailability('unavailable')), []);
  useEffect(() => { void check(); }, [check]);
  const ask = useCallback(async () => {
    await native.requestLightAccess().catch(() => false);
    await check();
  }, [check]);
  return { availability, ask };
}

/** Streams light readings in lux while `active`. Readings stop when the screen goes away. */
export function useLightReadings(active: boolean, onLux: (lux: number) => void) {
  useEffect(() => {
    if (!active) return;
    const sub = native.addListener('onLight', ({ lux }) => onLux(lux));
    void native.startLight().catch(() => {});
    return () => {
      sub.remove();
      void native.stopLight().catch(() => {});
    };
    // onLux is read through the latest closure by the caller's ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
