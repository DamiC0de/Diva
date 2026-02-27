# EL-010 — Wake Word Porcupine ("Hey Elio")

**Épique :** E2 — Pipeline vocal
**Sprint :** S2
**Points :** 5
**Priorité :** P1
**Dépendances :** EL-012 (App Expo), EL-009 (Orchestrateur)

---

## Description

En tant qu'**utilisateur**, je veux dire "Hey Elio" pour activer l'assistant sans toucher mon téléphone, afin d'avoir une expérience mains-libres naturelle.

## Contexte technique

- **Picovoice Porcupine** : détection wake word on-device (pas de cloud)
- **SDK React Native** : `@picovoice/porcupine-react-native`
- **CPU** : <4% en écoute permanente
- **Wake word custom** : "Hey Elio" (entraîné via Picovoice Console)
- **3 modes** : Always-on, Smart (activé selon contexte), Manual (bouton PTT uniquement)

### Flux

```
Micro (toujours actif)
    │
    ▼
Porcupine (on-device)
    │ wake word détecté
    ▼
Feedback haptic + visuel (LED/animation)
    │
    ▼
Début enregistrement audio
    │ silence détecté (VAD)
    ▼
Envoi audio → Orchestrateur (EL-009)
```

## Critères d'acceptation

- [ ] Porcupine SDK intégré avec wake word custom "Hey Elio"
- [ ] 3 modes configurables dans settings : Always-on / Smart / Manual
- [ ] Mode Always-on : écoute en permanence (même app en foreground sans focus)
- [ ] Détection déclenche : feedback haptic + animation visuelle (cercle pulsant)
- [ ] Après détection : micro enregistre jusqu'à silence (VAD ~1.5s) ou bouton stop
- [ ] Audio capturé envoyé à l'orchestrateur (EL-009) via WebSocket
- [ ] Consommation batterie <4% en Always-on sur 1h
- [ ] Faux positifs <1 par heure en environnement calme
- [ ] Fonctionne en foreground (background audio = stretch goal, limitations iOS)
- [ ] Bouton PTT (Push-to-Talk) comme fallback pour mode Manual
- [ ] Permission micro demandée proprement au premier usage
- [ ] Setting pour désactiver complètement le wake word

## Tâches de dev

1. **Picovoice Console** (~1h)
   - Créer compte Picovoice, obtenir AccessKey
   - Entraîner wake word custom "Hey Elio" (FR)
   - Télécharger le modèle `.ppn`

2. **SDK Integration** (~3h)
   - `@picovoice/porcupine-react-native` install + prebuild Expo
   - Init Porcupine avec le modèle custom
   - Listener `onWakeWordDetected` → déclenche le pipeline
   - Gestion lifecycle (start/stop selon mode)

3. **Audio capture post-wake** (~2h)
   - Après wake word : démarrer l'enregistrement (`expo-av` ou `react-native-audio-api`)
   - VAD simple : silence >1.5s → fin d'enregistrement
   - Encoder en Opus et envoyer via WS

4. **UI feedback** (~1h)
   - Animation cercle pulsant quand wake word détecté
   - Feedback haptic (`expo-haptics`)
   - Indicateur visuel "Elio écoute..." pendant l'enregistrement
   - Bouton PTT pour mode Manual

5. **Settings** (~0.5h)
   - Sélecteur mode : Always-on / Smart / Manual
   - Toggle on/off wake word
   - Persister dans user settings (Supabase)

## Tests requis

- **Unitaire :** Porcupine init sans crash avec le modèle custom
- **Intégration :** Wake word → enregistrement → envoi audio → réponse
- **Performance :** CPU <4% en mode Always-on (profiler Xcode)
- **Manuel :** Dire "Hey Elio" dans différentes conditions (calme, bruit, distance)
- **Manuel :** Vérifier taux de faux positifs sur 1h

## Definition of Done

- [ ] "Hey Elio" détecté de manière fiable
- [ ] Pipeline complet wake → réponse vocale fonctionne
- [ ] 3 modes configurables
- [ ] Batterie acceptable
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
