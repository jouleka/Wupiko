import { useEffect, useState } from 'react';
import { Modal, Text, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { kindOf } from '../kind';
import { useWupiko } from '../store';
import { Sky } from './Art';
import { Mascot } from './Mascot';
import { Button, haptic, useAction } from './components';
import { useFeedback } from './Feedback';
import { candy, display, skies } from './theme';
import { clockText } from './time';

function Ring({ delay, size }: { delay: number; size: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false)));
    return () => cancelAnimation(t);
  }, [delay, reduce, t]);
  const style = useAnimatedStyle(() => ({ opacity: reduce ? .25 : .55 * (1 - t.value), transform: [{ scale: .6 + t.value * .9 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 6, borderColor: '#FFFFFF' }, style]} />;
}

function ActiveAlarm({ id }: { id: string }) {
  const { alarms, stopAlarm, followUpIds } = useWupiko();
  // A follow-up is ringing: the user silenced the alarm without checking in.
  const again = !!followUpIds?.includes(id);
  const alarm = alarms.find((item) => item.id === id);
  const [now, setNow] = useState(() => new Date());
  const { busy, run } = useAction();
  const show = useFeedback();
  const { height, width } = useWindowDimensions();
  const s = skies.dawn;
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clock = clockText(now.getHours(), now.getMinutes());
  // Wake-ups arm follow-ups and the check-in screen takes over after Stop. A nudge is done once stopped.
  const nudge = !!alarm && kindOf(alarm) === 'nudge';
  const checkIn = !!alarm && !nudge;
  const mascot = Math.min(210, width * .52);
  return <Modal visible animationType="fade" onRequestClose={() => {}}>
    <View style={{ flex: 1, backgroundColor: s.bottom }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }}><Sky phase="dawn" height={height} radius={0} /></View>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 }}>
          <Text accessibilityRole="header" style={{ fontFamily: display, color: s.text, fontSize: 84, letterSpacing: -4 }}>{clock.time}<Text style={{ fontSize: 28, letterSpacing: -.5 }}>{clock.period ? ' ' + clock.period : ''}</Text></Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,.6)', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99 }}>
            <Text style={{ color: s.text, fontFamily: display, fontSize: 20, letterSpacing: -.3 }}>{again ? 'You dozed off! Round two ☀︎' : alarm?.label || (nudge ? 'Wupiko reminder' : 'Rise and shine!')}</Text>
          </View>
          <View style={{ alignItems: 'center', justifyContent: 'center', width: mascot * 1.6, height: mascot * 1.6, marginTop: 8 }}>
            <Ring delay={0} size={mascot * 1.4} /><Ring delay={600} size={mascot * 1.4} /><Ring delay={1200} size={mascot * 1.4} />
            <Mascot mood={nudge ? 'happy' : 'ringing'} size={mascot} animate />
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 10 }}>
          <Text style={{ textAlign: 'center', color: s.sub, fontWeight: '700', fontSize: 15 }}>{checkIn ? 'Next: boop Wupiko awake, or it rings again.' : nudge ? 'A little nudge from Wupiko.' : 'Wupiko won’t stop until you do!'}</Text>
          <Button testID="stop-alarm" title={checkIn ? 'Stop & wake Wupiko' : nudge ? 'Got it!' : 'Stop Alarm'} icon={nudge ? 'check' : 'sun'} tone={{ face: candy.coral, edge: '#C9452A', text: '#FFFFFF' }} disabled={busy} onPress={() => void run(async () => {
            await stopAlarm(id);
            haptic(true);
            if (nudge) show({ title: 'Nice one!', description: 'Wupiko is proud of you.', celebrate: true });
            else if (!checkIn) show({ title: 'Good morning, sunshine!', description: 'Alarm stopped. Go get ’em.', celebrate: true });
          }, 'Couldn’t stop this alarm')} />
        </View>
      </SafeAreaView>
    </View>
  </Modal>;
}

export function Ringing() {
  const { ringingIds } = useWupiko();
  const id = ringingIds[0];
  return id ? <ActiveAlarm key={id} id={id} /> : null;
}
