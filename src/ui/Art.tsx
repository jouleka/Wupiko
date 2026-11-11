import { useEffect, type ReactNode } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Mascot, Twinkle, type Mood } from './Mascot';
import { phaseOf, skies, usePalette, type Phase } from './theme';

export { Mascot, type Mood, type Outfit } from './Mascot';

export function Wordmark({ small = false, color }: { small?: boolean; color?: string }) {
  const p = usePalette();
  const width = small ? 90 : 108;
  return <Image accessible accessibilityLabel="Wupiko" resizeMode="contain" source={require('../../assets/brand/wordmark.png')} style={{ width, height: width * .282, tintColor: color ?? p.ink }} />;
}

export function Cloud({ width, color = '#FFFFFF', opacity = .9 }: { width: number; color?: string; opacity?: number }) {
  return <Svg width={width} height={width * .5} viewBox="0 0 100 50" opacity={opacity}>
    <Path d="M18 46 C4 46 2 30 14 27 C12 14 30 8 38 18 C44 4 70 4 72 22 C86 18 98 30 90 40 C96 46 90 48 84 46 Z" fill={color} />
  </Svg>;
}

function Drift({ children, top, from, distance, duration, reduce }: { children: ReactNode; top: number; from: number; distance: number; duration: number; reduce: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.set(withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [duration, reduce, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * distance }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top, left: from }, style]}>{children}</Animated.View>;
}

/** Sky, hills and weather for a part of the day. Content sits on top. */
export function Sky({ phase, height, radius = 30, children }: { phase: Phase; height: number; radius?: number; children?: ReactNode }) {
  const reduce = useReducedMotion();
  const s = skies[phase];
  const night = phase === 'night';
  const id = `sky-${phase}`;
  return <View style={{ height, overflow: 'hidden', borderRadius: radius, backgroundColor: s.bottom }}>
    <Svg accessible={false} style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={s.top} /><Stop offset="1" stopColor={s.bottom} /></LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="360" height="220" fill={`url(#${id})`} />
      {night ? <>
        <Circle cx="290" cy="52" r="34" fill={s.glow} opacity={.18} />
        <Path d="M296 31 A22 22 0 1 0 311 64 A18 18 0 1 1 296 31 Z" fill={s.glow} />
      </> : <>
        <Circle cx={phase === 'day' ? 290 : 250} cy={phase === 'day' ? 50 : 128} r={phase === 'day' ? 46 : 64} fill={s.glow} opacity={.35} />
        <Circle cx={phase === 'day' ? 290 : 250} cy={phase === 'day' ? 50 : 128} r={phase === 'day' ? 26 : 38} fill={phase === 'dusk' ? '#FFD3A8' : '#FFE27A'} />
      </>}
      <Path d="M-20 160 Q50 112 120 140 T250 138 Q310 116 380 130 V240 H-20 Z" fill={s.hills[0]} />
      <Path d="M-10 178 Q70 140 150 168 Q205 186 250 168 T380 160 V240 H-10 Z" fill={s.hills[1]} />
      <Path d="M-10 206 Q80 170 170 190 Q230 202 280 190 Q330 178 380 192 V240 H-10 Z" fill={s.hills[2]} />
      {phase === 'day' && <>
        <Ellipse cx="60" cy="170" rx="3" ry="3" fill="#FFF" /><Ellipse cx="64" cy="168" rx="2" ry="2" fill="#FF8FB1" />
        <Ellipse cx="300" cy="182" rx="3" ry="3" fill="#FFF" /><Ellipse cx="296" cy="184" rx="2" ry="2" fill="#FFC83D" />
      </>}
    </Svg>
    {night ? <>
      {[[.1, .14, 12], [.28, .3, 8], [.46, .1, 10], [.62, .34, 7], [.08, .48, 7], [.88, .5, 9]].map(([x, y, sz], i) =>
        <View key={i} pointerEvents="none" style={{ position: 'absolute', left: `${x * 100}%`, top: height * y }}><Twinkle size={sz} color="#FFF4D2" delay={i * 330} /></View>)}
    </> : <>
      <Drift top={height * .1} from={-10} distance={36} duration={9000} reduce={reduce}><Cloud width={74} opacity={phase === 'dusk' ? .55 : .85} /></Drift>
      <Drift top={height * .32} from={130} distance={-28} duration={12000} reduce={reduce}><Cloud width={48} opacity={phase === 'dusk' ? .45 : .7} /></Drift>
    </>}
    {children}
  </View>;
}

/** Full-width illustration with the mascot standing on the hills. */
export function Scene({ mood = 'awake', phase, compact = false, interactive = false, say }: { mood?: Mood; phase?: Phase; compact?: boolean; interactive?: boolean; say?: string | null }) {
  const { width, height } = useWindowDimensions();
  const sceneHeight = compact ? 170 : Math.min(330, Math.max(210, height * .33));
  const creature = compact ? 120 : Math.min(176, width * .44, sceneHeight * .6);
  return <Sky phase={phase ?? (mood === 'sleepy' ? 'night' : phaseOf(new Date().getHours()))} height={sceneHeight}>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: sceneHeight * .06 }}>
      <Mascot mood={mood} size={creature} animate interactive={interactive} say={say} />
    </View>
  </Sky>;
}

