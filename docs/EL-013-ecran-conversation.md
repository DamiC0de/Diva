# EL-013 — Écran Principal (Conversation + PTT)

**Épique :** E3 — App React Native
**Sprint :** S2
**Points :** 8
**Priorité :** P0
**Dépendances :** EL-012 (Setup Expo), EL-009 (Orchestrateur)

---

## Description

En tant qu'**utilisateur**, je veux un écran de conversation principal avec un bouton push-to-talk central, afin d'interagir avec Elio par la voix et voir l'historique de nos échanges.

## Contexte technique

- **Design** : minimaliste, centré sur l'interaction vocale
- **Bouton PTT** : gros bouton central, press & hold pour parler
- **Chat bubbles** : messages texte (transcription user + réponse Elio)
- **Audio playback** : réponse vocale jouée automatiquement
- **WebSocket** : connexion persistante avec l'API Gateway
- **États visuels** : idle, listening, thinking, speaking

### Layout

```
┌────────────────────────┐
│  ☰                  ⚙️  │  ← Header (menu + settings)
├────────────────────────┤
│                        │
│  ┌──────────────────┐  │
│  │ 🗨 Lis-moi mes   │  │  ← Bubble user (gris)
│  │   mails          │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ 📧 Tu as 3 mails │  │  ← Bubble Elio (orange)
│  │   non lus...     │  │
│  └──────────────────┘  │
│                        │
│                        │
│                        │
├────────────────────────┤
│    État: "Prêt" 🟢     │  ← Status bar
│                        │
│      ┌────────┐        │
│      │  🎙️   │        │  ← Bouton PTT (hold to talk)
│      │  PTT   │        │
│      └────────┘        │
│                        │
│   💬 Clavier    📎      │  ← Fallback texte + attachments
└────────────────────────┘
```

## Critères d'acceptation

- [ ] Écran conversation avec ScrollView/FlatList de messages
- [ ] Bubbles : user (aligné droite, gris) vs Elio (aligné gauche, orange primary)
- [ ] Bouton PTT central : press & hold → enregistre, release → envoie
- [ ] Animation PTT : idle (statique), recording (pulsation rouge), processing (spinner)
- [ ] Barre d'état : affiche l'état actuel (Prêt / Écoute... / Réflexion... / Parle...)
- [ ] Réponse texte affichée en temps réel (streaming depuis WS)
- [ ] Audio réponse joué automatiquement (`expo-av`)
- [ ] Input texte alternatif : champ texte pour taper au lieu de parler
- [ ] Historique : charge les derniers 50 messages au scroll up (pagination)
- [ ] Messages persistés dans Supabase (`messages` table)
- [ ] Indicateur connexion WS (vert/rouge)
- [ ] Accessibilité : VoiceOver labels sur les éléments clés

## Tâches de dev

1. **Layout & composants** (~3h)
   - `ConversationScreen` avec header, message list, input area
   - `MessageBubble` component (user vs assistant, timestamp)
   - `PTTButton` component avec animations (Reanimated)
   - `StatusBar` component (état pipeline)

2. **WebSocket client** (~2h)
   - Hook `useWebSocket` : connect, reconnect, send, onMessage
   - Auto-reconnect avec backoff exponentiel
   - Gestion des types de messages (state_change, transcript, audio_chunk, etc.)

3. **Audio recording** (~2h)
   - `expo-av` Audio.Recording (format Opus/WAV)
   - Press & hold → start recording
   - Release → stop + send via WS
   - Niveau audio en temps réel (visualisation waveform)

4. **Audio playback** (~1h)
   - Recevoir chunks audio via WS
   - Buffer + play avec `expo-av` Audio.Sound
   - Auto-play dès réception

5. **Message persistence** (~1h)
   - Sauvegarder messages dans Supabase (optimistic UI)
   - Charger historique avec pagination (cursor-based)
   - Indicateur loading pendant le chargement

## Tests requis

- **Unitaire :** MessageBubble render correct (user vs assistant)
- **Unitaire :** PTTButton states transitions
- **Intégration :** WS connect → send audio → receive response → display
- **E2E (manuel) :** Conversation complète voix → texte → voix
- **Manuel :** Scroll historique + pagination

## Definition of Done

- [ ] Conversation vocale end-to-end sur device
- [ ] PTT fluide avec feedback visuel
- [ ] Messages affichés et persistés
- [ ] Audio playback automatique
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
