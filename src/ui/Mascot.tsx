import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming, ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { candy, display, usePalette } from './theme';

export type Mood = 'awake' | 'sleepy' | 'happy' | 'ringing' | 'wink' | 'sad';
export type Outfit = 'none' | 'sprout' | 'flowers' | 'shades' | 'crown';
type Face = Mood | 'blink';

const INK = '#3A2A3E';
const stroke = { stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function Eye({ x }: { x: number }) {
  return <G>
    <Ellipse cx={x} cy={108} rx={11} ry={14} fill={INK} />
    <Circle cx={x + 4} cy={102} r={4.5} fill="#fff" />
    <Circle cx={x - 3} cy={114} r={2} fill="#fff" />
  </G>;
}

function Features({ face }: { face: Face }) {
  switch (face) {
    case 'sleepy': return <G>
      <Path d="M62 108 Q74 117 86 108 M114 108 Q126 117 138 108" fill="none" {...stroke} />
      <Ellipse cx={100} cy={128} rx={5} ry={4} fill={INK} />
    </G>;
    case 'blink': return <G>
      <Path d="M63 110 H85 M115 110 H137" fill="none" {...stroke} />
      <Path d="M90 124 Q95 131 100 125 Q105 131 110 124" fill="none" {...stroke} />
    </G>;
    case 'happy': return <G>
      <Path d="M62 112 Q74 98 86 112 M114 112 Q126 98 138 112" fill="none" {...stroke} />
      <Path d="M84 122 Q100 146 116 122 Z" fill={INK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <Ellipse cx={100} cy={134} rx={7} ry={4} fill="#FF7A8A" />
    </G>;
    case 'ringing': return <G>
      {[72, 128].map((x) => <G key={x}>
        <Circle cx={x} cy={106} r={16} fill="#fff" {...stroke} />
        <Circle cx={x} cy={108} r={6.5} fill={INK} />
        <Circle cx={x + 2} cy={105} r={2} fill="#fff" />
      </G>)}
      <Ellipse cx={100} cy={136} rx={10} ry={12} fill={INK} />
      <Ellipse cx={100} cy={142} rx={6} ry={4} fill="#FF7A8A" />
    </G>;
    case 'sad': return <G>
      <Path d="M60 96 L82 89 M140 96 L118 89" fill="none" {...stroke} />
      <Ellipse cx={74} cy={110} rx={10} ry={12} fill={INK} /><Circle cx={77} cy={106} r={3.5} fill="#fff" />
      <Ellipse cx={126} cy={110} rx={10} ry={12} fill={INK} /><Circle cx={129} cy={106} r={3.5} fill="#fff" />
      <Path d="M90 134 Q100 125 110 134" fill="none" {...stroke} />
      <Path d="M60 122 Q55 132 60 137 Q66 132 60 122 Z" fill="#6EC6FF" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </G>;
    case 'wink': return <G>
      <Eye x={74} />
      <Path d="M114 112 Q126 98 138 112" fill="none" {...stroke} />
      <Path d="M86 122 Q100 138 114 122" fill="none" {...stroke} />
    </G>;
    default: return <G>
      <Eye x={74} /><Eye x={126} />
      <Path d="M90 124 Q95 131 100 125 Q105 131 110 124" fill="none" {...stroke} />
    </G>;
  }
}

function Bloom({ x, y, color }: { x: number; y: number; color: string }) {
  return <G>
    {[0, 72, 144, 216, 288].map((a) => <Circle key={a} cx={x + 6 * Math.cos(a * Math.PI / 180)} cy={y + 6 * Math.sin(a * Math.PI / 180)} r={5} fill={color} stroke={INK} strokeWidth={1.6} />)}
    <Circle cx={x} cy={y} r={3.6} fill="#FFE27A" stroke={INK} strokeWidth={1.6} />
  </G>;
}

/** Unlockable streak rewards, drawn in the same 200-unit space as the body. */
function Wear({ outfit }: { outfit: Outfit }) {
  switch (outfit) {
    case 'sprout': return <G>
      <Path d="M58 74 Q52 60 58 50" fill="none" stroke="#2F8F5B" strokeWidth={4} strokeLinecap="round" />
      <Path d="M58 52 Q44 44 40 54 Q50 62 58 52 Z" fill="#5FD3A8" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M58 50 Q66 36 76 42 Q70 54 58 50 Z" fill="#7EE2B8" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </G>;
    case 'flowers': return <G>
      <Path d="M48 86 Q100 40 152 86" fill="none" stroke="#5FD3A8" strokeWidth={4} strokeLinecap="round" />
      <Bloom x={52} y={82} color="#FF8FB1" /><Bloom x={72} y={64} color="#A98BFF" /><Bloom x={100} y={57} color="#FF6B4A" />
      <Bloom x={128} y={64} color="#6EC6FF" /><Bloom x={148} y={82} color="#FF8FB1" />
    </G>;
    case 'shades': return <G>
      <Path d="M86 104 Q100 98 114 104" fill="none" {...stroke} />
      <Path d="M54 98 H92 V108 Q92 124 74 124 Q56 124 54 108 Z" fill="#2E2340" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M108 98 H146 V108 Q144 124 126 124 Q108 124 108 108 Z" fill="#2E2340" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M62 104 L70 104 M116 104 L124 104" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      <Path d="M54 100 L36 94 M146 100 L164 94" fill="none" {...stroke} />
    </G>;
    case 'crown': return <G>
      <Path d="M70 62 L64 30 L84 44 L100 20 L116 44 L136 30 L130 62 Z" fill="#FFC83D" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M70 62 L130 62" stroke="#E79A12" strokeWidth={5} />
      <Circle cx={100} cy={46} r={5} fill="#FF6B4A" stroke={INK} strokeWidth={2} />
      <Circle cx={80} cy={52} r={3.5} fill="#6EC6FF" stroke={INK} strokeWidth={2} />
      <Circle cx={120} cy={52} r={3.5} fill="#5FD3A8" stroke={INK} strokeWidth={2} />
    </G>;
    default: return null;
  }
}

/** The vector sunseed. Kept free of animation so it can render anywhere. */
export function WupikoArt({ face, size, outfit = 'none' }: { face: Face; size: number; outfit?: Outfit }) {
  const cheer = face === 'happy' || face === 'ringing';
  const id = `w${size}`;
  return <Svg accessible={false} width={size} height={size} viewBox="0 0 200 200">
    <Defs>
      <LinearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFE680" /><Stop offset="1" stopColor="#FFC23A" /></LinearGradient>
      <LinearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FF8A3D" /><Stop offset="1" stopColor="#FFC23A" /></LinearGradient>
    </Defs>
    <Ellipse cx={78} cy={186} rx={16} ry={9} fill={INK} />
    <Ellipse cx={122} cy={186} rx={16} ry={9} fill={INK} />
    {cheer ? <>
      <Ellipse cx={30} cy={92} rx={11} ry={19} transform="rotate(-28 30 92)" fill="#FFD24D" stroke={INK} strokeWidth={5} />
      <Ellipse cx={170} cy={92} rx={11} ry={19} transform="rotate(28 170 92)" fill="#FFD24D" stroke={INK} strokeWidth={5} />
    </> : <>
      <Ellipse cx={27} cy={142} rx={10} ry={17} transform="rotate(50 27 142)" fill="#FFD24D" stroke={INK} strokeWidth={5} />
      <Ellipse cx={173} cy={142} rx={10} ry={17} transform="rotate(-50 173 142)" fill="#FFD24D" stroke={INK} strokeWidth={5} />
    </>}
    <Path d="M80 60 C68 50 66 36 76 30 C80 40 86 44 92 46 C88 32 94 16 106 8 C108 22 114 34 116 46 C122 38 132 34 142 38 C136 46 130 56 124 62 Z" fill={`url(#${id}c)`} {...stroke} />
    <Path d="M100 46 C146 46 172 86 172 128 C172 164 142 184 100 184 C58 184 28 164 28 128 C28 86 54 46 100 46 Z" fill={`url(#${id}b)`} stroke={INK} strokeWidth={5} />
    <Ellipse cx={100} cy={156} rx={42} ry={22} fill="#FFF3C4" opacity={0.85} />
    <Ellipse cx={66} cy={74} rx={13} ry={7} transform="rotate(-38 66 74)" fill="#fff" opacity={0.75} />
    <Circle cx={54} cy={90} r={3.5} fill="#fff" opacity={0.75} />
    <Ellipse cx={58} cy={128} rx={12} ry={7} fill="#FF8FA3" opacity={cheer ? 0.95 : 0.75} />
    <Ellipse cx={142} cy={128} rx={12} ry={7} fill="#FF8FA3" opacity={cheer ? 0.95 : 0.75} />
    <Features face={face} />
    {face !== 'sleepy' && <Wear outfit={outfit} />}
    {face === 'sleepy' && <G>
      <Path d="M58 78 C62 44 96 30 124 36 C150 42 170 62 176 92 C170 96 164 92 160 86 C154 68 146 62 140 62 C126 66 100 64 58 78 Z" fill="#8C9BFF" {...stroke} />
      <Path d="M56 80 C90 62 126 58 146 62" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
      <Circle cx={174} cy={98} r={10} fill="#fff" stroke={INK} strokeWidth={5} />
    </G>}
  </Svg>;
}

const quips = {
  awake: ['Hi hi!', 'Boop!', 'Hehe, that tickles', 'Need a wake-up?', 'Ready when you are!', 'Sun’s out, fins out!', 'I’m a sunseed!'],
  sleepy: ['…five more minutes', 'zzz… mmh?', 'Shhh, dreaming of toast', 'Wake me at sunrise'],
  sad: ['I waited for you…', 'Tomorrow, together?', '*sniff*', 'It’s okay. Fresh start!'],
  ringing: ['WAKEY WAKEY!', 'Rise and shine!', 'Up up up!'],
};

export function Bubble({ text, tail = 'bottom' }: { text: string; tail?: 'bottom' | 'left' }) {
  const p = usePalette();
  return <Animated.View entering={ZoomIn.duration(180).easing(Easing.out(Easing.cubic))} exiting={FadeOut.duration(160)} pointerEvents="none" style={{ alignItems: 'center' }}>
    <View style={{ backgroundColor: p.panel, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 2.5, borderColor: candy.ink, maxWidth: 250 }}>
      <Text style={{ color: p.ink, fontFamily: display, fontSize: 15, letterSpacing: -.2, textAlign: 'center' }}>{text}</Text>
    </View>
    {tail === 'bottom' && <View style={{ width: 14, height: 14, backgroundColor: p.panel, borderColor: candy.ink, borderRightWidth: 2.5, borderBottomWidth: 2.5, transform: [{ rotate: '45deg' }], marginTop: -8 }} />}
  </Animated.View>;
}

function Zzz({ size, reduce }: { size: number; reduce: boolean }) {
  const p = usePalette();
  return <View pointerEvents="none" style={{ position: 'absolute', right: -size * .2, top: -size * .18, width: size * .4, height: size * .5 }}>
    {[0, 1, 2].map((i) => <Z key={i} i={i} size={size} reduce={reduce} color={p.dark ? '#CFC4F2' : '#8C9BFF'} />)}
  </View>;
}

function Z({ i, size, reduce, color }: { i: number; size: number; reduce: boolean; color: string }) {
  const t = useSharedValue(reduce ? .5 : 0);
  useEffect(() => {
    if (reduce) return;
    t.set(withDelay(i * 900, withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.quad) }), -1, false)));
    return () => cancelAnimation(t);
  }, [i, reduce, t]);
  const style = useAnimatedStyle(() => ({
    opacity: reduce ? 1 - i * .25 : t.value < .15 ? t.value / .15 : 1 - (t.value - .15) / .85,
    transform: [{ translateY: reduce ? -i * size * .12 : -t.value * size * .35 }, { translateX: reduce ? i * size * .07 : Math.sin(t.value * 6) * size * .04 + t.value * size * .08 }, { rotate: '-12deg' }],
  }));
  return <Animated.Text style={[{ position: 'absolute', bottom: 0, left: 0, color, fontFamily: display, fontSize: size * (.13 + i * .03) }, style]}>z</Animated.Text>;
}

