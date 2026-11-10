import { useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { randomUUID } from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useWupiko } from '../src/store';
import type { Alarm, Sound } from '../src/types';
import { Icon } from '../src/ui/Art';
import { Bar, Button, Choices, CircleButton, Copy, Field, Heading, Rule, Screen, Toggle, haptic, row, useAction } from '../src/ui/components';
import { useFeedback } from '../src/ui/Feedback';
import { display, usePalette } from '../src/ui/theme';
import { clockText, dayNames, daySummary, nextDescription, soundNames, uses24Hours } from '../src/ui/time';

const sounds = Object.entries(soundNames).map(([value, title]) => ({ value: value as Sound, title }));

function TimePicker({ date, setDate }: { date: Date; setDate: (date: Date) => void }) {
  const p = usePalette();
  const value = clockText(date.getHours(), date.getMinutes());
  if (Platform.OS === 'ios') return <View style={{ backgroundColor: p.soft, borderRadius: 23, padding: 2, overflow: 'hidden' }}>
    <DateTimePicker testID="alarm-time-picker" accessibilityLabel="Alarm time" mode="time" display="spinner" value={date} themeVariant={p.dark ? 'dark' : 'light'} textColor={p.ink} onValueChange={(_, next) => setDate(next)} style={{ width: '100%', height: 152 }} />
  </View>;
  return <Pressable testID="alarm-time-picker" accessibilityRole="button" accessibilityLabel={'Change alarm time, ' + value.full} onPress={() => DateTimePickerAndroid.open({
    value: date, mode: 'time', is24Hour: uses24Hours(), onValueChange: (_, next) => setDate(next),
  })} style={({ pressed }) => ({ minHeight: 142, backgroundColor: pressed ? p.rule : p.soft, borderRadius: 23, padding: 21, alignItems: 'center', justifyContent: 'center', gap: 4 })}>
    <Text style={{ fontFamily: display, color: p.ink, fontSize: 54, letterSpacing: -2.8 }}>{value.time}<Text style={{ fontSize: 22, letterSpacing: -.5 }}>{value.period ? ' ' + value.period : ''}</Text></Text>
    <Text style={{ color: p.accent, fontWeight: '600', fontSize: 14 }}>Change time</Text>
  </Pressable>;
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
  const { run, busy } = useAction();
  const notice = useFeedback();
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
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
    await saveAlarm({ id, hour: date.getHours(), minute: date.getMinutes(), days, label: label.trim(), sound, vibrate, enabled, nextAt: null });
    const saved = getSnapshot().alarms.find((item) => item.id === id);
    haptic(true);
    back();
    notice({ title: existing ? 'Alarm updated' : 'Alarm set', description: saved?.nextAt ? nextDescription(saved.nextAt) : 'Alarm is off' });
  }
  function confirmDelete() {
    Alert.alert('Delete this alarm?', label.trim() || clockText(date.getHours(), date.getMinutes()).full, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete alarm', style: 'destructive', onPress: () => void run(async () => {
        await deleteAlarm(id); back(); notice({ title: 'Alarm deleted' });
      }, 'Couldn’t delete this alarm') },
    ]);
  }
  return <Screen keyboard header={<Bar><CircleButton label="Back to alarms" icon="back" onPress={back} />{existing && <CircleButton label="Delete alarm" icon="trash" onPress={confirmDelete} />}</Bar>}
    footer={<Button testID="save-alarm" title={busy ? 'Saving…' : existing ? 'Save changes' : 'Set Alarm'} disabled={busy} icon="check" onPress={() => void run(save, 'Couldn’t save this alarm')} />}>
    <Heading>{existing ? 'Edit alarm' : 'New alarm'}</Heading>
    <View style={{ gap: 23 }}>
      <TimePicker date={date} setDate={setDate} />
      <Field title="Repeat">
        <View style={[row, { gap: 4, flexWrap: 'wrap' }]}>
          {dayNames.map((name, i) => {
            const day = i + 1, selected = days.includes(day);
            return <Pressable key={day} testID={`weekday-${day}`} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={name} onPress={() => {
              setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()));
              haptic();
            }} style={({ pressed }) => ({ flexGrow: 1, minWidth: 38, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? p.ink : p.soft, borderRadius: 14, padding: 3, opacity: pressed ? .7 : 1 })}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: selected ? p.paper : p.muted }}>{name.slice(0, 2)}</Text>
            </Pressable>;
          })}
        </View>
        <Copy muted size={14}>{days.length ? daySummary(days) : 'Once'}</Copy>
      </Field>
      <Rule />
      <Field title="Alarm name"><TextInput testID="alarm-name" accessibilityLabel="Alarm name" value={label} onChangeText={setLabel} maxLength={80} placeholder="Wake up" placeholderTextColor={p.muted} returnKeyType="done" selectionColor={p.accent} style={{ minHeight: 49, padding: 12, backgroundColor: p.panel, borderWidth: 1, borderColor: p.rule, borderRadius: 13, color: p.ink, fontSize: 16 }} /></Field>
      <Field title="Sound"><Choices options={sounds} label="Alarm sound" value={sound} onChange={setSound} /></Field>
      {Platform.OS === 'android' && <View style={[row, { gap: 10 }]}><Icon name="vibrate" color={p.muted} /><View style={{ flex: 1 }}><Copy size={17}>Vibration</Copy></View><Toggle label="Vibration" value={vibrate} onChange={setVibrate} /></View>}
    </View>
  </Screen>;
}

export default function Editor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { alarms } = useWupiko();
  const existing = alarms.find((item) => item.id === id);
  if (id && !existing) return <Screen footer={<Button title="Back to alarms" onPress={() => router.replace('/')} />}><Heading>Alarm unavailable</Heading><Copy muted>This alarm may have been deleted.</Copy></Screen>;
  return <EditForm key={id ?? 'new'} existing={existing} />;
}
