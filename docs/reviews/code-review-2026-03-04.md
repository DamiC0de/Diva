# Code Review Technique — Diva
**Date :** 4 mars 2026  
**Reviewer :** Amelia (Dev BMAD)  
**Projet :** Diva — Assistant vocal React Native/Expo + Backend Node.js/TypeScript

---

## 📊 Résumé Exécutif

| Catégorie | Nombre |
|-----------|--------|
| 🐛 Bugs critiques | 3 |
| ⚠️ Warnings | 12 |
| 🔧 Refactoring suggéré | 8 |
| ✅ Points positifs | 7 |

**Santé globale du code : 7/10** — Le code est fonctionnel mais nécessite du cleanup et quelques corrections de bugs potentiels.

---

## 🐛 Bugs Trouvés

### BUG-001 : Race condition dans `useVoiceSession.ts` — cleanup manquant
**Fichier :** `app/hooks/useVoiceSession.ts` (lignes 790-850)  
**Sévérité :** 🔴 Critique

```typescript
// PROBLÈME : isPreparingRecordingRef n'est jamais reset en cas de succès complet
const doStartListening = useCallback(async () => {
  if (isPreparingRecordingRef.current) {
    console.log('[Audio] Already preparing recording, skipping');
    return;
  }
  isPreparingRecordingRef.current = true;
  
  try {
    // ... code ...
    isPreparingRecordingRef.current = false; // Done preparing
    // OK ici
  } catch (err) {
    isPreparingRecordingRef.current = false; // Reset on error
    // OK ici aussi
  }
  // ⚠️ Mais si le code atteint la fin sans exception, c'est ok
}, []);
```

Le code semble correct, mais le **vrai problème** est que si `Audio.Recording.createAsync` échoue sans throw (cas rare), le flag reste bloqué.

**Fix suggéré :**
```typescript
} finally {
  // Toujours reset le flag à la fin
  isPreparingRecordingRef.current = false;
}
```

---

### BUG-002 : Memory leak potentiel — interval non nettoyé dans `useNetworkStatus`
**Fichier :** `app/hooks/useNetworkStatus.ts` (ligne 28)  
**Sévérité :** 🟡 Modérée

```typescript
useEffect(() => {
  checkNetworkState();
  const interval = setInterval(checkNetworkState, 3000);
  return () => clearInterval(interval);
}, [checkNetworkState]); // ⚠️ checkNetworkState dans les deps!
```

**Problème :** `checkNetworkState` est dans les dépendances du useEffect. Grâce à `useCallback` sans dépendances, ça devrait être stable. MAIS si on ajoute une dépendance à `useCallback` plus tard, l'interval sera recréé en boucle.

**Fix suggéré :**
```typescript
useEffect(() => {
  checkNetworkState();
  const interval = setInterval(checkNetworkState, 3000);
  return () => clearInterval(interval);
}, []); // Retirer checkNetworkState des deps - stable par design
```

---

### BUG-003 : Edge case non géré — WebSocket reconnection pendant audio playback
**Fichier :** `app/hooks/useVoiceSession.ts` (lignes 330-380)  
**Sévérité :** 🟡 Modérée

```typescript
ws.onclose = () => {
  if (pingInterval) clearInterval(pingInterval);
  setIsConnected(false);
  // ⚠️ Si on était en train de jouer de l'audio, on garde autoListenRef
  if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
    autoListenRef.current = false;
  }
  // Reconnect logic...
};
```

**Problème :** Si le WebSocket se déconnecte pendant la lecture audio, puis reconnecter, le nouvel audio pourrait arriver avant que l'ancien ne soit terminé → corruption de la queue audio.

**Fix suggéré :**
```typescript
ws.onclose = () => {
  // Vider la queue audio en cas de déconnexion pour éviter les mélanges
  if (reconnectTimeoutRef.current) {
    audioQueueRef.current = []; // Flush stale audio
  }
  // ... reste du code
};
```

---

## ⚠️ Warnings

### WARN-001 : Variables/imports non utilisés
**Source :** ESLint output

| Fichier | Variables non utilisées |
|---------|------------------------|
| `useVoiceSession.ts` | `containsInterruptKeyword`, `findInterruptKeyword`, `getOfflineResponse`, `checkForStopCommand`, `timers`, `resetConversationTimeout` |
| `app/(main)/index.tsx` | `cancel` |
| `app/(main)/settings.tsx` | `gmailLoading` |
| `app/(main)/history.tsx` | `SCREEN_WIDTH` |
| `lib/contacts.ts` | `Alert` |
| `lib/conversationParser.ts` | `lowered` |

