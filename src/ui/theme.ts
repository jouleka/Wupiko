import { createContext, useContext } from 'react';

const light = {
  dark: false,
  paper: '#FFF8EC',
  panel: '#FFFFFF',
  ink: '#2E2340',
  muted: '#76698A',
  rule: '#F0E3D0',
  soft: '#F8EBD8',
  accent: '#FF6B4A',
  onAccent: '#FFFFFF',
  track: '#E2D6C6',
  focus: '#7C5CFF',
  // Chunky "candy" primary button: sunny face, deeper bottom edge, ink label.
  primary: '#FFC83D',
  primaryEdge: '#E79A12',
  onPrimary: '#2E2340',
  secondary: '#F3E4CF',
  secondaryEdge: '#E1CDB1',
  shadow: 'rgba(76, 46, 20, 0.10)',
};

const dark = {
  dark: true,
  paper: '#1D1830',
  panel: '#2A2342',
  ink: '#FFF4E2',
  muted: '#B7ABCB',
  rule: '#3B3258',
  soft: '#332A4F',
  accent: '#FF9A7A',
  onAccent: '#2B1A14',
  track: '#4A4068',
  focus: '#B9A4FF',
  primary: '#FFC83D',
  primaryEdge: '#C77F0B',
  onPrimary: '#2E2340',
  secondary: '#3A3058',
  secondaryEdge: '#272040',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

export const palettes = { light, dark };
export type Palette = typeof light;
export const Theme = createContext<Palette>(light);
export const usePalette = () => useContext(Theme);
export const display = 'WupikoDisplay';

/** Candy colours shared by both appearances. */
export const candy = {
  sun: '#FFC83D',
  coral: '#FF6B4A',
  pink: '#FF8FB1',
  mint: '#5FD3A8',
  sky: '#6EC6FF',
  lilac: '#A98BFF',
  ink: '#2E2340',
};

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';

export function phaseOf(hour: number): Phase {
  if (hour >= 5 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'dusk';
  return 'night';
}

/** Each part of the day gets its own sky, hills and sticker colour. */
export const skies: Record<Phase, { top: string; bottom: string; glow: string; hills: [string, string, string]; text: string; sub: string; sticker: string; tint: string; tintDark: string }> = {
  dawn: { top: '#FFB38A', bottom: '#FFE0A3', glow: '#FFF3C9', hills: ['#FFC48C', '#F7A673', '#EE8C63'], text: '#3A2232', sub: '#6B3F45', sticker: '#FF8A5B', tint: '#FFE9D6', tintDark: '#3C2B3F' },
  day: { top: '#7FD0FF', bottom: '#CDEFFF', glow: '#FFF6C2', hills: ['#9BE3B5', '#6FCF97', '#4FB985'], text: '#14324A', sub: '#2E5873', sticker: '#3FB4F5', tint: '#DDF2FF', tintDark: '#24314F' },
  dusk: { top: '#A98BFF', bottom: '#FFB1C8', glow: '#FFE0EC', hills: ['#C49BE8', '#A57BD6', '#8762C2'], text: '#2A1846', sub: '#4E3577', sticker: '#B07CFF', tint: '#F0E6FF', tintDark: '#352A55' },
  night: { top: '#211A4A', bottom: '#4B3F8F', glow: '#FFF4D2', hills: ['#3A3279', '#2E2766', '#231D52'], text: '#FFF4E2', sub: '#CFC4F2', sticker: '#6D5CFF', tint: '#E6E2FF', tintDark: '#2A2452' },
};
