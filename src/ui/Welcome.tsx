import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useWupiko } from '../store';
import { Scene, Wordmark } from './Art';
import { Bar, Button, Copy, Screen, useAction } from './components';

export function Welcome() {
  const { permissions, requestPermission, updateSettings } = useWupiko();
  const [access, setAccess] = useState(false);
  const { busy, run } = useAction();
  const finish = () => updateSettings({ onboarded: true });
  const begin = () => {
    if (permissions.alarm === 'granted' && permissions.notifications !== false) void run(finish);
    else setAccess(true);
  };
  return <Screen header={<Bar><Wordmark /></Bar>} footer={
    <View style={{ gap: 8 }}>
      <Button testID={access ? "allow-alarms" : "welcome-continue"} title={access ? 'Allow alarms' : 'Let’s wake up'} icon={access ? 'clock' : 'sun'} disabled={busy} onPress={() => {
        if (access) void run(async () => { await requestPermission(); await finish(); }, 'Couldn’t request alarm access');
        else begin();
      }} />
      {access && <Button testID="permission-later" title="Maybe later" secondary disabled={busy} onPress={() => void run(finish)} />}
    </View>
  } style={{ justifyContent: 'center', paddingVertical: 18, gap: 24 }}>
    <Scene mood={access ? 'happy' : 'awake'} />
    <View style={{ paddingHorizontal: 2, gap: 8 }}>
      <Copy heading size={49}>{access ? 'Let Wupiko ring.' : 'Meet Wupiko.'}</Copy>
      <Copy size={19} style={{ lineHeight: 27 }}>{access ? (Platform.OS === 'android' ? 'Allow alarms and notifications so Wupiko can ring and show you the Stop Alarm button.' : 'Allow alarm access so Wupiko can wake you up when your iPhone is locked.') : 'Your tiny morning companion.'}</Copy>
      {!access && <Copy size={16} muted style={{ marginTop: 2 }}>One alarm. No second chances.</Copy>}
    </View>
  </Screen>;
}
