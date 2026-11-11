import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Mascot, type Outfit } from './Mascot';
import { candy, display } from './theme';

/**
 * Wake-up rituals. Each asks for a few seconds of real attention in a
 * different way, so a half-asleep thumb can't learn one fixed motion.
 */
export type Ritual = 'chase' | 'curtains' | 'sunrise' | 'bubbles';
export const ritualOrder: Ritual[] = ['chase', 'curtains', 'sunrise', 'bubbles'];

export const ritualCopy: Record<Ritual, { title: string; hint: string }> = {
  chase: { title: 'Wupiko keeps rolling over!', hint: 'Boop it wherever it hides — 4 times.' },
  curtains: { title: 'It’s dark in here…', hint: 'Swipe both curtains open to let the sun in.' },
  sunrise: { title: 'The sun overslept too!', hint: 'Drag the sun up over the hills.' },
  bubbles: { title: 'Sleepy bubbles everywhere!', hint: 'Pop 6 of them to wake Wupiko.' },
};

export function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic 0..1 noise, so layouts stay pure across renders. */
export function noise(seed: number, i: number, k = 0) {
  const v = Math.sin(seed * 0.0001 + i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const tap = () => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
const win = () => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };

type Props = { width: number; height: number; seed: number; outfit: Outfit; onProgress: (p: number) => void; done: boolean };

/** Boop Wupiko; it rolls somewhere new each time. */
function Chase({ width, height, seed, outfit, onProgress, done }: Props) {
  const goal = 4, size = Math.min(120, width * .32);
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);
  // Keep clear of the edges so Wupiko's speech bubble stays readable.
  const spot = (i: number) => ({ x: 60 + noise(seed, i, 1) * Math.max(0, width - size - 120), y: 56 + noise(seed, i, 2) * Math.max(0, height - size - 76) });
  const x = useSharedValue(spot(0).x), y = useSharedValue(spot(0).y);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));
  const centre = { x: (width - size) / 2, y: (height - size) / 2 };
  useEffect(() => {
    const to = done ? centre : spot(count);
    const t = { duration: reduce ? 0 : 320, easing: Easing.out(Easing.cubic) };
    x.set(withTiming(to.x, t));
    y.set(withTiming(to.y, t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, done, width, height]);
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, style]}>
    <Mascot mood={done ? 'happy' : count >= 2 ? 'awake' : 'sleepy'} size={size} animate interactive={!done} outfit={outfit}
      onPoke={() => { if (count < goal) { const n = count + 1; setCount(n); onProgress(n / goal); if (n === goal) win(); } }} />
  </Animated.View>;
}

function Curtain({ side, width, height, onOpen, opened }: { side: 'left' | 'right'; width: number; height: number; onOpen: () => void; opened: boolean }) {
  const half = width / 2 + 12;
  const tx = useSharedValue(0);
  const reduce = useReducedMotion();
  const sign = side === 'left' ? -1 : 1;
  const nudge = useSharedValue(0);
  // An opened curtain stays open, even if the stage remounts.
  useEffect(() => { if (opened) tx.set(withTiming(sign * half, { duration: 260 })); }, [half, opened, sign, tx]);
  useEffect(() => {
    if (opened || reduce) return;
    nudge.set(withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })), -1, false));
    return () => cancelAnimation(nudge);
  }, [nudge, opened, reduce]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !opened,
    onMoveShouldSetPanResponder: () => !opened,
    onPanResponderMove: (_, g) => { tx.set(sign < 0 ? Math.min(0, Math.max(-half, g.dx)) : Math.max(0, Math.min(half, g.dx))); },
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > width * .22 || Math.abs(g.vx) > .8) {
        tx.set(withTiming(sign * half, { duration: 260 }));
        tap();
        onOpen();
      } else tx.set(withSpring(0, { damping: 16 }));
    },
  }), [half, onOpen, opened, sign, tx, width]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const hint = useAnimatedStyle(() => ({ transform: [{ translateX: sign * nudge.value * 10 }], opacity: opened ? 0 : 1 }));
  const folds = [.18, .42, .66, .88];
  return <Animated.View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={`${side} curtain`}
    accessibilityActions={[{ name: 'activate', label: 'Open curtain' }]} onAccessibilityAction={() => { if (!opened) { tx.set(sign * half); onOpen(); } }}
    style={[{ position: 'absolute', top: 0, bottom: 0, width: half, [side]: 0 }, style]}>
    <Svg width={half} height={height} style={{ position: 'absolute' }}>
      <Rect x={0} y={0} width={half} height={height} fill="#8E73E8" />
      {folds.map((f) => <Rect key={f} x={half * f} y={0} width={10} height={height} fill="#7A5FD6" opacity={.7} />)}
      {[...Array(Math.ceil(height / 26))].map((_, i) => <Circle key={i} cx={side === 'left' ? half : 0} cy={i * 26 + 13} r={7} fill="#A98BFF" />)}
    </Svg>
    <Animated.View style={[{ position: 'absolute', top: height / 2 - 18, [side === 'left' ? 'right' : 'left']: 22 }, hint]}>
      <Svg width={30} height={24} viewBox="0 0 30 24">
        <Path d={side === 'left' ? 'M14 4 L6 12 L14 20 M24 4 L16 12 L24 20' : 'M6 4 L14 12 L6 20 M16 4 L24 12 L16 20'} stroke="#FFFFFF" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  </Animated.View>;
}

