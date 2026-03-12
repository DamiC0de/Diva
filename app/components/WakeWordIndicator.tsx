/**
 * WakeWordIndicator — Ambient listening state indicator
 *
 * Replaces the static "Appuie pour parler" hint with a living,
 * breathing indicator that shows when wake word detection is active.
 *
 * States:
 * - hidden: manual mode or not authenticated
 * - listening: ambient listening active, waiting for "Diva"
 * - detected: wake word just detected (brief flash before conversation starts)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Mic, MicOff, Waves } from 'lucide-react-native';
import { useTheme } from '../constants/theme';

interface WakeWordIndicatorProps {
  /** Is the ambient module actively listening? */
  isListening: boolean;
  /** Was wake word just detected? */
  isDetected?: boolean;
  /** Mode: always_on | smart | manual */
  mode?: string;
  /** Called when user taps the indicator (toggle mode or open settings) */
  onPress?: () => void;
}

export function WakeWordIndicator({
  isListening,
  isDetected = false,
  mode = 'smart',
  onPress,
}: WakeWordIndicatorProps) {
  const theme = useTheme();

  // Pulse animation for the outer ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  // Detected flash animation
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Breathing pulse while listening
  useEffect(() => {
    if (!isListening) {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.3);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.35,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isListening]);

  // Dot scale breathe
  useEffect(() => {
    if (!isListening) return;
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, { toValue: 1.12, duration: 1600, useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 0.92, duration: 1600, useNativeDriver: true }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [isListening]);

  // Flash on detection
  useEffect(() => {
    if (!isDetected) return;
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [isDetected]);

  if (mode === 'manual') {
    return (
      <View style={styles.manualContainer}>
        <Text style={[styles.manualHint, { color: theme.textMuted }]}>
          Appuie pour parler
        </Text>
      </View>
    );
  }

  const dotColor = isDetected
    ? theme.primary
    : isListening
    ? theme.teal ?? '#2DD4BF'
    : theme.textMuted;

  const labelText = isDetected
    ? 'Diva, je t\'écoute…'
    : isListening
    ? 'Dis « Diva » pour commencer'
    : 'Écoute désactivée';

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityLabel={labelText}
      accessibilityHint="Appuie pour modifier le mode d'écoute"
    >
      {/* Pulsing ring */}
      <View style={styles.ringWrapper}>
        {isListening && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: dotColor,
                transform: [{ scale: pulseAnim }],
                opacity: opacityAnim,
              },
            ]}
          />
        )}

        {/* Flash overlay on detection */}
        <Animated.View
          style={[
            styles.flashOverlay,
            { backgroundColor: theme.primary, opacity: flashAnim },
          ]}
        />

        {/* Core dot */}
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: dotColor,
              transform: [{ scale: dotScale }],
            },
          ]}
        >
          <Waves
            size={12}
            color={theme.background ?? '#0A0A0F'}
            strokeWidth={2.5}
          />
        </Animated.View>
      </View>

      {/* Label */}
      <Text
        style={[
          styles.label,
          {
            color: isDetected ? theme.primary : isListening ? theme.teal ?? '#2DD4BF' : theme.textMuted,
          },
        ]}
        numberOfLines={1}
      >
        {labelText}
      </Text>
    </Pressable>
  );
}

const DOT_SIZE = 28;
const RING_SIZE = DOT_SIZE + 20;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
  },
  flashOverlay: {
    position: 'absolute',
    width: DOT_SIZE + 4,
    height: DOT_SIZE + 4,
    borderRadius: (DOT_SIZE + 4) / 2,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  manualContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  manualHint: {
    fontSize: 14,
    fontWeight: '400',
  },
});
