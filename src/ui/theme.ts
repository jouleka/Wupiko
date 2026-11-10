import { createContext, useContext } from 'react';

const light = {
  dark: false,
  paper: '#F9F5EA',
  panel: '#FFFCF3',
  ink: '#242520',
  muted: '#625F53',
  rule: '#D9D3C3',
  soft: '#EDE8D9',
  accent: '#A64029',
  onAccent: '#FFF9ED',
  track: '#B8B4A6',
  focus: '#796428',
};

const dark = {
  dark: true,
  paper: '#242520',
  panel: '#2D3029',
  ink: '#FAF4E5',
  muted: '#C0BDAC',
  rule: '#4A4D42',
  soft: '#373A31',
  accent: '#FFAE87',
  onAccent: '#362218',
  track: '#656A5D',
  focus: '#E0CA8F',
};

export const palettes = { light, dark };
export type Palette = typeof light;
export const Theme = createContext<Palette>(light);
export const usePalette = () => useContext(Theme);
export const display = 'WupikoDisplay';
