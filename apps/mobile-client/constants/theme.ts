const tintColorLight = '#FF7A1A';
const tintColorDark = '#FF9A54';

export const Colors = {
  light: {
    text: '#172033',
    textMuted: '#667085',
    background: '#F4F1EA',
    backgroundAlt: '#FBF8F3',
    surface: '#FFFCF7',
    surfaceAlt: '#F7F2EA',
    surfaceElevated: '#FFFFFF',
    tint: tintColorLight,
    icon: '#7A8699',
    tabIconDefault: '#98A2B3',
    tabIconSelected: tintColorLight,
    primary: '#FF7A1A',
    primarySoft: '#FFE1CC',
    primaryLight: '#FFF1E6',
    border: '#E8DFD2',
    borderStrong: '#D8C7B2',
    error: '#ef4444',
    success: '#16A34A',
    warning: '#D97706',
    overlay: 'rgba(23, 32, 51, 0.08)',
    inputBackground: '#FFF8F0',
    transparent: 'transparent',
  },
  dark: {
    text: '#F6F2EA',
    textMuted: '#B9B3A9',
    background: '#17141D',
    backgroundAlt: '#1D1924',
    surface: '#211D29',
    surfaceAlt: '#2A2434',
    surfaceElevated: '#312A3D',
    tint: tintColorDark,
    icon: '#AAA3B7',
    tabIconDefault: '#7A738A',
    tabIconSelected: tintColorDark,
    primary: '#FF9A54',
    primarySoft: 'rgba(255, 154, 84, 0.22)',
    primaryLight: 'rgba(255, 154, 84, 0.14)',
    border: '#3A3348',
    borderStrong: '#564D68',
    error: '#f87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    overlay: 'rgba(0, 0, 0, 0.3)',
    inputBackground: '#261F31',
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
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#140F1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: '#140F1F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 6,
  },
  lg: {
    shadowColor: '#140F1F',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 36,
    elevation: 12,
  },
};

export const Typography = {
  display: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.2, lineHeight: 44 },
  title1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 36 },
  title2: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 30 },
  title3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 24 },
  headline: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  subtitle2: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySemibold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  captionSemibold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  smallSemibold: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
};
