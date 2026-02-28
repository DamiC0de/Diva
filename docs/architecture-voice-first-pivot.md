# Elio — Architecture Voice-First Pivot

**Architecte :** Winston (BMAD)
**Version :** 2.0
**Date :** 28 février 2026
**Contexte :** Pivot UX — d'une app chatbot vers un assistant vocal pur

---

## 1. Vision

Elio n'est **pas un chatbot**. C'est un **assistant vocal** comme Siri, mais intelligent et extensible. L'utilisateur parle, Elio répond par la voix. Zéro texte obligatoire, zéro bulle de chat.

**Principe fondamental :** L'écran est secondaire. La voix est l'interface principale.

---

## 2. Architecture UX — L'Orbe

### 2.1 Écran unique : The Orb

```
┌──────────────────────────────┐
│                              │
│          E L I O             │
│                              │
│                              │
│         ┌────────┐           │
│        ╱  ○○○○○○  ╲         │
│       │  ○ ORBE ○  │        │  ← Animation fluide
│        ╲  ○○○○○○  ╱         │     réagit à la voix
│         └────────┘           │
│                              │
│                              │
│    "Quel temps fait-il ?"    │  ← Transcription éphémère
│                              │     (disparaît après 3s)
│                              │
│              ⚙️               │  ← Réglages (discret)
└──────────────────────────────┘
```

### 2.2 États de l'Orbe

