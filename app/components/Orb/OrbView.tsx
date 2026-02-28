/**
 * OrbView — Animated orb that reacts to voice state.
 * States: idle | listening | processing | speaking | error
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  cancelAnimation,
  interpolateColor,
} from 'react-native-reanimated';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface OrbViewProps {
  state: OrbState;
  audioLevel?: number; // 0-1, from mic input
  onPress?: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
}

const COLORS = {
  idle: '#FF8C42',
  listening: '#FF8C42',
  processing: '#2A7B8B',
  speaking: '#FF8C42',
  error: '#DC2626',
};

const BASE_SIZE = 160;

export function OrbView({ state, audioLevel = 0, onPress, onLongPress, onPressOut }: OrbViewProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);
  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    // Cancel previous animations
    cancelAnimation(scale);
    cancelAnimation(opacity);
    cancelAnimation(rotation);
    cancelAnimation(glowScale);

    switch (state) {
      case 'idle':
        // Gentle breathing pulse
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
        opacity.value = withTiming(0.4, { duration: 500 });
        rotation.value = 0;
        glowScale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 2000 }),
            withTiming(1.1, { duration: 2000 }),
          ),
          -1,
          true,
        );
        colorProgress.value = withTiming(0, { duration: 300 });
        break;

      case 'listening':
        // Scale reacts to audio level
        scale.value = withSpring(1.2 + audioLevel * 0.3, { damping: 8 });
        opacity.value = withTiming(1, { duration: 200 });
        glowScale.value = withSpring(1.5 + audioLevel * 0.5);
        colorProgress.value = withTiming(0, { duration: 300 });
        break;

      case 'processing':
        // Rotating shimmer
        scale.value = withTiming(1.1, { duration: 300 });
        opacity.value = withTiming(0.9, { duration: 300 });
        rotation.value = withRepeat(
          withTiming(360, { duration: 3000, easing: Easing.linear }),
          -1,
        );
        glowScale.value = withRepeat(
          withSequence(
            withTiming(1.4, { duration: 500 }),
            withTiming(1.2, { duration: 500 }),
          ),
          -1,
          true,
        );
        colorProgress.value = withTiming(1, { duration: 300 });
        break;

      case 'speaking':
        // Pulse with TTS rhythm
        scale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.05, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
        opacity.value = withTiming(1, { duration: 200 });
        glowScale.value = withRepeat(
          withSequence(
            withTiming(1.6, { duration: 300 }),
            withTiming(1.3, { duration: 300 }),
          ),
          -1,
          true,
        );
        colorProgress.value = withTiming(0, { duration: 300 });
        break;

      case 'error':
        // Quick shake + red flash
        scale.value = withSequence(
          withTiming(1.2, { duration: 100 }),
          withTiming(0.9, { duration: 100 }),
          withTiming(1, { duration: 200 }),
        );
        opacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0.4, { duration: 500 }),
        );
        colorProgress.value = withTiming(2, { duration: 100 });
        break;
    }
  }, [state, audioLevel]);

  // Update listening scale reactively with audio level
  useEffect(() => {
    if (state === 'listening') {
      scale.value = withSpring(1.2 + audioLevel * 0.3, { damping: 8, stiffness: 150 });
      glowScale.value = withSpring(1.5 + audioLevel * 0.5);
    }
  }, [audioLevel, state]);

  const orbStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      colorProgress.value,
      [0, 1, 2],
      [COLORS.idle, COLORS.processing, COLORS.error],
    );

    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
      backgroundColor: bgColor,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      colorProgress.value,
      [0, 1, 2],
      [COLORS.idle, COLORS.processing, COLORS.error],
    );

    return {
      transform: [{ scale: glowScale.value }],
      backgroundColor: bgColor,
      opacity: opacity.value * 0.2,
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      style={styles.container}
    >
      {/* Glow layer */}
      <Animated.View style={[styles.glow, glowStyle]} />
      {/* Main orb */}
      <Animated.View style={[styles.orb, orbStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BASE_SIZE * 2,
    height: BASE_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orb: {
    width: BASE_SIZE,
    height: BASE_SIZE,
    borderRadius: BASE_SIZE / 2,
    position: 'absolute',
  },
  glow: {
    width: BASE_SIZE,
    height: BASE_SIZE,
    borderRadius: BASE_SIZE / 2,
    position: 'absolute',
  },
});
