# AMB-001 — Background Audio Session Manager

**Épique :** Diva Ambient Mode
**Points :** 8
**Sprint :** S1
**Priorité :** P0 — Bloquant pour tout le mode Ambient
**Dépendances :** Aucune (story fondation)

---

## Description

En tant qu'utilisateur de Diva, je veux que l'app maintienne le micro ouvert en arrière-plan quand je la quitte, afin que Diva puisse détecter mon wake word sans que j'aie besoin de rouvrir l'app.

## Contexte technique

**Ref :** ADR-004 §D1, §D3

Le cœur du mode Ambient repose sur une session `AVAudioSession` configurée en `.playAndRecord` avec l'option `.mixWithOthers`. Cette session maintient l'app vivante en background tant que le micro est actif (point orange iOS visible).

Le module doit être un **Expo Module natif Swift** (pas un bridge RCT ou un package npm tiers).

**Structure de fichiers :**
```
app/modules/diva-ambient/
  ├── index.ts                          ← Export JS
  ├── src/
  │   └── DivaAmbientModule.ts          ← TypeScript types/interface
  ├── ios/
  │   ├── DivaAmbientModule.swift        ← Expo Module principal
  │   └── BackgroundAudioManager.swift   ← Gestion AVAudioSession + AVAudioEngine
  ├── expo-module.config.json
  └── app.plugin.js                     ← Config plugin (UIBackgroundModes)
```

## Critères d'acceptation

- [ ] Le module natif Swift `DivaAmbientModule` est créé via Expo Module API
- [ ] `AVAudioSession` configuré : `.playAndRecord`, `.mixWithOthers`, `.allowBluetooth`, `.defaultToSpeaker`
- [ ] `AVAudioEngine` démarre avec un tap sur `inputNode` (buffer 4096 samples, 16kHz)
- [ ] Quand l'app passe en background, la session audio reste active (vérifiable via le point orange iOS)
- [ ] Quand l'app revient au foreground, la session continue sans interruption
- [ ] Les interruptions (appel téléphonique, Siri) sont gérées : pause automatique + reprise
- [ ] Le plugin Expo configure automatiquement `UIBackgroundModes: ["audio"]` dans Info.plist
- [ ] Les permissions micro sont demandées au premier lancement
- [ ] L'API JS expose `startListening()`, `stopListening()`, `isListening()`, `getStatus()`
- [ ] Les events `onStatusChange` et `onError` sont émis vers JS

## Tâches de dev

1. **Créer le scaffold Expo Module** (1h)
   - `expo-module.config.json`, `app.plugin.js`, `index.ts`
   - Config plugin pour `UIBackgroundModes`

2. **Implémenter `BackgroundAudioManager.swift`** (4h)
   - Configuration `AVAudioSession`
   - Démarrage/arrêt `AVAudioEngine`
   - Tap sur `inputNode` avec buffer callback
   - Gestion interruptions (`AVAudioSession.interruptionNotification`)
   - Gestion route change (branchement/débranchement casque)

3. **Implémenter `DivaAmbientModule.swift`** (2h)
   - Expo Module definition
   - Functions async : `startListening`, `stopListening`, `isListening`, `getStatus`
   - Event emitters : `onStatusChange`, `onError`
   - Lifecycle management (module init/destroy)

4. **Bridge TypeScript** (1h)
   - Types `AmbientStatus`, `AmbientError`
   - Hook `useDivaAmbient()` basique

5. **Test manuel sur device** (1h)
   - Vérifier background audio (point orange)
   - Vérifier interruption appel
   - Vérifier reprise après interruption

## Tests requis

- [ ] **Test manuel :** App en background → point orange visible → micro actif
- [ ] **Test manuel :** Recevoir un appel → Diva en pause → fin d'appel → Diva reprend
- [ ] **Test manuel :** Brancher/débrancher des AirPods → audio continue
- [ ] **Test unitaire Swift :** `BackgroundAudioManager` start/stop lifecycle

## Definition of Done

- [ ] Code pushé sur branche `feature/ambient-mode`
- [ ] Build iOS réussi sur Mac Mini
- [ ] Test sur device physique (pas simulateur — le micro background ne fonctionne pas sur simulateur)
- [ ] Pas de crash au démarrage
- [ ] Point orange visible en background
- [ ] PR review par l'équipe
