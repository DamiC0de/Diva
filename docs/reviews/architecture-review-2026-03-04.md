# 🏗️ Revue Architecture Diva — 4 mars 2026

> **Auteur**: Winston (Agent Architecte BMAD)  
> **Projet**: Diva — Assistant vocal privacy-first  
> **Stack**: React Native/Expo (mobile) + Fastify/Node.js (backend)

---

## 📊 Résumé exécutif

| Domaine | Score | Verdict |
|---------|-------|---------|
| Architecture globale | 8/10 | ✅ Solide |
| Sécurité | 6/10 | ⚠️ Améliorations nécessaires |
| Data flow | 8/10 | ✅ Bien pensé |
| Scalabilité | 7/10 | ⚠️ Quelques bottlenecks |
| Maintenabilité | 8/10 | ✅ Code propre |

---

## 1. Architecture Globale

### 1.1 Structure des dossiers

```
elio-repo/
├── app/                    # React Native / Expo
│   ├── app/               # Expo Router pages
│   │   ├── (main)/        # Écrans principaux (index, history, settings)
│   │   ├── (auth)/        # Écrans auth (login, onboarding)
│   │   └── (onboarding)/  # Onboarding
│   ├── components/        # Composants React
│   │   ├── Orb/          # Animation principale
│   │   └── ui/           # Design system
│   ├── hooks/            # Custom hooks (useWebSocket, useVoiceSession, etc.)
│   ├── lib/              # Services & utilitaires
│   ├── modules/          # Modules natifs (notification-reader, keyboard)
│   └── constants/        # Thème, couleurs, typo
│
├── server/                # Fastify backend
│   ├── src/
│   │   ├── routes/       # Endpoints REST & WebSocket
│   │   ├── services/     # Business logic (orchestrator, llm, memory)
│   │   ├── plugins/      # Fastify plugins (auth, rateLimit, cors)
│   │   ├── lib/          # Clients (supabase, redis)
│   │   └── config/       # Configuration env
│   └── dist/             # Build output
│
└── docs/                  # Documentation
```

### ✅ Points positifs

1. **Séparation claire app/server** — Monorepo bien structuré avec dossiers distincts
2. **Expo Router** — Navigation fichier-based moderne et maintenable
3. **Hooks pattern** — Logique réutilisable bien isolée (`useVoiceSession`, `useWebSocket`, `useSettings`)
4. **Services côté serveur** — Bonne séparation Orchestrator ↔ LLM ↔ Memory
5. **Plugin architecture (Fastify)** — Auth, CORS, rate limiting en plugins réutilisables

### ⚠️ Warnings

1. **Orchestrator.ts trop large** — 1500+ lignes, concentre trop de responsabilités
2. **Pas de types partagés app↔server** — Risque de désynchronisation des contrats API
3. **Tests limités** — Seulement `health.test.ts` visible

### 💡 Recommandations

```typescript
// 1. Extraire les handlers de tools dans des fichiers séparés
server/src/services/tools/
├── weatherTool.ts
├── calendarTool.ts
├── emailTool.ts
└── index.ts  // registry

// 2. Créer un package shared pour les types
packages/shared/
├── types/
│   ├── websocket.ts  // WSMessage, ServerEvent
│   └── api.ts        // Request/Response types
└── package.json
```

---

## 2. Sécurité

### 2.1 Gestion des tokens/auth

#### ✅ Points positifs

1. **JWT via Supabase Auth** — Standard, bien implémenté
2. **SecureStore côté mobile** — Tokens stockés dans le keychain iOS/Android
3. **Service role key côté serveur** — Séparation anon/service correcte

#### 🔴 Problèmes critiques

1. **Anon key hardcodée dans le code client**

```typescript
// app/lib/supabase.ts - CRITIQUE
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY 
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 🔴 Fallback hardcodé!
```

> **Risque**: Si les variables d'env ne sont pas définies en prod, la clé de fallback est utilisée. Cette clé est visible dans le code source et dans les builds.

2. **Google Client ID exposé dans plusieurs fichiers**

```typescript
// server/src/routes/gmail.ts
const GOOGLE_CLIENT_ID = process.env['GOOGLE_CLIENT_ID_WEB'] 
  || '794649959450-fc4ujikilh1eavfnbh3ov4aq3uphvq91.apps.googleusercontent.com'; // 🔴
```

> **Risque**: L'ID client n'est pas secret, mais le fallback hardcodé est une mauvaise pratique. Si `GOOGLE_CLIENT_SECRET` manque, l'app plante silencieusement.

3. **Validation JWT minimale en WebSocket**

