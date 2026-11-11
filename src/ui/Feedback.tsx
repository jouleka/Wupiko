import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeOutUp, SlideInUp, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot, type Mood, type Outfit } from './Mascot';
import { candy, display, usePalette } from './theme';

type Notice = { title: string; description?: string; celebrate?: boolean; mood?: Mood; outfit?: Outfit };
const Feedback = createContext<(notice: Notice) => void>(() => {});
const colors = [candy.sun, candy.coral, candy.pink, candy.mint, candy.sky, candy.lilac];

function Piece({ i, width, top, burst }: { i: number; width: number; top: number; burst: number }) {
  const t = useSharedValue(0);
  // Deterministic scatter keeps rendering pure; the burst key varies each celebration.
  const seed = useMemo(() => {
    const r = (k: number) => { const v = Math.sin((i + 1) * 12.9898 + (burst % 9973) * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
    return { x: r(1) * width, drift: (r(2) - .5) * 120, fall: 260 + r(3) * 260, spin: (r(4) - .5) * 900, delay: r(5) * 180, w: 7 + r(6) * 6, round: i % 3 === 0 };
  }, [burst, i, width]);
  useEffect(() => { t.set(withDelay(seed.delay, withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }))); }, [seed, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, t.value - .6) / .4,
    transform: [{ translateX: seed.drift * t.value }, { translateY: -30 * Math.sin(t.value * Math.PI) + seed.fall * t.value * t.value }, { rotate: `${seed.spin * t.value}deg` }],
  }));
  return <Animated.View style={[{ position: 'absolute', left: seed.x, top, width: seed.w, height: seed.round ? seed.w : seed.w * 1.7, borderRadius: seed.round ? seed.w : 2, backgroundColor: colors[i % colors.length] }, style]} />;
}

function Confetti({ top, burst }: { top: number; burst: number }) {
  const { width } = useWindowDimensions();
  return <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
    {Array.from({ length: 28 }, (_, i) => <Piece key={i} i={i} width={width} top={top} burst={burst} />)}
  </View>;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, show] = useState<(Notice & { key: number }) | null>(null);
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!notice) return;
    AccessibilityInfo.announceForAccessibility([notice.title, notice.description].filter(Boolean).join('. '));
    const timeout = setTimeout(() => show(null), 4200);
    return () => clearTimeout(timeout);
  }, [notice]);
  return <Feedback.Provider value={(next) => show({ ...next, key: Date.now() })}>{children}
    {notice?.celebrate && !reduce && <Confetti key={`c${notice.key}`} burst={notice.key} top={insets.top + 30} />}
    {notice && <View key={notice.key} pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 6, left: 16, right: 16, alignItems: 'center' }}>
      <Animated.View entering={reduce ? undefined : SlideInUp.duration(260).easing(Easing.out(Easing.cubic))} exiting={FadeOutUp.duration(200)} style={{ width: '100%', maxWidth: 550 }}>
        <Pressable accessibilityRole="button" accessibilityHint="Dismiss confirmation" onPress={() => show(null)} style={{ borderWidth: 2, borderBottomWidth: 5, borderColor: p.rule, backgroundColor: p.panel, borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 12, shadowColor: '#2E2340', shadowOpacity: .12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
          <Mascot mood={notice.mood ?? 'happy'} size={52} animate outfit={notice.outfit} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: p.ink, fontFamily: display, fontSize: 18, letterSpacing: -.3 }}>{notice.title}</Text>
            {notice.description && <Text style={{ color: p.muted, fontSize: 14, fontWeight: '600' }}>{notice.description}</Text>}
          </View>
        </Pressable>
      </Animated.View>
    </View>}
  </Feedback.Provider>;
}
export const useFeedback = () => useContext(Feedback);
