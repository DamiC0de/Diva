/**
 * TypingText — Typing animation component with blinking cursor
 * US-027: Progressive text reveal for transcript display
 */
import React, { useState, useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../constants/theme';

interface TypingTextProps {
  text: string;
  speed?: number; // ms per character
  style?: StyleProp<TextStyle>;
  showCursor?: boolean;
  onComplete?: () => void;
}

export function TypingText({ 
  text, 
  speed = 20, 
  style,
  showCursor = true,
  onComplete,
}: TypingTextProps) {
  const theme = useTheme();
  const [displayedText, setDisplayedText] = useState('');
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const previousText = useRef('');
  
  // Blinking cursor animation
  useEffect(() => {
    if (!showCursor) return;
    
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { 
          toValue: 0, 
          duration: 400, 
          useNativeDriver: true 
        }),
        Animated.timing(cursorOpacity, { 
          toValue: 1, 
          duration: 400, 
          useNativeDriver: true 
        }),
      ])
    );
    blink.start();
    
    return () => blink.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Animation ref is stable
  }, [showCursor]);
  
  // Typing effect
  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      previousText.current = '';
      return;
    }
    
    // If new text is an extension of previous, continue from where we were
    const startFrom = text.startsWith(previousText.current) 
      ? previousText.current.length 
      : 0;
    
    if (startFrom === 0) {
      setDisplayedText('');
    }
    
    let index = startFrom;
    
    // If speed is 0, show instantly
    if (speed === 0) {
      setDisplayedText(text);
      previousText.current = text;
      onComplete?.();
      return;
    }
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        previousText.current = text;
        onComplete?.();
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);
  
  const isTyping = displayedText.length < text.length;
  
  return (
    <Text style={style}>
      {displayedText}
      {showCursor && isTyping && (
        <Animated.Text 
          style={[
            styles.cursor, 
            { color: theme.primary, opacity: cursorOpacity }
          ]}
        >
          │
        </Animated.Text>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  cursor: {
    fontWeight: '300',
  },
});
