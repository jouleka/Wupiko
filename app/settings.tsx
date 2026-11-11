import { useState } from 'react';
import { router } from 'expo-router';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { rewards, summarize, wornOutfit } from '../src/streak';
import { WupikoArt } from '../src/ui/Mascot';
import { useWupiko } from '../src/store';
import type { OutfitChoice, Settings, Sound, Theme } from '../src/types';
import { Icon, Mascot, type IconName } from '../src/ui/Art';
import { Bar, Button, Card, Choices, CircleButton, Copy, Field, Heading, Screen, Squish, Toggle, haptic, row, useAction } from '../src/ui/components';
import { candy, display, usePalette } from '../src/ui/theme';
import { soundNames } from '../src/ui/time';

const themes: { value: Theme; title: string; icon: IconName; color: string }[] = [
  { value: 'system', title: 'Auto', icon: 'sparkle', color: candy.lilac },
  { value: 'light', title: 'Light', icon: 'sun', color: '#F5A300' },
  { value: 'dark', title: 'Dark', icon: 'moon', color: '#6D5CFF' },
];
const soundLook: Record<Sound, { icon: IconName; color: string }> = {
  daybreak: { icon: 'sunrise', color: candy.coral }, ripple: { icon: 'wave', color: candy.sky }, chime: { icon: 'bell', color: candy.lilac },
};
const sounds = Object.entries(soundNames).map(([value, title]) => ({ value: value as Sound, title, ...soundLook[value as Sound] }));

/** Streak rewards Wupiko can wear. Locked ones show what it takes. */
function Wardrobe({ best, current, onTime, choice, onPick }: { best: number; current: number; onTime: number; choice: OutfitChoice; onPick: (o: OutfitChoice) => void }) {
  const p = usePalette();
  const worn = wornOutfit(choice, best);
  const { width } = useWindowDimensions();
  // Three per row inside the 20pt screen gutters, with 8pt gaps.
  const tile = Math.floor((Math.min(width, 650) - 40 - 16) / 3);
  const tiles = [{ outfit: 'none' as const, title: 'Just me', days: 0 }, ...rewards.map((r) => ({ outfit: r.outfit, title: r.title, days: r.days }))];
  return <View style={{ gap: 12 }}>
    <View style={[row, { gap: 8 }]}>
      {[{ n: current, label: 'streak' }, { n: best, label: 'best' }, { n: onTime, label: 'flowers' }].map((stat) => <View key={stat.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 18, backgroundColor: p.soft }}>
        <Text style={{ color: p.ink, fontFamily: display, fontSize: 24 }}>{stat.n}</Text>
        <Text style={{ color: p.muted, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: .6 }}>{stat.label}</Text>
      </View>)}
    </View>
    <View style={[row, { flexWrap: 'wrap', gap: 8 }]}>
      {tiles.map((t) => {
        const open = best >= t.days, on = worn === t.outfit;
        return <Squish key={t.outfit} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: !open }}
          accessibilityLabel={open ? t.title : `${t.title}, locked. Reach a ${t.days} morning streak.`}
          onPress={() => { if (open) { haptic(); onPick(t.outfit); } }}
          style={{ width: tile, alignItems: 'center', paddingTop: 8, paddingBottom: 10, borderRadius: 22, borderWidth: 2, borderBottomWidth: 4,
            borderColor: on ? candy.mint : p.rule, backgroundColor: on ? (p.dark ? '#1F3A33' : '#E3F8EF') : p.panel }}>
          <View style={{ opacity: open ? 1 : .3 }}><WupikoArt face={open ? 'happy' : 'sleepy'} size={64} outfit={t.outfit} /></View>
          <Text numberOfLines={1} style={{ color: open ? p.ink : p.muted, fontWeight: '800', fontSize: 13, marginTop: 2 }}>{open ? t.title : `${t.days}-day streak`}</Text>
          {!open && <View style={{ position: 'absolute', top: 6, right: 8, backgroundColor: p.soft, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 11, fontWeight: '900', color: p.muted }}>LOCKED</Text></View>}
        </Squish>;
      })}
    </View>
  </View>;
}

