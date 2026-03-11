# AMB-002 — VAD (Voice Activity Detection)

**Épique :** Diva Ambient Mode
**Points :** 5
**Sprint :** S1
**Priorité :** P0
**Dépendances :** AMB-001 (BackgroundAudioManager doit fournir le buffer audio)

---

## Description

En tant qu'utilisateur de Diva, je veux que le système détecte quand quelqu'un parle à proximité, afin d'activer la reconnaissance vocale uniquement quand c'est nécessaire et préserver ma batterie.

## Contexte technique

**Ref :** ADR-004 §D2 — Niveau 1

Le VAD est le premier filtre dans l'architecture à 2 niveaux. Il analyse l'amplitude audio (RMS) en continu avec un coût CPU minimal (~2%). Quand de la voix est détectée, il active le Niveau 2 (SFSpeechRecognizer). Quand le silence revient, il désactive le Niveau 2.

**Algorithme :**
```
Pour chaque buffer audio (4096 samples) :
  1. Calculer RMS = sqrt(sum(sample²) / n)
  2. Convertir en dB = 20 * log10(RMS)
  3. Si dB > seuil (-40 dB) pendant > 200ms :
     → Émettre event "voiceDetected"
     → Activer timer silence (5s)
  4. Si dB < seuil pendant > 5s :
     → Émettre event "silenceDetected"
```

## Critères d'acceptation

- [ ] Le VAD analyse les buffers audio fournis par `BackgroundAudioManager`
- [ ] Calcul RMS correct avec conversion en dB
- [ ] Seuil configurable (défaut : -40 dB)
- [ ] Durée minimale de voix configurable (défaut : 200ms)
- [ ] Timeout silence configurable (défaut : 5s)
- [ ] Event `onVoiceDetected` émis quand voix détectée
- [ ] Event `onSilenceDetected` émis après timeout silence
- [ ] Le VAD fonctionne en background (pas de dépendance UI)
- [ ] Consommation CPU < 3% en continu

## Tâches de dev

1. **Créer `VoiceActivityDetector.swift`** (3h)
   - Classe qui reçoit les buffers audio
   - Calcul RMS + conversion dB
   - State machine : silent → speaking → silent
   - Timers pour durée minimale voix et timeout silence
   - Delegate/callback pattern

2. **Intégrer dans `BackgroundAudioManager`** (1h)
   - Passer les buffers du tap `AVAudioEngine` au VAD
   - Router les events VAD vers le module Expo

3. **Calibration et test** (1h)
   - Tester avec différents niveaux de bruit ambiant
   - Ajuster le seuil -40 dB si nécessaire
   - Vérifier que la musique en background ne trigger pas le VAD

## Tests requis

- [ ] **Test manuel :** Silence complet → pas de trigger
- [ ] **Test manuel :** Parler → trigger en < 500ms
- [ ] **Test manuel :** Musique en background (faible) → pas de trigger
- [ ] **Test manuel :** TV/radio en background → trigger acceptable
- [ ] **Test unitaire Swift :** RMS calculation avec buffers connus

## Definition of Done

- [ ] Code pushé sur branche `feature/ambient-mode`
- [ ] VAD détecte la voix avec < 500ms de latence
- [ ] VAD ne trigger pas sur le bruit ambiant normal
- [ ] Test sur device physique
