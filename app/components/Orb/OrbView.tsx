/**
 * OrbView — Premium minimal orb with subtle glassmorphism
 * 2026 Design: Clean, airy, the mascot is the star
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Animated, Pressable, Easing, Image, View, Platform } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '../../constants/theme';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface OrbViewProps {
  state: OrbState;
  audioLevel?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
}

const MASCOT_SIZE = 130;
const ORB_SIZE = 190;

/** Radial glow using SVG — fades to transparent at edges (no solid circle) */
function RadialGlow({ size, color, id }: { size: number; color: string; id: string }) {
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <Stop offset="50%" stopColor={color} stopOpacity="0.15" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

export function OrbView({ state, audioLevel = 0, onPress, onLongPress, onPressOut }: OrbViewProps) {
  const theme = useTheme();
  const isDark = theme.statusBar === 'light';
  
  // Core animations
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  
  // Glow — start subtle, animate up on interaction
  const glowOpacity = useRef(new Animated.Value(isDark ? 0.45 : 0.25)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  
  // Ring ripples
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  
  // Error shake
  const shakeX = useRef(new Animated.Value(0)).current;
  
  // Mouth
  const mouthOpen = useRef(new Animated.Value(0)).current;
  const mouthOpacity = useRef(new Animated.Value(0)).current;
  
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const mouthAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const stateColors = useMemo(() => ({
    idle: { glow: theme.indigo, ring: theme.indigoLight + '60' },
    listening: { glow: theme.cyan, ring: theme.cyan + '50' },
    processing: { glow: theme.indigoLight, ring: theme.indigoLight + '40' },
    speaking: { glow: theme.violet, ring: theme.indigo + '50' },
    error: { glow: theme.error, ring: theme.error + '40' },
  }), [theme]);

  const colors = stateColors[state];

  const resetAnimations = () => {
    animRef.current?.stop();
    mouthAnimRef.current?.stop();
    [scale, translateY, tilt, glowOpacity, glowScale,
     ring1Scale, ring1Opacity, ring2Scale, ring2Opacity,
     shakeX, mouthOpen, mouthOpacity]
      .forEach(a => a.stopAnimation());
    
    scale.setValue(1);
    translateY.setValue(0);
    tilt.setValue(0);
    shakeX.setValue(0);
    glowScale.setValue(1);
    glowOpacity.setValue(0.5);
    ring1Opacity.setValue(0);
    ring2Opacity.setValue(0);
    mouthOpen.setValue(0);
    mouthOpacity.setValue(0);
  };

  const createRipple = (duration: number) => {
    return Animated.loop(
      Animated.stagger(duration / 2, [
        Animated.sequence([
          Animated.timing(ring1Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0.4, duration: 80, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ring1Scale, { toValue: 1.6, duration: duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0, duration: duration, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.timing(ring2Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ring2Opacity, { toValue: 0.3, duration: 80, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ring2Scale, { toValue: 1.6, duration: duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0, duration: duration, useNativeDriver: true }),
          ]),
        ]),
      ])
    );
  };

  useEffect(() => {
    resetAnimations();

    switch (state) {
      case 'idle': {
        const breathe = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.04, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(glowOpacity, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.98, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 4, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(glowOpacity, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
            ]),
          ])
        );
        
        const glowPulse = Animated.loop(
          Animated.sequence([
            Animated.timing(glowScale, { toValue: 1.08, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([breathe, glowPulse]);
        animRef.current.start();
        break;
      }
      
      case 'listening': {
        Animated.timing(tilt, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 200, useNativeDriver: true }).start();
        
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.08, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -5, duration: 400, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.96, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 5, duration: 400, useNativeDriver: true }),
            ]),
          ])
        );
        
        animRef.current = Animated.parallel([pulse, createRipple(1400)]);
        animRef.current.start();
        break;
      }
      
      case 'processing': {
        glowOpacity.setValue(0.7);
        
        const breathe = Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.06, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
          ])
        );
        
        const glow = Animated.loop(
          Animated.sequence([
            Animated.timing(glowScale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1, duration: 800, useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([breathe, glow]);
        animRef.current.start();
        break;
      }
      
      case 'speaking': {
        glowOpacity.setValue(0.9);
        
        // Mouth
        Animated.timing(mouthOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        mouthAnimRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(mouthOpen, { toValue: 1, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0.2, duration: 80, useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0.7, duration: 100, useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0.1, duration: 90, useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0.5, duration: 110, useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.delay(60),
          ])
        );
        mouthAnimRef.current.start();
        
        // Bounce
        const bounce = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.12, duration: 130, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -12, duration: 130, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 5, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.03, duration: 80, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 80, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.07, duration: 100, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -5, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 90, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 90, useNativeDriver: true }),
            ]),
          ])
        );
        
        animRef.current = Animated.parallel([bounce, createRipple(1000)]);
        animRef.current.start();
        break;
      }
      
      case 'error': {
        glowOpacity.setValue(0.7);
        
        const shake = Animated.sequence([
          ...([12, -12, 8, -8, 5, -5, 0].map(v =>
            Animated.timing(shakeX, { toValue: v, duration: 50, useNativeDriver: true })
          )),
        ]);
        
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(glowScale, { toValue: 1.1, duration: 400, useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1, duration: 400, useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([shake, pulse]);
        animRef.current.start();
        break;
      }
    }
    
    return () => { animRef.current?.stop(); mouthAnimRef.current?.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Audio-reactive
  useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      Animated.spring(scale, { 
        toValue: 1 + audioLevel * 0.1, 
        damping: 15, stiffness: 300, useNativeDriver: true 
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioLevel, state]);

  const tiltInterp = tilt.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  const orbBorderColor = isDark 
    ? 'rgba(180,190,255,0.14)' 
    : 'rgba(0,0,0,0.06)';
  
  // Glass sphere: slight tint so the orb has shape without being a black circle
  const orbBgColor = isDark
    ? 'rgba(30, 28, 70, 0.38)'      // subtle dark indigo tint
    : 'rgba(255,255,255,0.28)';      // less opaque in light mode

  const glassHighlightOpacity = isDark ? 0.18 : 0.15;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} onPressOut={onPressOut} style={styles.container}>
      
      {/* SVG radial glow — smooth fade, no hard edges */}
      <Animated.View style={[
        styles.glowContainer,
        { transform: [{ scale: glowScale }], opacity: glowOpacity }
      ]}>
        <RadialGlow size={ORB_SIZE * 2.2} color={colors.glow} id={`glow-${state}`} />
      </Animated.View>
      
      {/* Ripple rings — thin, subtle */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <Animated.View style={[styles.ring, { borderColor: colors.ring, transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
          <Animated.View style={[styles.ring, { borderColor: colors.ring, transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
        </>
      )}

      {/* Orb + Mascot */}
      <Animated.View
        style={[
          styles.orbOuter,
          {
            transform: [
              { scale },
              { translateY },
              { translateX: shakeX },
              { rotate: state === 'listening' ? tiltInterp : '0deg' },
            ],
          },
        ]}
      >
        {/* Glass orb background */}
        <View style={[
          styles.orbGlass,
          { 
            backgroundColor: orbBgColor,
            borderColor: orbBorderColor,
            // iOS shadow for depth
            ...Platform.select({
              ios: {
                shadowColor: colors.glow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.15,
                shadowRadius: 20,
              },
              android: { elevation: 8 },
            }),
          },
        ]}>
          {/* Subtle glass highlight */}
          <View style={[styles.glassShine, { opacity: glassHighlightOpacity }]} />
        </View>
        
        {/* Mascot */}
        <Image
          source={require('../../assets/images/diva-logo.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        
        {/* Mouth overlay */}
        {state === 'speaking' && (
          <Animated.View style={[styles.mouthWrap, { opacity: mouthOpacity }]}>
            <Animated.View
              style={[
                styles.mouth,
                {
                  transform: [{
                    scaleY: mouthOpen.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.15, 1],
                    }),
                  }],
                },
              ]}
            />
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: 300, 
    height: 300, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  
  glowContainer: {
    position: 'absolute',
    width: ORB_SIZE * 1.8,
    height: ORB_SIZE * 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  ring: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1,
  },
  
  orbOuter: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  orbGlass: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  
  glassShine: {
    position: 'absolute',
    top: 14,
    left: 22,
    width: ORB_SIZE * 0.4,
    height: ORB_SIZE * 0.18,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-15deg' }],
  },
  
  mascot: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
  
  mouthWrap: {
    position: 'absolute',
    bottom: ORB_SIZE * 0.31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mouth: {
    width: 14,
    height: 10,
    borderRadius: 7,
    backgroundColor: 'rgba(80, 40, 130, 0.6)',
  },
});
