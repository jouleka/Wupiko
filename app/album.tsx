import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Icon } from '../src/ui/Art';
import { findById, finds, season, stageOf } from '../src/finds';
import { useTrips } from '../src/trips';
import { Bar, Card, CircleButton, Copy, Heading, Screen, row } from '../src/ui/components';
import { Keepsake } from '../src/ui/Keepsake';
import { tripDate, useNow } from '../src/ui/Postcard';
import { candy, display, usePalette } from '../src/ui/theme';

/** The season's chapters so far. Told ones can be tapped to read again. */
function Season({ told }: { told: number }) {
  const p = usePalette();
  const [open, setOpen] = useState<number | null>(null);
  const total = season.chapters.length;
  return <Card style={{ gap: 10, marginBottom: 22 }}>
    <View style={{ gap: 2 }}>
      <Text style={{ color: p.muted, fontWeight: '800', fontSize: 12, letterSpacing: .6, textTransform: 'uppercase' }}>Season 1 · {told >= total ? 'Complete' : `${told} of ${total} chapters`}</Text>
      <Text style={{ color: p.ink, fontFamily: display, fontSize: 21 }}>{season.title}</Text>
    </View>
    <View style={{ height: 8, borderRadius: 4, backgroundColor: p.soft, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round((told / total) * 100)}%`, height: '100%', backgroundColor: candy.sun }} />
    </View>
    {season.chapters.map((c, i) => {
      const n = i + 1, known = n <= told, reading = open === n;
      return <Pressable key={n} disabled={!known} accessibilityRole="button" accessibilityState={{ expanded: reading, disabled: !known }}
        accessibilityLabel={known ? `Chapter ${n}: ${c.title}` : `Chapter ${n}, not told yet`} onPress={() => setOpen(reading ? null : n)}
        style={{ paddingVertical: 6, gap: 4 }}>
        <View style={[row, { gap: 10 }]}>
          <Text style={{ width: 22, color: known ? candy.coral : p.muted, fontWeight: '900', fontSize: 14 }}>{n}</Text>
          <Text style={{ flex: 1, color: known ? p.ink : p.muted, fontWeight: '700', fontSize: 15 }}>{known ? c.title : n === told + 1 ? 'Next morning…' : '???'}</Text>
          {known && <Icon name={reading ? 'close' : 'arrow'} color={p.muted} size={14} />}
        </View>
        {reading && <Copy size={15} style={{ lineHeight: 22, paddingLeft: 32 }}>{c.story}</Copy>}
      </Pressable>;
    })}
  </Card>;
}

/** The season so far, every keepsake Wupiko has brought back, and the recent trips. */
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
    <Heading kicker={`${owned.size} of ${finds.length} keepsakes`}>Wupiko’s album</Heading>
    <Season told={Math.max(0, ...trips.map((t) => t.chapter ?? 0))} />
    <View style={[row, { flexWrap: 'wrap', gap: 8 }]}>
      {finds.map((f) => {
        const have = owned.has(f.id);
        return <View key={f.id} accessible accessibilityLabel={have ? `${f.keepsake} from ${f.place}` : 'Not found yet'}
          style={{ width: tile, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: p.rule, backgroundColor: p.panel }}>
          <Keepsake id={f.id} size={tile * .52} locked={!have} />
          <Text numberOfLines={2} style={{ color: have ? p.ink : p.muted, fontWeight: '800', fontSize: 12, textAlign: 'center', paddingHorizontal: 6 }}>{have ? f.keepsake : '???'}</Text>
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
