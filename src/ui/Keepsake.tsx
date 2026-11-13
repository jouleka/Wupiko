import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { KeepsakeId } from '../finds';
import { candy } from './theme';

const ink = candy.ink;
const line = { stroke: ink, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Shape({ id }: { id: KeepsakeId }) {
  switch (id) {
    case 'bun': return <G>
      <Path d="M10 40 C8 28 18 22 24 26 C26 16 40 14 44 24 C52 20 58 30 54 40 Z" fill="#FFF4E6" {...line} />
      <Path d="M10 40 H54 C54 48 46 52 32 52 C18 52 10 48 10 40 Z" fill="#F2B880" {...line} />
      <Path d="M22 31 Q26 28 30 31 M36 30 Q40 27 44 30" fill="none" stroke="#E8A36A" strokeWidth={2.5} strokeLinecap="round" />
    </G>;
    case 'marble': return <G>
      <Circle cx="32" cy="34" r="19" fill="#7FD9D0" {...line} />
      <Path d="M18 38 Q26 30 34 38 T48 36" fill="none" stroke="#3FA9B5" strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx="25" cy="25" rx="5" ry="3.5" fill="#FFFFFF" opacity={.85} />
    </G>;
    case 'moonflower': return <G>
      <Path d="M32 34 L32 58" stroke="#5FBF8A" strokeWidth={3.5} strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => <Ellipse key={a} cx="32" cy="20" rx="7" ry="11" fill="#E6DCFF" {...line} transform={`rotate(${a} 32 30)`} />)}
      <Circle cx="32" cy="30" r="6" fill="#FFE27A" {...line} />
    </G>;
    case 'ticket': return <G>
      <Path d="M8 20 H56 V28 A4 4 0 0 0 56 36 V44 H8 V36 A4 4 0 0 0 8 28 Z" fill="#FFD3A8" {...line} />
      <Path d="M40 20 V44" stroke={ink} strokeWidth={2.5} strokeDasharray="3 4" />
      <Path d="M15 28 H32 M15 35 H28" stroke="#C9764A" strokeWidth={3} strokeLinecap="round" />
      <Circle cx="48" cy="32" r="4" fill={candy.coral} />
    </G>;
    case 'jar': return <G>
      <Rect x="18" y="12" width="28" height="7" rx="3" fill="#C49BE8" {...line} />
      <Path d="M20 19 H44 V50 Q44 56 38 56 H26 Q20 56 20 50 Z" fill="#FFF7C2" {...line} />
      {[[27, 32], [37, 28], [32, 42], [26, 47], [39, 45]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.6} fill={candy.sun} />)}
    </G>;
    case 'feather': return <G>
      <Path d="M48 10 C24 14 14 34 16 54 C30 50 50 34 48 10 Z" fill="#E7ECF5" {...line} />
      <Path d="M16 54 L40 22" stroke="#8EA0BF" strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M24 42 L30 44 M28 36 L35 37 M33 30 L39 30" stroke="#8EA0BF" strokeWidth={2} strokeLinecap="round" />
    </G>;
    case 'acorn': return <G>
      <Path d="M18 30 Q32 62 46 30 Z" fill="#E8B077" {...line} />
      <Path d="M12 30 Q12 16 32 16 Q52 16 52 30 Z" fill="#9C6B43" {...line} />
      <Path d="M32 16 Q33 10 38 8" fill="none" {...line} />
      <Path d="M18 24 H46" stroke="#7C5232" strokeWidth={2} strokeLinecap="round" />
    </G>;
    case 'shell': return <G>
      <Path d="M32 54 C14 52 10 36 18 26 C24 18 38 16 44 24 C50 32 44 42 36 42 C30 42 28 36 32 32" fill="#FFC9D9" {...line} />
      <Path d="M32 54 C44 54 54 44 52 32" fill="none" {...line} />
    </G>;
    case 'star': return <G>
      <Path d="M32 8 L38 24 L55 25 L42 36 L46 53 L32 44 L18 53 L22 36 L9 25 L26 24 Z" fill={candy.sun} {...line} />
      <Circle cx="27" cy="29" r="2.4" fill={ink} /><Circle cx="37" cy="29" r="2.4" fill={ink} />
      <Path d="M28 35 Q32 38 36 35" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" />
    </G>;
    case 'key': return <G>
      <Circle cx="20" cy="32" r="11" fill="#FFD25E" {...line} />
      <Circle cx="20" cy="32" r="4.5" fill="#FFF4E2" {...line} />
      <Path d="M31 32 H56 M48 32 V40 M54 32 V38" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <Path d="M31 32 H56 M48 32 V40 M54 32 V38" fill="none" stroke="#FFD25E" strokeWidth={2} strokeLinecap="round" />
    </G>;
  }
}

/** A keepsake Wupiko brought back. Locked ones show as a quiet silhouette. */
export function Keepsake({ id, size = 64, locked = false }: { id: KeepsakeId; size?: number; locked?: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 64 64" opacity={locked ? .18 : 1}>
    <Shape id={id} />
  </Svg>;
}