/** Swipe both curtains open; Wupiko wakes in the light. */
function Curtains({ width, height, outfit, onProgress, done }: Props) {
  const [open, setOpen] = useState({ left: false, right: false });
  const count = Number(open.left) + Number(open.right);
  const report = useRef(onProgress);
  useEffect(() => { report.current = onProgress; });
  useEffect(() => { report.current(count / 2); if (count === 2) win(); }, [count]);
  return <>
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#211A4A', opacity: .5 * (1 - count / 2) }} />
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' }}>
      <Mascot mood={done ? 'happy' : count ? 'awake' : 'sleepy'} size={Math.min(150, width * .4)} animate outfit={outfit} />
    </View>
    <View style={{ position: 'absolute', left: 8, right: 8, top: 8, height: 10, borderRadius: 5, backgroundColor: '#5A3FB5', zIndex: 2 }} />
    <Curtain side="left" width={width} height={height} opened={open.left} onOpen={() => setOpen((o) => ({ ...o, left: true }))} />
    <Curtain side="right" width={width} height={height} opened={open.right} onOpen={() => setOpen((o) => ({ ...o, right: true }))} />
  </>;
}

/** Drag the sun up over the hills. */
function Sunrise({ width, height, outfit, onProgress, done }: Props) {
  const sun = 78;
  const bottom = height * .66 - sun * .7, top = 12;
  const y = useSharedValue(bottom);
  const start = useSharedValue(bottom);
  const [progress, setProgress] = useState(0);
  const reduce = useReducedMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduce || progress > 0) return;
    bob.set(withRepeat(withSequence(withTiming(1, { duration: 550 }), withTiming(0, { duration: 550 })), -1, false));
    return () => cancelAnimation(bob);
  }, [bob, progress, reduce]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !done,
    onMoveShouldSetPanResponder: () => !done,
    onPanResponderGrant: () => { start.set(y.value); },
    onPanResponderMove: (_, g) => {
      const next = Math.min(bottom, Math.max(top, start.value + g.dy));
      y.set(next);
      const p = Math.round(((bottom - next) / (bottom - top)) * 20) / 20;
      setProgress((old) => (p > old ? p : old));
    },
    onPanResponderRelease: () => {
      const p = (bottom - y.value) / (bottom - top);
      if (p > .8) { y.set(withTiming(top, { duration: 200 })); setProgress(1); }
    },
  }), [bottom, done, start, top, y]);
  const report = useRef(onProgress);
  useEffect(() => { report.current = onProgress; });
  useEffect(() => { report.current(progress >= 1 ? 1 : Math.min(.95, progress)); if (progress >= 1) win(); }, [progress]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const hint = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 10 }] }));
  const awake = progress >= 1;
  const sky = ['#2B2360', '#5B4A9A', '#B98BD8', '#FFB38A', '#FFD9A0', '#9FDcFF'][Math.min(5, Math.floor(progress * 5.99))];
  return <>
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: sky }} />
    {progress < .5 && [[.12, .1], [.3, .22], [.7, .08], [.86, .26], [.5, .16]].map(([x, yy], i) =>
      <View key={i} pointerEvents="none" style={{ position: 'absolute', left: x * width, top: yy * height, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF4D2', opacity: 1 - progress * 2 }} />)}
    <Animated.View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Sun"
      accessibilityActions={[{ name: 'increment', label: 'Raise the sun' }]} onAccessibilityAction={() => { y.set(top); setProgress(1); }}
      style={[{ position: 'absolute', left: width / 2 - sun / 2, top: 0, width: sun, height: sun }, style]}>
      <Svg width={sun} height={sun} viewBox="-50 -50 100 100">
        <G stroke="#FFB13B" strokeWidth={6} strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <Path key={a} d={`M${Math.cos(a * Math.PI / 180) * 36} ${Math.sin(a * Math.PI / 180) * 36} L${Math.cos(a * Math.PI / 180) * 46} ${Math.sin(a * Math.PI / 180) * 46}`} />)}
        </G>
        <Circle r={28} fill="#FFE27A" stroke={candy.ink} strokeWidth={4} />
        {awake ? <G fill={candy.ink}><Circle cx={-9} cy={-3} r={4} /><Circle cx={9} cy={-3} r={4} /></G>
          : <Path d="M-14 -2 Q-9 3 -4 -2 M4 -2 Q9 3 14 -2" stroke={candy.ink} strokeWidth={3} fill="none" strokeLinecap="round" />}
        <Path d="M-6 8 Q0 13 6 8" stroke={candy.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Circle cx={-17} cy={7} r={4} fill="#FF8FA3" opacity={.8} /><Circle cx={17} cy={7} r={4} fill="#FF8FA3" opacity={.8} />
      </Svg>
    </Animated.View>
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, bottom: 0 }}><Svg width={width} height={height * .34} viewBox="0 0 360 120" preserveAspectRatio="none">
      <Path d="M0 40 Q90 0 180 30 T360 24 V120 H0 Z" fill={progress > .5 ? '#9BE3B5' : '#5A4F8F'} />
      <Path d="M0 70 Q100 36 200 62 T360 56 V120 H0 Z" fill={progress > .5 ? '#6FCF97' : '#463C7A'} />
    </Svg></View>
    {progress < .1 && <Animated.View pointerEvents="none" style={[{ position: 'absolute', alignSelf: 'center', top: bottom - 40 }, hint]}>
      <Text style={{ color: '#FFFFFF', fontFamily: display, fontSize: 16 }}>↑ drag me up</Text>
    </Animated.View>}
    <View pointerEvents="none" style={{ position: 'absolute', right: 10, bottom: 8 }}>
      <Mascot mood={done ? 'happy' : progress > .5 ? 'awake' : 'sleepy'} size={Math.min(110, width * .3)} animate outfit={outfit} />
    </View>
  </>;
}

