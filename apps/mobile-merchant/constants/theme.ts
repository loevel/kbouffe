// Design tokens — Apple HIG-inspired for the KBouffe merchant app
// Brand violet: #7c3aed (light) / #a78bfa (dark)

export { Colors } from './colors';
export type { ThemeColors } from './colors';

// ─── Spacing (8pt grid) ────────────────────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
  // Semantic aliases
  screenPadding: 16,
  cardPadding: 14,
  cardGap: 12,
} as const;

// ─── Border radii ──────────────────────────────────────────────────────────
export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ─── Typography (SF Pro scale) ─────────────────────────────────────────────
// fontWeight: 400=Regular, 600=Semibold, 700=Bold, 800=Heavy
export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: '800' as const, lineHeight: 41, letterSpacing: 0.37 },
  title1:     { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title2:     { fontSize: 22, fontWeight: '800' as const, lineHeight: 28 },
  title3:     { fontSize: 20, fontWeight: '700' as const, lineHeight: 25 },
  headline:   { fontSize: 17, fontWeight: '800' as const, lineHeight: 22 },
  body:       { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
  callout:    { fontSize: 16, fontWeight: '400' as const, lineHeight: 21 },
  subhead:    { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  footnote:   { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption1:   { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  caption2:   { fontSize: 11, fontWeight: '600' as const, lineHeight: 13 },
  tabLabel:   { fontSize: 10, fontWeight: '700' as const, lineHeight: 12, letterSpacing: 0.3 },
  overline:   { fontSize: 11, fontWeight: '700' as const, lineHeight: 13, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

// ─── Shadows (iOS-style layered shadows) ───────────────────────────────────
// ⚠️ On iOS, `overflow: 'hidden'` kills shadows. Pattern:
//   outer <Animated.View style={Shadows.md}> — carries the shadow
//   inner <View style={{overflow:'hidden', borderRadius}}> — clips content
export const Shadows = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

// ─── Spring presets (react-native-reanimated withSpring) ───────────────────
// Usage: withSpring(targetValue, Springs.snappy)
export const Springs = {
  // Default — most interactions
  standard: { damping: 20, stiffness: 300 },
  // Button/card presses — tight and fast
  snappy:   { damping: 18, stiffness: 400 },
  // Playful expand effects
  bouncy:   { damping: 14, stiffness: 350 },
  // Tooltip, overlay — soft landing
  gentle:   { damping: 30, stiffness: 200 },
  // Modal/sheet — deliberate
  slow:     { damping: 40, stiffness: 150 },
} as const;

// ─── Duration (ms, for withTiming) ─────────────────────────────────────────
export const Duration = {
  instant:  100,
  fast:     150,
  normal:   250,
  moderate: 350,
  slow:     500,
} as const;

// ─── Touch targets (Apple HIG) ─────────────────────────────────────────────
// Every tappable element must be ≥ 44×44 pt
export const TouchTarget = {
  min:    44,   // Absolute minimum per HIG
  button: 50,   // Standard button height
  large:  60,   // Prominent CTA
  tab:    49,   // Native tab bar item
} as const;

// ─── Opacity states ─────────────────────────────────────────────────────────
export const Opacity = {
  disabled: 0.38,
  pressed:  0.80,
  ghost:    0.60,
  overlay:  0.48,
} as const;

// ─── Z-index hierarchy ──────────────────────────────────────────────────────
export const ZIndex = {
  base:     0,
  card:     1,
  sticky:   10,
  dropdown: 20,
  overlay:  30,
  modal:    40,
  toast:    50,
  tooltip:  60,
} as const;
