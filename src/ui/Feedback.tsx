import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot } from './Art';
import { usePalette } from './theme';

type Notice = { title: string; description?: string };
const Feedback = createContext<(notice: Notice) => void>(() => {});

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, show] = useState<Notice | null>(null);
  const p = usePalette();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!notice) return;
    AccessibilityInfo.announceForAccessibility([notice.title, notice.description].filter(Boolean).join('. '));
    const timeout = setTimeout(() => show(null), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);
  return <Feedback.Provider value={show}>{children}
    {notice && <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 6, left: 16, right: 16, alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityHint="Dismiss confirmation" onPress={() => show(null)} style={{ width: '100%', maxWidth: 550, borderWidth: 1, borderColor: p.rule, backgroundColor: p.panel, borderRadius: 19, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, gap: 12 }}>
        <Mascot mood="happy" size={46} animate />
        <View style={{ flex: 1, gap: 2 }}><Text style={{ color: p.ink, fontWeight: '700', fontSize: 16 }}>{notice.title}</Text>{notice.description && <Text style={{ color: p.muted, fontSize: 14 }}>{notice.description}</Text>}</View>
      </Pressable>
    </View>}
  </Feedback.Provider>;
}
export const useFeedback = () => useContext(Feedback);
