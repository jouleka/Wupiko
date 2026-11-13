import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useWupiko } from '../src/store';
import { findById, finds, stageOf, untilNext } from '../src/finds';
import { useTrips } from '../src/trips';
import { islandOf } from '../src/island';
import { IslandArt } from '../src/ui/IslandArt';
import { Keepsake } from '../src/ui/Keepsake';
import { countdown as timer } from '../src/ui/Postcard';
import { kindOf } from '../src/kind';
import type { Alarm, Morning } from '../src/types';
import { Garden, Icon, Mascot, Plant, Scene, Sky, Wordmark, type IconName, type Outfit } from '../src/ui/Art';
import { WupikoArt } from '../src/ui/Mascot';
import { dayKey, nextReward, summarize, wornOutfit, type Summary } from '../src/streak';
import { Bar, Button, Card, CircleButton, Copy, Screen, Sticker, Toggle, haptic, row, useAction } from '../src/ui/components';
import { Welcome } from '../src/ui/Welcome';
import { candy, display, phaseOf, skies, usePalette, type Phase } from '../src/ui/theme';
import { clockText, countdown, daySummary, greeting, nextDay } from '../src/ui/time';

const phaseIcon: Record<Phase, IconName> = { dawn: 'sunrise', day: 'sun', dusk: 'sparkle', night: 'moon' };

function useNow(interval = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
}

function Hero({ next, count, summary, outfit }: { next?: Alarm; count: number; summary: Summary; outfit: Outfit }) {
  const now = useNow();
  const phase = phaseOf(new Date(now).getHours());
  const s = skies[phase];
  const date = next ? new Date(next.nextAt!) : null;
  const clock = date ? clockText(date.getHours(), date.getMinutes()) : null;
  // Wupiko is a little sad for a day after a missed morning. No punishment, just a feeling.
  const sad = summary.latest?.outcome === 'missed' && now - summary.latest.date < 2 * 86400000;
  const mood = sad && phase !== 'night' ? 'sad' : !next || phase === 'night' ? 'sleepy' : 'awake';
  const garden = summary.days.length > 0;
  return <Sky phase={phase} height={garden ? 252 : 226}>
    <View style={{ flex: 1, padding: 20, paddingRight: 130, gap: 6 }}>
      <View style={[row, { gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,.35)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }]}>
        <Icon name={next ? 'bell' : 'moon'} color={s.text} size={14} weight={2.4} />
        <Text style={{ color: s.text, fontWeight: '800', fontSize: 13 }}>{next ? 'Next alarm' : count ? 'All alarms off' : 'No alarms yet'}</Text>
      </View>
      {clock && date ? <>
        <Text accessibilityLabel={`Next alarm ${clock.full}`} style={{ fontFamily: display, color: s.text, letterSpacing: -2, fontSize: 50, marginTop: 2, lineHeight: 56 }}>{clock.time}<Text style={{ fontSize: 20, letterSpacing: -.3 }}>{clock.period ? ' ' + clock.period : ''}</Text></Text>
        <Text style={{ color: s.sub, fontSize: 15, fontWeight: '700' }}>{nextDay(date.getTime())}</Text>
        <View style={[row, { gap: 5, alignSelf: 'flex-start', backgroundColor: s.text, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, marginTop: 2 }]}>
          <Icon name="clock" color={s.bottom} size={13} weight={2.6} />
          <Text style={{ color: s.bottom, fontWeight: '800', fontSize: 13 }}>Rings {countdown(date.getTime(), now)}</Text>
        </View>
      </> : <Text style={{ fontFamily: display, color: s.text, fontSize: 26, letterSpacing: -.6, marginTop: 6 }}>{count ? 'Wupiko is off duty.' : 'Nothing to wake for…'}</Text>}
    </View>
    {garden && <View style={{ position: 'absolute', left: 16, bottom: 8 }}><Garden days={summary.days} /></View>}
    <View style={{ position: 'absolute', right: 14, bottom: 14 }}><Mascot mood={mood} size={118} animate interactive outfit={outfit} say={sad ? 'I waited for you…' : undefined} /></View>
  </Sky>;
}

