# EL-031 — Widget iOS + Live Activities

**Épique :** E7 — Onboarding & UX
**Sprint :** S4
**Points :** 5
**Priorité :** P2
**Dépendances :** EL-012 (App Expo), EL-016 (Notifications), EL-018 (Calendar)

---

## Description

En tant qu'**utilisateur**, je veux un widget iOS sur mon écran d'accueil et des Live Activities, afin d'interagir avec Elio sans ouvrir l'app.

## Contexte technique

- **WidgetKit** (iOS 16+) : widgets sur l'écran d'accueil et écran de verrouillage
- **Live Activities** (iOS 16.1+) : bandeau persistant sur l'écran de verrouillage + Dynamic Island
- ⚠️ **Module natif requis** : WidgetKit n'a pas de wrapper Expo → code Swift natif
- Communication via App Groups (comme le clavier EL-022)

### Widgets proposés

```
Small (2x2)          Medium (4x2)                    Live Activity
┌──────────┐    ┌────────────────────────┐    ┌──────────────────────┐
│ 🌅 Elio  │    │ 🌅 Elio          14:30│    │ 🎙️ Elio écoute...    │
│          │    │                        │    │ ░░░░░▓▓▓░░░         │
│  🎙️ Tap  │    │ 📅 Réunion 15h        │    │ [Annuler]           │
│ to talk  │    │ 🌤️ 18° Lyon           │    └──────────────────────┘
│          │    │ 📧 3 mails non lus     │
└──────────┘    │                        │
                │  [🎙️ Parler à Elio]    │
                └────────────────────────┘
```

## Critères d'acceptation

- [ ] **Widget Small** : logo Elio + tap → ouvre l'app en mode PTT
- [ ] **Widget Medium** : prochain RDV + météo + mails non lus + bouton PTT
- [ ] Données mises à jour toutes les 15 min (timeline WidgetKit)
- [ ] Tap sur un élément → deep link vers la section concernée
- [ ] **Live Activity** pendant une requête vocale : "Elio écoute..." / "Elio réfléchit..."
- [ ] Live Activity sur Dynamic Island (iPhone 14 Pro+)
- [ ] Design cohérent avec la charte Elio
- [ ] Widget configurable (choisir quelles infos afficher)
- [ ] Fonctionne sur écran de verrouillage (iOS 16+)

## Tâches de dev

1. **Widget Extension Swift** (~3h)
   - Créer WidgetKit extension dans le projet Xcode (prebuild)
   - App Groups pour partager données avec l'app principale
   - TimelineProvider : refresh toutes les 15 min
   - Small + Medium layouts en SwiftUI

2. **Data provider** (~1.5h)
   - L'app principale écrit les données dans App Groups (UserDefaults partagé) :
    - Prochain événement calendar
    - Météo actuelle
    - Nombre d'emails non lus
   - Le widget lit ces données

3. **Live Activities** (~2h)
   - ActivityKit : démarrer/mettre à jour/terminer une Live Activity
   - États : listening → transcribing → thinking → responding → done
   - Dynamic Island (compact + expanded)
   - Bridge React Native → Swift (native module)

4. **Deep linking** (~0.5h)
   - Tap widget → `elio://conversation` ou `elio://services`
   - URL scheme handlers dans expo-router

## Tests requis

- **Manuel :** Ajouter widget → vérifier données affichées
- **Manuel :** Tap widget → app s'ouvre au bon écran
- **Manuel :** Requête vocale → Live Activity visible sur lock screen
- **Manuel :** Dynamic Island affiche l'état (si iPhone 14 Pro+)

## Definition of Done

- [ ] Widget Small + Medium fonctionnels
- [ ] Données à jour (prochain RDV, météo, mails)
- [ ] Live Activity pendant les requêtes vocales
- [ ] Deep linking opérationnel
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
