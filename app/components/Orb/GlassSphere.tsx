/**
 * GlassSphere — Crystal ball / soap bubble effect using SVG
 * Renders a transparent glass sphere with specular highlight
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Ellipse, Path } from 'react-native-svg';

interface GlassSphereProps {
  size: number;
  /** Tint color for the sphere interior, e.g. 'rgba(100,100,200,0.06)' */
  tint?: string;
  /** Whether to show sound ripples inside */
  showRipples?: boolean;
  /** Color of ripples */
  rippleColor?: string;
}

export const GlassSphere = memo(function GlassSphere({ 
  size, 
  tint = 'rgba(80,80,180,0.06)',
  showRipples = false,
  rippleColor = 'rgba(150,150,220,0.15)',
}: GlassSphereProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        {/* Sphere edge gradient — bright at edge, transparent inside */}
        <RadialGradient id="sphereEdge" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="85%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="93%" stopColor="white" stopOpacity="0.04" />
          <Stop offset="97%" stopColor="white" stopOpacity="0.10" />
          <Stop offset="100%" stopColor="white" stopOpacity="0.06" />
        </RadialGradient>
        
        {/* Specular highlight gradient (top-left crescent) */}
        <LinearGradient id="specular" x1="0%" y1="0%" x2="70%" y2="70%">
          <Stop offset="0%" stopColor="white" stopOpacity="0.45" />
          <Stop offset="40%" stopColor="white" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="white" stopOpacity="0" />
        </LinearGradient>
        
        {/* Subtle interior tint */}
        <RadialGradient id="interiorTint" cx="50%" cy="60%" r="50%">
          <Stop offset="0%" stopColor={tint} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={tint} stopOpacity="0.1" />
        </RadialGradient>

        {/* Outer glow */}
        <RadialGradient id="outerGlow" cx="50%" cy="55%" r="55%">
          <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="70%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="85%" stopColor="#7B78E8" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#5856D6" stopOpacity="0.15" />
        </RadialGradient>
      </Defs>
      
      {/* Outer subtle glow */}
      <Circle cx={cx} cy={cy} r={r + 1} fill="url(#outerGlow)" />
      
      {/* Sphere body — almost invisible fill + edge gradient */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#interiorTint)" />
      <Circle cx={cx} cy={cy} r={r} fill="url(#sphereEdge)" />
      
      {/* Thin edge ring */}
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      
      {/* Specular highlight — top-left crescent */}
      <Ellipse 
        cx={cx - size * 0.18} 
        cy={cy - size * 0.22}
        rx={size * 0.25}
        ry={size * 0.12}
        fill="url(#specular)"
        transform={`rotate(-30, ${cx - size * 0.18}, ${cy - size * 0.22})`}
      />
      
      {/* Small bright dot on highlight */}
      <Circle 
        cx={cx - size * 0.25} 
        cy={cy - size * 0.28}
        r={2}
        fill="rgba(255,255,255,0.5)"
      />
      
      {/* Sound ripples (if active) */}
      {showRipples && (
        <>
          {/* Left ripples */}
          <Path
            d={`M ${cx - size * 0.12} ${cy - size * 0.08} Q ${cx - size * 0.18} ${cy} ${cx - size * 0.12} ${cy + size * 0.08}`}
            fill="none"
            stroke={rippleColor}
            strokeWidth={1.5}
          />
          <Path
            d={`M ${cx - size * 0.17} ${cy - size * 0.12} Q ${cx - size * 0.24} ${cy} ${cx - size * 0.17} ${cy + size * 0.12}`}
            fill="none"
            stroke={rippleColor}
            strokeWidth={1}
            opacity={0.6}
          />
          {/* Right ripples */}
          <Path
            d={`M ${cx + size * 0.12} ${cy - size * 0.08} Q ${cx + size * 0.18} ${cy} ${cx + size * 0.12} ${cy + size * 0.08}`}
            fill="none"
            stroke={rippleColor}
            strokeWidth={1.5}
          />
          <Path
            d={`M ${cx + size * 0.17} ${cy - size * 0.12} Q ${cx + size * 0.24} ${cy} ${cx + size * 0.17} ${cy + size * 0.12}`}
            fill="none"
            stroke={rippleColor}
            strokeWidth={1}
            opacity={0.6}
          />
        </>
      )}
    </Svg>
  );
});
