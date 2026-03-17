import { Platform } from 'react-native';

const tintColorLight = '#f97316'; // Orange-500
const tintColorDark = '#fdba74';

export const Colors = {
  light: {
    text: '#0f172a', // Slate-900
    background: '#f8fafc', // Slate-50
    tint: tintColorLight,
    icon: '#64748b', // Slate-500
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorLight,
    primary: '#f97316',
    border: '#e2e8f0', // Slate-200
  },
  dark: {
    text: '#f8fafc',
    background: '#0f172a',
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    primary: '#ea580c',
    border: '#334155',
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

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    mono: 'monospace',
  },
});

export const Typography = {
  title1: { fontSize: 28, fontWeight: '700' as const },
  title2: { fontSize: 24, fontWeight: '600' as const },
  title3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
};

export const Radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
};
