# US-007 : Annulation commande vocale

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-007 |
| **Épique** | E1 — Core Voice |
| **Sprint** | Sprint 2 |
| **Estimation** | 2 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** pouvoir dire "annule" ou taper pendant une réponse
**Afin d'** interrompre Diva

---

## Critères d'acceptation

- [ ] **AC-001** : Tap sur l'orbe pendant TTS → arrêt immédiat
- [ ] **AC-002** : "Annule", "stop", "arrête" pendant l'écoute → cancel
- [ ] **AC-003** : Confirmation visuelle (orbe → violet)
- [ ] **AC-004** : Pas de confirmation vocale (silencieux)

---

## Contexte actuel

Le cancel par tap existe déjà (`cancel()` dans useVoiceSession). Cette story ajoute le cancel par commande vocale.

---

## Tâches de développement

### T1 : Cancel commands (30min)

```typescript
// app/lib/cancelDetection.ts
const CANCEL_COMMANDS = [
  'annule', 'annuler', 'cancel',
  'stop', 'arrête', 'arrêter',
  'tais-toi', 'silence',
  'non', 'laisse tomber',
];

export function isCancelCommand(text: string): boolean {
  const lowered = text.toLowerCase().trim();
  return CANCEL_COMMANDS.some(cmd => 
    lowered === cmd || 
    lowered.startsWith(cmd + ' ') ||
    lowered.endsWith(' ' + cmd)
  );
}
```

### T2 : Intégration transcription (30min)

```typescript
// Dans useVoiceSession.ts - handler WebSocket
case 'transcript':
  const text = msg.text;
  setTranscript(text);
  
  // Check for cancel command early
  if (isCancelCommand(text)) {
    cancel();
    setTranscript(null);
    return;
  }
  break;
```

### T3 : Cancel propre (30min)

```typescript
// Dans useVoiceSession.ts
const cancel = useCallback(() => {
  // Stop audio playback
  if (audioPlayer.current) {
    audioPlayer.current.stopAsync();
  }
  
  // Stop recording if active
  if (recording.current) {
    recording.current.stopAndUnloadAsync();
  }
  
  // Reset WebSocket state
  if (ws.current?.readyState === WebSocket.OPEN) {
    ws.current.send(JSON.stringify({ type: 'cancel' }));
  }
  
  // Reset UI
  setOrbState('idle');
  setTranscript(null);
  
  // Haptic feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}, []);
```

### T4 : Tap handler amélioré (30min)

```typescript
// Dans index.tsx
const handleOrbPress = () => {
  if (orbState === 'speaking' || orbState === 'processing') {
    // Cancel en cours
    cancel();
  } else if (orbState === 'idle') {
    // Start listening
    toggleSession();
  } else if (orbState === 'listening') {
    // Stop recording and process
    stopRecording();
  }
};
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Tap pendant TTS | Audio stop, orbe → violet |
| 2 | "Annule" pendant écoute | Cancel, pas de requête envoyée |
| 3 | "Stop" pendant processing | Cancel |
| 4 | Tap pendant listening | Envoie ce qui a été dit |

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
