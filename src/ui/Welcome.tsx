import { useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useWupiko } from '../store';
import { Scene, Wordmark } from './Art';
import { Bar, Button, Copy, Screen, useAction } from './components';
import { usePalette } from './theme';

function Dots({ step }: { step: number }) {
  const p = usePalette();
  return <View style={{ flexDirection: 'row', gap: 6 }}>
    {[0, 1].map((i) => <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? p.accent : p.rule }} />)}
  </View>;
}

export function Welcome() {
  const { permissions, requestPermission, updateSettings } = useWupiko();
  const [access, setAccess] = useState(false);
  const { busy, run } = useAction();
  const finish = () => updateSettings({ onboarded: true });
  const begin = () => {
    if (permissions.alarm === 'granted' && permissions.notifications !== false) void run(finish);
    else {
      setAccess(true);
      // Ask right away so the system prompt appears without an extra tap.
      if (permissions.alarm === 'undetermined') void run(async () => { await requestPermission(); await finish(); }, 'Couldn’t request alarm access');
    }
  };
  return <Screen header={<Bar><Wordmark /><Dots step={access ? 1 : 0} /></Bar>} footer={
    <View style={{ gap: 4 }}>
      <Button testID={access ? 'allow-alarms' : 'welcome-continue'} title={access ? 'Allow alarms' : 'Let’s wake up'} icon={access ? 'bell' : 'sun'} disabled={busy} onPress={() => {
        if (access) void run(async () => { await requestPermission(); await finish(); }, 'Couldn’t request alarm access');
        else begin();
      }} />
      {access && <Button testID="permission-later" title="Maybe later" secondary disabled={busy} onPress={() => void run(finish)} />}
    </View>
  } style={{ justifyContent: 'center', paddingVertical: 18, gap: 26 }}>
    <Scene key={access ? 'a' : 'b'} mood={access ? 'happy' : 'awake'} phase={access ? 'day' : 'dawn'} interactive say={access ? 'I promise to be loud!' : 'Hi! I’m Wupiko ✦'} />
    <Animated.View key={access ? 'ta' : 'tb'} entering={FadeInDown.duration(320)} style={{ paddingHorizontal: 2, gap: 8 }}>
      <Copy heading size={46}>{access ? 'Let Wupiko ring.' : 'Meet Wupiko.'}</Copy>
      <Copy size={19} style={{ lineHeight: 27 }}>{access ? (Platform.OS === 'android' ? 'Allow alarms and notifications so Wupiko can ring and show you the Stop Alarm button.' : 'Allow alarm access so Wupiko can wake you up, even when your iPhone is locked.') : 'A tiny sunseed who lives in your phone and really, really wants you up on time.'}</Copy>
      {!access && <Copy size={15} muted style={{ marginTop: 2, fontWeight: '700' }}>Psst — tap Wupiko. It likes that.</Copy>}
    </Animated.View>
  </Screen>;
}
