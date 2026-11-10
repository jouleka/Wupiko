import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useWupiko } from '../src/store';
import type { Alarm } from '../src/types';
import { Icon, Mascot, Scene, Wordmark } from '../src/ui/Art';
import { Bar, Button, CircleButton, Copy, Heading, Rule, Screen, Toggle, haptic, row, useAction } from '../src/ui/components';
import { Welcome } from '../src/ui/Welcome';
import { display, usePalette } from '../src/ui/theme';
import { clockText, daySummary, nextDay } from '../src/ui/time';

function NextAlarm({ alarm }: { alarm: Alarm }) {
  const date = new Date(alarm.nextAt!);
  const { time, period } = clockText(date.getHours(), date.getMinutes());
  return <View style={{ backgroundColor: '#F2CC90', borderRadius: 23, padding: 20, overflow: 'hidden', minHeight: 140, justifyContent: 'center' }}>
    <View accessible={false} style={{ position: 'absolute', height: 185, width: 185, borderRadius: 94, right: -35, bottom: -58, backgroundColor: '#EABB79' }} />
    <View accessible={false} style={{ position: 'absolute', right: -12, bottom: -14 }}><Mascot mood="awake" size={112} /></View>
    <View style={{ paddingRight: 56, gap: 4 }}>
      <View style={[row, { gap: 6 }]}><Icon name="sun" color="#594428" size={16} /><Text style={{ color: '#594428', fontWeight: '600', fontSize: 15 }}>Next alarm</Text></View>
      <Text style={{ fontFamily: display, color: '#302B24', letterSpacing: -2, fontSize: 39 }}>{time}<Text style={{ fontSize: 17, letterSpacing: -.3 }}>{period ? ' ' + period : ''}</Text></Text>
      <Text style={{ color: '#58432B', fontSize: 15 }}>{nextDay(date.getTime())}</Text>
    </View>
  </View>;
}

function AlarmRow({ alarm }: { alarm: Alarm }) {
  const p = usePalette();
  const { saveAlarm, permissions, requestPermission, getSnapshot } = useWupiko();
  const { busy, run } = useAction();
  const { time, period, full } = clockText(alarm.hour, alarm.minute);
  const repeat = daySummary(alarm.days);
  return <View><View style={[row, { gap: 14 }]}>
    <Pressable testID={`alarm-row-${alarm.id}`} accessibilityRole="button" accessibilityLabel={`Edit ${alarm.label || 'alarm'}, ${full}, ${repeat}`} onPress={() => router.push({ pathname: '/editor', params: { id: alarm.id } })} style={({ pressed }) => ({ flex: 1, paddingVertical: 18, opacity: pressed ? .64 : 1 })}>
      <Text style={{ color: alarm.enabled ? p.ink : p.muted, fontFamily: display, fontSize: 39, letterSpacing: -1.9 }}>{time}<Text style={{ fontFamily: undefined, fontSize: 15, letterSpacing: 0, fontWeight: '600' }}>{period ? ' ' + period : ''}</Text></Text>
      <Copy size={15} muted style={{ marginTop: 2 }}>{[alarm.label, repeat].filter(Boolean).join(' · ')}</Copy>
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
      await saveAlarm({ ...alarm, enabled });
      haptic();
    }, 'Couldn’t update this alarm')} />
  </View><Rule /></View>;
}

export default function Home() {
  const { alarms, settings, permissions, error, refresh } = useWupiko();
  const p = usePalette();
  const { run } = useAction();
  if (!settings.onboarded) return <Welcome />;
  const next = alarms.filter((alarm) => alarm.enabled && alarm.nextAt != null).sort((a, b) => a.nextAt! - b.nextAt!)[0];
  const sorted = [...alarms].sort((a, b) => a.hour - b.hour || a.minute - b.minute || a.label.localeCompare(b.label));
  const warning = permissions.alarm !== 'granted' || permissions.notifications === false || permissions.fullScreen === false;
  return <Screen header={<Bar><Wordmark /><CircleButton icon="settings" label="Settings" onPress={() => router.push('/settings')} /></Bar>} footer={<Button testID="create-alarm" title={alarms.length ? 'Add alarm' : 'Set your first alarm'} icon="plus" onPress={() => router.push('/editor')} />}>
    <Heading>Your alarms</Heading>
    {!!error && <Pressable accessibilityRole="button" onPress={() => void run(refresh)} style={{ paddingVertical: 12 }}><Copy>{error} · Try again</Copy></Pressable>}
    {warning && <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={({ pressed }) => [row, { gap: 9, borderWidth: StyleSheet.hairlineWidth, borderColor: p.rule, borderRadius: 14, padding: 12, marginBottom: 14, backgroundColor: pressed ? p.soft : p.panel }]}>
      <Icon name="clock" color={p.accent} size={18} /><Text style={{ color: p.ink, flex: 1, fontSize: 15 }}>{permissions.alarm !== 'granted' ? 'Allow access to schedule alarms' : permissions.notifications === false ? 'Allow alarm notifications' : 'Allow the lock-screen alarm display'}</Text><Icon name="external" color={p.muted} size={16} />
    </Pressable>}
    {sorted.length ? <>
      {next && <View style={{ marginBottom: 8 }}><NextAlarm alarm={next} /></View>}
      {sorted.map((alarm) => <AlarmRow key={alarm.id} alarm={alarm} />)}
    </> : <View style={{ flex: 1, justifyContent: 'center', gap: 22, paddingBottom: 22 }}>
      <Scene mood="sleepy" />
      <View style={{ gap: 6 }}><Copy heading size={31}>A little too quiet here.</Copy><Copy muted size={17}>Let’s set your first alarm.</Copy></View>
    </View>}
  </Screen>;
}
