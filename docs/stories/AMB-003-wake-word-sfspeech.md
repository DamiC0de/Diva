# AMB-003 — Wake Word via SFSpeechRecognizer

**Épique :** Diva Ambient Mode
**Points :** 8
**Sprint :** S1
**Priorité :** P0
**Dépendances :** AMB-001 (audio session), AMB-002 (VAD trigger)

---

## Description

En tant qu'utilisateur de Diva, je veux pouvoir dire "Diva" à tout moment (même avec l'app en background) pour activer l'assistant vocal, afin d'avoir une interaction mains-libres naturelle comme avec Siri.

## Contexte technique

**Ref :** ADR-004 §D2 — Niveau 2

Le wake word est le Niveau 2 de l'architecture. Il n'est activé que quand le VAD (Niveau 1) détecte de la voix. Il utilise `SFSpeechRecognizer` d'Apple pour transcrire l'audio en temps réel et cherche le mot "diva" dans les résultats partiels.

**Contraintes Apple :**
- `SFSpeechRecognizer` a une limite de ~60 secondes de reconnaissance continue
- Il faut restart la session après chaque expiration
- La reconnaissance nécessite la permission `NSSpeechRecognitionUsageDescription`
- Limite de requêtes : ~1000/jour/device (largement suffisant)

**Flow :**
```
VAD détecte voix
  → Créer SFSpeechAudioBufferRecognitionRequest
  → Alimenter avec les buffers AVAudioEngine
  → Recevoir résultats partiels
  → Chercher "diva" (case-insensitive, fuzzy)
  → Si trouvé : émettre onWakeWordDetected + stopper recognition
  → Si silence 5s : stopper recognition (VAD gère)
  → Si timeout 60s : restart recognition
```

## Critères d'acceptation

- [ ] `SFSpeechRecognizer` configuré avec locale `fr-FR`
- [ ] La reconnaissance ne démarre QUE quand le VAD trigger (pas en continu)
- [ ] Le mot "diva" est détecté dans les résultats partiels (`shouldReportPartialResults = true`)
- [ ] Détection fuzzy : "diva", "Diva", "DIVA", "diva !" → tous matchent
- [ ] Cooldown de 2 secondes après une détection (éviter double-trigger)
- [ ] Restart automatique après timeout 60s de SFSpeech
- [ ] Event `onWakeWordDetected` émis vers JS avec le transcript complet
- [ ] Score de confiance vérifié (> 0.5 si disponible)
- [ ] Fonctionne en background (via la session audio de AMB-001)
- [ ] Permission Speech Recognition demandée à l'onboarding
- [ ] Gestion d'erreur : si SFSpeech indisponible (pas de réseau pour la première init), fallback silencieux

## Tâches de dev

1. **Créer `WakeWordDetector.swift`** (4h)
   - Initialisation `SFSpeechRecognizer(locale: fr-FR)`
   - Méthode `startDetection(audioEngine: AVAudioEngine)`
   - `SFSpeechAudioBufferRecognitionRequest` avec partial results
   - Keyword matching : `transcript.lowercased().contains("diva")`
   - Cooldown timer (2s)
   - Auto-restart après timeout 60s
   - Delegate : `onWakeWordDetected(transcript: String)`

2. **Intégrer VAD → WakeWord** (2h)
   - VAD `onVoiceDetected` → `WakeWordDetector.startDetection()`
   - VAD `onSilenceDetected` → `WakeWordDetector.stopDetection()`
   - Gestion des transitions d'état

3. **Bridge vers JS** (1h)
   - Event `onWakeWordDetected` avec payload `{ transcript, confidence }`
   - Mise à jour du hook `useDivaAmbient()` côté JS
   - Connecter au `toggleSession()` de `useVoiceSession`

4. **Test sur device** (1h)
   - Tester en foreground et background
   - Tester avec bruit ambiant
   - Tester le restart après timeout 60s
   - Mesurer la latence wake word → activation

## Tests requis

- [ ] **Test manuel :** Dire "Diva" en foreground → détection en < 1s
- [ ] **Test manuel :** Dire "Diva" en background → détection en < 2s
- [ ] **Test manuel :** Dire "Diva" puis immédiatement après → pas de double trigger (cooldown)
- [ ] **Test manuel :** Dire des mots similaires ("diva!", "divague", "elle est diva") → seul "diva" trigger
- [ ] **Test manuel :** Attendre 60s+ sans parler → SFSpeech restart sans crash
- [ ] **Test manuel :** Mode avion → SFSpeech on-device fonctionne (iOS 17+)
- [ ] **Test unitaire Swift :** keyword matching avec variations

## Definition of Done

- [ ] Code pushé sur branche `feature/ambient-mode`
- [ ] Wake word "diva" détecté en foreground ET background
- [ ] Latence < 2s entre "diva" prononcé et event JS reçu
- [ ] Pas de false positive sur 5 minutes de conversation normale
- [ ] Restart automatique SFSpeech vérifié
- [ ] Test sur device physique (iPhone)
