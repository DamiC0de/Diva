import React from 'react';
import { Text as RNText, type TextStyle } from 'react-native';
import { useTheme } from '../../constants/theme';

type TextVariant = 'hero' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';

// Font family mapping for Inter
const FONT_FAMILIES = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: TextStyle;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export function Text({ children, variant = 'body', color, style, weight }: TextProps) {
  const theme = useTheme();

  const variantStyle: TextStyle = (() => {
    switch (variant) {
      case 'hero':
        return {
          fontSize: 34,
          fontFamily: FONT_FAMILIES.bold,
          color: theme.text,
          lineHeight: 41,
          letterSpacing: 0.4,
        };
      case 'heading':
        return {
          fontSize: 22,
          fontFamily: FONT_FAMILIES.semibold,
          color: theme.text,
          lineHeight: 28,
          letterSpacing: 0.35,
        };
      case 'subheading':
        return {
          fontSize: 17,
          fontFamily: FONT_FAMILIES.semibold,
          color: theme.text,
          lineHeight: 22,
          letterSpacing: -0.43,
        };
      case 'label':
        return {
          fontSize: 13,
          fontFamily: FONT_FAMILIES.medium,
          color: theme.textSecondary,
          lineHeight: 18,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        };
      case 'caption':
        return {
          fontSize: 13,
          fontFamily: FONT_FAMILIES.regular,
          color: theme.textMuted,
          lineHeight: 18,
          letterSpacing: -0.08,
        };
      default: // body
        return {
          fontSize: 17,
          fontFamily: FONT_FAMILIES.regular,
          color: theme.text,
          lineHeight: 22,
          letterSpacing: -0.43,
        };
    }
  })();

  // Override font family if weight is specified
  const fontOverride = weight ? { fontFamily: FONT_FAMILIES[weight] } : {};

  return (
    <RNText style={[variantStyle, fontOverride, color ? { color } : undefined, style]}>
      {children}
    </RNText>
  );
}
