/**
 * TranscriptOverlay — Ephemeral transcription text that fades after 3s
 */
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

interface TranscriptOverlayProps {
  text: string | null;
  role?: 'user' | 'assistant';
}

export function TranscriptOverlay({ text, role = 'user' }: TranscriptOverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (text) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(3000, withTiming(0, { duration: 500 })),
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [text]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!text) return null;

  return (
    <Animated.View style={[styles.container, style]}>
      <Animated.Text style={[styles.text, role === 'assistant' && styles.assistantText]}>
        {role === 'user' ? `"${text}"` : text}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  assistantText: {
    color: Colors.text,
    fontStyle: 'normal',
    fontWeight: '500',
  },
});