```typescript
// server/src/routes/ws.ts - JWT décodé manuellement sans vérification de signature
try {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  userId = payload.sub;
} catch {
  userId = token; // 🔴 FALLBACK DANGEREUX - accepte n'importe quoi comme userId!
}
```

> **Risque**: Un attaquant peut forger un token avec n'importe quel `sub` et usurper l'identité d'un utilisateur.

### 2.2 Stockage sécurisé (SecureStore)

#### ✅ Points positifs

- Wrapper avec gestion gracieuse des erreurs background iOS
- Pas de données sensibles dans AsyncStorage (seulement historique conversations)

#### ⚠️ Warnings

- Pas de chiffrement des données en AsyncStorage (`historyStore.ts`)
- L'historique des conversations contient potentiellement des infos personnelles

### 2.3 API keys dans le code

| Clé | Localisation | Sécurisé? |
|-----|--------------|-----------|
| Supabase URL | `app/lib/supabase.ts` | ⚠️ Fallback hardcodé |
| Supabase Anon Key | `app/lib/supabase.ts` | 🔴 Fallback hardcodé |
| Google Client ID | `server/src/routes/gmail.ts` | ⚠️ Fallback visible |
| Service Role Key | Env only | ✅ OK |
| Anthropic API Key | Env only | ✅ OK |
| Groq API Key | Env only | ✅ OK |
| Brave Search Key | Env only | ✅ OK |

### 2.4 Validation des inputs

#### ⚠️ Warnings

1. **Pas de validation zod/yup** sur les payloads WebSocket
2. **Trust client-side data** — Les tools reçoivent les inputs sans validation schema

```typescript
// Exemple: le serveur trust le format du calendrier client
case 'request_add_calendar':
  const eventData = msg.event; // 🔴 Pas de validation
  const result = await createEvent(msg.event);
```

### 💡 Recommandations sécurité

```typescript
// 1. Supprimer TOUS les fallbacks hardcodés
// app/lib/supabase.ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

// 2. Valider JWT correctement en WebSocket
import { getSupabase } from '../lib/supabase.js';

const { data, error } = await getSupabase().auth.getUser(token);
if (error || !data.user) {
  socket.close(4001, 'Unauthorized');
  return;
}
const userId = data.user.id;

// 3. Ajouter zod pour la validation des messages WS
import { z } from 'zod';

const AudioMessageSchema = z.object({
  type: z.literal('audio_message'),
  audio: z.string().min(1),
  format: z.enum(['m4a', 'wav', 'webm']),
});

// 4. Chiffrer l'historique local sensible
import * as Crypto from 'expo-crypto';
```

---

## 3. Data Flow

### 3.1 WebSocket: client ↔ server

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUX WEBSOCKET                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CLIENT (useVoiceSession)              SERVER (Orchestrator)            │
│  ═════════════════════════            ═══════════════════════           │
│                                                                         │
│  [TAP] ────────────────────────────→  connect                           │
│                                       ↓                                 │
│  start_listening ──────────────────→  handleConnection()                │
│                                       ↓                                 │
│  audio_message ────────────────────→  handleAudioMessage()              │
│       (base64 m4a)                    ↓                                 │
│                                       ┌──────────────────┐              │
│  ←───────── state_change: TRANSCRIBING│  STT (Groq)      │              │
│                                       └───────┬──────────┘              │
│  ←───────── transcript: "..."                 ↓                         │
│                                       ┌──────────────────┐              │
│  ←───────── state_change: THINKING    │  LLM (Claude)    │              │
│                                       │  + Tool calls    │              │
│                                       └───────┬──────────┘              │
│  ←───────── request_calendar ────────────────→│                         │
│             (server → client request)         │                         │
│  calendar_response ───────────────────────────→│                        │
│             (client → server)                 ↓                         │
│                                       ┌──────────────────┐              │
│  ←───────── state_change: SYNTHESIZING│  TTS (Piper)     │              │
│                                       └───────┬──────────┘              │
│  ←───────── tts_audio: base64 WAV            ↓                          │
│                                                                         │
│  ←───────── state_change: COMPLETED                                     │
│                                                                         │
│  [AUTO-LISTEN si conversation mode]                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### ✅ Points positifs

1. **Protocole bidirectionnel clair** — Types bien définis (`ClientMessage`, `ServerEvent`)
2. **State machine explicite** — `RequestState` enum pour le cycle de vie
3. **Auto-reconnect** avec backoff exponentiel
4. **Ping/pong keepalive** — Évite les timeouts sur mobile/tunnel

### ⚠️ Warnings

1. **Pas de message queue ordering** — Les messages peuvent arriver out-of-order
2. **Single WebSocket par user** — Si l'utilisateur ouvre 2 devices, conflit

