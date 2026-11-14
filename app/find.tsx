import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { chapterOf, findById, season, stageOf, unpackAfter, untilNext } from '../src/finds';
import { unpack, usePings, useTrips } from '../src/trips';
import { Icon, Mascot } from '../src/ui/Art';
import { Bar, Button, Card, CircleButton, Copy, Heading, Screen, haptic, row, useAction } from '../src/ui/components';
import { useFeedback } from '../src/ui/Feedback';
import { Keepsake } from '../src/ui/Keepsake';
import { Postcard, countdown, tripDate, useNow } from '../src/ui/Postcard';
import { candy, display, usePalette } from '../src/ui/theme';

/** Wupiko shares last night's trip: postcard now, story soon, keepsake if you stay up. */
export default function FindScreen() {
  const p = usePalette();
  const trips = useTrips();
  const now = useNow();
  const { busy, run } = useAction();
  const show = useFeedback();
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  const trip = [...trips].sort((a, b) => b.at - a.at)[0];
  const find = trip && findById(trip.find);
  const chapter = trip && chapterOf(trip);
  const pings = usePings(trip);
  if (!trip || !find) return <Screen header={<Bar><CircleButton label="Back" icon="back" onPress={back} /></Bar>}>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Mascot mood="sleepy" size={140} animate />
      <Heading>No trip yet</Heading>
      <Copy muted style={{ textAlign: 'center' }}>Wake up with a “Wake me up” alarm and Wupiko will tell you where it went in the night.</Copy>
    </View>
  </Screen>;
  const stage = stageOf(trip, now);
  const next = untilNext(trip, now);
  const storyOpen = stage !== 'postcard';
  return <Screen header={<Bar><CircleButton label="Back" icon="back" onPress={back} /><CircleButton label="Album" icon="heart" onPress={() => router.push('/album')} /></Bar>}
    footer={stage === 'unpack'
      ? <Button testID="unpack" title="Unpack Wupiko’s bag" icon="sparkle" disabled={busy} onPress={() => void run(async () => {
        await unpack(trip.day);
        haptic(true);
        show({ title: `You got the ${find.keepsake}!`, description: 'Wupiko put it in your album.', celebrate: true, mood: 'happy' });
      }, 'Couldn’t unpack')} />
      : <Button title={stage === 'collected' || stage === 'gone' ? 'Back to alarms' : 'I’ll stay up with Wupiko'} secondary onPress={back} />}>
    <Heading kicker={chapter ? `Chapter ${trip.chapter} of ${season.chapters.length} · ${chapter.title}` : tripDate(trip)}>{stage === 'gone' ? 'Wupiko dozed off…' : 'Wupiko is back!'}</Heading>
    <View style={{ gap: 18 }}>
      <Postcard find={find} line={chapter?.postcard} />
      {pings.status === 'undetermined' && (stage === 'postcard' || stage === 'story') && <Card style={[row, { gap: 12 }]}>
        <Icon name="bell" color={candy.coral} size={22} weight={2.4} />
        <View style={{ flex: 1, gap: 6 }}>
          <Copy size={15} style={{ fontWeight: '700' }}>Want a little ping when the story and the keepsake are ready?</Copy>
          <Button testID="enable-pings" title="Ping me" secondary icon="bell" onPress={() => void pings.enable()} />
        </View>
      </Card>}

      <Card style={{ gap: 8 }}>
        <View style={[row, { gap: 8 }]}>
          <Icon name="sparkle" color={candy.lilac} size={18} weight={2.4} />
          <Text style={{ color: p.ink, fontFamily: display, fontSize: 19 }}>The story</Text>
        </View>
        {storyOpen
          ? <Copy size={16} style={{ lineHeight: 23 }}>{chapter?.story ?? find.story}</Copy>
          : <Copy muted size={15}>Wupiko is still yawning… story in {countdown(next ?? 0)}</Copy>}
      </Card>

      <Card style={{ gap: 10, alignItems: 'center', paddingVertical: 18 }} tint={stage === 'collected' ? (p.dark ? '#24314F' : '#E9FBF2') : undefined}>
        {stage === 'collected' && <>
          <Keepsake id={find.id} size={96} />
          <Text style={{ color: p.ink, fontFamily: display, fontSize: 22 }}>{find.keepsake}</Text>
          <Copy muted size={14} style={{ textAlign: 'center' }}>{find.blurb}</Copy>
        </>}
        {stage === 'unpack' && <>
          <Mascot mood="happy" size={90} animate say="I brought you something!" />
          <Copy muted size={14}>Unpack it before Wupiko falls asleep · {countdown(next ?? 0)}</Copy>
        </>}
        {(stage === 'postcard' || stage === 'story') && <>
          <Mascot mood="awake" size={80} animate />
          <Text style={{ color: p.ink, fontWeight: '800', fontSize: 16 }}>Something’s rattling in Wupiko’s bag…</Text>
          <Copy muted size={14}>Stay up and it unpacks in {countdown(trip.at + unpackAfter - now)}</Copy>
        </>}
        {stage === 'gone' && <>
          <Mascot mood="sleepy" size={80} />
          <Copy muted size={15} style={{ textAlign: 'center' }}>Wupiko fell asleep holding its keepsake. Stay up with it tomorrow to see what it brings.</Copy>
        </>}
      </Card>
    </View>
  </Screen>;
}
