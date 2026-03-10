# US-039 : Interruption fluide pendant le TTS

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-039 |
| **Épique** | E1 — Core Voice |
| **Sprint** | Sprint 5 |
| **Estimation** | 5 points |
| **Priorité** | 🔴 MUST |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** pouvoir interrompre Diva pendant qu'elle parle
**Afin de** poser une nouvelle question sans perdre le contexte

---

## Problème actuel

Quand l'utilisateur interrompt Diva pendant le TTS :
1. Il doit appuyer sur le bouton (pas intuitif)
2. Le signal `cancel` reset toute la session
3. Le contexte conversationnel est perdu
4. L'UX est frustrante

---

## Comportement souhaité

```
Diva parle → User tap/parle → TTS stop → User parle → Continue conversation
```

### Scénario idéal

1. Diva est en train de parler (state: `speaking`)
2. User tap sur l'orbe OU commence à parler
3. TTS s'arrête immédiatement (audio stop)
4. Orbe passe en `listening`
5. User pose sa question
6. Diva répond EN GARDANT LE CONTEXTE précédent

---

## Critères d'acceptation

- [ ] **AC-001** : Tap pendant TTS → stop audio immédiat
- [ ] **AC-002** : Transition fluide speaking → listening
- [ ] **AC-003** : Contexte conversationnel préservé
- [ ] **AC-004** : Pas de message d'erreur ou de reset
- [ ] **AC-005** : Réponse partielle de Diva visible dans historique

---

## Architecture technique

### Problème actuel

```typescript
// useVoiceSession.ts - Cancel actuel
const cancel = () => {
  ws.current?.send(JSON.stringify({ type: 'cancel' })); // Reset tout !
  stopAudio();
  setOrbState('idle');
};
```

### Solution proposée

```typescript
// Nouveau: interrupt vs cancel
const interrupt = () => {
  // 1. Stop audio seulement
  stopAudio();
  
  // 2. Notifier le serveur de l'interruption (pas cancel)
  ws.current?.send(JSON.stringify({ 
    type: 'interrupt',
    preserve_context: true 
  }));
  
  // 3. Passer en listening
  setOrbState('listening');
  startRecording();
};

const cancel = () => {
  // Cancel = reset complet (seulement si explicite)
  ws.current?.send(JSON.stringify({ type: 'cancel' }));
  stopAudio();
  setOrbState('idle');
};
```

### Côté serveur

```typescript
// orchestrator.ts
case 'interrupt':
  // Stop TTS stream
  ttsStream?.destroy();
  
  // Garder le contexte (ne pas clear messages)
  // Ajouter note dans l'historique
  conversationHistory.push({
    role: 'assistant',
    content: partialResponse + ' [interrompu]'
  });
  
  // Ready for new input
  break;
```

---

## Tâches de développement

### T1 : Client - Interrupt handler (1h)

```typescript
// useVoiceSession.ts
const interrupt = useCallback(() => {
  // Stop audio playback
  if (audioPlayer.current) {
    audioPlayer.current.stopAsync();
  }
  
  // Clear audio queue
  audioQueueRef.current = [];
  
  // Notify server
  ws.current?.send(JSON.stringify({ type: 'interrupt' }));
  
  // Transition to listening
  setOrbState('listening');
  
  // Haptic feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  // Start recording
  startRecording();
}, []);
```

### T2 : Tap handler update (30min)

```typescript
// Dans index.tsx
const handleOrbPress = () => {
  if (orbState === 'speaking') {
    interrupt(); // Pas cancel !
  } else if (orbState === 'idle') {
    toggleSession();
  } else if (orbState === 'listening') {
    stopRecording();
  }
};
```

### T3 : Server - Interrupt message (1h)

```typescript
// websocket handler
socket.on('message', (data) => {
  const msg = JSON.parse(data);
  
  if (msg.type === 'interrupt') {
    // Stop TTS
    ttsAbortController?.abort();
    
    // Save partial response
    if (currentResponse) {
      addToHistory({
        role: 'assistant',
        content: currentResponse + ' [interrompu par l\'utilisateur]'
      });
    }
    
    // Don't clear context!
    // Ready for next input
    socket.send(JSON.stringify({ type: 'ready' }));
  }
});
```

### T4 : Détection vocale pendant TTS (2h)

Pour permettre l'interruption vocale (sans tap) :

```typescript
// Optionnel: Voice Activity Detection pendant speaking
const enableVADDuringSpeaking = () => {
  if (orbState === 'speaking') {
    // Mini recording pour détecter si user parle
    // Si audio level > threshold pendant 500ms → interrupt
  }
};
```

⚠️ Cette feature est complexe (écho, feedback) - à faire en V2.

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Tap pendant TTS | Audio stop, orbe → listening |
| 2 | Poser question après interrupt | Réponse avec contexte |
| 3 | "Quel temps fait-il ?" → interrupt → "Et demain ?" | Diva comprend "demain" = météo |
| 4 | Multiple interrupts | Pas de crash |

---

## Notes

- **V1** : Interrupt par tap seulement
- **V2** : Interrupt par détection vocale (complexe à cause de l'écho)
- Le contexte max reste limité (derniers N messages)

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
*Demandée par Jojo suite à test utilisateur*
