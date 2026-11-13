import { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { randomUUID } from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useWupiko } from '../src/store';
import { kindOf, suggestKind } from '../src/kind';
import type { Alarm, AlarmKind, Sound } from '../src/types';
import { Icon, Mascot, Sky, type IconName } from '../src/ui/Art';
import { Bar, Button, Card, Choices, CircleButton, Copy, Field, Heading, Screen, Squish, Toggle, haptic, row, shade, useAction } from '../src/ui/components';
import { useFeedback } from '../src/ui/Feedback';
import { candy, display, phaseOf, usePalette } from '../src/ui/theme';
import { clockText, dayNames, daySummary, hourQuip, nextDescription, soundNames, uses24Hours } from '../src/ui/time';

const soundLook: Record<Sound, { icon: IconName; color: string }> = {
  daybreak: { icon: 'sunrise', color: candy.coral },
  ripple: { icon: 'wave', color: candy.sky },
  chime: { icon: 'bell', color: candy.lilac },
};
const sounds = Object.entries(soundNames).map(([value, title]) => ({ value: value as Sound, title, ...soundLook[value as Sound] }));
const presets: { title: string; days: number[] }[] = [
  { title: 'Once', days: [] }, { title: 'Weekdays', days: [1, 2, 3, 4, 5] }, { title: 'Weekends', days: [6, 7] }, { title: 'Every day', days: [1, 2, 3, 4, 5, 6, 7] },
];
const nameIdeas = ['Rise & shine', 'Gym time', 'Take meds', 'Walk the dog', 'Nap’s over'];
const kinds: { value: AlarmKind; title: string; icon: IconName; color: string }[] = [
  { value: 'wake', title: 'Wake me up', icon: 'sun', color: candy.coral },
  { value: 'nudge', title: 'Just remind me', icon: 'bell', color: candy.sky },
];
const dayColors = [candy.coral, '#FF9F45', candy.sun, candy.mint, candy.sky, candy.lilac, candy.pink];

function TimePicker({ date, setDate }: { date: Date; setDate: (date: Date) => void }) {
  const p = usePalette();
  const value = clockText(date.getHours(), date.getMinutes());
  if (Platform.OS === 'ios') return <Card style={{ padding: 2, overflow: 'hidden' }}>
    <DateTimePicker testID="alarm-time-picker" accessibilityLabel="Alarm time" mode="time" display="spinner" value={date} themeVariant={p.dark ? 'dark' : 'light'} textColor={p.ink} onValueChange={(_, next) => setDate(next)} style={{ width: '100%', height: 168 }} />
  </Card>;
  return <Squish testID="alarm-time-picker" accessibilityLabel={'Change alarm time, ' + value.full} onPress={() => DateTimePickerAndroid.open({
    value: date, mode: 'time', is24Hour: uses24Hours(), onValueChange: (_, next) => setDate(next),
  })} scale={.97}>
    <Card style={{ minHeight: 142, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Text style={{ fontFamily: display, color: p.ink, fontSize: 60, letterSpacing: -2.8 }}>{value.time}<Text style={{ fontSize: 22, letterSpacing: -.5 }}>{value.period ? ' ' + value.period : ''}</Text></Text>
      <View style={[row, { gap: 6, backgroundColor: p.soft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }]}><Icon name="clock" size={15} color={p.accent} weight={2.4} /><Text style={{ color: p.accent, fontWeight: '800', fontSize: 14 }}>Tap to change</Text></View>
    </Card>
  </Squish>;
}

function Chip({ title, active, onPress, color = candy.coral }: { title: string; active?: boolean; onPress: () => void; color?: string }) {
  const p = usePalette();
  return <Squish accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={title} onPress={onPress} scale={.9}
    style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, borderWidth: 2, borderColor: active ? shade(color) : p.rule, backgroundColor: active ? color : p.panel }}>
    <Text style={{ fontSize: 14, fontWeight: '800', color: active ? '#FFFFFF' : p.muted }}>{title}</Text>
  </Squish>;
}

