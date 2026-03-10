# US-005 : Mode mains-libres continu

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-005 |
| **Épique** | E1 — Core Voice |
| **Sprint** | Sprint 2 |
| **Estimation** | 3 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** pouvoir garder l'app en écoute continue
**Afin de** parler à Diva sans toucher mon téléphone

---

## Contexte actuel

L'app a déjà une détection de silence (VAD) qui auto-stop après 2.5s. Le mode mains-libres = après la réponse, relancer automatiquement l'écoute.

---

## Critères d'acceptation

- [ ] **AC-001** : Toggle "Mode conversation" dans settings
- [ ] **AC-002** : Après réponse TTS, relancer l'écoute automatiquement
- [ ] **AC-003** : Indicateur visuel permanent (badge "conversation")
- [ ] **AC-004** : "Stop" ou tap pour arrêter le mode
- [ ] **AC-005** : Timeout après 30s de silence total

---

## Tâches de développement

### T1 : Setting toggle (30min)

```typescript
// app/hooks/useSettings.ts
interface Settings {
  // ...existing
  conversationMode: boolean;
}

// app/app/(main)/settings.tsx
<SettingRow
  icon="chatbubbles"
  title="Mode conversation"
  subtitle="Continue d'écouter après chaque réponse"
  trailing={
    <Switch
      value={settings.conversationMode}
      onValueChange={(v) => updateSettings({ conversationMode: v })}
    />
  }
/>
```

### T2 : Auto-restart listening (1h)

```typescript
// Dans useVoiceSession.ts
useEffect(() => {
  if (orbState === 'idle' && settings.conversationMode && wasJustSpeaking.current) {
    // Petit délai pour éviter de capter la fin du TTS
    const timer = setTimeout(() => {
      startListening();
    }, 500);
    return () => clearTimeout(timer);
  }
}, [orbState, settings.conversationMode]);

// Tracker si on vient de parler
const wasJustSpeaking = useRef(false);
useEffect(() => {
  if (orbState === 'speaking') {
    wasJustSpeaking.current = true;
  } else if (orbState === 'idle') {
    // Reset après 5s d'idle
    const timer = setTimeout(() => {
      wasJustSpeaking.current = false;
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [orbState]);
```

### T3 : Stop command (30min)

```typescript
// Détecter "stop" ou "arrête" dans la transcription
const STOP_COMMANDS = ['stop', 'arrête', 'arrêter', 'termine', 'fin'];

function checkForStopCommand(transcript: string): boolean {
  const lowered = transcript.toLowerCase().trim();
  return STOP_COMMANDS.some(cmd => lowered === cmd || lowered.startsWith(cmd + ' '));
}

// Dans le handler de transcription
if (settings.conversationMode && checkForStopCommand(transcript)) {
  updateSettings({ conversationMode: false });
  speak("D'accord, je m'arrête.");
  return;
}
```

### T4 : Badge visuel (30min)

```typescript
// Dans index.tsx
{settings.conversationMode && (
  <View style={styles.conversationBadge}>
    <Text style={styles.badgeText}>💬 Conversation</Text>
  </View>
)}
```

### T5 : Timeout global (30min)

```typescript
// Arrêter le mode après 30s de silence total
const silenceTimer = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (settings.conversationMode && orbState === 'listening') {
    silenceTimer.current = setTimeout(() => {
      updateSettings({ conversationMode: false });
      speak("Je m'arrête, tu n'as rien dit depuis un moment.");
    }, 30000);
  }
  
  return () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
  };
}, [settings.conversationMode, orbState]);
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Activer mode conversation | Badge visible |
| 2 | Poser une question | Réponse puis relance écoute |
| 3 | Dire "stop" | Mode désactivé |
| 4 | 30s de silence | Auto-désactivation |
| 5 | Tap sur orbe | Arrêt immédiat |

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
