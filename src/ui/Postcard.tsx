import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { Find, Trip } from '../finds';
import { dayKey } from '../island';
import { Sky } from './Art';
import { Mascot } from './Mascot';
import { candy, display, skies } from './theme';

export function useNow(every = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(timer);
  }, [every]);
  return now;
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The front of the postcard Wupiko sends from its night trip. */
export function Postcard({ find, line = find.postcard, height = 200 }: { find: Find; line?: string; height?: number }) {
  const s = skies[find.phase];
  return <View style={{ borderRadius: 24, borderWidth: 3, borderColor: candy.ink, backgroundColor: '#FFFDF7', padding: 8, transform: [{ rotate: '-1.5deg' }] }}
    accessible accessibilityLabel={`Postcard from ${find.place}: ${line}`}>
    <Sky phase={find.phase} height={height} radius={16}>
      <View style={{ position: 'absolute', top: 10, right: 10, width: 54, height: 62, backgroundColor: '#FFFDF7', borderRadius: 6, borderWidth: 2, borderColor: candy.ink, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
        <Mascot mood="happy" size={40} />
      </View>
      <View style={{ position: 'absolute', left: 14, bottom: 12, right: 80 }}>
        <Text style={{ color: s.text, fontWeight: '800', fontSize: 13, letterSpacing: .4, textTransform: 'uppercase' }}>Greetings from</Text>
        <Text style={{ color: s.text, fontFamily: display, fontSize: 24, letterSpacing: -.6 }}>{find.place.replace(/^the /, 'The ')}</Text>
      </View>
    </Sky>
    <Text style={{ color: candy.ink, fontSize: 16, fontWeight: '700', fontStyle: 'italic', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4 }}>“{line}” — W.</Text>
  </View>;
}

export function tripDate(trip: Trip, today = dayKey(Date.now())) {
  if (trip.day === today) return 'Today';
  const [y, m, d] = trip.day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
