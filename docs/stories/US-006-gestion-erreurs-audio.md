# US-006 : Gestion erreurs audio

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-006 |
| **Épique** | E1 — Core Voice |
| **Sprint** | Sprint 2 |
| **Estimation** | 2 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** être informé si quelque chose ne va pas avec l'audio
**Afin de** comprendre pourquoi Diva ne répond pas

---

## Critères d'acceptation

- [ ] **AC-001** : Message si permission micro refusée
- [ ] **AC-002** : Message si audio inaudible (trop faible)
- [ ] **AC-003** : Message si transcription échoue (serveur down)
- [ ] **AC-004** : Suggestion pour réessayer
- [ ] **AC-005** : Orbe passe en état "error" (rouge)

---

## Tâches de développement

### T1 : Messages d'erreur localisés (30min)

```typescript
// app/constants/errors.ts
export const ERROR_MESSAGES = {
  MICROPHONE_PERMISSION: {
    title: "Micro désactivé",
    message: "J'ai besoin d'accéder au micro pour t'écouter.",
    action: "Activer dans Réglages",
  },
  AUDIO_TOO_QUIET: {
    title: "Je n'ai rien entendu",
    message: "Parle un peu plus fort ou rapproche-toi.",
    action: "Réessayer",
  },
  TRANSCRIPTION_FAILED: {
    title: "Problème de connexion",
    message: "Je n'ai pas pu comprendre ta demande.",
    action: "Réessayer",
  },
  SERVER_UNAVAILABLE: {
    title: "Serveur indisponible",
    message: "Vérifie ta connexion internet.",
    action: "Réessayer",
  },
};
```

### T2 : Détection audio faible (30min)

```typescript
// Dans useVoiceSession.ts
const checkAudioLevel = (level: number): boolean => {
  // level en dB, typiquement -60 à 0
  const MIN_AUDIBLE_LEVEL = -50;
  return level > MIN_AUDIBLE_LEVEL;
};

// Pendant l'enregistrement
let hasAudibleAudio = false;
const onAudioLevel = (level: number) => {
  setAudioLevel(level);
  if (checkAudioLevel(level)) {
    hasAudibleAudio = true;
  }
};

// À la fin de l'enregistrement
if (!hasAudibleAudio) {
  setError(ERROR_MESSAGES.AUDIO_TOO_QUIET);
  setOrbState('error');
  return;
}
```

### T3 : UI d'erreur (30min)

```typescript
// app/components/ErrorOverlay.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../constants/theme';

interface ErrorOverlayProps {
  error: {
    title: string;
    message: string;
    action: string;
  } | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorOverlay({ error, onRetry, onDismiss }: ErrorOverlayProps) {
  const theme = useTheme();
  
  if (!error) return null;
  
  const handleAction = () => {
    if (error.action === "Activer dans Réglages") {
      Linking.openSettings();
    } else {
      onRetry();
    }
    onDismiss();
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.error }]}>{error.title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{error.message}</Text>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleAction}
      >
        <Text style={styles.buttonText}>{error.action}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
});
```

### T4 : Intégration (30min)

```typescript
// Dans index.tsx
const [error, setError] = useState<ErrorMessage | null>(null);

// Afficher l'overlay
<ErrorOverlay 
  error={error}
  onRetry={toggleSession}
  onDismiss={() => setError(null)}
/>
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Permission micro refusée | Message + lien settings |
| 2 | Parler très doucement | "Je n'ai rien entendu" |
| 3 | Serveur down | "Problème de connexion" |
| 4 | Tap "Réessayer" | Relance l'écoute |

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
