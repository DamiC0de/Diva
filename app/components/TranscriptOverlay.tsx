/**
 * TranscriptOverlay — Shows user speech only (voice-first: assistant is heard, not read)
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useTheme } from '../constants/theme';

interface TranscriptOverlayProps {
  text: string | null;
  role?: 'user' | 'assistant';
}

export function TranscriptOverlay({ text, role = 'user' }: TranscriptOverlayProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (text && role === 'user') {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [text, role]);

  // Voice-first: only show what the user said, not the assistant response
  if (!text || role === 'assistant') return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.Text style={[styles.text, { color: theme.textMuted }]}>
        {`"${text}"`}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 28, paddingVertical: 12, alignItems: 'center' },
  text: { fontSize: 15, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
});
