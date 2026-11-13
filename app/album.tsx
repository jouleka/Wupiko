import { router } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { findById, finds, stageOf } from '../src/finds';
import { useTrips } from '../src/trips';
import { Bar, Card, CircleButton, Copy, Heading, Screen, row } from '../src/ui/components';
import { Keepsake } from '../src/ui/Keepsake';
import { tripDate, useNow } from '../src/ui/Postcard';
import { candy, display, usePalette } from '../src/ui/theme';

/** Every keepsake Wupiko has brought back, plus the recent trips. */
export default function Album() {
  const p = usePalette();
  const trips = useTrips();
  const now = useNow(30_000);
  const { width } = useWindowDimensions();
  const owned = new Set(trips.filter((t) => t.collected).map((t) => t.find));
  const tile = Math.floor((Math.min(width, 650) - 40 - 16) / 3);
  const recent = [...trips].sort((a, b) => b.at - a.at).slice(0, 14);
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  return <Screen header={<Bar><CircleButton label="Back" icon="back" onPress={back} /></Bar>}>
    <Heading kicker={`${owned.size} of ${finds.length} found`}>Wupiko’s album</Heading>
    <View style={[row, { flexWrap: 'wrap', gap: 8 }]}>
      {finds.map((f) => {
        const have = owned.has(f.id);
        return <View key={f.id} accessible accessibilityLabel={have ? `${f.keepsake} from ${f.place}` : 'Not found yet'}
          style={{ width: tile, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: have && f.rare ? candy.sun : p.rule, backgroundColor: p.panel }}>
          <Keepsake id={f.id} size={tile * .52} locked={!have} />
          <Text numberOfLines={2} style={{ color: have ? p.ink : p.muted, fontWeight: '800', fontSize: 12, textAlign: 'center', paddingHorizontal: 6 }}>{have ? f.keepsake : '???'}</Text>
          {f.rare && <Text style={{ color: '#C98A00', fontWeight: '900', fontSize: 10, letterSpacing: .6 }}>RARE</Text>}
        </View>;
      })}
    </View>
    <Copy heading size={22} style={{ marginTop: 26, marginBottom: 10 }}>Recent trips</Copy>
    {recent.length ? <View style={{ gap: 8 }}>
      {recent.map((trip) => {
        const find = findById(trip.find)!;
        const stage = stageOf(trip, now);
        return <Card key={trip.day} style={[row, { gap: 12, paddingVertical: 10 }]}>
          <Keepsake id={find.id} size={40} locked={stage !== 'collected'} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: p.ink, fontFamily: display, fontSize: 16 }}>{find.place.replace(/^the /, 'The ')}</Text>
            <Copy muted size={13}>{tripDate(trip)} · {stage === 'collected' ? `Brought back the ${find.keepsake}` : stage === 'gone' ? 'Wupiko fell asleep holding it' : 'Still unpacking…'}</Copy>
          </View>
        </Card>;
      })}
    </View> : <Copy muted>No trips yet. Wake up with Wupiko to start your album.</Copy>}
  </Screen>;
}
