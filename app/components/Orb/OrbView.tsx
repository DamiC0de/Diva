/**
 * OrbView — Expressive mascot with advanced animations
 * 2026 Design: Living mascot that listens and speaks
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Animated, Pressable, Easing, Image, View } from 'react-native';
import { useTheme } from '../../constants/theme';
import { GlassSphere } from './GlassSphere';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface OrbViewProps {
  state: OrbState;
  audioLevel?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
}

const MASCOT_SIZE = 130;
const ORB_SIZE = 200;
const RING_BASE_SIZE = ORB_SIZE;

export function OrbView({ state, audioLevel = 0, onPress, onLongPress, onPressOut }: OrbViewProps) {
  const theme = useTheme();
  
  // Core animations
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current; // For "listening" lean
  
  // Glow animations
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  
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
  
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const mouthAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Debug: log state changes
  useEffect(() => {
    console.log('[OrbView] State changed to:', state);
  }, [state]);

  // State-based colors
  const stateColors = useMemo(() => ({
    idle: { glow: theme.indigo, ring: theme.indigoLight },
    listening: { glow: theme.cyan, ring: '#7DD3E8' },
    processing: { glow: theme.indigoLight, ring: theme.cyan },
    speaking: { glow: theme.violet, ring: theme.indigo },
    error: { glow: theme.error, ring: '#FF6B6B' },
  }), [theme]);

  const colors = stateColors[state];

  // Reset all animations with smooth transition
  const resetAnimations = () => {
    animRef.current?.stop();
    mouthAnimRef.current?.stop();
    [scale, translateY, rotate, tilt, glowOpacity, glowScale, 
     ring1Scale, ring1Opacity, ring2Scale, ring2Opacity, ring3Scale, ring3Opacity, shakeX,
     mouthOpen, mouthOpacity]
      .forEach(anim => anim.stopAnimation());
    
    // Reset ALL values to neutral
    scale.setValue(1);
    translateY.setValue(0);
    shakeX.setValue(0);
    rotate.setValue(0);
    tilt.setValue(0);
    glowScale.setValue(1);
    glowOpacity.setValue(0.4);
    ring1Opacity.setValue(0);
    ring2Opacity.setValue(0);
    ring3Opacity.setValue(0);
    mouthOpen.setValue(0);
    mouthOpacity.setValue(0);
  };

  // Ripple ring animation (for listening/speaking)
  const createRippleAnimation = () => {
    const rippleDuration = state === 'listening' ? 1500 : 1000;
    
    return Animated.loop(
      Animated.stagger(rippleDuration / 3, [
        // Ring 1
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(ring1Scale, { toValue: 1.8, duration: rippleDuration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(ring1Opacity, { toValue: 0, duration: rippleDuration, useNativeDriver: true }),
            ]),
          ]),
        ]),
        // Ring 2
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring2Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0.5, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(ring2Scale, { toValue: 1.8, duration: rippleDuration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(ring2Opacity, { toValue: 0, duration: rippleDuration, useNativeDriver: true }),
            ]),
          ]),
        ]),
        // Ring 3
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring3Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring3Opacity, { toValue: 0.4, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(ring3Scale, { toValue: 1.8, duration: rippleDuration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
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
        // Set initial values to avoid jumps
        scale.setValue(1);
        translateY.setValue(0);
        glowOpacity.setValue(0.4);
        glowScale.setValue(1);
        
        // Smooth breathing cycle: neutral → up → neutral → down → neutral
        const breathe = Animated.loop(
          Animated.sequence([
            // Float up
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.06, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -10, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(glowOpacity, { toValue: 0.55, duration: 1500, useNativeDriver: true }),
            ]),
            // Return to center
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(glowOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
            ]),
            // Float down
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.96, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 8, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(glowOpacity, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
            ]),
            // Return to center (ready to loop)
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(glowOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
            ]),
          ])
        );
        
        const glowPulse = Animated.loop(
          Animated.sequence([
            Animated.timing(glowScale, { toValue: 1.25, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([breathe, glowPulse]);
        animRef.current.start();
        break;
      }
      
      case 'listening': {
        // Strong tilt + ripple rings + visible pulse
        Animated.timing(tilt, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 200, useNativeDriver: true }).start();
        Animated.timing(glowScale, { toValue: 1.4, duration: 300, useNativeDriver: true }).start();
        
        const attentivePulse = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.12, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -8, duration: 400, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.95, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 8, duration: 400, useNativeDriver: true }),
            ]),
          ])
        );
        
        const ripple = createRippleAnimation();
        
        animRef.current = Animated.parallel([attentivePulse, ripple]);
        animRef.current.start();
        break;
      }
      
      case 'processing': {
        console.log('[OrbView] Starting PROCESSING animation');
        // Set initial values to avoid jumps
        scale.setValue(1);
        translateY.setValue(0);
        glowScale.setValue(1.2);
        glowOpacity.setValue(0.7);
        
        // Simple breathing animation - no sudden jumps
        const breathe = Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { 
              toValue: 1.1, 
              duration: 800, 
              easing: Easing.bezier(0.4, 0, 0.2, 1), // Material ease
              useNativeDriver: true 
            }),
            Animated.timing(scale, { 
              toValue: 1, 
              duration: 800, 
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true 
            }),
          ])
        );
        
        const glowBreath = Animated.loop(
          Animated.sequence([
            Animated.timing(glowScale, { toValue: 1.4, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1.1, duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([breathe, glowBreath]);
        animRef.current.start();
        break;
      }
      
      case 'speaking': {
        console.log('[OrbView] Starting SPEAKING animation');
        // Set initial values
        scale.setValue(1);
        translateY.setValue(0);
        glowOpacity.setValue(1);
        glowScale.setValue(1.6);
        
        // Mouth animation
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
        
        // Energetic "talking" bounce - like the mascot is speaking with enthusiasm
        const talkBounce = Animated.loop(
          Animated.sequence([
            // Quick bounce up
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.18, duration: 120, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -18, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            ]),
            // Squash down
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.92, duration: 100, easing: Easing.in(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 8, duration: 100, useNativeDriver: true }),
            ]),
            // Settle
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.05, duration: 80, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 80, useNativeDriver: true }),
            ]),
            // Small bounce
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.1, duration: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(translateY, { toValue: -8, duration: 100, useNativeDriver: true }),
            ]),
            // Return
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]),
          ])
        );
        
        // Intense glow pulsing
        const glowPulse = Animated.loop(
          Animated.sequence([
            Animated.timing(glowScale, { toValue: 1.9, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.7, duration: 150, useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1.4, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ])
        );
        
        const ripple = createRippleAnimation();
        
        animRef.current = Animated.parallel([talkBounce, glowPulse, ripple]);
        animRef.current.start();
        break;
      }
      
      case 'error': {
        // Shake + red glow
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 100, useNativeDriver: true }).start();
        
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
            Animated.timing(glowScale, { toValue: 1.2, duration: 400, useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 1, duration: 400, useNativeDriver: true }),
          ])
        );
        
        animRef.current = Animated.parallel([shake, errorPulse]);
        animRef.current.start();
        break;
      }
    }
    
    return () => { animRef.current?.stop(); mouthAnimRef.current?.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Animation refs are stable, only re-run on state change
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Animation ref is stable
  }, [audioLevel, state]);

  // Interpolations
  const tiltInterp = tilt.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'], // Visible tilt when listening
  });
  
  const rotateInterp = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} onPressOut={onPressOut} style={styles.container}>
      {/* Ripple rings */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <Animated.View
            style={[
              styles.ring,
              {
                borderColor: colors.ring,
                transform: [{ scale: ring1Scale }],
                opacity: ring1Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                borderColor: colors.ring,
                transform: [{ scale: ring2Scale }],
                opacity: ring2Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                borderColor: colors.ring,
                transform: [{ scale: ring3Scale }],
                opacity: ring3Opacity,
              },
            ]}
          />
        </>
      )}
      
      {/* Soft glow behind the sphere */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.glow,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Glass sphere + Mascot — move together */}
      <Animated.View
        style={[
          styles.orbWrapper,
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
        {/* SVG Glass sphere */}
        <GlassSphere 
          size={ORB_SIZE} 
          showRipples={state === 'speaking' || state === 'listening'}
          rippleColor={state === 'listening' ? 'rgba(125,211,232,0.2)' : 'rgba(150,150,220,0.15)'}
        />
        
        {/* Mascot */}
        <Image
          source={require('../../assets/images/diva-logo.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        
        {/* Floating particles */}
        <View style={[styles.particle, { top: '18%', right: '22%', backgroundColor: theme.cyan }]} />
        <View style={[styles.particle, { bottom: '25%', left: '18%', backgroundColor: theme.indigoLight, width: 5, height: 5 }]} />
        <View style={[styles.particle, { top: '30%', left: '20%', backgroundColor: theme.cyan, width: 4, height: 4 }]} />
        <View style={[styles.particle, { bottom: '20%', right: '25%', backgroundColor: theme.violet, width: 5, height: 5 }]} />
        
        {/* Animated mouth — speaking */}
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
  glow: { 
    position: 'absolute',
    width: ORB_SIZE * 1.3, 
    height: ORB_SIZE * 1.3, 
    borderRadius: ORB_SIZE * 0.65,
  },
  ring: {
    position: 'absolute',
    width: RING_BASE_SIZE,
    height: RING_BASE_SIZE,
    borderRadius: RING_BASE_SIZE / 2,
    borderWidth: 1.5,
  },
  orbWrapper: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascot: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
  },
  mouthWrap: {
    position: 'absolute',
    // Mascot 130px centered in 200px orbWrapper → mascot top = 35px
    // Mouth at 53% from mascot top (between eyes ~40% and body ~60%)
    // 35 + (130 * 0.53) = 35 + 69 = 104px from orbWrapper top
    top: (ORB_SIZE - MASCOT_SIZE) / 2 + MASCOT_SIZE * 0.53,
    // Slightly left of center (mascot body curves left)
    left: (ORB_SIZE - MASCOT_SIZE) / 2 + MASCOT_SIZE * 0.47,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mouth: {
    width: 12,
    height: 9,
    borderRadius: 6,
    backgroundColor: 'rgba(80, 40, 130, 0.55)',
  },
});