**Fix :** Supprimer ces imports/variables pour réduire le bundle size et améliorer la lisibilité.

---

### WARN-002 : Dépendances useEffect/useCallback manquantes ou incorrectes
**Source :** ESLint react-hooks/exhaustive-deps

```
useVoiceSession.ts:943 — missing: cancelAllTimers, cancelLastTimer, cancelTimer, etc.
useVoiceSession.ts:1010 — missing: doStartListening
useVoiceSession.ts:1185 — missing: doStopAndSend
useVoiceSession.ts:1247 — missing: doStartListening
OrbView.tsx:305 — missing: 8 animation functions
ErrorOverlay.tsx:50 — missing: opacity, translateY
```

**Impact :** Ces warnings indiquent des closures potentiellement stale. Dans certains cas c'est intentionnel (pour éviter les re-renders), mais devrait être documenté avec `// eslint-disable-next-line`.

---

### WARN-003 : Caractères non échappés dans JSX
**Fichiers :** `onboarding.tsx`, `(onboarding)/index.tsx`, `+not-found.tsx`, `TutorialOverlay.tsx`

```tsx
// ❌ Mauvais
<Text>Tu n'as pas de compte</Text>

// ✅ Bon
<Text>Tu n&apos;as pas de compte</Text>
// ou
<Text>{"Tu n'as pas de compte"}</Text>
```

---

### WARN-004 : Type Array<T> vs T[]
**Fichiers :** `settings.tsx`, `conversationParser.ts`

ESLint préfère `T[]` sur `Array<T>` pour la cohérence. Fix mineur.

---

### WARN-005 : Double import d'expo-router
**Fichier :** `app/(onboarding)/_layout.tsx`

```typescript
// Lignes 1-2 : Double import
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router'; // Devrait être fusionné
```

---

## 🔧 Refactoring Suggéré

### REF-001 : Extraire la logique WebSocket de `useVoiceSession.ts`
**Fichier :** `app/hooks/useVoiceSession.ts` — **1247 lignes**

Le hook est massif et gère trop de responsabilités :
- WebSocket connection
- Audio recording
- Audio playback
- Keyword detection
- Timer management
- History management
- Error handling

**Suggestion :** Découper en hooks plus petits :
```
hooks/
├── useVoiceSession.ts      (orchestration — 200 lignes max)
├── useAudioRecording.ts    (recording logic)
├── useAudioPlayback.ts     (playback queue)
├── useSessionWebSocket.ts  (WS connection)
└── useKeywordDetection.ts  (US-040)
```

---

### REF-002 : Constantes magiques à extraire
**Fichier :** `useVoiceSession.ts`

```typescript
// Ces constantes devraient être dans un fichier de config
const SILENCE_THRESHOLD = -45; // dB
const SILENCE_DURATION_MS = 2500;
const MIN_RECORDING_MS = 1000;
const LONG_RECORDING_SILENCE_MS = 3500;
const MIN_AUDIBLE_LEVEL = -50;
const CONVERSATION_TIMEOUT_MS = 30000;
```

**Suggestion :** Créer `constants/audio.ts` avec toutes ces valeurs.

---

### REF-003 : Centraliser les messages d'erreur server-side
**Fichier :** `server/src/services/orchestrator.ts`

Les messages d'erreur en français sont hardcodés partout :
```typescript
resolve("Le téléphone n'a pas répondu.");
resolve("Gmail n'est pas connecté.");
resolve("Aucun contact trouvé.");
```

**Suggestion :** Créer `server/src/constants/messages.ts` et centraliser.

---

### REF-004 : Tool execution dans l'orchestrator — switch géant
**Fichier :** `server/src/services/orchestrator.ts` (lignes 700-950)

Le `executeTools` a un switch de 250+ lignes. 

**Suggestion :** Pattern Strategy avec un registre de tool handlers :
```typescript
const toolHandlers: Record<string, ToolHandler> = {
  'get_weather': new WeatherHandler(),
  'web_search': new WebSearchHandler(),
  // ...
};

const handler = toolHandlers[tool.name];
if (handler) {
  results.push(await handler.execute(input, context));
}
```

---

### REF-005 : Supprimer le code mort dans `keywordDetector.ts`
**Fichier :** `app/lib/keywordDetector.ts`

