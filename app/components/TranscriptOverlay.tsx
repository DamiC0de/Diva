/**
 * TranscriptOverlay — Ephemeral text overlay, theme-aware.
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
    if (text) {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [text]);

  if (!text) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.Text style={[
        styles.text,
        { color: role === 'assistant' ? theme.text : theme.textMuted },
        role === 'assistant' && styles.assistant,
      ]}>
        {role === 'user' ? `"${text}"` : text}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 28, paddingVertical: 12, alignItems: 'center' },
  text: { fontSize: 15, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
  assistant: { fontStyle: 'normal', fontWeight: '500', fontSize: 16 },
});
