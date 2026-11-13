import { router } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { islandOf, pieces, weatherLine } from '../src/island';
import { useWupiko } from '../src/store';
import { summarize, wornOutfit } from '../src/streak';
import { Icon } from '../src/ui/Art';
import { Bar, Card, CircleButton, Copy, Heading, Screen, row } from '../src/ui/components';
import { IslandArt } from '../src/ui/IslandArt';
import { candy, display, usePalette } from '../src/ui/theme';

/** Wupiko's island: every good morning grows it, and nothing is ever taken away. */
export default function IslandScreen() {
  const p = usePalette();
  const { mornings, settings } = useWupiko();
  const { width } = useWindowDimensions();
  const summary = summarize(mornings ?? []);
  const island = islandOf(mornings ?? []);
  const have = new Set(island.earned.map((e) => e.id));
  const art = Math.min(width, 650) - 40;
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  const left = island.next ? island.next.at - island.growth : 0;
  const prev = [...island.earned].pop()?.at ?? 0;
  return <Screen header={<Bar><CircleButton label="Back" icon="back" onPress={back} /></Bar>}>
    <Heading kicker={`${island.growth} good ${island.growth === 1 ? 'morning' : 'mornings'}`}>Wupiko’s island</Heading>
    <View style={{ gap: 16 }}>
      <IslandArt width={art} have={have} weather={island.weather} outfit={wornOutfit(settings.outfit, summary.best)} />
      <Card style={[row, { gap: 10 }]}>
        <Icon name={island.weather === 'sunny' ? 'sun' : 'moon'} color={island.weather === 'sunny' ? '#F5A300' : '#7F8CA3'} size={22} weight={2.4} />
        <Copy size={15} style={{ flex: 1, fontWeight: '600' }}>{island.growth ? weatherLine[island.weather] : 'An empty little island. Every good morning grows something here.'}</Copy>
      </Card>
      {island.next ? <Card style={{ gap: 8 }}>
        <Text style={{ color: p.ink, fontFamily: display, fontSize: 18 }}>{left === 1 ? 'One more morning' : `${left} more mornings`} → {island.next.title}</Text>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: p.soft, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(((island.growth - prev) / (island.next.at - prev)) * 100)}%`, height: '100%', backgroundColor: candy.mint }} />
        </View>
      </Card> : <Card><Copy size={16} style={{ fontWeight: '700' }}>Your island is complete. Wupiko is very proud of you.</Copy></Card>}
      <Copy heading size={22} style={{ marginTop: 8 }}>What’s growing</Copy>
      <View style={{ gap: 8 }}>
        {pieces.map((piece) => {
          const got = have.has(piece.id);
          return <View key={piece.id} accessible accessibilityLabel={got ? `${piece.title}: ${piece.blurb}` : `${piece.title}, after ${piece.at} good mornings`}
            style={[row, { gap: 12, padding: 12, borderRadius: 18, borderWidth: 2, borderColor: p.rule, backgroundColor: got ? p.panel : 'transparent', opacity: got ? 1 : .6 }]}>
            <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: got ? candy.mint : p.soft }}>
              {got ? <Icon name="check" color="#FFFFFF" size={18} weight={3} /> : <Text style={{ color: p.muted, fontWeight: '900', fontSize: 13 }}>{piece.at}</Text>}
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={{ color: p.ink, fontWeight: '800', fontSize: 15 }}>{piece.title}</Text>
              <Copy muted size={13}>{got ? piece.blurb : `After ${piece.at} good ${piece.at === 1 ? 'morning' : 'mornings'}`}</Copy>
            </View>
          </View>;
        })}
      </View>
    </View>
  </Screen>;
}