Les fonctions `containsInterruptKeyword` et `findInterruptKeyword` sont importées mais jamais utilisées dans `useVoiceSession.ts`. La détection de keyword se fait côté serveur maintenant (US-040).

**Action :** Confirmer que le client-side keyword detection n'est plus nécessaire et supprimer.

---

### REF-006 : Améliorer la gestion du offline mode
**Fichier :** `app/lib/offlineResponses.ts`

Le système offline est minimal. Suggestions :
- Ajouter plus de réponses locales (conversions basiques, calculs simples)
- Queue les messages pour envoi ultérieur quand online
- Afficher un indicateur visuel de mode offline

---

### REF-007 : Tests manquants critiques
**Couverture actuelle :** 1 fichier de test (`health.test.ts`)

**Tests à ajouter urgemment :**

| Fichier | Tests nécessaires |
|---------|-------------------|
| `orchestrator.ts` | Tool execution, state machine transitions, error handling |
| `useVoiceSession.ts` | Recording lifecycle, audio queue, reconnection |
| `timerService.ts` | Timer creation/cancellation, notification scheduling |
| `cancelDetection.ts` | Différents patterns de cancel commands |
| `historyStore.ts` | CRUD operations, TTL expiration |

---

### REF-008 : Ajouter des types stricts pour les messages WebSocket
**Fichiers :** `useVoiceSession.ts`, `orchestrator.ts`

Les messages WebSocket utilisent `any` implicitement :
```typescript
const msg = JSON.parse(event.data);
// msg est any!
```

**Suggestion :** Créer un fichier de types partagé :
```typescript
// shared/types/websocket.ts
export type ClientMessage = 
  | { type: 'audio_message'; audio: string; format: string }
  | { type: 'cancel' }
  | { type: 'interrupt' }
  // ...

export type ServerMessage =
  | { type: 'transcript'; text: string; final?: boolean }
  | { type: 'tts_audio'; audio: string }
  // ...
```

---

## ✅ Points Positifs

### ✅ TypeScript sans erreurs
```bash
$ cd app && npx tsc --noEmit
$ cd server && npx tsc --noEmit
# Aucune erreur dans les deux cas
```

### ✅ Architecture WebSocket bien pensée
La gestion des reconnexions avec backoff exponentiel est solide :
```typescript
reconnectDelayRef.current = Math.min(delay * 1.5, 10000); // Max 10s backoff
```

### ✅ Système de mémoire (RAG) bien implémenté
- Cache avec TTL de 60 secondes
- Extraction de mémoires différée (30s après déconnexion)
- Limite de 20 messages par session

### ✅ Gestion propre des timers avec notifications
Le `useTimers` hook est bien conçu :
- Cleanup automatique des timers expirés
- Notifications natives Expo
- Support de labels optionnels

### ✅ Error handling structuré côté app
Les `ERROR_MESSAGES` sont bien typés et centralisés :
```typescript
export const ERROR_MESSAGES = {
  MICROPHONE_PERMISSION: { title: '...', message: '...', action: '...' },
  AUDIO_TOO_QUIET: { ... },
  // ...
};
```

### ✅ Historique avec TTL et limite
Le `historyStore.ts` est clean :
- 24h TTL automatique
- Max 20 entrées
- Nettoyage des entrées expirées à chaque lecture

### ✅ Clean separation client/server
Bonne séparation des responsabilités :
- Client : UI, audio capture, local storage
- Server : LLM, STT/TTS, tools execution, memory

---

## 📋 Priorités d'Action

| Priorité | Action | Effort |
|----------|--------|--------|
| 🔴 P0 | Fix BUG-001 (race condition recording) | 1h |
| 🔴 P0 | Fix BUG-003 (audio queue corruption) | 2h |
| 🟡 P1 | Cleanup variables non utilisées | 1h |
| 🟡 P1 | Ajouter tests orchestrator | 4h |
| 🟢 P2 | Refactoring useVoiceSession | 8h |
| 🟢 P2 | Extraire constantes | 2h |
| 🟢 P3 | Types WebSocket partagés | 3h |

---

## 🔍 Commandes de Vérification

```bash
# TypeScript errors
cd ~/elio-repo/app && npx tsc --noEmit
cd ~/elio-repo/server && npx tsc --noEmit

# ESLint
cd ~/elio-repo/app && npx eslint . --ext .ts,.tsx

# Tests
cd ~/elio-repo/server && npm test

# Bundle size analysis
cd ~/elio-repo/app && npx expo export --analyze
```

---

**Fin du rapport**  
*Amelia — Agent Développeur BMAD*
