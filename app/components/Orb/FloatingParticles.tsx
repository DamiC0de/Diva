/**
 * FloatingParticles — Animated firefly-like dots orbiting around the mascot
 * Each particle floats independently with its own speed, path, and fade cycle
 */
import React, { useEffect, useRef, memo } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

interface Particle {
  x: number; // Start position (% from left)
  y: number; // Start position (% from top)
  size: number;
  color: string;
  driftX: number; // How far it drifts horizontally
  driftY: number; // How far it drifts vertically
  duration: number; // Full cycle duration
  delay: number; // Start delay
}

interface FloatingParticlesProps {
  size: number; // Container size (ORB_SIZE)
  colors: { cyan: string; violet: string; indigoLight: string };
  intensity?: 'idle' | 'active'; // idle = calm, active = more vivid
}

const PARTICLES: Particle[] = [
  { x: 18, y: 15, size: 5, color: 'cyan', driftX: 12, driftY: -18, duration: 4000, delay: 0 },
  { x: 78, y: 22, size: 4, color: 'cyan', driftX: -10, driftY: -14, duration: 3500, delay: 600 },
  { x: 15, y: 72, size: 5, color: 'indigoLight', driftX: 14, driftY: -20, duration: 4500, delay: 1200 },
  { x: 80, y: 68, size: 4, color: 'violet', driftX: -12, driftY: -16, duration: 3800, delay: 400 },
  { x: 50, y: 10, size: 3, color: 'cyan', driftX: 8, driftY: -12, duration: 5000, delay: 800 },
  { x: 25, y: 45, size: 4, color: 'violet', driftX: 16, driftY: -10, duration: 4200, delay: 1500 },
];

export const FloatingParticles = memo(function FloatingParticles({ 
  size, colors, intensity = 'idle' 
}: FloatingParticlesProps) {
  const anims = useRef(
    PARTICLES.map(() => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  useEffect(() => {
    const animations = PARTICLES.map((p, i) => {
      const a = anims[i];
      const maxOpacity = intensity === 'active' ? 0.9 : 0.6;

      return Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          // Fade in + start drifting
          Animated.parallel([
            Animated.timing(a.opacity, { toValue: maxOpacity, duration: p.duration * 0.2, useNativeDriver: true }),
            Animated.timing(a.scale, { toValue: 1, duration: p.duration * 0.3, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(a.translateX, { toValue: p.driftX, duration: p.duration * 0.5, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(a.translateY, { toValue: p.driftY, duration: p.duration * 0.5, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
          // Continue drifting + fade out
          Animated.parallel([
            Animated.timing(a.opacity, { toValue: 0, duration: p.duration * 0.3, useNativeDriver: true }),
            Animated.timing(a.scale, { toValue: 0.3, duration: p.duration * 0.3, useNativeDriver: true }),
            Animated.timing(a.translateX, { toValue: p.driftX * 1.5, duration: p.duration * 0.3, useNativeDriver: true }),
            Animated.timing(a.translateY, { toValue: p.driftY * 1.5, duration: p.duration * 0.3, useNativeDriver: true }),
          ]),
          // Reset position (invisible)
          Animated.parallel([
            Animated.timing(a.translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(a.translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(a.scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
          // Brief pause before next cycle
          Animated.delay(p.duration * 0.2),
        ])
      );
    });

    const composite = Animated.parallel(animations);
    composite.start();

    return () => composite.stop();
  }, [intensity]);

  return (
    <>
      {PARTICLES.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: colors[p.color as keyof typeof colors] || colors.cyan,
              transform: [
                { translateX: anims[i].translateX },
                { translateY: anims[i].translateY },
                { scale: anims[i].scale },
              ],
              opacity: anims[i].opacity,
            },
          ]}
        />
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
