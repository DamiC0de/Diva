/**
 * GlassSphere — Dark crystal ball / soap bubble effect
 * Target: transparent-looking sphere with bright white rim catching light
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Ellipse, Path } from 'react-native-svg';

interface GlassSphereProps {
  size: number;
  showRipples?: boolean;
  isDark?: boolean;
}

export const GlassSphere = memo(function GlassSphere({ 
  size, 
  showRipples = false,
  isDark = true,
}: GlassSphereProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        {/* Sphere interior — dark in dark mode, tinted purple in light mode */}
        <RadialGradient id="sphereFill" cx="45%" cy="42%" r="52%">
          <Stop offset="0%" stopColor={isDark ? '#1a1535' : '#b8b0d8'} stopOpacity={isDark ? "0.6" : "0.5"} />
          <Stop offset="50%" stopColor={isDark ? '#13102b' : '#a8a0cc'} stopOpacity={isDark ? "0.8" : "0.65"} />
          <Stop offset="100%" stopColor={isDark ? '#0c091e' : '#9890c0'} stopOpacity={isDark ? "0.92" : "0.75"} />
        </RadialGradient>
        
        {/* Bright WHITE rim all around — like a soap bubble */}
        <RadialGradient id="rimWhite" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="86%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="92%" stopColor="white" stopOpacity={isDark ? "0.04" : "0.08"} />
          <Stop offset="96%" stopColor="white" stopOpacity={isDark ? "0.15" : "0.25"} />
          <Stop offset="98%" stopColor="white" stopOpacity={isDark ? "0.25" : "0.40"} />
          <Stop offset="100%" stopColor="white" stopOpacity={isDark ? "0.10" : "0.20"} />
        </RadialGradient>

        {/* Purple tint on bottom-right of rim */}
        <RadialGradient id="rimPurple" cx="65%" cy="65%" r="50%">
          <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="85%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="95%" stopColor="#8B5CF6" stopOpacity={isDark ? "0.2" : "0.20"} />
          <Stop offset="100%" stopColor="#7C3AED" stopOpacity={isDark ? "0.15" : "0.15"} />
        </RadialGradient>
        
        {/* Specular highlight gradient — bright upper-left crescent */}
        <LinearGradient id="specular" x1="0%" y1="15%" x2="50%" y2="85%">
          <Stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <Stop offset="20%" stopColor="white" stopOpacity="0.5" />
          <Stop offset="50%" stopColor="white" stopOpacity="0.1" />
          <Stop offset="100%" stopColor="white" stopOpacity="0" />
        </LinearGradient>

        {/* Dim secondary specular — bottom-right edge */}
        <LinearGradient id="specular2" x1="100%" y1="85%" x2="50%" y2="15%">
          <Stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <Stop offset="30%" stopColor="white" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="white" stopOpacity="0" />
        </LinearGradient>
        
        {/* Outer purple glow */}
        <RadialGradient id="outerGlow" cx="55%" cy="58%" r="55%">
          <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="80%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="92%" stopColor="#7C3AED" stopOpacity={isDark ? "0.12" : "0.12"} />
          <Stop offset="100%" stopColor="#6D28D9" stopOpacity={isDark ? "0.2" : "0.18"} />
        </RadialGradient>

        {/* Mascot luminous aura — white/cyan center glow */}
        <RadialGradient id="mascotGlow" cx="50%" cy="44%" r="28%">
          <Stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <Stop offset="30%" stopColor="#7DD3E8" stopOpacity="0.12" />
          <Stop offset="60%" stopColor="#5856D6" stopOpacity="0.06" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      
      {/* Outer glow */}
      <Circle cx={cx} cy={cy} r={r + 5} fill="url(#outerGlow)" />
      
      {/* Sphere body */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#sphereFill)" />
      
      {/* White rim — all around */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#rimWhite)" />
      
      {/* Purple tint on bottom-right rim */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#rimPurple)" />
      
      {/* Thin white edge stroke */}
      <Circle 
        cx={cx} cy={cy} r={r} 
        fill="none" 
        stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(100,80,160,0.25)'} 
        strokeWidth={1.2} 
      />
      
      {/* Mascot glow */}
      <Circle cx={cx} cy={cy * 0.92} r={r * 0.5} fill="url(#mascotGlow)" />
      
      {/* MAIN specular — bright crescent upper-left (long arc) */}
      <Path
        d={`M ${cx - r * 0.55} ${cy - r * 0.7} 
            A ${r} ${r} 0 0 0 ${cx - r * 0.72} ${cy + r * 0.45}`}
        fill="none"
        stroke="url(#specular)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      
      {/* Bright dot at top of specular */}
      <Circle 
        cx={cx - r * 0.58} 
        cy={cy - r * 0.65}
        r={3}
        fill="rgba(255,255,255,0.9)"
      />
      
      {/* Secondary specular — dim crescent bottom-right */}
      <Path
        d={`M ${cx + r * 0.65} ${cy + r * 0.4} 
            A ${r} ${r} 0 0 0 ${cx + r * 0.35} ${cy + r * 0.75}`}
        fill="none"
        stroke="url(#specular2)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      
      {/* Bottom shadow */}
      <Ellipse
        cx={cx}
        cy={cy + r * 0.48}
        rx={r * 0.22}
        ry={r * 0.035}
        fill={isDark ? 'rgba(0,0,0,0.35)' : 'rgba(80,60,120,0.15)'}
      />
      
      {/* Sound ripples */}
      {showRipples && (
        <>
          <Path
            d={`M ${cx - r * 0.22} ${cy - r * 0.14} Q ${cx - r * 0.30} ${cy} ${cx - r * 0.22} ${cy + r * 0.14}`}
            fill="none" stroke={isDark ? 'rgba(120,110,180,0.3)' : 'rgba(80,70,140,0.25)'}
            strokeWidth={2} strokeLinecap="round"
          />
          <Path
            d={`M ${cx - r * 0.29} ${cy - r * 0.20} Q ${cx - r * 0.40} ${cy} ${cx - r * 0.29} ${cy + r * 0.20}`}
            fill="none" stroke={isDark ? 'rgba(120,110,180,0.18)' : 'rgba(80,70,140,0.15)'}
            strokeWidth={1.5} strokeLinecap="round"
          />
          <Path
            d={`M ${cx + r * 0.22} ${cy - r * 0.14} Q ${cx + r * 0.30} ${cy} ${cx + r * 0.22} ${cy + r * 0.14}`}
            fill="none" stroke={isDark ? 'rgba(120,110,180,0.3)' : 'rgba(80,70,140,0.25)'}
            strokeWidth={2} strokeLinecap="round"
          />
          <Path
            d={`M ${cx + r * 0.29} ${cy - r * 0.20} Q ${cx + r * 0.40} ${cy} ${cx + r * 0.29} ${cy + r * 0.20}`}
            fill="none" stroke={isDark ? 'rgba(120,110,180,0.18)' : 'rgba(80,70,140,0.15)'}
            strokeWidth={1.5} strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
});
