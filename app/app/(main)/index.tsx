/**
 * Elio — Voice-First Main Screen (The Orb)
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrbView } from '../../components/Orb/OrbView';
import { TranscriptOverlay } from '../../components/TranscriptOverlay';
import { useVoiceSession } from '../../hooks/useVoiceSession';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

const STATE_HINTS: Record<string, string> = {
  idle: 'Appuie pour parler',
  listening: 'Je t\'écoute...',
  processing: 'Je réfléchis...',
  speaking: 'Je parle...',
  error: 'Oups, réessaye',
};

export default function OrbScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  const {
    orbState,
    transcript,
    transcriptRole,
    audioLevel,
    startListening,
    stopListening,
    cancel,
    isConnected,
  } = useVoiceSession({ token });

  const handleOrbPress = () => {
    if (orbState === 'idle') {
      startListening();
    } else if (orbState === 'listening') {
      stopListening();
    } else if (orbState === 'speaking') {
      cancel();
    }
  };

  const handleOrbLongPress = () => {
    startListening();
  };

  const handleOrbPressOut = () => {
    // If in long-press listening mode, stop on release
    // (only if we were listening)
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Elio</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={20}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* Connection status */}
      {!isConnected && token && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>❌ Déconnecté</Text>
        </View>
      )}

      {/* Orb area */}
      <View style={styles.orbArea}>
        <OrbView
          state={orbState}
          audioLevel={audioLevel}
          onPress={handleOrbPress}
          onLongPress={handleOrbLongPress}
          onPressOut={handleOrbPressOut}
        />
      </View>

      {/* State hint */}
      <Text style={styles.hint}>{STATE_HINTS[orbState]}</Text>

      {/* Transcript overlay */}
      <View style={styles.transcriptArea}>
        <TranscriptOverlay text={transcript} role={transcriptRole} />
      </View>

      {/* Bottom spacer */}
      <View style={{ height: insets.bottom + 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  settingsIcon: {
    fontSize: 24,
  },
  statusBar: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  orbArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 8,
  },
  transcriptArea: {
    minHeight: 80,
    justifyContent: 'center',
  },
});