function Waves({ size, reduce }: { size: number; reduce: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.set(withRepeat(withTiming(1, { duration: 700 }), -1, false));
    return () => cancelAnimation(t);
  }, [reduce, t]);
  const style = useAnimatedStyle(() => ({ opacity: reduce ? 1 : 1 - t.value * .7, transform: [{ scale: 1 + t.value * .12 }] }));
  const arcs = (flip: boolean) => <Svg width={size * .2} height={size * .4} viewBox="0 0 40 80">
    <Path d={flip ? 'M8 20 Q22 40 8 60 M20 8 Q42 40 20 72' : 'M32 20 Q18 40 32 60 M20 8 Q-2 40 20 72'} stroke={candy.coral} strokeWidth={5} strokeLinecap="round" fill="none" />
  </Svg>;
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: size * .12, left: -size * .2, right: -size * .2, flexDirection: 'row', justifyContent: 'space-between' }, style]}>
    {arcs(false)}{arcs(true)}
  </Animated.View>;
}

export function Mascot({ mood, size = 140, animate = false, interactive = false, say, onPoke, outfit = 'none' }: {
  mood: Mood; size?: number; animate?: boolean; interactive?: boolean; say?: string | null; onPoke?: (count: number) => void; outfit?: Outfit;
}) {
  const reduce = useReducedMotion();
  const idle = useSharedValue(0);
  const pop = useSharedValue(0);
  const squish = useSharedValue(1);
  const [blink, setBlink] = useState(false);
  const [reaction, setReaction] = useState<{ face: Face; text: string } | null>(null);
  const pokes = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    idle.set(0);
    if (animate && !reduce) {
      const duration = mood === 'sleepy' || mood === 'sad' ? 2200 : mood === 'ringing' ? 90 : 900;
      idle.set(withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    }
    return () => cancelAnimation(idle);
  }, [animate, mood, idle, reduce]);

  // Open-eyed moods blink at a natural, irregular rhythm.
  useEffect(() => {
    if (mood !== 'awake' || reaction) return;
    let open: ReturnType<typeof setTimeout>, shut: ReturnType<typeof setTimeout>;
    const schedule = () => {
      shut = setTimeout(() => {
        setBlink(true);
        open = setTimeout(() => { setBlink(false); schedule(); }, 140);
      }, 2200 + Math.random() * 3200);
    };
    schedule();
    return () => { clearTimeout(open); clearTimeout(shut); setBlink(false); };
  }, [mood, reaction]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const body = useAnimatedStyle(() => {
    const v = idle.value;
    const hop = -pop.value * size * .06;
    if (mood === 'ringing') return { transform: [{ translateY: hop - Math.abs(v - .5) * size * .04 }, { rotate: `${(v - .5) * 12}deg` }, { scaleX: squish.value }, { scaleY: 2 - squish.value }] };
    if (mood === 'sleepy' || mood === 'sad') return { transform: [{ translateY: hop + size * .01 * v }, { scaleX: (1 + v * .025) * squish.value }, { scaleY: (1 - v * .02) * (2 - squish.value) }] };
    return { transform: [{ translateY: hop - v * size * .03 }, { rotate: `${(v - .5) * 3}deg` }, { scaleX: (1 + (1 - v) * .015) * squish.value }, { scaleY: (1 - (1 - v) * .015) * (2 - squish.value) }] };
  });
  const shadow = useAnimatedStyle(() => ({ opacity: .11 - pop.value * .05, transform: [{ scaleX: 1 - pop.value * .3 - (mood === 'awake' ? idle.value * .06 : 0) }] }));

  function poke() {
    pokes.current += 1;
    onPoke?.(pokes.current);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    squish.set(withSequence(withTiming(1.08, { duration: 90 }), withSpring(1, { damping: 14, stiffness: 240 })));
    pop.set(reduce ? 0 : withSequence(withDelay(60, withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) })), withSpring(0, { damping: 16, stiffness: 200 })));
    const pool = quips[mood === 'sleepy' ? 'sleepy' : mood === 'ringing' ? 'ringing' : mood === 'sad' ? 'sad' : 'awake'];
    const text = pokes.current % 7 === 0 ? `That’s ${pokes.current} boops!` : pool[Math.floor(Math.random() * pool.length)];
    setReaction({ face: mood === 'sleepy' || mood === 'sad' ? mood : Math.random() < .5 ? 'wink' : 'happy', text });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReaction(null), 1700);
  }

  const face: Face = reaction?.face ?? (blink ? 'blink' : mood);
  const bubble = reaction?.text ?? say;
  const figure = <View style={{ width: size, height: size }}>
    <Animated.View style={[{ position: 'absolute', left: size * .22, right: size * .22, bottom: -size * .015, height: size * .055, borderRadius: size, backgroundColor: '#2E2340' }, shadow]} />
    <Animated.View style={[{ width: size, height: size, transformOrigin: 'bottom' }, body]}>
      <WupikoArt face={face} size={size} outfit={outfit} />
      {mood === 'sleepy' && !reaction && <Zzz size={size} reduce={reduce} />}
      {mood === 'ringing' && <Waves size={size} reduce={reduce} />}
    </Animated.View>
    {!!bubble && <View pointerEvents="none" style={{ position: 'absolute', bottom: size * 1.02, left: -60, right: -60, alignItems: 'center' }}>
      <Bubble key={bubble} text={bubble} />
    </View>}
  </View>;
  if (!interactive) return figure;
  return <Pressable accessibilityRole="button" accessibilityLabel="Wupiko" accessibilityHint="Give Wupiko a little boop" onPress={poke} hitSlop={8}>{figure}</Pressable>;
}

