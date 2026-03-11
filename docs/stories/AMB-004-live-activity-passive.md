# AMB-004 — Live Activity — État écoute passive

**Épique :** Diva Ambient Mode
**Points :** 5
**Sprint :** S1
**Priorité :** P1
**Dépendances :** AMB-001 (session background active)

---

## Description

En tant qu'utilisateur de Diva, je veux voir un indicateur discret sur mon écran de verrouillage et dans la Dynamic Island quand Diva écoute, afin de savoir qu'elle est active sans ouvrir l'app.

## Contexte technique

**Ref :** ADR-004 §D4

Live Activity via `ActivityKit`. Nécessite une Widget Extension target dans Xcode.

**Structure Xcode :**
```
DivaLiveActivity/  (Widget Extension target)
  ├── DivaLiveActivityBundle.swift
  ├── DivaLiveActivity.swift          ← Layouts (lock screen + Dynamic Island)
  └── DivaActivityAttributes.swift    ← Modèle de données
```

**États pour cette story :**
- `listening` — orbe en respiration douce, texte "Diva écoute"
- `paused` — icône pause, texte "Diva en pause"

## Critères d'acceptation

- [ ] Widget Extension target créé dans le projet Xcode
- [ ] `ActivityAttributes` défini avec `DivaAmbientState`
- [ ] Live Activity démarre automatiquement quand le mode Ambient s'active
- [ ] **Lock screen :** Orbe Diva (petit, couleur indigo) + texte "Dis 'Diva' pour commencer"
- [ ] **Dynamic Island compact :** Petit orbe (8pt) avec couleur indigo, pulsation subtile
- [ ] **Dynamic Island expanded :** Orbe + texte état + bouton pour ouvrir l'app
- [ ] La Live Activity se met à jour quand l'état change (listening ↔ paused)
- [ ] La Live Activity se termine quand le mode Ambient est désactivé
- [ ] Fonctionne sur iPhone 14 Pro+ (Dynamic Island) et iPhone 15+ (all models)

## Tâches de dev

1. **Créer la Widget Extension target** (1h)
   - Ajouter target dans Xcode
   - Configurer signing + App Group (partage données)
   - `DivaLiveActivityBundle.swift`

2. **Définir `DivaActivityAttributes`** (30min)
   - `ActivityAttributes` avec état ambient
   - `ContentState` : `state: DivaAmbientState`, `lastUpdate: Date`

3. **Implémenter les layouts Live Activity** (2h)
   - Lock screen layout (SwiftUI)
   - Dynamic Island compact (leading + trailing)
   - Dynamic Island expanded
   - Animations subtiles (pulsation orbe)

4. **Bridge ActivityKit ↔ Expo Module** (1h)
   - Démarrer/arrêter la Live Activity depuis `DivaAmbientModule`
   - Mettre à jour l'état via `Activity.update()`

5. **Intégrer plugin Expo** (30min)
   - `app.plugin.js` pour configurer le target dans le prebuild

## Tests requis

- [ ] **Test manuel :** Activer Ambient → Live Activity apparaît sur lock screen
- [ ] **Test manuel :** Dynamic Island affiche l'orbe compact
- [ ] **Test manuel :** Tap sur Dynamic Island → ouvre l'app
- [ ] **Test manuel :** Désactiver Ambient → Live Activity disparaît

## Definition of Done

- [ ] Widget Extension compilée et fonctionnelle
- [ ] Live Activity visible sur lock screen + Dynamic Island
- [ ] États listening/paused correctement affichés
- [ ] Test sur device physique (iPhone 14 Pro ou +)
