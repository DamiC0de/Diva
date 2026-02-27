/**
 * EL-030 — Interactive Tutorial Overlay
 *
 * Shown on first launch after onboarding.
 * Highlights key UI elements with tooltips.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button } from './ui';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  title: string;
  description: string;
  emoji: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Bouton micro',
    description: 'Maintiens pour parler à Elio. Il écoute et répond par la voix.',
    emoji: '🎙️',
  },
  {
    title: 'Conversation',
    description: 'Tes échanges apparaissent ici. Elio se souvient de tout !',
    emoji: '💬',
  },
  {
    title: 'Texte aussi',
    description: 'Tu peux taper au lieu de parler. Comme tu préfères.',
    emoji: '⌨️',
  },
  {
    title: 'Services',
    description: 'Connecte Gmail, Calendar, Spotify... Elio les gère pour toi.',
    emoji: '🔗',
  },
  {
    title: 'Essaie !',
    description: 'Demande "Quel temps fait-il ?" ou "Lis mes mails" pour commencer.',
    emoji: '🚀',
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const currentStep = TUTORIAL_STEPS[step]!;

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
        <Text variant="caption" color={Colors.white}>Passer</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text variant="hero" style={styles.emoji}>{currentStep.emoji}</Text>
        <Text variant="heading" style={styles.title}>{currentStep.title}</Text>
        <Text variant="body" color={Colors.textLight} style={styles.desc}>
          {currentStep.description}
        </Text>

        <View style={styles.dotsRow}>
          {TUTORIAL_STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <Button
          title={step === TUTORIAL_STEPS.length - 1 ? 'C\'est parti !' : 'Suivant'}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

// Suggestion chips for after tutorial
export const SUGGESTION_CHIPS = [
  { label: '🌤️ Météo', text: 'Quel temps fait-il ?' },
  { label: '📧 Mails', text: 'Lis mes mails' },
  { label: '📅 Agenda', text: 'C\'est quoi mon programme ?' },
  { label: '⏰ Rappel', text: 'Rappelle-moi d\'acheter du pain à 18h' },
  { label: '🎵 Musique', text: 'Mets du jazz sur Spotify' },
];

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 32,
    alignItems: 'center',
    gap: 12,
    maxWidth: 340,
  },
  emoji: { fontSize: 48 },
  title: { textAlign: 'center' },
  desc: { textAlign: 'center', lineHeight: 22 },
  dotsRow: { flexDirection: 'row', gap: 6, marginVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
});
