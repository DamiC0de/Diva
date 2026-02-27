import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ui';
import { Colors } from '../constants/colors';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text variant="body" color={isUser ? Colors.white : Colors.text}>
          {content}
        </Text>
      </View>
      {timestamp && (
        <Text variant="caption" style={[styles.time, isUser && styles.timeRight]}>
          {timestamp}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  time: {
    marginTop: 2,
    marginHorizontal: 4,
  },
  timeRight: {
    textAlign: 'right',
  },
});
