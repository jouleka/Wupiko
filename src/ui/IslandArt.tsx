import { useEffect } from 'react';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { PieceId, Weather } from '../island';
import { Mascot, type Outfit } from './Mascot';
import { candy } from './theme';

const ink = candy.ink;
const line = { stroke: ink, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const skyFor: Record<Weather, [string, string]> = {
  sunny: ['#8FD8FF', '#D9F3FF'],
  cloudy: ['#A9C4D8', '#E1ECF2'],
  gloomy: ['#7F8CA3', '#B9C2D0'],
};
const seaFor: Record<Weather, string> = { sunny: '#4FC3E8', cloudy: '#6FA9C4', gloomy: '#5E7F99' };

function Flower({ x, y, color, droop }: { x: number; y: number; color: string; droop: boolean }) {
  const tilt = droop ? 'rotate(35' : 'rotate(0';
  return <G transform={`${tilt} ${x} ${y + 12})`}>
    <Path d={`M${x} ${y + 12} V${y + 3}`} stroke="#2F8F5B" strokeWidth={2} strokeLinecap="round" />
    {[0, 72, 144, 216, 288].map((a) => <Circle key={a} cx={x + 3.2 * Math.cos((a - 90) * Math.PI / 180)} cy={y + 3.2 * Math.sin((a - 90) * Math.PI / 180)} r={2.6}
      fill={droop ? '#C9B8C2' : color} stroke={ink} strokeWidth={0.8} />)}
    <Circle cx={x} cy={y} r={1.8} fill="#FFE27A" stroke={ink} strokeWidth={0.8} />
  </G>;
}

function Tree({ x, y, scale = 1, droop }: { x: number; y: number; scale?: number; droop: boolean }) {
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
    <Path d="M-4 0 Q-3 -18 -2 -26 H2 Q3 -18 4 0 Z" fill="#B57A4E" {...line} />
    <Circle cx={0} cy={-36} r={17} fill={droop ? '#8FB59A' : '#5FC98A'} {...line} />
    <Circle cx={-11} cy={-28} r={10} fill={droop ? '#82A88D' : '#4FB97A'} {...line} />
    <Circle cx={11} cy={-29} r={10} fill={droop ? '#82A88D' : '#4FB97A'} {...line} />
    {!droop && <><Circle cx={-5} cy={-40} r={2.4} fill={candy.coral} /><Circle cx={7} cy={-33} r={2.4} fill={candy.coral} /></>}
  </G>;
}

/** Drifts its children gently, for clouds, birds and the boat. */
function Bob({ children, distance = 6, duration = 2600, x = false }: { children: React.ReactNode; distance?: number; duration?: number; x?: boolean }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.set(withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [duration, reduce, t]);
  const style = useAnimatedStyle(() => ({ transform: [x ? { translateX: t.value * distance } : { translateY: t.value * distance }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }, style]}>{children}</Animated.View>;
}

/**
 * The island. Drawn in a 320×220 box and scaled to `width`. Pieces appear as
 * they are earned; the weather tints the sky and droops the plants.
 */
export function IslandArt({ width, have, weather, outfit = 'none', mascot = true }: {
  width: number; have: Set<PieceId>; weather: Weather; outfit?: Outfit; mascot?: boolean;
}) {
  const height = width * 220 / 320;
  const k = width / 320;
  const droop = weather === 'gloomy';
  const [top, bottom] = skyFor[weather];
  const svg = (children: React.ReactNode) => <Svg width={width} height={height} viewBox="0 0 320 220" style={{ position: 'absolute' }}>{children}</Svg>;
  return <View style={{ width, height, overflow: 'hidden', borderRadius: 26 * k + 4 }}
    accessible accessibilityLabel={`Wupiko’s island with ${have.size} things growing. Weather: ${weather}.`}>
    {svg(<>
      <Defs>
        <LinearGradient id={`isl-${weather}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={top} /><Stop offset="1" stopColor={bottom} /></LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="320" height="220" fill={`url(#isl-${weather})`} />
      {weather === 'sunny' && <><Circle cx="268" cy="42" r="30" fill="#FFF3B0" opacity={.5} /><Circle cx="268" cy="42" r="18" fill="#FFD54A" /></>}
      {have.has('rainbow') && weather !== 'gloomy' && [candy.coral, '#FF9F45', candy.sun, candy.mint, candy.sky, candy.lilac].map((c, i) =>
        <Path key={c} d={`M${40 + i * 5} 150 A ${120 - i * 5} ${110 - i * 5} 0 0 1 ${280 - i * 5} 150`} stroke={c} strokeWidth={5} fill="none" opacity={.75} />)}
      <Rect x="0" y="150" width="320" height="70" fill={seaFor[weather]} />
      <Path d="M0 158 Q20 154 40 158 T80 158 T120 158 T160 158 T200 158 T240 158 T280 158 T320 158" stroke="#FFFFFF" strokeWidth={2} fill="none" opacity={.5} />
      <Path d="M0 186 Q25 182 50 186 T100 186 T150 186 T200 186 T250 186 T300 186 T350 186" stroke="#FFFFFF" strokeWidth={2} fill="none" opacity={.35} />
      {/* The island itself grows a little wider as it fills up. */}
      <Ellipse cx="160" cy="166" rx={92 + Math.min(have.size, 13) * 3} ry="20" fill="#F2D58C" {...line} />
      <Path d={`M${78 - have.size * 2} 160 Q100 ${118 - have.size} 160 112 Q220 ${118 - have.size} ${242 + have.size * 2} 160 Z`} fill={droop ? '#8FB59A' : '#7FD39A'} {...line} />
      {have.has('pond') && <Ellipse cx="200" cy="146" rx="22" ry="7" fill={seaFor[weather]} {...line} />}
      {have.has('tree') && <Tree x={118} y={140} droop={droop} />}
      {have.has('grove') && <Tree x={232} y={146} scale={0.8} droop={droop} />}
      {have.has('hut') && <G>
        <Rect x="178" y="110" width="26" height="22" fill="#FFE9C7" {...line} />
        <Path d="M174 112 L191 96 L208 112 Z" fill={candy.coral} {...line} />
        <Rect x="187" y="120" width="8" height="12" fill="#B57A4E" {...line} />
      </G>}
      {have.has('lighthouse') && <G>
        <Path d="M270 160 L274 112 H284 L288 160 Z" fill="#FFFFFF" {...line} />
        <Path d="M272 136 H286 M271 148 H287" stroke={candy.coral} strokeWidth={5} />
        <Rect x="273" y="104" width="12" height="9" fill={candy.sun} {...line} />
        <Path d="M271 104 L279 96 L287 104 Z" fill={candy.coral} {...line} />
      </G>}
      {have.has('bush') && <G>
        <Circle cx="94" cy="152" r="9" fill={droop ? '#82A88D' : '#4FB97A'} {...line} />
        <Circle cx="105" cy="150" r="8" fill={droop ? '#82A88D' : '#5FC98A'} {...line} />
        {!droop && <><Circle cx="92" cy="149" r={1.8} fill="#7A4FD6" /><Circle cx="104" cy="147" r={1.8} fill="#7A4FD6" /><Circle cx="98" cy="155" r={1.8} fill="#7A4FD6" /></>}
      </G>}
      {have.has('mushrooms') && [[240, 157], [249, 160], [231, 160]].map(([x, y], i) => <G key={i}>
        <Rect x={x - 1.5} y={y - 4} width="3" height="5" fill="#FFF4E2" stroke={ink} strokeWidth={1} />
        <Path d={`M${x - 5} ${y - 3} Q${x} ${y - 11} ${x + 5} ${y - 3} Z`} fill={candy.coral} stroke={ink} strokeWidth={1} />
      </G>)}
      {have.has('flowers') && [[136, 148, candy.pink], [212, 150, candy.lilac], [252, 153, candy.sun], [84, 156, candy.sky]].map(([x, y, c], i) =>
        <Flower key={i} x={x as number} y={y as number} color={c as string} droop={droop} />)}
      {have.has('sprouts') && [[110, 158], [190, 160], [226, 160]].map(([x, y], i) => <G key={i}>
        <Path d={`M${x} ${y} V${y - 6}`} stroke="#2F8F5B" strokeWidth={2} strokeLinecap="round" />
        <Path d={`M${x} ${y - 5} Q${x - 5} ${y - 9} ${x - 6} ${y - 5} Q${x - 3} ${y - 3} ${x} ${y - 5} Z`} fill="#5FD3A8" />
        <Path d={`M${x} ${y - 6} Q${x + 5} ${y - 10} ${x + 6} ${y - 6} Q${x + 3} ${y - 4} ${x} ${y - 6} Z`} fill="#5FD3A8" />
      </G>)}
    </>)}
    <Bob x distance={22 * k} duration={9000}>{svg(<G opacity={weather === 'sunny' ? .85 : .95}>
      <Path d="M30 40 C20 40 20 28 30 28 C32 20 46 20 48 28 C58 26 60 40 50 40 Z" fill={weather === 'gloomy' ? '#9AA3B2' : '#FFFFFF'} />
      {weather !== 'sunny' && <Path d="M150 30 C138 30 138 16 150 16 C153 6 170 6 172 16 C184 14 186 30 174 30 Z" fill={weather === 'gloomy' ? '#8892A3' : '#F4F7FA'} />}
      {weather !== 'sunny' && <Path d="M230 50 C220 50 220 40 230 40 C232 33 244 33 246 40 C255 38 257 50 248 50 Z" fill={weather === 'gloomy' ? '#9AA3B2' : '#FFFFFF'} />}
    </G>)}</Bob>
    {weather === 'gloomy' && svg(<G opacity={.55}>
      {[[60, 54], [90, 70], [150, 40], [175, 62], [240, 62], [262, 80], [120, 86]].map(([x, y], i) =>
        <Path key={i} d={`M${x} ${y} l-4 10`} stroke="#E6EEF7" strokeWidth={2} strokeLinecap="round" />)}
    </G>)}
    {have.has('boat') && <Bob distance={3 * k} duration={2200}>{svg(<G>
      <Path d="M38 178 H70 L64 188 H44 Z" fill="#B57A4E" {...line} />
      <Path d="M54 178 V160 L68 176 Z" fill="#FFFFFF" {...line} />
    </G>)}</Bob>}
    {have.has('bird') && <Bob distance={5 * k} duration={1800}>{svg(<G>
      <Path d="M200 74 Q205 68 210 74 Q215 68 220 74" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />
    </G>)}</Bob>}
    {have.has('butterflies') && weather === 'sunny' && <Bob distance={8 * k} duration={1500}>{svg(<G>
      {[[96, 118, candy.pink], [222, 112, candy.sun]].map(([x, y, c], i) => <G key={i}>
        <Ellipse cx={(x as number) - 3} cy={y as number} rx="3.5" ry="4.5" fill={c as string} stroke={ink} strokeWidth={1} />
        <Ellipse cx={(x as number) + 3} cy={y as number} rx="3.5" ry="4.5" fill={c as string} stroke={ink} strokeWidth={1} />
      </G>)}
    </G>)}</Bob>}
    {mascot && <View pointerEvents="none" style={{ position: 'absolute', left: width * .43, top: height * .5 }}>
      <Mascot mood={weather === 'gloomy' ? 'sleepy' : weather === 'cloudy' ? 'awake' : 'happy'} size={width * .16} animate outfit={outfit} />
    </View>}
  </View>;
}
