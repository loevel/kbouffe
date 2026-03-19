import { Platform } from 'react-native';

const tintColorLight = '#FF6B00'; // Vibrant Orange
const tintColorDark = '#FF9D5C';

export const Colors = {
  light: {
    text: '#1e293b', // Slate-800
    textMuted: '#64748b', // Slate-500
    background: '#f8fafc', // Slate-50
    surface: '#ffffff', // White cards
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    primary: '#FF6B00',
    primaryLight: '#FFF0E6', // Soft orange background
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
    transparent: 'transparent',
  },
  dark: {
    text: '#f1f5f9', // Slate-100
    textMuted: '#94a3b8', // Slate-400
    background: '#0f172a', // Slate-900
    surface: '#1e293b', // Slate-800 cards
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorDark,
    primary: '#FF9D5C',
    primaryLight: 'rgba(255, 107, 0, 0.15)',
    border: '#334155',
    error: '#f87171',
    success: '#4ade80',
    transparent: 'transparent',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const Typography = {
  title1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  title2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  title3: { fontSize: 20, fontWeight: '700' as const },
  headline: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySemibold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  captionSemibold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '500' as const },
};