export function Sparkles({ size = 120, color = candy.sun }: { size?: number; color?: string }) {
  const reduce = useReducedMotion();
  return <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size }}>
    {[[.08, .2, .16], [.82, .1, .12], [.9, .62, .1], [.02, .7, .09]].map(([x, y, s], i) =>
      <Animated.View key={i} entering={reduce ? undefined : FadeIn.delay(i * 120)} style={{ position: 'absolute', left: x * size, top: y * size }}>
        <Twinkle size={s * size} color={color} delay={i * 400} />
      </Animated.View>)}
  </View>;
}

export function Twinkle({ size, color, delay = 0 }: { size: number; color: string; delay?: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    t.set(withDelay(delay, withRepeat(withSequence(withTiming(.35, { duration: 900 }), withTiming(1, { duration: 900 })), -1, false)));
    return () => cancelAnimation(t);
  }, [delay, reduce, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: .7 + t.value * .3 }, { rotate: `${(1 - t.value) * 45}deg` }] }));
  return <Animated.View style={style}>
    <Svg width={size} height={size} viewBox="-10 -10 20 20"><Path d="M0 -9 Q1.2 -1.2 9 0 Q1.2 1.2 0 9 Q-1.2 1.2 -9 0 Q-1.2 -1.2 0 -9 Z" fill={color} /></Svg>
  </Animated.View>;
}