export type IconName = 'settings' | 'back' | 'close' | 'plus' | 'arrow' | 'clock' | 'check' | 'sun' | 'moon' | 'sound' | 'repeat' | 'vibrate' | 'trash' | 'external' | 'bell' | 'wave' | 'sunrise' | 'sparkle' | 'tag' | 'palette' | 'shield' | 'heart';
const paths: Record<IconName, string> = {
  settings: 'M10.5 3h3l.65 2.25 2.04 1.18 2.28-.57 1.5 2.6-1.62 1.69v2.38l1.62 1.69-1.5 2.6-2.28-.57-2.04 1.18-.65 2.25h-3l-.65-2.25-2.04-1.18-2.28.57-1.5-2.6 1.62-1.69v-2.38L4.03 8.46l1.5-2.6 2.28.57 2.04-1.18z M15 11.34a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  back: 'M14.5 5.5 8 12l6.5 6.5', close: 'm6 6 12 12 M18 6 6 18', plus: 'M12 5v14 M5 12h14',
  arrow: 'M4 12h15 M13 6l6 6-6 6', external: 'M7 17 17 7 M7 7h10v10',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 7v5l3.5 2',
  check: 'm5 12 4.5 4.5L19 7', sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5 19 19 M5 19l1.5-1.5 M17.5 6.5 19 5',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  sound: 'M4 10h4l5-4v12l-5-4H4z M16 9a4 4 0 0 1 0 6 M18.5 6a8 8 0 0 1 0 12',
  repeat: 'M4 12V9a3 3 0 0 1 3-3h12 M16 3l3 3-3 3 M20 12v3a3 3 0 0 1-3 3H5 M8 21l-3-3 3-3',
  vibrate: 'M8 5h8v14H8z M5 8v8 M19 8v8 M2 10v4 M22 10v4',
  trash: 'M4 6h16 M9 6V3h6v3 M6 6l1 14h10l1-14 M10 10v6 M14 10v6',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0',
  wave: 'M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0 M2 17c2-4 4-4 6 0s4 4 6 0 4-4 6 0 M2 7c2-4 4-4 6 0s4 4 6 0 4-4 6 0',
  sunrise: 'M3 18h18 M7 18a5 5 0 0 1 10 0 M12 4v4 M4.5 10.5l2 2 M19.5 10.5l-2 2 M9 6l3-3 3 3',
  sparkle: 'M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8z',
  tag: 'M3 12V4h8l10 10-8 8z M7.5 8.5h.01',
  palette: 'M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.4-2-.4-1.1.3-2 1.5-2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z M7.5 11.5h.01 M10 7.5h.01 M14.5 7.5h.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M8.5 12l2.5 2.5 4.5-5',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
};
export function Icon({ name, color, size = 22, weight = 2 }: { name: IconName; color: string; size?: number; weight?: number }) {
  return <Svg accessible={false} width={size} height={size} viewBox="0 0 24 24"><Path d={paths[name]} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

const petals = ['#FF8FB1', '#A98BFF', '#FF6B4A', '#6EC6FF', '#FFC83D', '#FF9F45'];

/** One garden plant: a bloom for an on-time morning, a bud for a late one, a droop for a miss. */
export function Plant({ outcome, tint, size = 26 }: { outcome: 'onTime' | 'late' | 'missed'; tint: number; size?: number }) {
  const color = petals[tint % petals.length];
  return <Svg width={size} height={size * 1.4} viewBox="0 0 20 28">
    {outcome === 'missed' ? <>
      <Path d="M10 28 Q10 18 14 15" stroke="#9C8F7A" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={15} cy={16} r={2.6} fill="#BDB2A0" />
    </> : <>
      <Path d="M10 28 V12" stroke="#2F8F5B" strokeWidth={2} strokeLinecap="round" />
      <Path d="M10 21 Q4 18 3 21 Q6 24 10 21 Z" fill="#5FD3A8" />
      {outcome === 'onTime' ? <>
        {[0, 72, 144, 216, 288].map((a) => <Circle key={a} cx={10 + 4.2 * Math.cos((a - 90) * Math.PI / 180)} cy={9 + 4.2 * Math.sin((a - 90) * Math.PI / 180)} r={3.4} fill={color} stroke="#2E2340" strokeWidth={0.9} />)}
        <Circle cx={10} cy={9} r={2.4} fill="#FFE27A" stroke="#2E2340" strokeWidth={0.9} />
      </> : <Path d="M10 6 Q14 10 10 14 Q6 10 10 6 Z" fill={color} stroke="#2E2340" strokeWidth={0.9} />}
    </>}
  </Svg>;
}

/** The streak made visible: the last mornings planted along the hills. */
export function Garden({ days, max = 9 }: { days: { key: string; outcome: 'onTime' | 'late' | 'missed' }[]; max?: number }) {
  const shown = days.slice(-max);
  return <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
    {shown.map((d, i) => <View key={d.key} style={{ marginBottom: (i % 3) * 3 }}>
      <Plant outcome={d.outcome} tint={d.key.split('-').reduce((a, b) => a + Number(b), 0)} size={i === shown.length - 1 ? 26 : 22} />
    </View>)}
  </View>;
}
