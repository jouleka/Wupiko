import { router } from 'expo-router';
import { Platform, View } from 'react-native';
import { useWupiko } from '../src/store';
import type { Settings, Sound, Theme } from '../src/types';
import { Mascot } from '../src/ui/Art';
import { Bar, Button, Choices, CircleButton, Copy, Field, Heading, Rule, Screen, Toggle, haptic, row, useAction } from '../src/ui/components';
import { soundNames } from '../src/ui/time';

const themes: { value: Theme; title: string }[] = [{ value: 'system', title: 'System' }, { value: 'light', title: 'Light' }, { value: 'dark', title: 'Dark' }];
const sounds = Object.entries(soundNames).map(([value, title]) => ({ value: value as Sound, title }));

export default function Preferences() {
  const { settings, permissions, requestPermission, openSettings, updateSettings } = useWupiko();
  const { run, busy } = useAction();
  function change(patch: Partial<Settings>) {
    void run(async () => { await updateSettings(patch); haptic(); }, 'Couldn’t save your preference');
  }
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  const needsAlarm = permissions.alarm !== 'granted';
  const needsNotifications = permissions.notifications === false;
  const needsScreen = permissions.fullScreen === false;
  return <Screen header={<Bar><CircleButton label="Back to alarms" icon="back" onPress={back} /></Bar>}>
    <Heading>Settings</Heading>
    <View style={{ gap: 26 }}>
      <Field title="Appearance"><Choices label="Theme" options={themes} value={settings.theme} onChange={(theme) => change({ theme })} /></Field>
      <Field title="Default alarm sound"><Choices label="Default alarm sound" options={sounds} value={settings.sound} onChange={(sound) => change({ sound })} /></Field>
      {Platform.OS === 'android' && <View style={[row, { justifyContent: 'space-between', gap: 10 }]}><Copy size={17} style={{ flex: 1 }}>Vibrate new alarms</Copy><Toggle label="Vibrate new alarms" disabled={busy} value={settings.vibrate} onChange={(vibrate) => change({ vibrate })} /></View>}
      <Rule />
      <Field title="Alarm permissions">
        <Copy muted>{needsAlarm ? 'Alarm access is off. Allow access to schedule your wake-up.' : 'Alarm scheduling is allowed.'}</Copy>
        {Platform.OS === 'android' && <><Copy muted>Notifications {needsNotifications ? 'are off.' : 'are allowed.'}</Copy><Copy muted>Full-screen alarms {needsScreen ? 'are off. Allow them to show the ringing screen when your device is locked.' : 'are allowed.'}</Copy></>}
        <Button title={permissions.alarm === 'undetermined' || needsNotifications ? 'Allow alarms' : 'Open system settings'} secondary icon="external" disabled={busy} onPress={() => void run(permissions.alarm === 'undetermined' || needsNotifications ? requestPermission : openSettings, 'Couldn’t open permissions')} />
        {needsNotifications && <Button title="Open system settings" secondary disabled={busy} onPress={() => void run(openSettings)} />}
      </Field>
      <Rule />
      <View style={[row, { gap: 14 }]}><Mascot mood="happy" size={66} /><View style={{ flex: 1, gap: 4 }}><Copy heading size={23}>About Wupiko</Copy><Copy muted size={15}>One alarm. No second chances.</Copy></View></View>
    </View>
  </Screen>;
}
