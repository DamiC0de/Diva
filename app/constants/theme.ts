/**
 * DIVA Design System — 2026
 * 
 * Palette inspirée du logo mascotte "Flamme Esprit"
 * Gradient: Cyan (#A8E0F0) → Bleu → Indigo (#5856D6) → Violet (#4A4B91)
 * Style: Compagnon IA chaleureux, premium, Apple-like
 */
import { useColorScheme } from 'react-native';

// Shared accent palette — harmonized with mascot logo
const accent = {
  primary: '#5856D6',       // Indigo Apple — main brand color
  primaryLight: '#7B78E8',  // Lighter indigo for dark mode
  primarySoft: 'rgba(88, 86, 214, 0.12)',
  teal: '#20808D',          // Teal accent (secondary)
  tealSoft: 'rgba(32, 128, 141, 0.12)',
  cyan: '#A8E0F0',          // Cyan from logo top
  cyanSoft: 'rgba(168, 224, 240, 0.15)',
  violet: '#4A4B91',        // Deep violet from logo base
  success: '#34D399',
  error: '#EF4444',
  warning: '#FBBF24',
};

// Orb state colors — aligned with logo gradient
const orbColors = {
  orbIdle: '#5856D6',       // Indigo — primary, ready
  orbListening: '#7DD3E8',  // Cyan — active, alert
  orbProcessing: '#818CF8', // Light indigo — thinking
  orbSpeaking: '#4A4B91',   // Deep violet — speaking
  orbError: '#EF4444',      // Red — error state
};

export const lightTheme = {
  ...accent,
  ...orbColors,
  // Backgrounds
  bg: '#FAFAF9',            // Cloud Dancer warm white
  bgSecondary: '#F5F3EF',   // Slightly warm
  bgTertiary: '#EDEBE6',
  background: '#FAFAF9',    // Alias for bg
  
  // Surfaces
  card: '#FFFFFF',
  cardBorder: '#E8E5DE',
  cardElevated: '#FFFFFF',
  
  // Text
  text: '#1A1A2E',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textLight: '#94A3B8',     // Alias for processing state
  
  // Input
  inputBg: '#FFFFFF',
  inputBorder: '#E2DFD8',
  inputFocus: accent.primary,
  
  // Orb background
  orbBg: '#F0EDE6',
  
  // Misc
  white: '#FFFFFF',
  border: '#E8E5DE',
  secondary: '#6366F1',     // Alias for primary
  shadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  divider: '#E8E5DE',
  statusBar: 'dark' as const,
};

export const darkTheme = {
  ...accent,
  ...orbColors,
  // Backgrounds
  bg: '#0C0C14',            // Deep space navy
  bgSecondary: '#12121E',
  bgTertiary: '#1A1A2A',
  background: '#0C0C14',    // Alias for bg
  
  // Surfaces
  card: '#16162A',
  cardBorder: '#252540',
  cardElevated: '#1E1E36',
  
  // Text
  text: '#F1F0EE',          // Cloud Dancer tinted
  textSecondary: '#9CA3AF',
  textMuted: '#5B6078',
  textInverse: '#0C0C14',
  textLight: '#5B6078',     // Alias for processing state
  
  // Input
  inputBg: '#16162A',
  inputBorder: '#2A2A44',
  inputFocus: accent.primaryLight,
  
  // Orb background
  orbBg: '#1A1A2E',
  
  // Misc
  white: '#FFFFFF',
  border: '#252540',
  secondary: '#818CF8',     // Primary light for dark mode
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  divider: '#252540',
  statusBar: 'light' as const,
};

// Define the base theme type with statusBar as a union to allow both values
export type Theme = Omit<typeof lightTheme, 'statusBar'> & {
  statusBar: 'dark' | 'light';
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}

// Keep backward compat
export const Colors = lightTheme;
export const colors = Colors;
