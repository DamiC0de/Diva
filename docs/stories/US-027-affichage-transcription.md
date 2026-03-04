# US-027 : Affichage texte transcrit

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-027 |
| **Épique** | E5 — Orb UI |
| **Sprint** | Sprint 4 |
| **Estimation** | 2 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Existing (amélioration) |

---

## Description

**En tant qu'** utilisateur
**Je veux** voir ce que Diva a compris de ma voix
**Afin de** vérifier la transcription

---

## Contexte actuel

L'app a déjà un `TranscriptOverlay` qui affiche le texte. Cette story améliore l'UX.

---

## Critères d'acceptation

- [ ] **AC-001** : Texte apparaît progressivement (streaming)
- [ ] **AC-002** : Animation de typing
- [ ] **AC-003** : Police lisible, contraste suffisant
- [ ] **AC-004** : Disparition après transition vers réponse
- [ ] **AC-005** : Scroll si texte long

---

## Tâches de développement

### T1 : Typing animation (1h)

```typescript
// app/components/TypingText.tsx
import React, { useState, useEffect } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';

interface TypingTextProps {
  text: string;
  speed?: number; // ms par caractère
  style?: any;
}

export function TypingText({ text, speed = 20, style }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }
    
    let index = 0;
    setDisplayedText('');
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return (
    <Text style={style}>
      {displayedText}
      {displayedText.length < text.length && (
        <Text style={styles.cursor}>|</Text>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  cursor: {
    opacity: 0.5,
  },
});
```

### T2 : TranscriptOverlay amélioré (1h)

```typescript
// app/components/TranscriptOverlay.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../constants/theme';
import { TypingText } from './TypingText';

interface TranscriptOverlayProps {
  text: string | null;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
}

export function TranscriptOverlay({ text, role, isStreaming = false }: TranscriptOverlayProps) {
  const theme = useTheme();
  
  if (!text) return null;
  
  const isUser = role === 'user';
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isUser ? theme.primarySoft : theme.card }
    ]}>
      <Text style={[styles.label, { color: theme.textMuted }]}>
        {isUser ? 'Toi' : 'Diva'}
      </Text>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isStreaming ? (
          <TypingText 
            text={text}
            style={[styles.text, { color: theme.text }]}
            speed={isUser ? 0 : 15} // Instant pour user, typing pour Diva
          />
        ) : (
          <Text style={[styles.text, { color: theme.text }]}>
            {text}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    maxHeight: 150,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollView: {
    maxHeight: 100,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Parler | Transcription affichée progressivement |
| 2 | Phrase longue | Scroll activé |
| 3 | Réponse Diva | Typing animation |
| 4 | Nouvelle question | Ancien texte remplacé |

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
