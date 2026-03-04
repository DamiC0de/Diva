/**
 * DIVA Design System — 2026
 * 
 * Palette "Luminous Intelligence" from UX trends PDF
 * - Dark-first with warm accents
 * - Aligned with mascot logo gradient (cyan → indigo → violet)
 * - Neo-minimalism: soft blacks, warm whites
 */
import { useColorScheme } from 'react-native';

// Brand colors — aligned with mascot logo
const brand = {
  // Logo gradient colors
  cyan: '#7DD3E8',          // Top of logo flame
  indigo: '#5856D6',        // Core brand color (Apple system indigo)
  indigoLight: '#7B78E8',   // Lighter for dark mode
  violet: '#4A4B91',        // Base of logo flame
  
  // Secondary accents
  teal: '#20808D',
  tealLight: '#2CB5C5',
  peach: '#DE7356',         // Warm accent
  peachLight: '#E8886B',
};

// Functional colors
const functional = {
  success: '#34C759',
  successDark: '#30D158',
  error: '#FF3B30',
  errorDark: '#FF453A',
  warning: '#FF9500',
  warningDark: '#FF9F0A',
};

// Orb state colors — aligned with logo gradient
const orbColors = {
  orbIdle: brand.indigo,        // Ready state — brand indigo
  orbListening: brand.cyan,     // Active listening — cyan (alert, receiving)
  orbProcessing: brand.indigoLight, // Thinking — lighter indigo
  orbSpeaking: brand.violet,    // Speaking — deep violet
  orbError: functional.error,   // Error — red
};

// Voice animation gradient (for mesh/aurora effects)
const voiceGradient = {
  start: brand.cyan,
  mid: brand.indigo,
  end: brand.violet,
};

export const lightTheme = {
  // Brand
  ...brand,
  primary: brand.indigo,
  primaryLight: brand.indigoLight,
  primarySoft: 'rgba(88, 86, 214, 0.12)',
  tealSoft: 'rgba(32, 128, 141, 0.12)',
  cyanSoft: 'rgba(125, 211, 232, 0.15)',
  
  // Orb
  ...orbColors,
  voiceGradient,
  
  // Functional
  success: functional.success,
  error: functional.error,
  warning: functional.warning,
  
  // Backgrounds — Luminous Intelligence light palette
  bg: '#FAFAF8',              // Warm white (not pure)
  bgSecondary: '#F2F0EB',
  bgTertiary: '#E8E5DE',
  bgGradientStart: '#FAFAF8',
  bgGradientEnd: '#F2F0EB',
  background: '#FAFAF8',
  
  // Surfaces
  card: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  cardElevated: '#FFFFFF',
  
  // Text
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9A9A9A',
  textInverse: '#FFFFFF',
  textLight: '#9A9A9A',
  
  // Input
  inputBg: '#FFFFFF',
  inputBorder: '#E2DFD8',
  inputFocus: brand.indigo,
  
  // Orb background
  orbBg: '#F0EDE6',
  
  // Misc
  white: '#FFFFFF',
  border: '#E8E5DE',
  secondary: brand.indigo,
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  divider: '#E8E5DE',
  statusBar: 'dark' as const,
};

export const darkTheme = {
  // Brand
  ...brand,
  primary: brand.indigoLight,   // Lighter in dark mode
  primaryLight: '#9B98F0',
  primarySoft: 'rgba(123, 120, 232, 0.15)',
  tealSoft: 'rgba(44, 181, 197, 0.15)',
  cyanSoft: 'rgba(125, 211, 232, 0.12)',
  
  // Orb — slightly lighter in dark mode
  orbIdle: brand.indigoLight,
  orbListening: brand.cyan,
  orbProcessing: '#9B98F0',
  orbSpeaking: '#6B6BC4',
  orbError: functional.errorDark,
  voiceGradient,
  
  // Functional
  success: functional.successDark,
  error: functional.errorDark,
  warning: functional.warningDark,
  
  // Backgrounds — Luminous Intelligence dark palette
  bg: '#0D0D0D',              // Soft black (not pure)
  bgSecondary: '#1A1A1E',
  bgTertiary: '#2C2C30',
  bgGradientStart: '#0D0D0D',
  bgGradientEnd: '#1A1A2E',   // Hint of indigo
  background: '#0D0D0D',
  
  // Surfaces
  card: '#1C1C20',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardElevated: '#242428',
  
  // Text — warm white, never pure
  text: '#F0EDE8',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',
  textInverse: '#0D0D0D',
  textLight: '#6B6B6B',
  
  // Input
  inputBg: '#1C1C20',
  inputBorder: '#2C2C30',
  inputFocus: brand.indigoLight,
  
  // Orb background
  orbBg: '#1A1A2E',
  
  // Misc
  white: '#FFFFFF',
  border: '#2C2C30',
  secondary: brand.indigoLight,
  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  divider: '#2C2C30',
  statusBar: 'light' as const,
};

// Type definition
export type Theme = Omit<typeof lightTheme, 'statusBar'> & {
  statusBar: 'dark' | 'light';
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}

// Backward compat exports
export const Colors = lightTheme;
export const colors = Colors;
