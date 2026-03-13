/**
 * SoftGlow — SVG radial gradient ambient glow behind the orb
 * Replaces solid disc with smooth fade-to-transparent
 */
import React, { memo } from 'react';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

interface SoftGlowProps {
  size: number;
  color: string;
}

export const SoftGlow = memo(function SoftGlow({ size, color }: SoftGlowProps) {
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg
      width={size}
      height={size}
      style={{ position: 'absolute' }}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="softGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor={color} stopOpacity="0.40" />
          <Stop offset="40%"  stopColor={color} stopOpacity="0.18" />
          <Stop offset="70%"  stopColor={color} stopOpacity="0.06" />
          <Stop offset="100%" stopColor={color} stopOpacity="0"    />
        </RadialGradient>
      </Defs>
      <Ellipse
        cx={cx}
        cy={cy}
        rx={cx}
        ry={cy}
        fill="url(#softGlow)"
      />
    </Svg>
  );
});
