# Brief Produit — Diva Ambient Mode

**Date:** 2026-03-11
**Auteur:** Mary (Analyste BMAD)
**Projet:** Diva — Assistant vocal iOS
**Priorité:** P0 (Core Experience)

---

## 1. Vision

**Diva doit être invisible.** L'utilisateur lance l'app une fois, puis elle disparaît. Diva écoute en arrière-plan. Quand l'utilisateur dit "Diva", l'assistant s'active instantanément, peu importe ce que l'utilisateur fait sur son téléphone — naviguer sur Safari, être sur Instagram, ou même avec l'écran verrouillé.

**Référence UX :** ChatGPT Advanced Voice (Dynamic Island + Live Activity) — écoute active en background avec indicateur visuel discret.

---

## 2. Analyse des contraintes iOS

### Ce qu'iOS permet ✅
- **Background Audio Mode** : une app peut maintenir une session audio en background si elle déclare `UIBackgroundModes: audio`
- **AVAudioSession .playAndRecord** : maintient le micro ouvert en background
- **Live Activity / Dynamic Island** : indicateur visuel persistant sans UI plein écran
- **Local Notifications** : ramener l'app au premier plan via tap
- **Background Tasks** : BGProcessingTask et BGAppRefreshTask

### Ce qu'iOS limite ⚠️
- **Speech Recognition en background** : Apple limite à ~1 minute de reconnaissance vocale continue en background (SFSpeechRecognizer). Après, la session expire.
- **Live Activity refresh** : limité à 15 minutes sur iOS 18+, nécessite réactivation
- **Indicateur micro orange** : iOS affiche TOUJOURS un point orange quand le micro est actif — l'utilisateur verra que Diva écoute (c'est un AVANTAGE côté confiance/transparence)
- **App Review** : Apple peut rejeter une app qui maintient le micro ouvert "sans raison évidente". Il faut justifier l'usage (assistant vocal = OK, c'est le même use case que Alexa/Google Assistant)

### Ce qu'iOS interdit ❌
- Démarrer l'écoute depuis le background sans interaction utilisateur préalable
- Contourner le point orange du micro
- Écouter indéfiniment sans session audio active

---

## 3. Architecture technique recommandée

### Couche 1 — Background Audio Session (Core)

```
[App Launch] 
    → Démarre AVAudioSession (.playAndRecord, .defaultToSpeaker)
    → Configure BGAudioSession avec mixWithOthers
    → App passe en background → session audio maintenue
    → Micro reste ouvert (point orange visible)
```

**Fichier clé :** `BackgroundAudioManager.swift` (module natif Expo)

**Configuration app.json :**
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["audio", "fetch", "processing"],
      "NSMicrophoneUsageDescription": "Diva écoute le mot-clé 'Diva' pour s'activer quand tu en as besoin.",
      "NSSpeechRecognitionUsageDescription": "Diva utilise la reconnaissance vocale pour détecter quand tu dis 'Diva'."
    }
  }
}
```

### Couche 2 — Wake Word Detection (Optimisé batterie)

**Stratégie hybride à 2 niveaux :**

1. **Niveau 1 — Détection audio low-level (toujours actif)**
   - `AVAudioEngine` avec tap sur le bus d'entrée
   - Analyse d'amplitude (VAD — Voice Activity Detection)
   - Consommation minimale (~2-5% batterie/heure)
   - Quand de la voix est détectée → active le Niveau 2

2. **Niveau 2 — Speech Recognition (activé à la demande)**
   - `SFSpeechRecognizer` activé uniquement quand le VAD détecte de la voix
   - Cherche le keyword "Diva" dans la transcription
   - Se désactive après 5s de silence
   - Consommation réduite car n'écoute pas en continu

**Avantage :** Le micro est ouvert en permanence (point orange) mais la reconnaissance vocale gourmande ne tourne que quand quelqu'un parle.

### Couche 3 — Live Activity / Dynamic Island

```
[Diva en écoute background]
    → Live Activity active sur écran de verrouillage
    → Compact: petit orbe animé + "Diva écoute"
    → Expanded: orbe + "Dis 'Diva' pour commencer"
    → Dynamic Island: pulsation subtile (respiration)
```

**Quand "Diva" est détecté :**
```
[Wake Word détecté]
    → Haptic feedback (.heavy)
    → Live Activity update: orbe en mode listening
    → Dynamic Island: expansion avec waveform
    → Si app en background: notification silencieuse + ramener au premier plan
    → Commence l'enregistrement vocal → pipeline STT → LLM → TTS
