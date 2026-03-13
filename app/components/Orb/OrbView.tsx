/**
 * OrbView — Premium mascot orb with glassmorphism & expressive animations
 * 2026 Design: Living mascot that listens and speaks
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Animated, Pressable, Easing, Image, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/theme';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface OrbViewProps {
  state: OrbState;
  audioLevel?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
}

const MASCOT_SIZE = 120;
const ORB_SIZE = 180;
const OUTER_GLOW_SIZE = 240;

export function OrbView({ state, audioLevel = 0, onPress, onLongPress, onPressOut }: OrbViewProps) {
  const theme = useTheme();
  const isDark = theme.statusBar === 'light';
  
  // Core animations
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  
  // Orb glass animations
  const orbGlowOpacity = useRef(new Animated.Value(0.4)).current;
  const orbGlowScale = useRef(new Animated.Value(1)).current;
  const outerGlowOpacity = useRef(new Animated.Value(0.15)).current;
  const outerGlowScale = useRef(new Animated.Value(1)).current;
  
  // Inner gradient rotation
  const gradientRotate = useRef(new Animated.Value(0)).current;
  
  // Ring animations (3 concentric rings)
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring3Scale = useRef(new Animated.Value(1)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;
  
  // Shake for error
  const shakeX = useRef(new Animated.Value(0)).current;
  
  // Mouth animation (speaking)
  const mouthOpen = useRef(new Animated.Value(0)).current;
  const mouthOpacity = useRef(new Animated.Value(0)).current;
  
  // Particle float (decorative dots)
  const particle1Y = useRef(new Animated.Value(0)).current;
  const particle1Opacity = useRef(new Animated.Value(0)).current;
  const particle2Y = useRef(new Animated.Value(0)).current;
  const particle2Opacity = useRef(new Animated.Value(0)).current;
  const particle3Y = useRef(new Animated.Value(0)).current;
  const particle3Opacity = useRef(new Animated.Value(0)).current;
  
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const mouthAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const particleAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // State-based colors
  const stateColors = useMemo(() => ({
    idle: { 
      glow: theme.indigo, 
      ring: theme.indigoLight,
      gradient: [theme.cyan + '40', theme.indigo + '60', theme.violet + '40'] as [string, string, string],
    },
    listening: { 
      glow: theme.cyan, 
      ring: '#7DD3E8',
      gradient: [theme.cyan + '70', '#7DD3E8' + '50', theme.indigo + '40'] as [string, string, string],
    },
    processing: { 
      glow: theme.indigoLight, 
      ring: theme.cyan,
      gradient: [theme.indigoLight + '50', theme.indigo + '60', theme.violet + '50'] as [string, string, string],
    },
    speaking: { 
      glow: theme.violet, 
      ring: theme.indigo,
      gradient: [theme.cyan + '50', theme.violet + '70', theme.indigo + '50'] as [string, string, string],
    },
    error: { 
      glow: theme.error, 
      ring: '#FF6B6B',
      gradient: [theme.error + '40', '#FF6B6B' + '50', theme.error + '40'] as [string, string, string],
    },
  }), [theme]);

  const colors = stateColors[state];

  // Reset all animations
  const resetAnimations = () => {
    animRef.current?.stop();
    mouthAnimRef.current?.stop();
    particleAnimRef.current?.stop();
    [scale, translateY, rotate, tilt, orbGlowOpacity, orbGlowScale,
     outerGlowOpacity, outerGlowScale, gradientRotate,
     ring1Scale, ring1Opacity, ring2Scale, ring2Opacity, ring3Scale, ring3Opacity, 
     shakeX, mouthOpen, mouthOpacity,
     particle1Y, particle1Opacity, particle2Y, particle2Opacity, particle3Y, particle3Opacity]
      .forEach(anim => anim.stopAnimation());
    
    scale.setValue(1);
    translateY.setValue(0);
    shakeX.setValue(0);
    rotate.setValue(0);
    tilt.setValue(0);
    orbGlowScale.setValue(1);
    orbGlowOpacity.setValue(0.4);
    outerGlowScale.setValue(1);
    outerGlowOpacity.setValue(0.15);
    ring1Opacity.setValue(0);
    ring2Opacity.setValue(0);
    ring3Opacity.setValue(0);
    mouthOpen.setValue(0);
    mouthOpacity.setValue(0);
  };

  // Floating particle animation (always active)
  useEffect(() => {
    const createParticleLoop = (yAnim: Animated.Value, opacityAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(opacityAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
            Animated.timing(yAnim, { toValue: -60, duration: 2500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(opacityAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.timing(yAnim, { toValue: -80, duration: 600, useNativeDriver: true }),
          ]),
          Animated.timing(yAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    };

    particleAnimRef.current = Animated.parallel([
      createParticleLoop(particle1Y, particle1Opacity, 0),
      createParticleLoop(particle2Y, particle2Opacity, 1000),
      createParticleLoop(particle3Y, particle3Opacity, 2000),
    ]);
    particleAnimRef.current.start();

    return () => { particleAnimRef.current?.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ripple ring animation
  const createRippleAnimation = () => {
    const rippleDuration = state === 'listening' ? 1500 : 1000;
    
    return Animated.loop(
      Animated.stagger(rippleDuration / 3, [
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0.5, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(ring1Scale, { toValue: 2, duration: rippleDuration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(ring1Opacity, { toValue: 0, duration: rippleDuration, useNativeDriver: true }),
            ]),
          ]),
        ]),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring2Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0.4, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(ring2Scale, { toValue: 2, duration: rippleDuration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(ring2Opacity, { toValue: 0, duration: rippleDuration, useNativeDriver: true }),
            ]),
          ]),
        ]),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring3Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring3Opacity, { toValue: 0.3, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(ring3Scale, { toValue: 2, duration: rippleDuration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(ring3Opacity, { toValue: 0, duration: rippleDuration, useNativeDriver: true }),
            ]),
          ]),
        ]),
      ])
    );
  };

  useEffect(() => {
    resetAnimations();

    switch (state) {
      case 'idle': {
        scale.setValue(1);
        translateY.setValue(0);
        orbGlowOpacity.setValue(0.4);
        orbGlowScale.setValue(1);
        outerGlowOpacity.setValue(0.15);
        
        const breathe = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.05, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(orbGlowOpacity, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
              Animated.timing(outerGlowOpacity, { toValue: 0.25, duration: 2000, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(orbGlowOpacity, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
              Animated.timing(outerGlowOpacity, { toValue: 0.15, duration: 2000, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.97, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(orbGlowOpacity, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
              Animated.timing(outerGlowOpacity, { toValue: 0.1, duration: 2000, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(orbGlowOpacity, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
              Animated.timing(outerGlowOpacity, { toValue: 0.15, duration: 2000, useNativeDriver: true }),
            ]),
          ])
        );
        
        const glowPulse = Animated.loop(
          Animated.sequence([
            Animated.timing(orbGlowScale, { toValue: 1.15, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(orbGlowScale, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([breathe, glowPulse]);
        animRef.current.start();
        break;
      }
      
      case 'listening': {
        Animated.timing(tilt, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        Animated.timing(orbGlowOpacity, { toValue: 0.8, duration: 200, useNativeDriver: true }).start();
        Animated.timing(orbGlowScale, { toValue: 1.3, duration: 300, useNativeDriver: true }).start();
        Animated.timing(outerGlowOpacity, { toValue: 0.4, duration: 300, useNativeDriver: true }).start();
        Animated.timing(outerGlowScale, { toValue: 1.2, duration: 300, useNativeDriver: true }).start();
        
        const attentivePulse = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -6, duration: 400, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.96, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 6, duration: 400, useNativeDriver: true }),
            ]),
          ])
        );
        
        const ripple = createRippleAnimation();
        animRef.current = Animated.parallel([attentivePulse, ripple]);
        animRef.current.start();
        break;
      }
      
      case 'processing': {
        scale.setValue(1);
        translateY.setValue(0);
        orbGlowScale.setValue(1.2);
        orbGlowOpacity.setValue(0.7);
        outerGlowOpacity.setValue(0.3);
        
        const breathe = Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.08, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
          ])
        );
        
        const glowBreath = Animated.loop(
          Animated.sequence([
            Animated.timing(orbGlowScale, { toValue: 1.4, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
            Animated.timing(orbGlowScale, { toValue: 1.1, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([breathe, glowBreath]);
        animRef.current.start();
        break;
      }
      
      case 'speaking': {
        scale.setValue(1);
        translateY.setValue(0);
        orbGlowOpacity.setValue(1);
        orbGlowScale.setValue(1.4);
        outerGlowOpacity.setValue(0.5);
        outerGlowScale.setValue(1.3);
        
        // Mouth appears
        Animated.timing(mouthOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        
        // Mouth talking animation
        mouthAnimRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(mouthOpen, { toValue: 1, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0.3, duration: 80, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0.8, duration: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0.1, duration: 90, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0.6, duration: 110, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(mouthOpen, { toValue: 0, duration: 100, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.delay(80),
          ])
        );
        mouthAnimRef.current.start();
        
        // Energetic bounce
        const talkBounce = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.15, duration: 120, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -14, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.94, duration: 100, easing: Easing.in(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 6, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.04, duration: 80, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 80, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.08, duration: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -6, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]),
          ])
        );
        
        const glowPulse = Animated.loop(
          Animated.sequence([
            Animated.timing(orbGlowScale, { toValue: 1.6, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(outerGlowOpacity, { toValue: 0.3, duration: 150, useNativeDriver: true }),
            Animated.timing(orbGlowScale, { toValue: 1.3, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(outerGlowOpacity, { toValue: 0.6, duration: 150, useNativeDriver: true }),
          ])
        );
        
        const ripple = createRippleAnimation();
        animRef.current = Animated.parallel([talkBounce, glowPulse, ripple]);
        animRef.current.start();
        break;
      }
      
      case 'error': {
        Animated.timing(orbGlowOpacity, { toValue: 0.8, duration: 100, useNativeDriver: true }).start();
        
        const shake = Animated.sequence([
          Animated.timing(shakeX, { toValue: 15, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -15, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 12, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -12, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]);
        
        const errorPulse = Animated.loop(
          Animated.sequence([
            Animated.timing(orbGlowScale, { toValue: 1.2, duration: 400, useNativeDriver: true }),
            Animated.timing(orbGlowScale, { toValue: 1, duration: 400, useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([shake, errorPulse]);
        animRef.current.start();
        break;
      }
    }
    
    return () => { animRef.current?.stop(); mouthAnimRef.current?.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Audio-reactive boost
  useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      const boost = 1 + audioLevel * 0.12;
      Animated.spring(scale, { 
        toValue: boost, 
        damping: 15,
        stiffness: 300,
        useNativeDriver: true 
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioLevel, state]);

  // Interpolations
  const tiltInterp = tilt.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '12deg'],
  });
  
  const rotateInterp = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} onPressOut={onPressOut} style={styles.container}>
      
      {/* Outer atmospheric glow */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            backgroundColor: colors.glow,
            transform: [{ scale: outerGlowScale }],
            opacity: outerGlowOpacity,
          },
        ]}
      />
      
      {/* Ripple rings */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <Animated.View style={[styles.ring, { borderColor: colors.ring, transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
          <Animated.View style={[styles.ring, { borderColor: colors.ring, transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
          <Animated.View style={[styles.ring, { borderColor: colors.ring, transform: [{ scale: ring3Scale }], opacity: ring3Opacity }]} />
        </>
      )}
      
      {/* Main glow behind orb */}
      <Animated.View
        style={[
          styles.mainGlow,
          {
            backgroundColor: colors.glow,
            transform: [{ scale: orbGlowScale }],
            opacity: orbGlowOpacity,
          },
        ]}
      />

      {/* Glass orb container */}
      <Animated.View
        style={[
          styles.orbContainer,
          {
            transform: [
              { scale },
              { translateY },
              { translateX: shakeX },
              { rotate: state === 'listening' ? tiltInterp : rotateInterp },
            ],
          },
        ]}
      >
        {/* Glass border ring */}
        <View style={[styles.glassBorder, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)' }]}>
          {/* Inner gradient fill */}
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.innerGradient}
          />
          
          {/* Frosted glass overlay */}
          <BlurView
            intensity={isDark ? 40 : 25}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurOverlay}
          />
          
          {/* Glass highlight (top-left shine) */}
          <View style={styles.glassHighlight} />
          
          {/* Mascot */}
          <Image
            source={require('../../assets/images/diva-logo.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
          
          {/* Animated mouth — appears when speaking */}
          {state === 'speaking' && (
            <Animated.View style={[styles.mouthContainer, { opacity: mouthOpacity }]}>
              <Animated.View
                style={[
                  styles.mouth,
                  {
                    transform: [{
                      scaleY: mouthOpen.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 1],
                      }),
                    }],
                  },
                ]}
              />
            </Animated.View>
          )}
        </View>
      </Animated.View>
      
      {/* Floating particles */}
      <Animated.View style={[
        styles.particle, styles.particle1,
        { backgroundColor: theme.cyan, opacity: particle1Opacity, transform: [{ translateY: particle1Y }] }
      ]} />
      <Animated.View style={[
        styles.particle, styles.particle2,
        { backgroundColor: theme.indigoLight, opacity: particle2Opacity, transform: [{ translateY: particle2Y }] }
      ]} />
      <Animated.View style={[
        styles.particle, styles.particle3,
        { backgroundColor: theme.violet, opacity: particle3Opacity, transform: [{ translateY: particle3Y }] }
      ]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: 320, 
    height: 320, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  
  // Outer atmospheric glow
  outerGlow: {
    position: 'absolute',
    width: OUTER_GLOW_SIZE,
    height: OUTER_GLOW_SIZE,
    borderRadius: OUTER_GLOW_SIZE / 2,
  },
  
  // Main glow
  mainGlow: { 
    position: 'absolute',
    width: ORB_SIZE + 40, 
    height: ORB_SIZE + 40, 
    borderRadius: (ORB_SIZE + 40) / 2,
  },
  
  // Ripple rings
  ring: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1.5,
  },
  
  // Glass orb
  orbContainer: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBorder: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  innerGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ORB_SIZE / 2,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ORB_SIZE / 2,
  },
  glassHighlight: {
    position: 'absolute',
    top: 12,
    left: 20,
    width: ORB_SIZE * 0.45,
    height: ORB_SIZE * 0.25,
    borderRadius: ORB_SIZE * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '-20deg' }],
  },
  
  // Mascot
  mascot: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
  
  // Mouth
  mouthContainer: {
    position: 'absolute',
    bottom: ORB_SIZE * 0.3,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mouth: {
    width: 14,
    height: 10,
    borderRadius: 7,
    backgroundColor: 'rgba(90, 50, 140, 0.65)',
  },
  
  // Floating particles
  particle: {
    position: 'absolute',
    borderRadius: 10,
  },
  particle1: {
    width: 5,
    height: 5,
    right: 60,
    bottom: 100,
  },
  particle2: {
    width: 4,
    height: 4,
    left: 55,
    bottom: 80,
  },
  particle3: {
    width: 3,
    height: 3,
    right: 80,
    bottom: 130,
  },
});
