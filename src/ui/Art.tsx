import { useEffect } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { usePalette } from './theme';

const faces = {
  awake: require('../../assets/brand/wupiko-awake.png'),
  sleepy: require('../../assets/brand/wupiko-sleepy.png'),
  happy: require('../../assets/brand/wupiko-happy.png'),
  ringing: require('../../assets/brand/wupiko-ringing.png'),
};
export type Mood = keyof typeof faces;

export function Wordmark({ small = false }: { small?: boolean }) {
  const p = usePalette();
  const width = small ? 90 : 114;
  return <Image accessible accessibilityLabel="Wupiko" resizeMode="contain" source={require('../../assets/brand/wordmark.png')} style={{ width, height: width * .282, tintColor: p.ink }} />;
}

export function Mascot({ mood, size = 140, animate = false }: { mood: Mood; size?: number; animate?: boolean }) {
  const reduce = useReducedMotion();
  const phase = useSharedValue(0);
  useEffect(() => {
    phase.value = 0;
    if (animate && !reduce) {
      phase.value = withRepeat(withTiming(1, { duration: mood === 'sleepy' ? 1950 : 1350, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
    return () => cancelAnimation(phase);
  }, [animate, mood, phase, reduce]);
  const movement = useAnimatedStyle(() => ({ transform: [{ translateY: -phase.value * (mood === 'sleepy' ? 1.3 : 3) }, { rotate: `${phase.value * .8}deg` }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, movement]}>
      <Image accessible={false} source={faces[mood]} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

const star = 'M0 -8 Q1 -1 7 0 Q1 1 0 8 Q-1 1 -7 0 Q-1 -1 0 -8 Z';

// A cropped panorama gives the little sunseed a real horizon at any screen width.
export function Scene({ mood = 'awake', compact = false }: { mood?: Mood; compact?: boolean }) {
  const { width, height } = useWindowDimensions();
  const night = mood === 'sleepy';
  const sceneHeight = compact ? 148 : Math.min(310, Math.max(184, height * .30));
  const creature = compact ? 136 : Math.min(202, width * .50, sceneHeight * .84);
  return (
    <View accessible={false} style={{ height: sceneHeight, overflow: 'hidden', borderRadius: compact ? 23 : 30, backgroundColor: night ? '#CDD8CD' : '#F3C68D', alignItems: 'center', justifyContent: 'flex-end' }}>
      <Svg accessible={false} style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 254" preserveAspectRatio="xMidYMid slice">
        <Circle cx={night ? 70 : 186} cy={night ? 62 : 110} r={night ? 24 : 80} fill={night ? '#F1EDD5' : '#F9DDA6'} />
        {night && <Circle cx="82" cy="54" r="22" fill="#CDD8CD" />}
        <G fill={night ? '#657A68' : '#B57A4D'}>
          <Path d={star} transform="translate(298 53) scale(.72)" />
          <Path d={star} transform="translate(58 97) scale(.65)" />
          <Circle cx="105" cy="53" r="1.6" /><Circle cx="277" cy="79" r="1.4" /><Circle cx="320" cy="94" r="1" />
        </G>
        <Path d="M-15 162 Q45 112 97 142 T223 150 Q291 112 374 126 V258 H-15 Z" fill={night ? '#AFBFAC' : '#E7AA73'} />
        <Path d="M-6 173 Q63 135 144 164 Q192 183 241 163 T372 154 V258 H-6 Z" fill={night ? '#9DAF9D' : '#D99366'} />
        <Path d="M-5 217 Q76 157 159 182 Q219 198 265 183 Q315 169 368 186 V260 H-5 Z" fill={night ? '#8D9F89' : '#CB815C'} />
        <G stroke={night ? '#6C806C' : '#AB6B49'} strokeWidth="1.2" fill="none" strokeLinecap="round">
          <Path d="M-7 223 Q39 187 80 184 M-5 231 Q34 200 57 195 M19 239 Q39 224 52 220 M244 209 Q312 187 374 203 M272 215 Q325 200 368 211 M305 220 Q332 214 353 217" />
          <Path d="M47 174 l-4 -5 m4 5 l2 -8 m6 7 l2 -4 M284 172 l-5 -5 m6 6 l2 -9 M78 230 l-4 -5 m5 6 l3 -7" />
        </G>
      </Svg>
      <View style={{ marginBottom: compact ? -3 : Math.max(10, sceneHeight * .055) }}><Mascot mood={mood} size={creature} animate /></View>
    </View>
  );
}

export type IconName = 'settings' | 'back' | 'close' | 'plus' | 'arrow' | 'clock' | 'check' | 'sun' | 'sound' | 'repeat' | 'vibrate' | 'trash' | 'external';
const paths: Record<IconName, string> = {
  settings: 'M10.5 3h3l.65 2.25 2.04 1.18 2.28-.57 1.5 2.6-1.62 1.69v2.38l1.62 1.69-1.5 2.6-2.28-.57-2.04 1.18-.65 2.25h-3l-.65-2.25-2.04-1.18-2.28.57-1.5-2.6 1.62-1.69v-2.38L4.03 8.46l1.5-2.6 2.28.57 2.04-1.18z M15 11.34a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  back: 'M14.5 5.5 8 12l6.5 6.5', close: 'm6 6 12 12 M18 6 6 18', plus: 'M12 5v14 M5 12h14',
  arrow: 'M4 12h15 M13 6l6 6-6 6', external: 'M7 17 17 7 M7 7h10v10',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 7v5l3.5 2',
  check: 'm5 12 4.5 4.5L19 7', sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5 19 19 M5 19l1.5-1.5 M17.5 6.5 19 5',
  sound: 'M4 10h4l5-4v12l-5-4H4z M16 9a4 4 0 0 1 0 6 M18.5 6a8 8 0 0 1 0 12',
  repeat: 'M4 12V9a3 3 0 0 1 3-3h12 M16 3l3 3-3 3 M20 12v3a3 3 0 0 1-3 3H5 M8 21l-3-3 3-3',
  vibrate: 'M8 5h8v14H8z M5 8v8 M19 8v8 M2 10v4 M22 10v4',
  trash: 'M4 6h16 M9 6V3h6v3 M6 6l1 14h10l1-14 M10 10v6 M14 10v6',
};
export function Icon({ name, color, size = 22 }: { name: IconName; color: string; size?: number }) {
  return <Svg accessible={false} width={size} height={size} viewBox="0 0 24 24"><Path d={paths[name]} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
