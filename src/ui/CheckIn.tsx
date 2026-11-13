import { useEffect, useState } from 'react';
import { AccessibilityInfo, Modal, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWupiko } from '../store';
import { dayKey, goodMornings, newPieces, wornOutfit } from '../island';
import { Icon, Sky } from './Art';
import { router } from 'expo-router';
import { useLightAvailability } from '../light';
import { beginTodaysTrip } from '../trips';
import { FeedingStage, LightAsk } from './Feeding';
import { RitualStage, hash, ritualCopy, ritualOrder, type Ritual } from './Rituals';
import { row, useAction } from './components';
import { useFeedback } from './Feedback';
import { candy, display, skies } from './theme';
import { greeting } from './time';

function timeLeft(at: number | null | undefined, now: number) {
  if (!at) return null;
  const s = Math.max(0, Math.round((at - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function useScreenReader() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setOn);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
    return () => sub.remove();
  }, []);
  return on;
}

/** The wake-up check: a short, different ritual each morning. Finishing it checks in. */
function WakeUp({ id }: { id: string }) {
  const { alarms, checkIn, mornings, settings, getSnapshot } = useWupiko();
  const alarm = alarms.find((item) => item.id === id);
  const [progress, setProgress] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const { run } = useAction();
  const show = useFeedback();
  const { height: screen } = useWindowDimensions();
  const screenReader = useScreenReader();
  const [before] = useState(() => goodMornings(mornings ?? []));
  const [seed] = useState(() => hash(id + dayKey(Date.now())));
  // Same ritual if the screen reopens this morning; a different one tomorrow. Boops suit screen readers best.
  const ritual: Ritual = screenReader ? 'chase' : ritualOrder[seed % ritualOrder.length];
  // Feeding Wupiko light is the check-in. Without a light reading (no camera, access
  // declined, or "Not now") the morning falls back to a ritual so nobody is locked out.
  const light = useLightAvailability();
  const [skipLight, setSkipLight] = useState(false);
  const { busy: asking, run: runAsk } = useAction();
  const mode = skipLight ? 'ritual' : light.availability === 'ready' ? 'light'
    : light.availability === 'undetermined' ? 'ask' : light.availability == null ? 'loading' : 'ritual';
  const done = progress >= 1;
  const outfit = wornOutfit(settings.outfit, before);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => void run(async () => {
      await checkIn(id);
      // The first wake-up of the day brings Wupiko home from its night trip.
      const trip = await beginTodaysTrip().catch(() => false);
      if (trip) setTimeout(() => router.push('/find'), 1400);
      const latest = getSnapshot().mornings ?? [];
      const after = goodMornings(latest);
      const fresh = newPieces(before, after).pop();
      const late = latest[latest.length - 1]?.outcome === 'late';
      if (fresh?.outfit) {
        show({ title: `New on your island: ${fresh.title}!`, description: `And Wupiko got the ${fresh.outfit.title}. It’s wearing it now.`, celebrate: true, outfit: fresh.outfit.id });
      } else if (fresh) {
        show({ title: `New on your island: ${fresh.title}!`, description: fresh.blurb, celebrate: true, outfit });
      } else {
        show({
          title: late ? 'You made it!' : `${greeting(new Date().getHours())}, sunshine!`,
          description: after > before ? `A little ${late ? 'late, but' : 'sunnier:'} ${after} good ${after === 1 ? 'morning' : 'mornings'} on your island.` : 'You’re up. Wupiko is happy.',
          celebrate: true, outfit,
        });
      }
    }, 'Couldn’t check in'), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  const left = timeLeft(alarm?.nagAt, now);
  const s = skies[done ? 'day' : 'dawn'];
  const copy = mode === 'light' ? { title: 'Wupiko is frozen!', hint: 'Turn on the room lights or face a window for a few seconds.' }
    : mode === 'ask' ? { title: 'Wupiko runs on sunshine', hint: 'One quick thing before breakfast.' }
    : mode === 'loading' ? { title: 'Good morning!', hint: '' } : ritualCopy[ritual];
  return <Modal visible animationType="fade" onRequestClose={() => {}}>
    <View style={{ flex: 1, backgroundColor: s.bottom }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }}><Sky phase={done ? 'day' : 'dawn'} height={screen} radius={0} /></View>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 18, gap: 8, alignItems: 'center' }}>
          {left && !done && <View style={[row, { gap: 6, backgroundColor: candy.ink, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99 }]}>
            <Icon name="bell" color={candy.sun} size={16} weight={2.6} />
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16, fontVariant: ['tabular-nums'] }}>Rings again in {left}</Text>
          </View>}
          <Text accessibilityRole="header" style={{ fontFamily: display, color: s.text, fontSize: 32, letterSpacing: -1, textAlign: 'center' }}>{done ? 'You’re both up!' : copy.title}</Text>
          <Text style={{ color: s.sub, fontSize: 17, fontWeight: '600', textAlign: 'center' }}>{done ? 'Checking in…' : copy.hint}</Text>
        </View>
        <View style={{ flex: 1, margin: 16, borderRadius: 30, overflow: 'hidden' }} onLayout={(e) => setStage({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
          {stage.width > 0 && mode === 'light' && <FeedingStage id={id} width={stage.width} height={stage.height} outfit={outfit} done={done}
            onProgress={setProgress} />}
          {stage.width > 0 && mode === 'ask' && <LightAsk width={stage.width} height={stage.height} busy={asking}
            onAllow={() => void runAsk(light.ask)} onSkip={() => setSkipLight(true)} />}
          {stage.width > 0 && mode === 'ritual' && <RitualStage key={ritual} ritual={ritual} width={stage.width} height={stage.height} seed={seed} outfit={outfit} done={done}
            onProgress={(p) => setProgress((old) => Math.max(old, p))} />}
        </View>
        <View style={{ paddingHorizontal: 40, paddingBottom: 18 }}>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
            style={{ height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.5)', borderWidth: 2.5, borderColor: candy.ink, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: done ? candy.mint : candy.sun }} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  </Modal>;
}

export function CheckIn() {
  const { checkInIds, ringingIds } = useWupiko();
  const id = checkInIds?.[0];
  // Ringing takes over first; the check-in follows once the sound stops.
  return id && !ringingIds.length ? <WakeUp key={id} id={id} /> : null;
}
