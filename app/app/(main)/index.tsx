/**
 * EL-013 — Main Conversation Screen
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Screen, Text } from '../../components/ui';
import { MessageBubble } from '../../components/MessageBubble';
import { PTTButton } from '../../components/PTTButton';
import { Colors } from '../../constants/colors';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type PipelineState = 'ready' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

const STATE_LABELS: Record<PipelineState, string> = {
  ready: 'Prêt',
  listening: 'Écoute...',
  transcribing: 'Transcription...',
  thinking: 'Réflexion...',
  speaking: 'Parle...',
};

export default function ConversationScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pipelineState, setPipelineState] = useState<PipelineState>('ready');
  const [textInput, setTextInput] = useState('');
  const [pttState, setPttState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const flatListRef = useRef<FlatList>(null);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);

    // Auto-scroll
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handlePTTStart = useCallback(() => {
    setPttState('recording');
    setPipelineState('listening');
    // TODO: start audio recording (usePTT hook)
  }, []);

  const handlePTTEnd = useCallback(() => {
    setPttState('processing');
    setPipelineState('transcribing');

    // TODO: send audio to orchestrator, get response
    // Simulated for now
    setTimeout(() => {
      addMessage('user', '[Message vocal]');
      setPipelineState('thinking');

      setTimeout(() => {
        addMessage('assistant', 'Je suis Elio, ton assistant vocal ! Comment puis-je t\'aider ?');
        setPipelineState('ready');
        setPttState('idle');
      }, 1000);
    }, 500);
  }, [addMessage]);

  const handleSendText = useCallback(() => {
    if (!textInput.trim()) return;

    addMessage('user', textInput.trim());
    setTextInput('');
    setPipelineState('thinking');

    // TODO: send to orchestrator via WebSocket
    setTimeout(() => {
      addMessage('assistant', `Tu as dit : "${textInput.trim()}". Je suis encore en mode démo !`);
      setPipelineState('ready');
    }, 1000);
  }, [textInput, addMessage]);

  return (
    <Screen padded={false}>
      <View style={styles.container}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              role={item.role}
              content={item.content}
              timestamp={item.timestamp}
            />
          )}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="heading" color={Colors.primary} style={styles.emptyEmoji}>
                🌅
              </Text>
              <Text variant="subheading" style={styles.emptyTitle}>
                Salut !
              </Text>
              <Text variant="body" color={Colors.textLight} style={styles.emptyText}>
                Maintiens le bouton micro pour parler à Elio, ou tape ton message.
              </Text>
            </View>
          }
        />

        {/* Status bar */}
        <View style={styles.statusBar}>
          <View style={[
            styles.statusDot,
            pipelineState === 'ready' ? styles.statusGreen :
            pipelineState === 'listening' ? styles.statusRed :
            styles.statusOrange,
          ]} />
          <Text variant="caption">{STATE_LABELS[pipelineState]}</Text>
        </View>

        {/* PTT Button */}
        <PTTButton
          state={pttState}
          onPressIn={handlePTTStart}
          onPressOut={handlePTTEnd}
        />

        {/* Text input fallback */}
        <View style={styles.textInputArea}>
          <TextInput
            style={styles.textInput}
            placeholder="Ou tape ton message..."
            placeholderTextColor={Colors.textLight}
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={handleSendText}
            returnKeyType="send"
          />
          {textInput.trim().length > 0 && (
            <TouchableOpacity onPress={handleSendText} style={styles.sendButton}>
              <Text variant="body" color={Colors.white}>↑</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusGreen: {
    backgroundColor: Colors.success,
  },
  statusRed: {
    backgroundColor: Colors.error,
  },
  statusOrange: {
    backgroundColor: Colors.warning,
  },
  textInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