```

### Couche 4 — Widget écran de verrouillage (Fallback)

Si iOS tue la session background (après ~5 min d'inactivité audio) :
- Widget WidgetKit sur l'écran de verrouillage
- Tap → relance l'app + l'écoute
- "Diva est en pause — tape pour relancer"

---

## 4. User Flow complet

```
1. Premier lancement
   ├── Onboarding : "Diva va écouter en arrière-plan"
   ├── Demande permissions : micro ✅, speech recognition ✅, notifications ✅
   ├── Active Live Activity
   └── Commence l'écoute background

2. Utilisation quotidienne
   ├── L'utilisateur ouvre l'app → voit l'orbe en mode idle
   ├── Ferme l'app / switch vers une autre app
   ├── Point orange visible = Diva écoute
   ├── Dynamic Island : petite pulsation
   └── L'utilisateur dit "Diva"
       ├── Haptic + son d'activation
       ├── Dynamic Island expand → waveform
       ├── L'utilisateur parle sa demande
       ├── Diva répond vocalement (TTS)
       ├── Dynamic Island : mode speaking
       └── Retour en écoute passive

3. Edge cases
   ├── Appel téléphonique → Diva se met en pause
   ├── Musique → Diva écoute par-dessus (mixWithOthers)
   ├── iOS kill l'app → Widget fallback
   └── Batterie < 20% → Diva se met en mode éco (pas d'écoute)
```

---

## 5. Concurrence — Benchmark

| Feature | Diva (cible) | ChatGPT Voice | Siri | Alexa iOS |
|---------|-------------|---------------|------|-----------|
| Wake word background | ✅ "Diva" | ❌ Tap requis | ✅ "Hey Siri" | ⚠️ Très limité |
| Dynamic Island | ✅ | ✅ | ✅ (natif) | ❌ |
| Live Activity | ✅ | ✅ | ✅ (natif) | ❌ |
| Écoute continue BG | ✅ (audio session) | ⚠️ (timeout) | ✅ (natif) | ❌ |
| Conversation fluide | ✅ | ✅ | ⚠️ | ⚠️ |
| Widget fallback | ✅ | ❌ | N/A | ❌ |
| Batterie aware | ✅ | ⚠️ | ✅ (natif) | ❌ |

**Avantage compétitif de Diva :** Le seul assistant tiers avec un vrai wake word en background + Dynamic Island + conversation naturelle.

---

## 6. Stories à créer

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| AMB-001 | Background Audio Session Manager (module natif) | 8 | S1 |
| AMB-002 | VAD (Voice Activity Detection) low-level | 5 | S1 |
| AMB-003 | Wake word via SFSpeechRecognizer (2 niveaux) | 8 | S1 |
| AMB-004 | Live Activity — état écoute passive | 5 | S1 |
| AMB-005 | Live Activity — état conversation active | 5 | S2 |
| AMB-006 | Dynamic Island — compact + expanded | 5 | S2 |
| AMB-007 | Transition background → foreground au wake word | 3 | S2 |
| AMB-008 | Gestion interruptions (appel, musique) | 3 | S2 |
| AMB-009 | Widget écran de verrouillage (fallback) | 3 | S3 |
| AMB-010 | Mode économie batterie | 2 | S3 |
| AMB-011 | Indicateur visuel discret (point orange = feature, pas bug) | 2 | S3 |

**Total : 49 points — 3 sprints (~6 semaines)**

---

## 7. Risques

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Apple rejette l'app (micro en BG) | Critique | Moyenne | Justifier usage assistant vocal + transparence (point orange) |
| Batterie excessive | Élevé | Moyenne | VAD 2 niveaux + mode éco |
| Speech Recognition timeout en BG | Moyen | Haute | Restart automatique + fallback VAD-only |
| Faux positifs wake word | Moyen | Moyenne | Cooldown + confirmation via Dynamic Island |
| iOS tue l'app en background | Moyen | Haute | Widget fallback + BGProcessingTask |

---

## 8. Recommandation

**Commencer par AMB-001 + AMB-002 + AMB-003** — le cœur du système. Si le background audio + wake word fonctionne de manière stable, le reste (Live Activity, Dynamic Island, Widget) est de la finition UI.

Le module natif `BackgroundAudioManager` est le composant le plus critique — il doit être écrit en Swift natif (pas en JS) pour garantir la performance et l'intégration avec AVAudioEngine.

**Prochaine étape :** Validation par Winston (architecte) pour l'ADR du module natif, puis Bob (SM) pour le sprint planning.
