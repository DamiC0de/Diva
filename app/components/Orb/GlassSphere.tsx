/**
 * GlassSphere — Dark crystal ball with luminous rim
 * Reference: dark tinted glass sphere with bright specular highlight on left edge
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Ellipse, Path } from 'react-native-svg';

interface GlassSphereProps {
  size: number;
  /** Show sound wave ripples inside */
  showRipples?: boolean;
  /** Is dark mode */
  isDark?: boolean;
}

export const GlassSphere = memo(function GlassSphere({ 
  size, 
  showRipples = false,
  isDark = true,
}: GlassSphereProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4; // Leave room for outer glow

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        {/* Dark sphere interior — darker than background */}
        <RadialGradient id="sphereFill" cx="45%" cy="42%" r="52%">
          <Stop offset="0%" stopColor={isDark ? '#1a1535' : '#e8e5f0'} stopOpacity="0.7" />
          <Stop offset="60%" stopColor={isDark ? '#12102a' : '#d5d0e5'} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={isDark ? '#0d0a1f' : '#c5c0d8'} stopOpacity="0.95" />
        </RadialGradient>
        
        {/* Bright rim — the glass edge catches light */}
        <RadialGradient id="rimLight" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="88%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="94%" stopColor={isDark ? '#4a4580' : '#8885b0'} stopOpacity="0.3" />
          <Stop offset="97%" stopColor={isDark ? '#6b65a0' : '#9995c0'} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={isDark ? '#8880c0' : '#aaa5d0'} stopOpacity="0.2" />
        </RadialGradient>
        
        {/* Specular highlight — bright crescent on left edge */}
        <LinearGradient id="specular" x1="0%" y1="20%" x2="60%" y2="80%">
          <Stop offset="0%" stopColor="white" stopOpacity="0.7" />
          <Stop offset="30%" stopColor="white" stopOpacity="0.3" />
          <Stop offset="60%" stopColor="white" stopOpacity="0.05" />
          <Stop offset="100%" stopColor="white" stopOpacity="0" />
        </LinearGradient>
        
        {/* Outer glow — purple/violet on bottom-right */}
        <RadialGradient id="outerGlow" cx="60%" cy="60%" r="55%">
          <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="75%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="90%" stopColor={isDark ? '#6b4fa0' : '#9080c0'} stopOpacity="0.15" />
          <Stop offset="100%" stopColor={isDark ? '#5040a0' : '#8070b0'} stopOpacity="0.25" />
        </RadialGradient>

        {/* Mascot glow — luminous aura behind the character */}
        <RadialGradient id="mascotGlow" cx="50%" cy="45%" r="30%">
          <Stop offset="0%" stopColor="#7DD3E8" stopOpacity="0.25" />
          <Stop offset="50%" stopColor="#5856D6" stopOpacity="0.1" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      
      {/* Outer glow (violet, bottom-right) */}
      <Circle cx={cx} cy={cy} r={r + 3} fill="url(#outerGlow)" />
      
      {/* Main sphere body — dark tinted glass */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#sphereFill)" />
      
      {/* Rim light — bright edge */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#rimLight)" />
      
      {/* Thin edge line */}
      <Circle 
        cx={cx} cy={cy} r={r} 
        fill="none" 
        stroke={isDark ? 'rgba(140,130,200,0.2)' : 'rgba(100,90,160,0.15)'} 
        strokeWidth={1} 
      />
      
      {/* Mascot luminous glow (behind the character) */}
      <Circle cx={cx} cy={cy * 0.92} r={r * 0.55} fill="url(#mascotGlow)" />
      
      {/* Specular highlight — bright crescent on left */}
      <Path
        d={`M ${cx - r * 0.65} ${cy - r * 0.55} 
            A ${r * 0.95} ${r * 0.95} 0 0 0 ${cx - r * 0.5} ${cy + r * 0.65}`}
        fill="none"
        stroke="url(#specular)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      
      {/* Small bright dot at top of specular */}
      <Circle 
        cx={cx - r * 0.62} 
        cy={cy - r * 0.52}
        r={2.5}
        fill="rgba(255,255,255,0.8)"
      />
      
      {/* Bottom shadow/reflection under mascot */}
      <Ellipse
        cx={cx}
        cy={cy + r * 0.45}
        rx={r * 0.25}
        ry={r * 0.04}
        fill={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}
      />
      
      {/* Sound ripples (when speaking/listening) */}
      {showRipples && (
        <>
          {/* Left ripples */}
          <Path
            d={`M ${cx - r * 0.22} ${cy - r * 0.15} Q ${cx - r * 0.32} ${cy} ${cx - r * 0.22} ${cy + r * 0.15}`}
            fill="none"
            stroke={isDark ? 'rgba(100,90,160,0.3)' : 'rgba(80,70,140,0.2)'}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d={`M ${cx - r * 0.30} ${cy - r * 0.22} Q ${cx - r * 0.42} ${cy} ${cx - r * 0.30} ${cy + r * 0.22}`}
            fill="none"
            stroke={isDark ? 'rgba(100,90,160,0.2)' : 'rgba(80,70,140,0.12)'}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {/* Right ripples */}
          <Path
            d={`M ${cx + r * 0.22} ${cy - r * 0.15} Q ${cx + r * 0.32} ${cy} ${cx + r * 0.22} ${cy + r * 0.15}`}
            fill="none"
            stroke={isDark ? 'rgba(100,90,160,0.3)' : 'rgba(80,70,140,0.2)'}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d={`M ${cx + r * 0.30} ${cy - r * 0.22} Q ${cx + r * 0.42} ${cy} ${cx + r * 0.30} ${cy + r * 0.22}`}
            fill="none"
            stroke={isDark ? 'rgba(100,90,160,0.2)' : 'rgba(80,70,140,0.12)'}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
});
