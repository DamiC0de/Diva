/**
 * DIVA — Voice-First Main Screen
 * 2026 Design: Luminous Intelligence palette, gradient backgrounds
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { BlurView } from 'expo-blur'; // Commented: may not work in Expo Go
import { OrbView } from '../../components/Orb/OrbView';
import { TranscriptOverlay } from '../../components/TranscriptOverlay';
import { ErrorOverlay } from '../../components/ErrorOverlay';
import { useVoiceSession } from '../../hooks/useVoiceSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const STATE_HINTS: Record<string, string> = {
  idle: 'Appuie pour parler',
  listening: 'Je t\'écoute...',
  processing: 'Je réfléchis...',
  speaking: '',
  error: 'Réessaie',
};

export default function OrbScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null>(null);
  const { isConnected: isNetworkConnected } = useNetworkStatus();
  const { settings, updateSetting } = useSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  const handleConversationModeChange = (enabled: boolean) => {
    updateSetting('voice', { ...settings.voice, conversationMode: enabled });
  };

  const {
    orbState,
    transcript,
    transcriptRole,
    audioLevel,
    toggleSession,
    cancel,
    isConnected: isWsConnected,
    error,
    clearError,
    isConversationActive,
  } = useVoiceSession({ 
    token, 
    isNetworkConnected,
    conversationMode: settings.voice.conversationMode,
    onConversationModeChange: handleConversationModeChange,
  });

  const isDark = theme.statusBar === 'light';

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={[theme.bgGradientStart, theme.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Safe area content */}
      <View style={[styles.content, { paddingTop: insets.top }]}>
        
        {/* Minimal header */}
        <View style={styles.header}>
          <Text style={[styles.brandText, { color: theme.text }]}>diva</Text>
          <View style={styles.headerActions}>
            <Pressable 
              onPress={() => router.push('/history')} 
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={styles.iconBtnText}>📜</Text>
            </Pressable>
            <Pressable 
              onPress={() => router.push('/settings')} 
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={styles.iconBtnText}>⚙️</Text>
            </Pressable>
          </View>
        </View>

        {/* Status badges */}
        {!isNetworkConnected && (
          <View style={[styles.badge, styles.badgeError]}>
            <Text style={styles.badgeText}>Hors ligne</Text>
          </View>
        )}
        {isConversationActive && isNetworkConnected && (
          <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>💬 Conversation</Text>
          </View>
        )}
        {!isWsConnected && isNetworkConnected && token && (
          <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>Connexion...</Text>
          </View>
        )}

        {/* Main orb area */}
        <View style={styles.orbContainer}>
          <OrbView
            state={orbState}
            audioLevel={audioLevel}
            onPress={toggleSession}
          />
        </View>

        {/* State hint */}
        <View style={styles.hintContainer}>
          {STATE_HINTS[orbState] ? (
            <Text style={[styles.hintText, { color: theme.textMuted }]}>
              {STATE_HINTS[orbState]}
            </Text>
          ) : null}
        </View>

        {/* Transcript area */}
        <View style={styles.transcriptContainer}>
          <TranscriptOverlay 
            text={transcript} 
            role={transcriptRole}
            isStreaming={orbState === 'speaking' && transcriptRole === 'assistant'}
          />
        </View>

        {/* Error overlay */}
        <ErrorOverlay
          error={error}
          onRetry={toggleSession}
          onDismiss={clearError}
        />

        <View style={{ height: insets.bottom + 16 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: 8,
    textTransform: 'lowercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBtnText: {
    fontSize: 18,
  },

  // Badges
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeError: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },

  // Orb
  orbContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  // Hint
  hintContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.3,
  },

  // Transcript
  transcriptContainer: {
    minHeight: 100,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
