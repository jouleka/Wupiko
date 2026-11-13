import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon, type IconName } from './Art';
import { candy, display, usePalette } from './theme';

export function Copy({ children, size = 16, muted = false, heading = false, style }: { children: ReactNode; size?: number; muted?: boolean; heading?: boolean; style?: StyleProp<TextStyle> }) {
  const p = usePalette();
  return <Text accessibilityRole={heading ? 'header' : undefined} style={[{ color: muted ? p.muted : p.ink, fontSize: size, ...(heading ? { fontFamily: display, letterSpacing: -size * .035 } : {}) }, style]}>{children}</Text>;
}

export function Screen({ children, footer, header, style, keyboard = false, background }: { children: ReactNode; header?: ReactNode; footer?: ReactNode; style?: ViewStyle; keyboard?: boolean; background?: string }) {
  const p = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background ?? p.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboard && Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, width: '100%', maxWidth: 650, alignSelf: 'center' }}>
          {header}
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={[{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 }, style]}>
            {children}
          </ScrollView>
          {footer && <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const row: ViewStyle = { flexDirection: 'row', alignItems: 'center' };
export function Bar({ children }: { children: ReactNode }) {
  return <View style={[row, { minHeight: 64, paddingHorizontal: 20, paddingVertical: 8, justifyContent: 'space-between', gap: 12 }]}>{children}</View>;
}

/** Press feedback shared by all tappable surfaces: a quick squish and spring back. */
export function Squish({ children, onPress, disabled, style, scale = .95, testID, accessibilityLabel, accessibilityRole = 'button', accessibilityState, accessibilityHint }: {
  children: ReactNode; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; scale?: number; testID?: string;
  accessibilityLabel?: string; accessibilityRole?: 'button' | 'checkbox' | 'radio' | 'switch'; accessibilityState?: object; accessibilityHint?: string;
}) {
  const s = useSharedValue(1);
  const reduce = useReducedMotion();
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Pressable testID={testID} disabled={disabled} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} accessibilityState={{ disabled, ...accessibilityState }} onPress={onPress}
    onPressIn={() => { if (!reduce) s.set(withSpring(scale, { damping: 15, stiffness: 400 })); }}
    onPressOut={() => { s.set(withSpring(1, { damping: 14, stiffness: 300 })); }}>
    <Animated.View style={[style, anim]}>{children}</Animated.View>
  </Pressable>;
}

export function CircleButton({ label, icon, onPress, tone }: { label: string; icon: IconName; onPress: () => void; tone?: string }) {
  const p = usePalette();
  return <Squish accessibilityLabel={label} onPress={onPress} scale={.88} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: p.panel, borderWidth: 2, borderColor: p.rule, borderBottomWidth: 4 }}>
    <Icon name={icon} color={tone ?? p.ink} size={22} weight={2.2} />
  </Squish>;
}

/** A chunky candy button: the face sinks into its darker edge when pressed. */
export function Button({ title, onPress, icon, secondary = false, disabled = false, testID, tone }: { testID?: string; title: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean; tone?: { face: string; edge: string; text: string } }) {
  const p = usePalette();
  const colors = tone ?? (secondary ? { face: p.secondary, edge: p.secondaryEdge, text: p.ink } : { face: p.primary, edge: p.primaryEdge, text: p.onPrimary });
  const depth = 6;
  const press = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * (depth - 1) }, { scale: 1 - press.value * .01 }] }));
  return <Pressable testID={testID} disabled={disabled} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} onPress={onPress}
    onPressIn={() => { press.set(withTiming(1, { duration: 70 })); }}
    onPressOut={() => { press.set(withSpring(0, { damping: 15, stiffness: 340 })); }}
    style={{ alignSelf: 'stretch', opacity: disabled ? .6 : 1, paddingBottom: depth }}>
    <View style={{ position: 'absolute', left: 0, right: 0, top: depth, bottom: 0, borderRadius: 22, backgroundColor: colors.edge }} />
    <Animated.View style={[row, { justifyContent: 'center', minHeight: 58, paddingVertical: 13, paddingHorizontal: 18, gap: 9, borderRadius: 22, backgroundColor: colors.face }, face]}>
      {icon && <Icon name={icon} size={22} color={colors.text} weight={2.6} />}
      <Text style={{ color: colors.text, fontFamily: display, fontSize: 19, letterSpacing: -.3 }}>{title}</Text>
    </Animated.View>
  </Pressable>;
}