function Bubble({ x, y, onPop, delay }: { x: number; y: number; onPop: () => void; delay: number }) {
  const reduce = useReducedMotion();
  const bob = useSharedValue(0), pop = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    bob.set(withRepeat(withSequence(withTiming(1, { duration: 900 + delay }), withTiming(0, { duration: 900 + delay })), -1, false));
    return () => cancelAnimation(bob);
  }, [bob, delay, reduce]);
  const style = useAnimatedStyle(() => ({ opacity: 1 - pop.value, transform: [{ translateY: -bob.value * 8 }, { scale: 1 + pop.value * .6 }] }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y }, style]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Sleepy bubble" hitSlop={6} onPress={() => { tap(); pop.set(withTiming(1, { duration: 160 })); setTimeout(onPop, 150); }}
      style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(255,255,255,.55)', borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: display, color: '#8C9BFF', fontSize: 28 }}>z</Text>
      <View style={{ position: 'absolute', top: 10, left: 14, width: 12, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF', transform: [{ rotate: '-30deg' }] }} />
    </Pressable>
  </Animated.View>;
}

/** Pop sleepy bubbles that keep appearing around Wupiko. */
function Bubbles({ width, height, seed, outfit, onProgress, done }: Props) {
  const goal = 6;
  const [popped, setPopped] = useState(0);
  const [slots, setSlots] = useState([0, 1, 2]);
  const mascot = Math.min(130, width * .36);
  const report = useRef(onProgress);
  useEffect(() => { report.current = onProgress; });
  useEffect(() => { report.current(Math.min(1, popped / goal)); if (popped === goal) win(); }, [popped]);
  // Keep bubbles out of the band where Wupiko sits.
  const place = (n: number) => {
    const left = (n + (seed & 1)) % 2 === 0;
    const x = left ? noise(seed, n, 4) * Math.max(0, width / 2 - mascot / 2 - 70) : width / 2 + mascot / 2 + noise(seed, n, 4) * Math.max(0, width / 2 - mascot / 2 - 70);
    return { x: Math.max(4, x), y: 10 + noise(seed, n, 5) * Math.max(0, height - 90) };
  };
  return <>
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#5B4A9A', opacity: .45 * (1 - popped / goal) }} />
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' }}>
      <Mascot mood={done ? 'happy' : popped >= 3 ? 'awake' : 'sleepy'} size={mascot} animate outfit={outfit} />
    </View>
    {!done && slots.map((n, i) => {
      const p = place(n);
      return <Bubble key={n} x={p.x} y={p.y} delay={i * 150} onPop={() => {
        setPopped((c) => c + 1);
        setSlots((s) => s.map((v) => (v === n ? Math.max(...s) + 1 : v)));
      }} />;
    })}
  </>;
}

const stages: Record<Ritual, (p: Props) => React.JSX.Element> = { chase: Chase, curtains: Curtains, sunrise: Sunrise, bubbles: Bubbles };

export function RitualStage({ ritual, ...props }: Props & { ritual: Ritual }) {
  const Stage = stages[ritual];
  return <Stage {...props} />;
}