function EditForm({ existing }: { existing?: Alarm }) {
  const p = usePalette();
  const { settings, permissions, saveAlarm, requestPermission, openSettings, deleteAlarm, getSnapshot } = useWupiko();
  const [id] = useState(() => existing?.id ?? randomUUID());
  const [date, setDate] = useState(() => new Date(2024, 0, 15, existing?.hour ?? 7, existing?.minute ?? 0));
  const [days, setDays] = useState<number[]>(existing?.days ?? []);
  const [label, setLabel] = useState(existing?.label ?? '');
  const [sound, setSound] = useState(existing?.sound ?? settings.sound);
  const [vibrate, setVibrate] = useState(existing?.vibrate ?? settings.vibrate);
  // A new alarm follows the suggested kind until the user picks one.
  const [chosenKind, setChosenKind] = useState<AlarmKind | null>(existing ? kindOf(existing) : null);
  const { run, busy } = useAction();
  const notice = useFeedback();
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  const hour = date.getHours();
  const phase = phaseOf(hour);
  const kind = chosenKind ?? suggestKind(hour, label);
  async function save() {
    const enabled = existing?.enabled ?? true;
    if (enabled && (permissions.alarm !== 'granted' || permissions.notifications === false)) {
      await requestPermission();
      const current = getSnapshot().permissions;
      if (current.alarm !== 'granted' || current.notifications === false) {
        Alert.alert('Alarm access needed', 'Allow access in system settings, then return here to save your alarm.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open settings', onPress: () => void run(openSettings) },
        ]);
        return;
      }
    }
    await saveAlarm({ id, hour, minute: date.getMinutes(), days, label: label.trim(), sound, vibrate, enabled, kind, nextAt: null });
    const saved = getSnapshot().alarms.find((item) => item.id === id);
    haptic(true);
    back();
    notice({ title: existing ? 'Alarm updated!' : kind === 'nudge' ? 'Reminder set!' : 'Alarm set!', description: saved?.nextAt ? nextDescription(saved.nextAt) : 'Alarm is off', celebrate: true });
  }
  function confirmDelete() {
    Alert.alert('Delete this alarm?', label.trim() || clockText(hour, date.getMinutes()).full, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete alarm', style: 'destructive', onPress: () => void run(async () => {
        await deleteAlarm(id); back(); notice({ title: 'Alarm deleted', description: 'Bye bye, little alarm.', mood: 'sleepy' });
      }, 'Couldn’t delete this alarm') },
    ]);
  }
  const preset = presets.find((item) => item.days.join() === days.join());
  return <Screen keyboard header={<Bar><CircleButton label="Back to alarms" icon="back" onPress={back} />{existing && <CircleButton label="Delete alarm" icon="trash" tone={candy.coral} onPress={confirmDelete} />}</Bar>}
    footer={<Button testID="save-alarm" title={busy ? 'Saving…' : existing ? 'Save changes' : 'Set Alarm'} disabled={busy} icon="check" onPress={() => void run(save, 'Couldn’t save this alarm')} />}>
    <Heading kicker={existing ? 'Tweak it' : 'New alarm'}>{existing ? 'Edit alarm' : 'When should I ring?'}</Heading>
    <View style={{ gap: 24 }}>
      <View style={{ gap: 12 }}>
        <Sky phase={phase} height={176} radius={26}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 }}>
            <Mascot mood={phase === 'night' ? 'sleepy' : 'awake'} size={92} animate interactive say={hourQuip(hour, date.getMinutes())} />
          </View>
        </Sky>
        <TimePicker date={date} setDate={setDate} />
      </View>
      <Field title="What’s it for?" icon={kind === 'wake' ? 'sun' : 'bell'} color={kind === 'wake' ? candy.coral : candy.sky}>
        <Choices options={kinds} label="Alarm type" value={kind} onChange={setChosenKind} />
      </Field>
      <Field title="Repeat" icon="repeat" color={candy.mint}>
        <View style={[row, { gap: 6, justifyContent: 'space-between' }]}>
          {dayNames.map((name, i) => {
            const day = i + 1, selected = days.includes(day);
            return <Squish key={day} testID={`weekday-${day}`} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={name} scale={.82} onPress={() => {
              setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()));
              haptic();
            }} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? dayColors[i] : p.panel, borderWidth: 2, borderBottomWidth: 4, borderColor: selected ? shade(dayColors[i]) : p.rule, transform: [{ rotate: selected ? (i % 2 ? '6deg' : '-6deg') : '0deg' }] }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: selected ? candy.ink : p.muted }}>{name.slice(0, 2)}</Text>
            </Squish>;
          })}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 20 }}>
          {presets.map((item) => <Chip key={item.title} title={item.title} active={preset === item} color={candy.mint} onPress={() => { setDays(item.days); haptic(); }} />)}
        </ScrollView>
        {!preset && <Copy muted size={14} style={{ fontWeight: '700' }}>{daySummary(days)}</Copy>}
      </Field>
      <Field title="Alarm name" icon="tag" color={candy.pink}>
        <TextInput testID="alarm-name" accessibilityLabel="Alarm name" value={label} onChangeText={setLabel} maxLength={80} placeholder="Wake up" placeholderTextColor={p.muted} returnKeyType="done" selectionColor={p.accent}
          style={{ minHeight: 54, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: p.panel, borderWidth: 2, borderBottomWidth: 4, borderColor: p.rule, borderRadius: 18, color: p.ink, fontSize: 17, fontWeight: '600' }} />
        <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 20 }}>
          {nameIdeas.map((idea) => <Chip key={idea} title={idea} active={label === idea} color={candy.pink} onPress={() => { setLabel(label === idea ? '' : idea); haptic(); }} />)}
        </ScrollView>
      </Field>
      <Field title="Sound" icon="sound" color={candy.lilac}><Choices options={sounds} label="Alarm sound" value={sound} onChange={setSound} /></Field>
      <Card tint={p.dark ? '#3C2B3F' : '#FFF1C9'} style={[row, { gap: 12, paddingVertical: 12, borderColor: p.dark ? '#5A4060' : '#F5D88A' }]}>
        <Mascot mood={kind === 'wake' ? 'sleepy' : 'happy'} size={48} />
        {kind === 'wake' ? <View style={{ flex: 1, gap: 3 }}>
          <Copy size={16} style={{ fontWeight: '800' }}>No snooze. No sneaking back to sleep.</Copy>
          <Copy size={13} muted style={{ fontWeight: '600' }}>After you stop it, open Wupiko and boop it awake. Skip that and it rings again in 1 minute.</Copy>
        </View> : <View style={{ flex: 1, gap: 3 }}>
          <Copy size={16} style={{ fontWeight: '800' }}>A friendly nudge, nothing more.</Copy>
          <Copy size={13} muted style={{ fontWeight: '600' }}>Stop it and you’re done. No check-in, no repeats, and it never touches your streak.</Copy>
        </View>}
      </Card>
      {Platform.OS === 'android' && <Card style={[row, { gap: 12, paddingVertical: 8 }]}><Icon name="vibrate" color={p.accent} weight={2.2} /><View style={{ flex: 1 }}><Copy size={17} style={{ fontWeight: '700' }}>Vibration</Copy></View><Toggle label="Vibration" value={vibrate} onChange={setVibrate} /></Card>}
    </View>
  </Screen>;
}

export default function Editor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { alarms } = useWupiko();
  const existing = alarms.find((item) => item.id === id);
  if (id && !existing) return <Screen footer={<Button title="Back to alarms" onPress={() => router.replace('/')} />}>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Mascot mood="sleepy" size={140} animate />
      <Heading>Alarm unavailable</Heading><Copy muted>This alarm may have been deleted.</Copy>
    </View>
  </Screen>;
  return <EditForm key={id ?? 'new'} existing={existing} />;
}

