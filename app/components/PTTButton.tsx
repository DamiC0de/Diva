import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './ui';
import { Colors } from '../constants/colors';

type PTTState = 'idle' | 'recording' | 'processing';

interface PTTButtonProps {
  state: PTTState;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function PTTButton({ state, onPressIn, onPressOut }: PTTButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scaleAnim, {
      toValue: 1.15,
      useNativeDriver: true,
    }).start();
    onPressIn();
  };

  const handlePressOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPressOut();
  };

  const buttonColor =
    state === 'recording' ? Colors.error :
    state === 'processing' ? Colors.textLight :
    Colors.primary;

  const label =
    state === 'recording' ? '🎙️ Écoute...' :
    state === 'processing' ? '⏳ Traitement...' :
    '🎙️ Maintenir pour parler';

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={state === 'processing'}
          style={[styles.button, { backgroundColor: buttonColor }]}
        >
          <Text variant="subheading" color={Colors.white}>
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  button: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});
