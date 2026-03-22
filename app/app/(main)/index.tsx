/**
 * DIVA — Main Screen with Mascot Orb
 * 2026 Design: Dark-first, Lucide icons, mascot-centered
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, History, Wifi, WifiOff, MessageCircle, StopCircle } from 'lucide-react-native';
import { OrbView } from '../../components/Orb/OrbView';
import { TranscriptOverlay } from '../../components/TranscriptOverlay';
import { ErrorOverlay } from '../../components/ErrorOverlay';
import { useVoiceSession } from '../../hooks/useVoiceSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSettings } from '../../hooks/useSettings';
import { useDivaAmbient } from '../../modules/diva-ambient';
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
    // cancel available for future use
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

  // Diva Ambient Mode — native background wake word detection
  const handleWakeWord = useCallback(() => {
    if (orbState === 'idle') {
      console.log('[DivaAmbient] Wake word detected! Starting voice session...');
      toggleSession();
    }
  }, [orbState, toggleSession]);

  const { isListening: isAmbientListening, state: ambientState } = useDivaAmbient({
    onWakeWordDetected: handleWakeWord,
    autoStart: settings.voice.wake_word_mode !== 'manual' && !!token,
    paused: orbState !== 'idle',
  });

  // Widget deep link: auto-start listening when launched via diva:///?widget=true
  const widgetAutoStarted = useRef(false);
  useEffect(() => {
    if (!token) return;

    const handleUrl = (url: string | null) => {
      if (!url || !url.includes('widget=true')) return;
      // For cold start, only trigger once
      // For warm start (addEventListener), always trigger
      const tryToggle = (attempt: number) => {
        if (attempt > 8) return;
        if (orbState === 'idle') {
          toggleSession();
        } else {
          setTimeout(() => tryToggle(attempt + 1), 600);
        }
      };
      setTimeout(() => tryToggle(1), 1000);
    };

    // Cold start — only once
    if (!widgetAutoStarted.current) {
      widgetAutoStarted.current = true;
      Linking.getInitialURL().then(handleUrl);
    }

    // Warm start — always listen
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, [token, orbState, toggleSession]);

  const isDark = theme.statusBar === 'light';

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={isDark 
          ? [theme.bgGradientStart, theme.bgGradientEnd, '#0D0D18']
          : [theme.bgGradientStart, theme.bgGradientEnd]
        }
        style={StyleSheet.absoluteFill}
        locations={isDark ? [0, 0.5, 1] : [0, 1]}
      />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.brandText, { color: theme.text }]}>diva</Text>
          <View style={styles.headerActions}>
            <Pressable 
              onPress={() => router.push('/history')} 
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconBtn,
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  opacity: pressed ? 0.6 : 1 
                }
              ]}
            >
              <History size={20} color={theme.textSecondary} strokeWidth={1.5} />
            </Pressable>
            <Pressable 
              onPress={() => router.push('/settings')} 
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconBtn,
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  opacity: pressed ? 0.6 : 1 
                }
              ]}
            >
              <Settings size={20} color={theme.textSecondary} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>

        {/* Status indicators */}
        <View style={styles.statusRow}>
          {!isNetworkConnected && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
              <WifiOff size={14} color={theme.error} strokeWidth={2} />
              <Text style={[styles.statusText, { color: theme.error }]}>Hors ligne</Text>
            </View>
          )}
          {isConversationActive && isNetworkConnected && (
            <View style={[styles.statusBadge, { backgroundColor: theme.primarySoft }]}>
              <MessageCircle size={14} color={theme.primary} strokeWidth={2} />
              <Text style={[styles.statusText, { color: theme.primary }]}>Conversation</Text>
            </View>
          )}
          {!isWsConnected && isNetworkConnected && token && (
            <View style={[styles.statusBadge, { backgroundColor: theme.primarySoft }]}>
              <Wifi size={14} color={theme.primary} strokeWidth={2} />
              <Text style={[styles.statusText, { color: theme.primary }]}>Connexion...</Text>
            </View>
          )}
        </View>

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

        {/* Stop button (only when session active) */}
        {orbState !== 'idle' && (
          <View style={styles.stopContainer}>
            <Pressable
              onPress={toggleSession}
              style={({ pressed }) => [
                styles.stopButton,
                { backgroundColor: pressed ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)' },
              ]}
            >
              <StopCircle size={18} color="#EF4444" strokeWidth={2} />
              <Text style={styles.stopButtonText}>Arrêter</Text>
            </Pressable>
          </View>
        )}

        {/* Transcript (hidden when no text) */}
        {transcript ? (
          <View style={styles.transcriptContainer}>
            <TranscriptOverlay 
              text={transcript} 
              role={transcriptRole}
              isStreaming={orbState === 'speaking' && transcriptRole === 'assistant'}
            />
          </View>
        ) : null}

        {/* Error overlay */}
        <ErrorOverlay
          error={error}
          onRetry={toggleSession}
          onDismiss={clearError}
        />

        <View style={{ height: insets.bottom + 20 }} />
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Orb
  orbContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hint
  hintContainer: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  stopContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  stopButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },

  // Transcript
  transcriptContainer: {
    minHeight: 100,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
