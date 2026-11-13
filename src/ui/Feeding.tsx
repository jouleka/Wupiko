import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { levelOf, lightLines, smooth, warm, type LightLevel } from '../feeding';
import { useLightReadings } from '../light';
import { Icon, Sky } from './Art';
import { Mascot, type Outfit } from './Mascot';
import { Button, row } from './components';
import { candy } from './theme';

const levelLabel: Record<LightLevel, string> = { dark: 'Too dark', dim: 'Too dim', bright: 'Bright!', sunny: 'Sunny!' };
const levelColor: Record<LightLevel, string> = { dark: '#5B6B8C', dim: '#9C8BB5', bright: candy.sun, sunny: '#FFB020' };

// Warmth per alarm, kept while the app runs, so a follow-up ring that interrupts
// feeding doesn't send Wupiko back to frozen.
const kept = new Map<string, number>();

/**
 * Wupiko is cold and sleepy until it soaks up real light. The warmth meter only
 * fills while the light stays bright, so a quick flick of a lamp does nothing.
 */
export function FeedingStage({ id, width, height, outfit, done, onProgress }: {
  id: string; width: number; height: number; outfit: Outfit; done: boolean; onProgress: (warmth: number) => void;
}) {
  const reduce = useReducedMotion();
  // Android's light sensor only reports changes, so steady light means no new
  // readings. Keep the latest raw value and smooth toward it on every tick.
  const raw = useRef<number | null>(null);
  const lux = useRef<number | null>(null);
  const warmth = useRef(kept.get(id) ?? 0);
  const [level, setLevel] = useState<LightLevel>('dark');
  const [shown, setShown] = useState(() => kept.get(id) ?? 0);
  const [reading, setReading] = useState<number | null>(null);
  useLightReadings(!done, (value) => { raw.current = value; });

  useEffect(() => {
    if (done) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      if (raw.current != null) lux.current = smooth(lux.current, raw.current);
      const value = lux.current ?? 0;
      warmth.current = warm(warmth.current, value, (now - last) / 1000);
      if (warmth.current >= 1) kept.delete(id);
      else kept.set(id, warmth.current);
      last = now;
      setLevel(levelOf(value));
      setReading(lux.current);
      setShown(warmth.current);
      onProgress(warmth.current);
    }, 250);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Tell the user (and screen readers) when the light changes enough to matter.
  const previous = useRef<LightLevel>('dark');
  useEffect(() => {
    if (level === previous.current) return;
    const warmer = ['dark', 'dim', 'bright', 'sunny'].indexOf(level) > ['dark', 'dim', 'bright', 'sunny'].indexOf(previous.current);
    previous.current = level;
    if (warmer && (level === 'bright' || level === 'sunny')) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    AccessibilityInfo.announceForAccessibility(lightLines[level]);
  }, [level]);

  // Wupiko shivers while it is cold and the light isn't helping.
  const shiver = useSharedValue(0);
  const cold = !done && (level === 'dark' || level === 'dim');
  useEffect(() => {
    if (reduce || !cold) {
      cancelAnimation(shiver);
      shiver.set(withTiming(0, { duration: 120 }));
      return;
    }
    shiver.set(withRepeat(withSequence(withTiming(1, { duration: 60 }), withTiming(-1, { duration: 120 }), withTiming(0, { duration: 60 })), -1, false));
    return () => cancelAnimation(shiver);
  }, [cold, reduce, shiver]);
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: shiver.value * 3 }] }));

  const size = Math.min(170, width * .46);
  const glow = size * (1.1 + shown * .7);
  const phase = done || shown > .66 ? 'day' : shown > .33 ? 'dawn' : 'night';
  const say = done ? 'Mmm, toasty! I’m wide awake!' : lightLines[level];
  return <View style={{ width, height }}>
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }}><Sky phase={phase} height={height} radius={30} /></View>
    <View style={[row, { position: 'absolute', top: 14, alignSelf: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,.85)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }]}
      accessible accessibilityLabel={`Light: ${levelLabel[level]}`}>
      <Icon name={level === 'dark' ? 'moon' : 'sun'} color={levelColor[level]} size={16} weight={2.6} />
      <Text style={{ color: candy.ink, fontWeight: '900', fontSize: 14 }}>{done ? 'Fed!' : levelLabel[level]}</Text>
      {reading != null && !done && <Text style={{ color: '#7A6F86', fontWeight: '700', fontSize: 12, fontVariant: ['tabular-nums'] }}>≈ {Math.round(reading)} lux</Text>}
    </View>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View pointerEvents="none" style={{ position: 'absolute', width: glow, height: glow, borderRadius: glow / 2, backgroundColor: candy.sun, opacity: .15 + shown * .5 }} />
      <Animated.View style={shake}>
        <Mascot mood={done ? 'happy' : shown > .5 ? 'awake' : 'sleepy'} size={size} animate say={say} outfit={outfit} />
      </Animated.View>
    </View>
  </View>;
}

/** Shown once on iPhone before the camera is first used to measure light. */
export function LightAsk({ width, height, onAllow, onSkip, busy }: {
  width: number; height: number; onAllow: () => void; onSkip: () => void; busy: boolean;
}) {
  return <View style={{ width, height, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }}><Sky phase="night" height={height} radius={30} /></View>
    <Mascot mood="sleepy" size={Math.min(140, width * .38)} animate say="I run on sunshine…" />
    <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 23 }}>
      Wupiko wakes up by soaking up real light. Let it peek through the camera to feel how bright it is. No photos, ever.
    </Text>
    <View style={{ gap: 8, alignSelf: 'stretch' }}>
      <Button testID="allow-light" title="Let Wupiko see the light" icon="sun" disabled={busy} onPress={onAllow} />
      <Button testID="skip-light" title="Not now" secondary disabled={busy} onPress={onSkip} />
    </View>
  </View>;
}
