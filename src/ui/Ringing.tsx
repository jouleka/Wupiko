import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { useWupiko } from '../store';
import { Mascot, Wordmark } from './Art';
import { Bar, Button, Copy, Screen, haptic, useAction } from './components';
import { useFeedback } from './Feedback';
import { clockText } from './time';

function ActiveAlarm({ id }: { id: string }) {
  const { alarms, stopAlarm } = useWupiko();
  const alarm = alarms.find((item) => item.id === id);
  const [now, setNow] = useState(() => new Date());
  const { busy, run } = useAction();
  const show = useFeedback();
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <Modal visible animationType="none" onRequestClose={() => {}}>
    <Screen header={<Bar><Wordmark small /></Bar>} footer={<Button testID="stop-alarm" title="Stop Alarm" disabled={busy} onPress={() => void run(async () => {
      await stopAlarm(id);
      haptic(true);
      show({ title: 'Alarm stopped' });
    }, 'Couldn’t stop this alarm')} />}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 14 }}>
        <Mascot mood="ringing" size={188} animate />
        <Copy size={62} heading style={{ textAlign: 'center' }}>{clockText(now.getHours(), now.getMinutes()).full}</Copy>
        <Copy size={24} style={{ textAlign: 'center' }}>{alarm?.label || 'Wake up'}</Copy>
      </View>
    </Screen>
  </Modal>;
}

export function Ringing() {
  const { ringingIds } = useWupiko();
  const id = ringingIds[0];
  return id ? <ActiveAlarm key={id} id={id} /> : null;
}
