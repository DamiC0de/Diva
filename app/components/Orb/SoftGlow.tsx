/**
 * SoftGlow — Animated radial glow using SVG RadialGradient
 * Replaces the solid backgroundColor glow that was rendering as an ugly disc
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

interface SoftGlowProps {
  size: number;
  color: string;
}

export const SoftGlow = memo(function SoftGlow({ size, color }: SoftGlowProps) {
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="softGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <Stop offset="30%" stopColor={color} stopOpacity="0.25" />
          <Stop offset="60%" stopColor={color} stopOpacity="0.08" />
          <Stop offset="85%" stopColor={color} stopOpacity="0.02" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#softGlow)" />
    </Svg>
  );
});
