import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ActivityIndicator, StatusBar, Text, useColorScheme, View } from 'react-native';
import { useWupiko } from '../src/store';
import { Button, useAction } from '../src/ui/components';
import { FeedbackProvider } from '../src/ui/Feedback';
import { CheckIn } from '../src/ui/CheckIn';
import { Ringing } from '../src/ui/Ringing';
import { palettes, Theme } from '../src/ui/theme';

export default function Layout() {
  const { ready, settings, error, refresh } = useWupiko();
  const scheme = useColorScheme();
  const [loaded, fontError] = useFonts({ WupikoDisplay: require('../assets/fonts/BricolageDisplay.ttf') });
  const p = palettes[settings.theme === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : settings.theme];
  const { busy, run } = useAction();
  return <Theme.Provider value={p}>
    <StatusBar barStyle={p.dark ? 'light-content' : 'dark-content'} />
    {!ready || (!loaded && !fontError) ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 18, backgroundColor: p.paper }}>
      {error ? <><Text style={{ color: p.ink, fontSize: 20, fontWeight: '600' }}>Couldn’t load your alarms</Text><Text style={{ color: p.muted }}>{error}</Text><Button title="Try again" disabled={busy} onPress={() => void run(refresh)} /></> : <ActivityIndicator color={p.accent} />}
    </View> :
      <FeedbackProvider>
        <Stack screenOptions={{ headerShown: false, statusBarStyle: p.dark ? 'light' : 'dark', contentStyle: { backgroundColor: p.paper } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="editor" />
          <Stack.Screen name="settings" />
        </Stack>
        <Ringing />
        <CheckIn />
      </FeedbackProvider>}
  </Theme.Provider>;
}
