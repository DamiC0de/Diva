# EL-009 — Orchestrateur de Requêtes

**Épique :** E2 — Pipeline vocal
**Sprint :** S2
**Points :** 8
**Priorité :** P0
**Dépendances :** EL-006 (STT), EL-007 (TTS), EL-008 (Claude Haiku)

---

## Description

En tant qu'**utilisateur**, je veux pouvoir parler à Elio et recevoir une réponse vocale complète de bout en bout, afin d'avoir une expérience conversationnelle fluide par la voix.

## Contexte technique

L'orchestrateur est le **chef d'orchestre** du pipeline vocal. Il coordonne : Audio in → STT → Claude → (Actions) → TTS → Audio out, le tout via WebSocket.

### Pipeline complet

```
iPhone ──audio──▶ WS Handler ──▶ STT Worker ──text──▶ Claude Haiku
                                                          │
                                                    ┌─────┴──────┐
                                                    │ Tool call? │
                                                    └─────┬──────┘
                                                     non  │  oui
                                                     │    │──▶ Action Runner
                                                     │    │◀── résultat
                                                     ▼    ▼
                                               Réponse texte
                                                     │
                                              TTS Worker ──audio──▶ WS ──▶ iPhone
```

### Gestion des états

```typescript
enum RequestState {
  RECEIVING_AUDIO,   // Audio streame depuis le client
  TRANSCRIBING,      // STT en cours
  THINKING,          // Claude réfléchit
  EXECUTING_ACTION,  // Action externe (Gmail, Calendar...)
  SYNTHESIZING,      // TTS en cours
  STREAMING_AUDIO,   // Audio streame vers le client
  COMPLETED,
  ERROR
}
```

## Critères d'acceptation

- [ ] Module `Orchestrator` qui gère le cycle de vie complet d'une requête vocale
- [ ] WebSocket handler : reçoit audio chunks, détecte fin de parole (silence ou signal client)
- [ ] Chaîne STT → LLM → TTS exécutée séquentiellement
- [ ] État de la requête envoyé au client via WS : `{ state: "transcribing" }`, `{ state: "thinking" }`, etc.
- [ ] Timeout global par requête : 15s → erreur user-friendly
- [ ] Concurrence : chaque user a max 1 requête active (les nouvelles annulent l'ancienne)
- [ ] Métriques : durée de chaque étape loggée (cf. EL-005)
- [ ] Latence totale pipeline <2s (hors actions externes)
- [ ] Gestion d'erreur à chaque étape : fallback message vocal "Désolé, je n'ai pas compris"
- [ ] Conversation context : charge l'historique + mémoire avant l'appel Claude

## Tâches de dev

1. **WebSocket Protocol** (~2h)
   - Définir le protocole client ↔ serveur :
     - Client → Server : `audio_chunk`, `audio_end`, `cancel`
     - Server → Client : `state_change`, `transcript`, `text_response`, `audio_chunk`, `audio_end`, `error`
   - Serialization : JSON pour control, binary pour audio

2. **Orchestrator class** (~4h)
   - `async processVoiceRequest(userId, audioStream)` → audioResponse stream
   - State machine avec transitions
   - Timeout management (per-step + global)
   - Cancel support (client envoie `cancel` ou nouvelle requête)

3. **Audio buffering** (~1h)
   - Accumuler les chunks audio jusqu'à `audio_end`
   - Concat buffer → envoyer au STT worker
   - (Future : streaming STT pour réduire latence)

4. **Integration wiring** (~2h)
   - Connecter STT result → LLM input
   - Connecter LLM response → TTS input
   - Connecter TTS audio → WS output (streaming chunks)
   - Charger historique + mémoire depuis Supabase avant LLM

5. **Error handling & fallbacks** (~1h)
   - Try/catch à chaque étape
   - Messages d'erreur vocaux pré-générés (TTS offline)
   - Retry STT 1x si échec

## Tests requis

- **Unitaire :** State machine transitions correctes
- **Unitaire :** Timeout déclenche erreur après 15s
- **Unitaire :** Cancel interrompt le pipeline
- **Intégration :** Audio WAV → STT → LLM → TTS → Audio out (end-to-end local)
- **Performance :** Pipeline complet <2s sur audio de 3s
- **Manuel :** Conversation vocale réelle via WebSocket client de test

## Definition of Done

- [ ] Pipeline vocal end-to-end fonctionnel
- [ ] États envoyés au client en temps réel
- [ ] Latence <2s vérifiée
- [ ] Gestion d'erreurs robuste
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
