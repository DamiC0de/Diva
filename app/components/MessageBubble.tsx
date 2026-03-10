import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ui';
import { useTheme } from '../constants/theme';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const theme = useTheme();
  const isUser = role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[
        styles.bubble,
        isUser
          ? { backgroundColor: theme.secondary, borderBottomRightRadius: 4 }
          : { backgroundColor: theme.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.border }
      ]}>
        <Text variant="body" color={isUser ? theme.white : theme.text}>
          {content}
        </Text>
      </View>
      {timestamp && (
        <Text variant="caption" style={{
          ...styles.time,
          ...(isUser ? styles.timeRight : {}),
        }}>
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
  time: {
    marginTop: 2,
    marginHorizontal: 4,
  },
  timeRight: {
    textAlign: 'right',
  },
});