/** The streak pill beside the greeting; opens the wardrobe. */
function StreakPill({ summary }: { summary: Summary }) {
  const p = usePalette();
  const hot = summary.current > 0;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${summary.current} morning streak. Open Wupiko's wardrobe`} onPress={() => router.push('/settings')}
    style={({ pressed }) => [row, { gap: 4, paddingLeft: 6, paddingRight: 12, paddingVertical: 4, borderRadius: 99, borderWidth: 2, borderBottomWidth: 4,
      borderColor: hot ? '#F5C24A' : p.rule, backgroundColor: hot ? (p.dark ? '#4A3A1E' : '#FFF1C9') : p.panel, opacity: pressed ? .7 : 1 }]}>
    <Plant outcome={hot ? 'onTime' : 'late'} tint={summary.current} size={20} />
    <Text style={{ color: p.ink, fontFamily: display, fontSize: 17 }}>{summary.current}</Text>
  </Pressable>;
}

/** What the next milestone unlocks, so there's always something to chase. */
/** This morning's find while it is still unfolding, otherwise a way into the album. */
function TripCard() {
  const p = usePalette();
  const trips = useTrips();
  const now = useNow(1000);
  if (!trips.length) return null;
  const trip = [...trips].sort((a, b) => b.at - a.at)[0];
  const find = findById(trip.find);
  const stage = stageOf(trip, now);
  const live = trip.day === dayKey(now) && (stage === 'postcard' || stage === 'story' || stage === 'unpack');
  const owned = new Set(trips.filter((t) => t.collected).map((t) => t.find)).size;
  const next = untilNext(trip, now) ?? 0;
  const status = stage === 'unpack' ? `Ready to unpack! · ${timer(next)} left` : stage === 'story' ? `Story is in · unpacks in ${timer(next)}` : `Story in ${timer(next)}`;
  return <Pressable testID="trip-card" accessibilityRole="button" onPress={() => router.push(live ? '/find' : '/album')}
    style={({ pressed }) => [row, { gap: 12, marginTop: 12, padding: 10, paddingRight: 14, borderRadius: 22, borderWidth: 2, borderBottomWidth: 4, borderColor: live && stage === 'unpack' ? candy.sun : p.rule, backgroundColor: p.panel, opacity: pressed ? .75 : 1 }]}>
    <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: p.soft, alignItems: 'center', justifyContent: 'center' }}>
      {live || !find ? <WupikoArt face="happy" size={46} /> : <Keepsake id={find.id} size={40} locked={stage !== 'collected'} />}
    </View>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: p.ink, fontWeight: '800', fontSize: 14 }}>{live && find ? `Wupiko’s trip to ${find.place}` : 'Wupiko’s album'}</Text>
      <Text style={{ color: p.muted, fontWeight: '700', fontSize: 13 }}>{live ? status : `${owned} of ${finds.length} keepsakes found`}</Text>
    </View>
    <Icon name="arrow" color={p.muted} size={18} />
  </Pressable>;
}

/** A peek at the island, which grows with every good morning. */
function IslandCard({ mornings, outfit }: { mornings: Morning[]; outfit: Outfit }) {
  const p = usePalette();
  const island = islandOf(mornings);
  const have = new Set(island.earned.map((e) => e.id));
  const left = island.next ? island.next.at - island.growth : 0;
  return <Pressable testID="island-card" accessibilityRole="button" accessibilityLabel={`Wupiko’s island, ${island.growth} good mornings`} onPress={() => router.push('/island')}
    style={({ pressed }) => [row, { gap: 12, marginTop: 12, padding: 8, paddingRight: 14, borderRadius: 22, borderWidth: 2, borderBottomWidth: 4, borderColor: p.rule, backgroundColor: p.panel, opacity: pressed ? .75 : 1 }]}>
    <IslandArt width={96} have={have} weather={island.weather} outfit={outfit} />
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: p.ink, fontWeight: '800', fontSize: 14 }}>Wupiko’s island</Text>
      <Text style={{ color: p.muted, fontWeight: '700', fontSize: 13 }}>{island.next ? `${left === 1 ? 'One more morning' : `${left} more mornings`} → ${island.next.title}` : 'All grown. Look at it!'}</Text>
    </View>
    <Icon name="arrow" color={p.muted} size={18} />
  </Pressable>;
}