export function Heading({ children, kicker }: { children: ReactNode; kicker?: string }) {
  const p = usePalette();
  return <View style={{ marginBottom: 16, marginTop: 6, gap: 2 }}>
    {kicker && <Text style={{ color: p.accent, fontWeight: '800', fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' }}>{kicker}</Text>}
    <Copy heading size={38}>{children}</Copy>
  </View>;
}
export function Card({ children, style, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  const p = usePalette();
  return <View style={[{ backgroundColor: tint ?? p.panel, borderRadius: 26, padding: 18, borderWidth: 2, borderColor: p.rule, borderBottomWidth: 5 }, style]}>{children}</View>;
}

/** A rounded sticker that holds a small icon. */
export function Sticker({ icon, color, size = 36 }: { icon: IconName; color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size * .36, backgroundColor: color, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }}>
    <Icon name={icon} color="#FFFFFF" size={size * .56} weight={2.4} />
  </View>;
}

export function Choices<T extends string>({ options, value, onChange, label }: { options: { value: T; title: string; icon?: IconName; color?: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  const p = usePalette();
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[row, { flexWrap: 'wrap', gap: 8 }]}>
    {options.map((option) => {
      const chosen = option.value === value;
      const color = option.color ?? candy.coral;
      return <Squish key={option.value} accessibilityRole="radio" accessibilityState={{ checked: chosen }} accessibilityLabel={option.title} onPress={() => { if (!chosen) { haptic(); onChange(option.value); } }}
        style={[row, { flexGrow: 1, justifyContent: 'center', gap: 7, minHeight: 50, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, backgroundColor: chosen ? color : p.panel, borderColor: chosen ? shade(color) : p.rule }]}>
        {option.icon && <Icon name={option.icon} size={19} color={chosen ? '#FFFFFF' : color} weight={2.4} />}
        <Text style={{ fontSize: 15, fontWeight: '800', color: chosen ? '#FFFFFF' : p.ink }}>{option.title}</Text>
      </Squish>;
    })}
  </View>;
}

/** Darkens a hex colour for candy edges. */
export function shade(hex: string, amount = .22) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

/** Sun-and-moon switch: the knob is a sun when on and a sleepy moon when off. */
export function Toggle({ label, value, onChange, disabled, testID }: { testID?: string; label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  const p = usePalette();
  const t = useSharedValue(value ? 1 : 0);
  const reduce = useReducedMotion();
  useEffect(() => { t.set(reduce ? (value ? 1 : 0) : withSpring(value ? 1 : 0, { damping: 18, stiffness: 240 })); }, [reduce, t, value]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(t.value, [0, 1], [p.track, candy.mint]) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * 26 }, { rotate: `${t.value * 180}deg` }], backgroundColor: interpolateColor(t.value, [0, 1], ['#FFFFFF', candy.sun]) }));
  return <Pressable testID={testID} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={() => onChange(!value)} hitSlop={8}
    style={{ minHeight: 48, justifyContent: 'center', opacity: disabled ? .6 : 1 }}>
    <Animated.View style={[{ width: 64, height: 38, borderRadius: 19, padding: 4, borderWidth: 2, borderColor: p.dark ? 'rgba(0,0,0,.25)' : 'rgba(46,35,64,.08)' }, track]}>
      <Animated.View style={[{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 }, knob]}>
        <View style={{ transform: [{ rotate: value ? '-180deg' : '0deg' }] }}><Icon name={value ? 'sun' : 'moon'} size={15} color={value ? '#B86A00' : '#8C9BFF'} weight={2.4} /></View>
      </Animated.View>
    </Animated.View>
  </Pressable>;
}

export function Field({ title, note, icon, color, children }: { title: string; note?: string; icon?: IconName; color?: string; children: ReactNode }) {
  const p = usePalette();
  return <View style={{ gap: 12 }}>
    <View style={[row, { gap: 10 }]}>
      {icon && <Sticker icon={icon} color={color ?? p.accent} size={30} />}
      <Copy size={18} style={{ fontFamily: display, letterSpacing: -.3 }}>{title}</Copy>
    </View>
    {children}
    {note && <Copy size={14} muted>{note}</Copy>}
  </View>;
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
