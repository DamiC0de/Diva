/**
 * EyeBlink — Subtle eyelid overlay that blinks every 3-5 seconds
 * Positioned over the mascot's eyes to create a "living" feeling
 */
import React, { useEffect, useRef, memo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface EyeBlinkProps {
  mascotSize: number;
  orbSize: number;
  /** listening = wider eyes (surprise), speaking = normal blink */
  state?: 'idle' | 'listening' | 'speaking';
}

export const EyeBlink = memo(function EyeBlink({ 
  mascotSize, orbSize, state = 'idle' 
}: EyeBlinkProps) {
  const blinkAnim = useRef(new Animated.Value(0)).current; // 0 = open, 1 = closed
  const eyeScale = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current?.stop();

    if (state === 'listening') {
      // Eyes widen slightly when listening (surprise/attention)
      Animated.spring(eyeScale, {
        toValue: 1.15,
        damping: 12,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(eyeScale, {
        toValue: 1,
        damping: 12,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }

    // Random blink cycle
    const doBlink = () => {
      const nextBlinkDelay = 2500 + Math.random() * 3000; // 2.5-5.5 seconds
      const isDoubleBlink = Math.random() > 0.7; // 30% chance of double blink

      const singleBlink = Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 1, duration: 80, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 0, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]);

      const blinkSequence = isDoubleBlink
        ? Animated.sequence([singleBlink, Animated.delay(100), singleBlink])
        : singleBlink;

      animRef.current = Animated.sequence([
        Animated.delay(nextBlinkDelay),
        blinkSequence,
      ]);

      animRef.current.start(({ finished }) => {
        if (finished) doBlink(); // Schedule next blink
      });
    };

    doBlink();

    return () => { animRef.current?.stop(); };
  }, [state]);

  // Position: eyes are at ~38% from top of mascot
  const mascotTop = (orbSize - mascotSize) / 2;
  const eyeY = mascotTop + mascotSize * 0.36;
  // Eyelids span across both eyes
  const eyeAreaWidth = mascotSize * 0.55;
  const eyeAreaLeft = (orbSize - eyeAreaWidth) / 2 - 2; // Slightly left to match mascot

  return (
    <Animated.View
      style={[
        styles.eyeOverlay,
        {
          top: eyeY,
          left: eyeAreaLeft,
          width: eyeAreaWidth,
          height: mascotSize * 0.12,
          transform: [{ scaleY: eyeScale }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Left eyelid */}
      <Animated.View
        style={[
          styles.eyelid,
          {
            left: '8%',
            width: mascotSize * 0.16,
            height: mascotSize * 0.10,
            transform: [{
              scaleY: blinkAnim, // 0 = invisible (open), 1 = full height (closed)
            }],
            backgroundColor: 'rgba(30, 20, 60, 0.85)',
            borderRadius: mascotSize * 0.08,
          },
        ]}
      />
      {/* Right eyelid */}
      <Animated.View
        style={[
          styles.eyelid,
          {
            right: '8%',
            width: mascotSize * 0.16,
            height: mascotSize * 0.10,
            transform: [{
              scaleY: blinkAnim,
            }],
            backgroundColor: 'rgba(30, 20, 60, 0.85)',
            borderRadius: mascotSize * 0.08,
          },
        ]}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  eyeOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyelid: {
    position: 'absolute',
  },
});