### 3.2 Audio Pipeline: STT → LLM → TTS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PIPELINE AUDIO OPTIMISÉ                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BEFORE: Audio → STT (300ms) → Claude full (500ms) → TTS full (400ms)   │
│          Total: ~1.7s TTFB                                              │
│                                                                         │
│  AFTER:  Audio → STT (300ms) → Claude stream → TTS per sentence         │
│          Total: ~0.9s TTFB (streaming)                                  │
│                                                                         │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐            │
│  │  Audio  │    │   STT    │    │  Claude │    │   TTS    │            │
│  │ (m4a)   │───→│  (Groq)  │───→│(Anthropic)│──→│ (Piper)  │           │
│  │         │    │ Whisper  │    │  Haiku  │    │  Local   │            │
│  └─────────┘    └──────────┘    └─────────┘    └──────────┘            │
│                      │              │               │                   │
│                      │              │               │                   │
│               ~150-300ms      ~300-500ms       ~50-100ms/phrase         │
│                                                                         │
│  STREAMING: Les phrases sont TTS dès que Claude les génère              │
│  (SentenceAccumulator dans streamingPipeline.ts)                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### ✅ Points positifs

1. **Groq pour STT** — Whisper large-v3-turbo, très rapide (~150ms)
2. **TTS local (Piper)** — Pas de latence réseau, ~50ms/phrase
3. **Sentence streaming** — Audio envoyé phrase par phrase
4. **Parallel batch TTS** — Plusieurs phrases synthétisées en parallèle

### 3.3 Persistence

| Data | Storage | TTL | Encryption |
|------|---------|-----|------------|
| Auth tokens | SecureStore (iOS/Android keychain) | Session | ✅ Natif |
| Conversation history (local) | AsyncStorage | 24h | ❌ None |
| Memories (facts, preferences) | Supabase + pgvector | Permanent | ✅ At-rest |
| Session state | In-memory (Orchestrator) | Session | N/A |
| User settings | Supabase `users.settings` | Permanent | ✅ At-rest |

---

## 4. Scalabilité

### 4.1 Bottlenecks potentiels

| Composant | Risque | Impact | Mitigation actuelle |
|-----------|--------|--------|---------------------|
| Orchestrator in-memory | 🔴 High | Perte état si restart | Aucune |
| WebSocket single-instance | 🔴 High | Pas de horizontal scaling | Aucune |
| Groq STT | 🟡 Medium | Rate limits Groq | Fallback Redis worker |
| Claude API | 🟡 Medium | Rate limits Anthropic | Retry avec backoff |
| Piper TTS local | 🟢 Low | CPU-bound | HTTP server séparé |
| Supabase queries | 🟢 Low | Connection pooling | Singleton client |

### 4.2 Rate Limiting

```typescript
// server/src/plugins/rateLimit.ts
await app.register(rateLimit, {
  max: 100,          // 100 requêtes
  timeWindow: '1 minute',
});
```

⚠️ **Warning**: Le rate limit n'est pas appliqué au WebSocket, seulement aux routes HTTP.

### 4.3 Gestion mémoire

#### Conversation history (server-side)

```typescript
// Limite à 20 messages en mémoire
sessionHistory.push({ role: 'assistant', content: fullText });
if (sessionHistory.length > 20) sessionHistory.splice(0, sessionHistory.length - 20);
```

#### Memory cache

```typescript
// Cache TTL 1 minute pour les memories
private memoryCache = new Map<string, { memories: string[]; timestamp: number }>();
private readonly MEMORY_CACHE_TTL = 60_000;
```

### 4.4 Audio queue

```typescript
// Côté client
const audioQueueRef = useRef<string[]>([]); // Queue base64 sans limite
```

⚠️ **Warning**: Pas de limite sur la queue audio — risque OOM si le serveur envoie trop de chunks.

### 💡 Recommandations scalabilité

```typescript
// 1. Persister l'état de session dans Redis
// server/src/services/sessionStore.ts
export class SessionStore {
  async saveSession(userId: string, history: Message[]): Promise<void> {
    await redis.set(`session:${userId}`, JSON.stringify(history), 'EX', 3600);
  }
}

// 2. WebSocket scaling avec Redis pub/sub
// Pour multi-instance, utiliser @fastify/websocket avec Redis adapter

// 3. Rate limit WebSocket par userId
const userMessageCount = new Map<string, { count: number; resetAt: number }>();
const MAX_WS_MESSAGES_PER_MINUTE = 30;

// 4. Limiter la queue audio côté client
const MAX_AUDIO_QUEUE_SIZE = 10;
if (audioQueueRef.current.length >= MAX_AUDIO_QUEUE_SIZE) {
  audioQueueRef.current.shift(); // Drop oldest
}
```