function Status({ ok, children }: { ok: boolean; children: string }) {
  const p = usePalette();
  return <View style={[row, { gap: 10 }]}>
    <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? candy.mint : candy.coral }}>
      <Icon name={ok ? 'check' : 'close'} color="#FFFFFF" size={14} weight={3} />
    </View>
    <Text style={{ color: p.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>{children}</Text>
  </View>;
}

export default function Preferences() {
  const p = usePalette();
  const { settings, permissions, requestPermission, openSettings, updateSettings, mornings } = useWupiko();
  const summary = summarize(mornings ?? []);
  const { run, busy } = useAction();
  const [boops, setBoops] = useState(0);
  function change(patch: Partial<Settings>) {
    void run(async () => { await updateSettings(patch); haptic(); }, 'Couldn’t save your preference');
  }
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  const needsAlarm = permissions.alarm !== 'granted';
  const needsNotifications = permissions.notifications === false;
  const needsScreen = permissions.fullScreen === false;
  const allGood = !needsAlarm && !needsNotifications && !needsScreen;
  return <Screen header={<Bar><CircleButton label="Back to alarms" icon="back" onPress={back} /></Bar>}>
    <Heading kicker="Make it yours">Settings</Heading>
    <View style={{ gap: 28 }}>
      {Platform.OS === 'ios' && <Field title="Wupiko’s wardrobe" icon="heart" color={candy.pink} note="Wake up on time to keep your streak and unlock new outfits. Missed mornings reset the streak, but outfits stay yours.">
        <Wardrobe best={summary.best} current={summary.current} onTime={summary.onTime} choice={settings.outfit} onPick={(outfit) => change({ outfit })} />
      </Field>}
      <Field title="Appearance" icon="palette" color={candy.lilac}><Choices label="Theme" options={themes} value={settings.theme} onChange={(theme) => change({ theme })} /></Field>
      <Field title="Default alarm sound" icon="sound" color={candy.coral}><Choices label="Default alarm sound" options={sounds} value={settings.sound} onChange={(sound) => change({ sound })} /></Field>
      {Platform.OS === 'android' && <Card style={[row, { justifyContent: 'space-between', gap: 10, paddingVertical: 8 }]}><Icon name="vibrate" color={p.accent} weight={2.2} /><Copy size={17} style={{ flex: 1, fontWeight: '700' }}>Vibrate new alarms</Copy><Toggle label="Vibrate new alarms" disabled={busy} value={settings.vibrate} onChange={(vibrate) => change({ vibrate })} /></Card>}
      <Field title="Alarm permissions" icon="shield" color={allGood ? candy.mint : candy.coral}>
        <Card style={{ gap: 12 }}>
          <Status ok={!needsAlarm}>{needsAlarm ? 'Alarm access is off — allow it so Wupiko can wake you.' : 'Alarm scheduling is allowed'}</Status>
          {Platform.OS === 'android' && <>
            <Status ok={!needsNotifications}>{needsNotifications ? 'Notifications are off' : 'Notifications are allowed'}</Status>
            <Status ok={!needsScreen}>{needsScreen ? 'Full-screen alarms are off. Allow them to show the ringing screen when locked.' : 'Full-screen alarms are allowed'}</Status>
          </>}
          <View style={{ gap: 4, marginTop: 4 }}>
            <Button title={permissions.alarm === 'undetermined' || needsNotifications ? 'Allow alarms' : 'Open system settings'} secondary icon="external" disabled={busy} onPress={() => void run(permissions.alarm === 'undetermined' || needsNotifications ? requestPermission : openSettings, 'Couldn’t open permissions')} />
            {needsNotifications && <Button title="Open system settings" secondary disabled={busy} onPress={() => void run(openSettings)} />}
          </View>
        </Card>
      </Field>
      <Card tint={p.dark ? '#3C2B3F' : '#FFF1C9'} style={[row, { gap: 14, borderColor: p.dark ? '#5A4060' : '#F5D88A' }]}>
        <Mascot mood="happy" size={84} animate interactive onPoke={setBoops} outfit={wornOutfit(settings.outfit, summary.best)} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: p.ink, fontFamily: display, fontSize: 22, letterSpacing: -.4 }}>About Wupiko</Text>
          <Copy muted size={14} style={{ fontWeight: '600' }}>A tiny sunseed who takes waking you up very seriously. Your alarms never leave your phone.</Copy>
          <Copy size={13} style={{ fontWeight: '800', color: p.accent, marginTop: 2 }}>{boops ? `${boops} boop${boops === 1 ? '' : 's'} today ♥` : 'Made with sunshine · v1.0'}</Copy>
        </View>
      </Card>
    </View>
  </Screen>;
}