| État | Visuel | Durée |
|------|--------|-------|
| **Idle** | Orbe petit, pulsation douce (respiration), orange atténué | Permanent |
| **Listening** | Orbe grandit, waveform réactive au volume micro, orange vif | Tant que l'user parle |
| **Processing** | Orbe moyen, rotation/shimmer, couleur teal (#2A7B8B) | ~1-2s |
| **Speaking** | Orbe pulse au rythme de la voix TTS, orange solaire | Durée de la réponse |
| **Error** | Flash rouge bref, retour idle | 1s |
| **Action** | Mini-icône contextuelle (☀️ météo, 📧 mail, 🎵 musique) | 2-3s |

### 2.3 Interactions

| Geste | Action |
|-------|--------|
| **Tap** sur l'orbe | Active l'écoute (mode push-to-talk alternatif) |
| **Long press** | Écoute continue (relâche = fin) |
| **"Hé Elio"** | Wake word → active l'écoute (v2, Porcupine) |
| **Swipe up** | Ouvre réglages |
| **Silence 2s** | Fin d'écoute automatique (VAD) |
| **Double tap** | Annule / Stop la réponse en cours |

---

## 3. Architecture technique révisée

### 3.1 Vue d'ensemble

```
┌────────────────────────────────────────┐
│           📱 iPhone (Client)            │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │         Orb Screen               │  │
│  │  - Animated SVG/Lottie orb       │  │
│  │  - expo-av audio capture         │  │
│  │  - expo-av audio playback        │  │
│  │  - WebSocket client              │  │
│  └──────────────┬───────────────────┘  │
│                 │                      │
│  ┌──────────────┴───────────────────┐  │
│  │       Audio Pipeline (local)      │  │
│  │  - VAD (Voice Activity Detection) │  │
│  │  - Chunking (200ms frames)        │  │
│  │  - Opus encoding (optionnel)      │  │
│  └──────────────┬───────────────────┘  │
└─────────────────┼──────────────────────┘
                  │ WebSocket (binary audio frames)
                  ▼
┌────────────────────────────────────────┐
│        🖥️ API Gateway (Fastify)         │
│                                        │
│  ┌─────────┐  ┌───────────────────┐    │
│  │  Auth   │  │  Session Manager  │    │
│  │  JWT    │  │  (per-user state) │    │
│  └─────────┘  └────────┬──────────┘    │
│                        │               │
│  ┌─────────────────────┴────────────┐  │
│  │        Voice Orchestrator        │  │
│  │  - Accumulates audio chunks      │  │
│  │  - Detects end-of-speech (VAD)   │  │
│  │  - Pipelines STT→LLM→TTS        │  │
│  │  - Streams TTS audio back        │  │
│  └─────────────────────┬────────────┘  │
└────────────────────────┼───────────────┘
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │   STT    │   │  Claude  │   │   TTS    │
   │ Whisper  │   │  Haiku   │   │  Piper   │
   │ (Redis)  │   │  (SDK)   │   │ (Redis)  │
   └──────────┘   └────┬─────┘   └──────────┘
                       │
                  ┌────┴─────┐
                  ▼          ▼
            ┌──────────┐ ┌──────────┐
            │Supabase  │ │ Actions  │
            │DB+Auth   │ │ Weather  │
            │+Memories │ │ Apps...  │
            └──────────┘ └──────────┘
```

### 3.2 Protocole WebSocket voice-first

```typescript
// Client → Server
interface AudioFrame {
  type: 'audio_chunk';
  data: ArrayBuffer;      // PCM 16-bit, 16kHz, mono
  sequence: number;
}

interface StartListening {
  type: 'start_listening';  // User tapped orb
}

interface StopListening {
  type: 'stop_listening';   // User released / silence detected
}

interface CancelRequest {
  type: 'cancel';           // Double tap = stop
}

// Server → Client
interface StateChange {
  type: 'state';
  state: 'idle' | 'listening' | 'processing' | 'speaking';
}

interface Transcription {
  type: 'transcription';
  text: string;             // Affiché brièvement sur l'orbe
  final: boolean;
}

interface AudioResponse {
  type: 'audio_response';
  data: ArrayBuffer;        // PCM ou OGG audio
  sequence: number;
  final: boolean;
}

interface ActionFeedback {
  type: 'action';
  action: string;           // 'weather' | 'open_app' | 'reminder' | ...
  icon: string;             // Emoji pour l'orbe
  summary: string;          // Texte court optionnel
}

interface Error {
  type: 'error';
  message: string;
}
```

### 3.3 Flux audio détaillé

```
User parle    App capture    WebSocket     Server        STT          Claude       TTS
    │              │             │            │            │             │           │
    │──voix──────▶│             │            │            │             │           │
    │              │──PCM 16k──▶│            │            │             │           │
    │              │  (chunks)   │──frames──▶│            │             │           │
    │              │             │            │──accumule──│             │           │
    │──silence 2s──│             │            │            │             │           │
    │              │──stop──────▶│            │            │             │           │
    │              │             │  state:    │──audio───▶│             │           │
    │              │◀────────────│ processing │            │             │           │
    │              │             │            │◀──text────│             │           │
    │              │◀────────────│ transcript │            │──prompt───▶│           │
    │              │             │            │            │             │──text───▶│
    │              │             │            │            │◀──réponse──│           │
    │              │             │            │            │             │◀──audio──│
    │              │◀────────────│ audio_resp │◀───stream──│             │          │
    │◀──parle──────│             │  state:    │            │             │           │
    │              │             │  speaking  │            │             │           │
    │              │◀────────────│ state:idle │            │             │           │
```

---

## 4. Structure app React Native révisée

```
app/
├── (auth)/
│   ├── login.tsx              # Email/password simple
│   └── register.tsx           #
├── (main)/
│   ├── _layout.tsx            # Pas de tab bar !
│   ├── index.tsx              # ⭐ L'ÉCRAN ORB (seul écran principal)
│   └── settings.tsx           # Accessible via swipe/icône
├── (onboarding)/
│   └── index.tsx              # Première ouverture, choix voix
└── index.tsx                  # Root redirect
│
components/
├── Orb/
│   ├── OrbView.tsx            # ⭐ Composant orbe animé (SVG/Reanimated)
│   ├── OrbWaveform.tsx        # Waveform réactive au volume
│   ├── OrbStates.ts           # Machine à états de l'orbe
│   └── ActionIcon.tsx         # Mini-icône contextuelle
├── TranscriptOverlay.tsx      # Texte éphémère (fade in/out)
└── ui/                        # Composants partagés
│
hooks/
├── useVoiceSession.ts         # ⭐ Hook principal : capture → WS → playback
├── useAudioCapture.ts         # expo-av recording
├── useAudioPlayback.ts        # expo-av playback (réponse TTS)
├── useVAD.ts                  # Voice Activity Detection (silence = stop)
└── useOrbState.ts             # State machine de l'orbe
│
lib/
├── supabase.ts                # Client Supabase
├── websocket.ts               # WebSocket manager (binary frames)
└── audioUtils.ts              # PCM conversion, chunking
```

### 4.1 Suppression du chat

**Fichiers à supprimer :**
- `components/MessageBubble.tsx`
- `components/PTTButton.tsx` (remplacé par l'Orb)
- Tab bar navigation (remplacée par écran unique)
- Écran `memories.tsx` (les memories restent côté serveur, invisible pour l'user)
- Écran `services.tsx` (connexion services = dans settings)

**Écrans restants :** 3 seulement
1. **Orb** (home) — L'expérience vocale
2. **Settings** — Réglages, connexion services, compte
3. **Onboarding** — Première config (voix, prénom, tutoriel vocal)

---

## 5. Animation de l'Orbe — Spécifications

### 5.1 Technologie

```
react-native-reanimated 3    → Animations fluides 60fps
react-native-svg              → Rendu de l'orbe
expo-av                        → Capture & playback audio
```

### 5.2 Design de l'Orbe

```
                    Idle                    Listening
              
           ┌──────────────┐          ┌──────────────────┐
           │    ╭─────╮   │          │   ╭───────────╮  │
           │   ╱ ░░░░░ ╲  │          │  ╱ ▓▓▓▓▓▓▓▓▓ ╲ │
           │  │  ░░░░░░ │ │    →     │ │  ▓▓▓▓▓▓▓▓▓▓ ││
           │   ╲ ░░░░░ ╱  │          │  ╲ ▓▓▓▓▓▓▓▓▓ ╱ │
           │    ╰─────╯   │          │   ╰───────────╯  │
           │   80px, 30%  │          │   140px, 100%     │
           │   opacity    │          │   + waveform      │
           └──────────────┘          └──────────────────┘

              Processing                  Speaking

          ┌──────────────────┐      ┌──────────────────┐
          │   ╭───────────╮  │      │   ╭───────────╮  │
          │  ╱ ◊◊◊◊◊◊◊◊◊ ╲ │      │  ╱ ●●●●●●●●● ╲ │
          │ │  ◊◊ TEAL ◊◊◊ ││      │ │  ● PULSE ●● ││
          │  ╲ ◊◊◊◊◊◊◊◊◊ ╱ │      │  ╲ ●●●●●●●●● ╱ │
          │   ╰───────────╯  │      │   ╰───────────╯  │
          │   120px, rotate  │      │   120px, rhythm   │
          │   shimmer        │      │   pulse to audio   │
          └──────────────────┘      └──────────────────┘
```

### 5.3 Palette Orbe

| État | Couleur | Effet |
|------|---------|-------|
| Idle | `#FF8C42` 30% opacity | Pulsation lente (3s cycle) |
| Listening | `#FF8C42` 100% + glow | Waveform réactive + scale up |
| Processing | `#2A7B8B` (teal) | Rotation + shimmer gradient |
| Speaking | `#FF8C42` → `#7ECFB3` gradient | Pulse synchronisé au volume TTS |
| Error | `#DC2626` flash | Shake 200ms + retour idle |

---

## 6. Voice Orchestrator côté serveur (révision)

### 6.1 Nouveau flux

```typescript
// server/src/services/voiceOrchestrator.ts

class VoiceOrchestrator {
  private sessions: Map<string, VoiceSession>;

  handleConnection(ws: WebSocket, userId: string) {
    const session = new VoiceSession(userId, ws);
    this.sessions.set(userId, session);

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        session.addAudioChunk(data as Buffer);
      } else {
        const msg = JSON.parse(data.toString());
        switch (msg.type) {
          case 'start_listening':
            session.startListening();
            break;
          case 'stop_listening':
            session.stopAndProcess();
            break;
          case 'cancel':
            session.cancel();
            break;
        }
      }
    });
  }
}

class VoiceSession {
  private audioBuffer: Buffer[] = [];
  private state: 'idle' | 'listening' | 'processing' | 'speaking';

  async stopAndProcess() {
    this.setState('processing');
    
    // 1. Concat audio chunks
    const audio = Buffer.concat(this.audioBuffer);
    this.audioBuffer = [];
    
    // 2. STT
    const text = await this.stt(audio);
    this.ws.send(JSON.stringify({ 
      type: 'transcription', text, final: true 
    }));
    
    // 3. Claude LLM (avec tools + memories)
    const response = await this.llm(text);
    
    // 4. Execute actions si besoin
    if (response.toolCalls) {
      for (const tool of response.toolCalls) {
        const result = await this.executeAction(tool);
        this.ws.send(JSON.stringify({
          type: 'action', action: tool.name, icon: getIcon(tool.name)
        }));
      }
    }
    
    // 5. TTS → stream audio back
    this.setState('speaking');
    const audioResponse = await this.tts(response.text);
    this.ws.send(audioResponse);  // binary
    
    this.setState('idle');
  }
}
```

### 6.2 Latence cible

| Étape | Budget | Optimisation |
|-------|--------|--------------|
| Audio → STT | 300ms | faster-whisper int8, audio court |
| STT → Claude | 500ms | Prompt caching, Haiku |
| Tool execution | 300ms | Parallel si possible |
| Claude → TTS | 200ms | Piper streaming |
| TTS → Client | 100ms | Binary WS, pas d'encodage |
| **Total** | **< 1.5s** | |

---

## 7. Changements backend nécessaires

### 7.1 WebSocket route (révision)

Le `/ws` actuel gère du JSON. Il doit maintenant :
- Accepter des **frames binaires** (audio PCM)
- Envoyer des **frames binaires** (audio TTS) en retour
- Garder le JSON pour les messages de contrôle (state, transcription, error)

### 7.2 VAD côté serveur (optionnel)

Si on veut détecter la fin de parole côté serveur plutôt que côté app :
- **Silero VAD** (Python, léger) en complément du STT worker
- Ou simple détection de silence : 1.5s de volume < threshold = fin

### 7.3 Fichiers serveur à modifier

| Fichier | Changement |
|---------|------------|
| `routes/ws.ts` | Binary frames, protocole voice-first |
| `services/orchestrator.ts` | Refactor → VoiceOrchestrator |
| `services/llm.ts` | Inchangé |
| `services/actions/*` | Inchangé |
| `lib/redis.ts` | Inchangé |

---

## 8. Plan d'implémentation

### Phase 1 — Orb UI (2-3 jours)
1. Supprimer le chat UI, tab bar, écrans inutiles
2. Créer `OrbView` avec react-native-reanimated + SVG
3. Implémenter les 5 états visuels
4. Hook `useVoiceSession` : tap → capture → WS → playback

### Phase 2 — Voice Pipeline (1-2 jours)
1. Refactor `ws.ts` pour binary audio frames
2. Créer `VoiceOrchestrator` (remplace le chat orchestrator)
3. Tester tap → parle → réponse vocale end-to-end

### Phase 3 — Polish (1-2 jours)
1. Transcription overlay éphémère
2. Action icons sur l'orbe
3. Animations fluides (spring, easing)
4. Onboarding vocal ("Dis bonjour à Elio")

### Phase 4 — Wake Word (v2)
1. Intégrer Porcupine (nécessite `expo prebuild`)
2. "Hé Elio" → active l'écoute sans toucher l'écran

---

## 9. Ce qu'on garde vs. ce qu'on jette

| Composant | Statut |
|-----------|--------|
| ✅ Backend Fastify + routes | **Garde** |
| ✅ STT worker (faster-whisper) | **Garde** |
| ✅ TTS worker (Piper) | **Garde** |
| ✅ LLM service (Claude) | **Garde** |
| ✅ Actions (météo, apps, rappels) | **Garde** |
| ✅ Supabase (auth, DB, memories) | **Garde** |
| ✅ Redis queues | **Garde** |
| ✅ Settings screen | **Garde** (simplifié) |
| ✅ Auth flow | **Garde** |
| ❌ Chat bubbles / MessageBubble | **Supprime** |
| ❌ Tab bar 4 onglets | **Supprime** |
| ❌ Services screen | **Supprime** (→ settings) |
| ❌ Memories screen | **Supprime** (invisible) |
| ❌ PTTButton composant | **Supprime** (→ Orb) |
| ❌ Keyboard extension stories | **Reporte** (v2) |
| ❌ Widget iOS | **Reporte** (v2) |
| 🔄 WebSocket protocol | **Refactor** (→ binary audio) |
| 🔄 Orchestrator | **Refactor** (→ VoiceOrchestrator) |
| 🔄 Onboarding | **Refactor** (→ vocal) |

---

## 10. ADR — Passage au voice-first

**Décision :** Supprimer le chat UI et passer à une interface orbe vocale pure.

**Contexte :** L'app MVP était parti sur un modèle chatbot avec bulles de texte. Ce n'est pas la vision du produit : Elio est un assistant vocal, pas un chatbot.

**Conséquences :**
- UX radicalement simplifiée (1 écran principal)
- Différenciation forte vs. les chatbots existants (ChatGPT, Gemini)
- Nécessite animation fluide de l'orbe (technique)
- Le pipeline backend reste quasi-identique
- Latence plus critique (l'user attend une réponse vocale, pas du texte)

**Risques :**
- Accessibilité : certains users préfèrent le texte → transcription optionnelle
- Environnement bruyant : fallback texte nécessaire à terme
- Animations complexes sur vieux devices → tester perf

---

*Document généré par Winston — Architecte Elio*
*Validé par : En attente de review Georges*