---

## 5. Points d'amélioration

### 5.1 Refactoring suggéré

#### 1. Extraire l'Orchestrator

```
server/src/services/
├── orchestrator/
│   ├── index.ts           # Orchestrator class (coordination only)
│   ├── stateManager.ts    # RequestState machine
│   ├── audioProcessor.ts  # STT/TTS coordination
│   └── toolExecutor.ts    # Tool dispatch + execution
├── tools/
│   ├── weatherTool.ts
│   ├── calendarTool.ts
│   ├── emailTool.ts
│   ├── contactTool.ts
│   ├── timerTool.ts
│   └── registry.ts        # Tool registration + schema
```

#### 2. Typage partagé

```
packages/
└── shared/
    ├── src/
    │   ├── websocket/
    │   │   ├── clientMessages.ts
    │   │   ├── serverEvents.ts
    │   │   └── index.ts
    │   └── api/
    │       ├── auth.ts
    │       └── user.ts
    └── package.json
```

#### 3. Configuration centralisée

```typescript
// server/src/config/index.ts
export const config = {
  supabase: {
    url: env('SUPABASE_URL', { required: true }),
    serviceKey: env('SUPABASE_SERVICE_ROLE_KEY', { required: true }),
    anonKey: env('SUPABASE_ANON_KEY', { required: true }),
  },
  llm: {
    model: env('ANTHROPIC_MODEL', { default: 'claude-3-5-haiku-20241022' }),
    maxTokens: envInt('LLM_MAX_TOKENS', { default: 1024 }),
  },
  // ...
};
```

### 5.2 Patterns manquants

| Pattern | Status | Impact |
|---------|--------|--------|
| Error boundary (React) | ❌ | Crashes silencieux côté client |
| Circuit breaker (API calls) | ❌ | Cascade failures si Claude/Groq down |
| Request tracing (correlation ID) | ⚠️ Partiel | Difficile à debug en prod |
| Structured logging | ✅ | Logs Pino propres |
| Health checks | ✅ | `/health` endpoint |
| Graceful shutdown | ❌ | Connexions WS coupées brutalement |

### 5.3 Tests d'architecture

| Type | Coverage actuelle | Recommandé |
|------|-------------------|------------|
| Unit tests | ~5% (1 fichier) | 60%+ |
| Integration tests | 0% | 30%+ |
| E2E tests | 0% | 10%+ |
| Contract tests (API) | 0% | Oui |
| Load tests | 0% | Recommandé avant launch |

---

## 6. Matrice de risques

| Risque | Probabilité | Impact | Priorité |
|--------|-------------|--------|----------|
| Token forgery (WS auth bypass) | Moyenne | 🔴 Critique | P0 |
| API keys leakées via fallbacks | Basse | 🔴 Élevé | P0 |
| OOM sur audio queue | Basse | 🟡 Moyen | P1 |
| State loss on server restart | Haute | 🟡 Moyen | P1 |
| No horizontal scaling | Certaine | 🟡 Moyen | P2 |
| Manque de tests | Certaine | 🟡 Moyen | P2 |

---

## 7. Plan d'action recommandé

### Sprint prochain (P0)

1. [ ] **Fix auth WebSocket** — Valider JWT via Supabase, pas de fallback
2. [ ] **Supprimer fallbacks hardcodés** — Fail-fast si config manquante
3. [ ] **Ajouter validation zod** — Sur tous les messages WebSocket

### Court terme (P1)

4. [ ] **Persister sessions Redis** — Survie aux restarts
5. [ ] **Limiter audio queue** — Max 10 chunks, drop oldest
6. [ ] **Extraire tools** — Orchestrator < 500 lignes

### Moyen terme (P2)

7. [ ] **Tests unitaires** — Viser 60% coverage
8. [ ] **Types partagés** — Package monorepo
9. [ ] **Circuit breaker** — Pour appels API externes
10. [ ] **Graceful shutdown** — Fermer WS proprement

---

## 8. Conclusion

L'architecture de Diva est **solide et bien pensée** pour un MVP. Les choix technologiques sont pertinents (Fastify, Expo, Supabase, Redis workers). Le pipeline audio streamé est impressionnant et offre une excellente latence.

**Priorité immédiate**: corriger les failles de sécurité (auth WebSocket, fallbacks). Ces issues sont simples à fixer mais critiques.

**À moyen terme**: améliorer la résilience (tests, circuit breaker, session persistence) avant de scaler.

---

*Rapport généré par Winston, Agent Architecte BMAD*  
*Date: 4 mars 2026*
