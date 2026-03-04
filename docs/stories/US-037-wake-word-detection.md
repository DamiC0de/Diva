# US-037 : Wake Word "Diva"

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-037 |
| **Épique** | E7 — Wake Word |
| **Sprint** | V1.1 (Post-MVP) |
| **Estimation** | 8 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Research |

---

## Description

**En tant qu'** utilisateur
**Je veux** dire "Hey Diva" ou "Diva" pour activer l'écoute
**Afin de** parler à Diva sans toucher mon téléphone

---

## Contexte

Le wake word est une feature avancée qui nécessite :
- Écoute continue en arrière-plan
- Modèle ML de détection de mot-clé
- Optimisation batterie

### Options techniques

| Option | Taille | Latence | Batterie | Difficulté |
|--------|--------|---------|----------|------------|
| Porcupine (Picovoice) | ~2MB | <100ms | Faible | ⭐⭐ |
| Snowboy | ~1MB | <150ms | Faible | ⭐⭐⭐ |
| TensorFlow Lite custom | ~5MB | Variable | Variable | ⭐⭐⭐⭐ |
| Vosk (offline STT) | ~50MB | ~200ms | Moyenne | ⭐⭐⭐ |

**Recommandation** : Porcupine (Picovoice) - SDK React Native disponible

---

## Critères d'acceptation

- [ ] **AC-001** : "Hey Diva" ou "Diva" active l'écoute
- [ ] **AC-002** : Fonctionne en arrière-plan (écran éteint)
- [ ] **AC-003** : Impact batterie < 5%/heure
- [ ] **AC-004** : Latence < 200ms entre mot et activation
- [ ] **AC-005** : Faux positifs < 1/heure en usage normal
- [ ] **AC-006** : Toggle on/off dans settings

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Wake Word Pipeline                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐│
│   │   Microphone  │────►│  Porcupine    │────►│   Activate    ││
│   │   (always on) │     │  Wake Word    │     │   Listening   ││
│   └───────────────┘     └───────────────┘     └───────────────┘│
│                                │                                │
│                                │ "Diva" detected                │
│                                ▼                                │
│                         ┌───────────────┐                      │
│                         │  Haptic +     │                      │
│                         │  Sound cue    │                      │
│                         └───────────────┘                      │
│                                                                  │
│   Mode background:                                              │
│   • iOS: Background Audio + Voip modes                         │
│   • Consommation: ~3-5% batterie/heure                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tâches de développement

### T1 : Setup Picovoice (1h)

```bash
npm install @picovoice/porcupine-react-native
```

```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio", "voip"],
        "NSMicrophoneUsageDescription": "Diva écoute le mot magique pour s'activer"
      }
    },
    "android": {
      "permissions": ["RECORD_AUDIO", "FOREGROUND_SERVICE"]
    }
  }
}
```

### T2 : Créer modèle wake word custom (2h)

1. Aller sur [Picovoice Console](https://console.picovoice.ai/)
2. Créer un nouveau wake word : "Diva"
3. Variantes : "Hey Diva", "OK Diva"
4. Télécharger le modèle (.ppn)

### T3 : Hook useWakeWord (2h)

```typescript
// app/hooks/useWakeWord.ts
import { useState, useEffect, useCallback } from 'react';
import { Porcupine, PorcupineManager } from '@picovoice/porcupine-react-native';
import { AppState, AppStateStatus } from 'react-native';

interface UseWakeWordOptions {
  enabled: boolean;
  onWakeWordDetected: () => void;
}

export function useWakeWord({ enabled, onWakeWordDetected }: UseWakeWordOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manager, setManager] = useState<PorcupineManager | null>(null);
  
  useEffect(() => {
    if (!enabled) {
      manager?.stop();
      return;
    }
    
    const initPorcupine = async () => {
      try {
        const porcupineManager = await PorcupineManager.fromKeywordPaths(
          process.env.EXPO_PUBLIC_PICOVOICE_KEY!,
          ['assets/diva_wake_word.ppn'],
          (keywordIndex: number) => {
            // Wake word detected!
            onWakeWordDetected();
          },
          (error: Error) => {
            setError(error.message);
          }
        );
        
        await porcupineManager.start();
        setManager(porcupineManager);
        setIsListening(true);
      } catch (e) {
        setError(String(e));
      }
    };
    
    initPorcupine();
    
    return () => {
      manager?.stop();
      manager?.delete();
    };
  }, [enabled]);
  
  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && enabled) {
        manager?.start();
      }
      // Note: Ne pas arrêter en background si on veut le wake word en background
    });
    
    return () => subscription.remove();
  }, [manager, enabled]);
  
  return { isListening, error };
}
```

### T4 : Intégration écran principal (1h)

```typescript
// app/app/(main)/index.tsx
import { useWakeWord } from '../../hooks/useWakeWord';
import { useSettings } from '../../hooks/useSettings';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

export default function OrbScreen() {
  const { settings } = useSettings();
  
  const handleWakeWord = useCallback(async () => {
    // Feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Son d'activation (optionnel)
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/wake.mp3')
    );
    await sound.playAsync();
    
    // Activer l'écoute
    toggleSession();
  }, [toggleSession]);
  
  useWakeWord({
    enabled: settings.wakeWordEnabled ?? false,
    onWakeWordDetected: handleWakeWord,
  });
  
  // ...
}
```

### T5 : Settings toggle (30min)

```typescript
// Dans settings.tsx
<SettingRow
  icon="mic"
  title="Wake Word"
  subtitle={settings.wakeWordEnabled ? '"Hey Diva" activé' : 'Désactivé'}
  trailing={
    <Switch
      value={settings.wakeWordEnabled}
      onValueChange={(v) => updateSettings({ wakeWordEnabled: v })}
    />
  }
/>

{settings.wakeWordEnabled && (
  <Text style={styles.batteryWarning}>
    ⚡ Le wake word consomme ~5% de batterie/heure
  </Text>
)}
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | "Hey Diva" avec écran allumé | Activation immédiate |
| 2 | "Diva" avec écran éteint | Activation + réveil écran |
| 3 | Mot similaire "Riva" | Pas d'activation |
| 4 | Environnement bruyant | Détection OK |
| 5 | Toggle off | Pas d'écoute continue |
| 6 | 1h d'usage | Batterie < -5% |

---

## Coûts

| Service | Prix |
|---------|------|
| Picovoice Free | 3 wake words, usage limité |
| Picovoice Pro | $5/mois pour usage illimité |

---

## Alternatives open source

Si Picovoice trop cher :
- **OpenWakeWord** (Python) — nécessite serveur
- **Vosk** avec modèle léger — plus de batterie
- **Custom TFLite** — beaucoup de travail

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