function NextReward({ summary }: { summary: Summary }) {
  const p = usePalette();
  const reward = nextReward(summary.current);
  if (!reward) return null;
  const left = reward.days - summary.current;
  return <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={({ pressed }) => [row, { gap: 12, marginTop: 12, padding: 10, paddingRight: 14, borderRadius: 22, borderWidth: 2, borderBottomWidth: 4, borderColor: p.rule, backgroundColor: p.panel, opacity: pressed ? .75 : 1 }]}>
    <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: p.soft, alignItems: 'center', justifyContent: 'center' }}>
      <WupikoArt face="happy" size={46} outfit={reward.outfit} />
    </View>
    <View style={{ flex: 1, gap: 5 }}>
      <Text style={{ color: p.ink, fontWeight: '800', fontSize: 14 }}>{left === 1 ? 'One more morning' : `${left} more mornings`} → {reward.title}</Text>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: p.soft, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round((summary.current / reward.days) * 100)}%`, height: '100%', borderRadius: 4, backgroundColor: candy.sun }} />
      </View>
    </View>
  </Pressable>;
}

function DayDots({ days, color }: { days: number[]; color: string }) {
  const p = usePalette();
  return <View style={[row, { gap: 4 }]}>
    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
      const on = days.includes(i + 1);
      return <View key={i} style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? color : 'transparent' }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: on ? '#FFFFFF' : p.muted, opacity: on ? 1 : .6 }}>{d}</Text>
      </View>;
    })}
  </View>;
}

function AlarmCard({ alarm, index }: { alarm: Alarm; index: number }) {
  const p = usePalette();
  const { saveAlarm, permissions, requestPermission, getSnapshot } = useWupiko();
  const { busy, run } = useAction();
  const { time, period, full } = clockText(alarm.hour, alarm.minute);
  const repeat = daySummary(alarm.days);
  const phase = phaseOf(alarm.hour);
  const s = skies[phase];
  const nudge = kindOf(alarm) === 'nudge';
  const detail = nudge ? `Reminder · ${alarm.label || repeat}` : alarm.label || repeat;
  return <Animated.View entering={FadeInDown.delay(60 + index * 50).duration(300)} layout={LinearTransition.duration(220)} style={{ marginBottom: 12 }}>
    <Card tint={alarm.enabled ? (p.dark ? s.tintDark : s.tint) : p.panel} style={{ paddingVertical: 14, paddingHorizontal: 16, opacity: alarm.enabled ? 1 : .72 }}>
      <View style={[row, { gap: 12 }]}>
        <Pressable testID={`alarm-row-${alarm.id}`} accessibilityRole="button" accessibilityLabel={`Edit ${alarm.label || 'alarm'}, ${full}, ${repeat}`} onPress={() => router.push({ pathname: '/editor', params: { id: alarm.id } })} style={({ pressed }) => [row, { flex: 1, gap: 12, opacity: pressed ? .6 : 1 }]}>
          <Sticker icon={!alarm.enabled ? 'moon' : nudge ? 'bell' : phaseIcon[phase]} color={alarm.enabled ? s.sticker : p.track} size={42} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: p.ink, fontFamily: display, fontSize: 36, letterSpacing: -1.6 }}>{time}<Text style={{ fontSize: 15, letterSpacing: 0 }}>{period ? ' ' + period : ''}</Text></Text>
            <Copy size={14} muted style={{ fontWeight: '700' }} >{alarm.enabled ? detail : `Off · ${detail}`}</Copy>
          </View>
        </Pressable>
        <Toggle testID={`alarm-toggle-${alarm.id}`} label={`${alarm.label || 'Alarm'} at ${full} enabled`} value={alarm.enabled} disabled={busy} onChange={(enabled) => void run(async () => {
          if (enabled && (permissions.alarm !== 'granted' || permissions.notifications === false)) {
            await requestPermission();
            const current = getSnapshot().permissions;
            if (current.alarm !== 'granted' || current.notifications === false) {
              Alert.alert('Allow access to enable this alarm', 'Open alarm permissions in Settings to continue.', [
                { text: 'Cancel', style: 'cancel' }, { text: 'Settings', onPress: () => router.push('/settings') },
              ]);
              return;
            }
          }
          haptic();
          await saveAlarm({ ...alarm, enabled });
        }, 'Couldn’t update this alarm')} />
      </View>
      <View style={[row, { justifyContent: 'space-between', marginTop: 10, paddingLeft: 54 }]}>
        <DayDots days={alarm.days.length ? alarm.days : []} color={alarm.enabled ? s.sticker : p.track} />
        {!alarm.days.length && <Text style={{ color: p.muted, fontSize: 12, fontWeight: '800' }}>ONCE</Text>}
      </View>
    </Card>
  </Animated.View>;
}

export default function Home() {
  const { alarms, settings, permissions, error, refresh, mornings } = useWupiko();
  const p = usePalette();
  const { run } = useAction();
  if (!settings.onboarded) return <Welcome />;
  const next = alarms.filter((alarm) => alarm.enabled && alarm.nextAt != null).sort((a, b) => a.nextAt! - b.nextAt!)[0];
  const sorted = [...alarms].sort((a, b) => a.hour - b.hour || a.minute - b.minute || a.label.localeCompare(b.label));
  const summary = summarize(mornings ?? []);
  const outfit = wornOutfit(settings.outfit, summary.best);
  const warning = permissions.alarm !== 'granted' || permissions.notifications === false || permissions.fullScreen === false;
  return <Screen header={<Bar><Wordmark /><CircleButton icon="settings" label="Settings" onPress={() => router.push('/settings')} /></Bar>}
    footer={<Button testID="create-alarm" title={alarms.length ? 'Add alarm' : 'Set your first alarm'} icon="plus" onPress={() => router.push('/editor')} />}>
    <View style={[row, { justifyContent: 'space-between', marginBottom: 14, marginTop: 2, gap: 10 }]}>
      <Copy heading size={30} style={{ flexShrink: 1 }}>{greeting(new Date().getHours())}{new Date().getHours() >= 21 || new Date().getHours() < 5 ? '.' : '!'}</Copy>
      {sorted.length > 0 && <StreakPill summary={summary} />}
    </View>
    {!!error && <Pressable accessibilityRole="button" onPress={() => void run(refresh)} style={{ paddingVertical: 12 }}><Copy>{error} · Try again</Copy></Pressable>}
    {warning && <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={({ pressed }) => [row, { gap: 10, borderWidth: 2, borderColor: '#FFB199', borderRadius: 18, padding: 12, marginBottom: 14, backgroundColor: pressed ? p.soft : p.dark ? '#43283A' : '#FFEDE6' }]}>
      <Sticker icon="bell" color="#FF6B4A" size={30} /><Text style={{ color: p.ink, flex: 1, fontSize: 15, fontWeight: '700' }}>{permissions.alarm !== 'granted' ? 'Allow access to schedule alarms' : permissions.notifications === false ? 'Allow alarm notifications' : 'Allow the lock-screen alarm display'}</Text><Icon name="arrow" color={p.muted} size={18} />
    </Pressable>}
    {sorted.length ? <>
      <Hero next={next} count={alarms.length} summary={summary} outfit={outfit} />
      <TripCard />
      <IslandCard mornings={mornings ?? []} outfit={outfit} />
      <NextReward summary={summary} />
      <View style={[row, { justifyContent: 'space-between', marginTop: 24, marginBottom: 12 }]}>
        <Copy heading size={24}>Your alarms</Copy>
        <View style={{ backgroundColor: p.soft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ color: p.muted, fontWeight: '800' }}>{alarms.filter((a) => a.enabled).length} on</Text></View>
      </View>
      {sorted.map((alarm, i) => <AlarmCard key={alarm.id} alarm={alarm} index={i} />)}
    </> : <View style={{ flex: 1, justifyContent: 'center', gap: 22, paddingBottom: 22 }}>
      <Scene mood="sleepy" interactive />
      <View style={{ gap: 6, alignItems: 'center' }}>
        <Copy heading size={30} style={{ textAlign: 'center' }}>A little too quiet here.</Copy>
        <Copy muted size={17} style={{ textAlign: 'center' }}>Wupiko is napping. Give it a boop,{'\n'}then set your first alarm.</Copy>
      </View>
    </View>}
  </Screen>;
}
