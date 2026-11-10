import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon, type IconName } from './Art';
import { display, usePalette } from './theme';

export function Copy({ children, size = 16, muted = false, heading = false, style }: { children: ReactNode; size?: number; muted?: boolean; heading?: boolean; style?: TextStyle }) {
  const p = usePalette();
  return <Text accessibilityRole={heading ? 'header' : undefined} style={[{ color: muted ? p.muted : p.ink, fontSize: size, ...(heading ? { fontFamily: display, letterSpacing: -size * .04 } : {}) }, style]}>{children}</Text>;
}

export function Screen({ children, footer, header, style, keyboard = false }: { children: ReactNode; header?: ReactNode; footer?: ReactNode; style?: ViewStyle; keyboard?: boolean }) {
  const p = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboard && Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, width: '100%', maxWidth: 650, alignSelf: 'center' }}>
          {header}
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{ flex: 1 }} contentContainerStyle={[{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 }, style]}>
            {children}
          </ScrollView>
          {footer && <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 10 }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const row: ViewStyle = { flexDirection: 'row', alignItems: 'center' };
export function Bar({ children }: { children: ReactNode }) {
  return <View style={[row, { minHeight: 66, paddingHorizontal: 24, paddingVertical: 8, justifyContent: 'space-between', gap: 12 }]}>{children}</View>;
}

export function CircleButton({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ width: 46, height: 46, borderWidth: 1, borderColor: p.rule, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? p.soft : p.paper })}><Icon name={icon} color={p.ink} size={21} /></Pressable>;
}

export function Button({ title, onPress, icon, secondary = false, disabled = false, testID }: { testID?: string; title: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean }) {
  const p = usePalette();
  const color = secondary ? p.ink : p.onAccent;
  return <Pressable testID={testID} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [row, { alignSelf: 'stretch', justifyContent: 'center', minHeight: 58, paddingVertical: 13, paddingHorizontal: 16, gap: 9, borderRadius: 19, backgroundColor: secondary ? p.soft : p.accent, opacity: pressed || disabled ? .72 : 1 }]}>
    {icon && <Icon name={icon} size={21} color={color} />}
    <Text style={{ color, fontFamily: display, fontSize: 18, letterSpacing: -.4 }}>{title}</Text>
  </Pressable>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Copy heading size={42} style={{ marginBottom: 19, marginTop: 12 }}>{children}</Copy>;
}
export function Rule() {
  const p = usePalette();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: p.rule }} />;
}

export function Choices<T extends string>({ options, value, onChange, label }: { options: { value: T; title: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  const p = usePalette();
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[row, { flexWrap: 'wrap', backgroundColor: p.soft, borderRadius: 15, padding: 4, gap: 2 }]}>
    {options.map((option) => {
      const chosen = option.value === value;
      return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: chosen }} accessibilityLabel={option.title} onPress={() => { if (!chosen) onChange(option.value); }} style={({ pressed }) => ({ flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: chosen ? p.panel : 'transparent', borderRadius: 11, opacity: pressed ? .7 : 1 })}>
        <Text style={{ fontSize: 15, fontWeight: chosen ? '700' : '500', color: chosen ? p.ink : p.muted }}>{option.title}</Text>
      </Pressable>;
    })}
  </View>;
}

export function Toggle({ label, value, onChange, disabled, testID }: { testID?: string; label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  const p = usePalette();
  return <View style={{ minHeight: 48, justifyContent: 'center' }}><Switch testID={testID} accessibilityLabel={label} disabled={disabled} value={value} onValueChange={onChange} trackColor={{ false: p.track, true: p.accent }} thumbColor={p.dark && value ? '#5C3327' : '#FFFDF7'} ios_backgroundColor={p.track} /></View>;
}

export function Field({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return <View style={{ gap: 10 }}><Copy size={17} style={{ fontWeight: '600' }}>{title}</Copy>{children}{note && <Copy size={14} muted>{note}</Copy>}</View>;
}

export function haptic(success = false) {
  const feedback = success ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.selectionAsync();
  void feedback.catch(() => {});
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  // UI actions always surface native/persistence failures and leave the form available for retry.
  async function run(action: () => Promise<void>, title = 'Wupiko needs a moment') {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try { await action(); } catch (e) {
      Alert.alert(title, e instanceof Error ? e.message : 'Please try again.');
    } finally { pending.current = false; setBusy(false); }
  }
  return { busy, run };
}
