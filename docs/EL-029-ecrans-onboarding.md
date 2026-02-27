# EL-029 — Écrans Onboarding (4 étapes)

**Épique :** E7 — Onboarding & UX
**Sprint :** S3
**Points :** 5
**Priorité :** P2
**Dépendances :** EL-012 (Setup Expo), EL-003 (Auth)

---

## Description

En tant que **nouvel utilisateur**, je veux un onboarding guidé en 4 étapes, afin de comprendre ce qu'Elio fait et configurer mes préférences de base.

## Contexte technique

- **4 écrans** swipables (horizontal pager)
- Affiché uniquement au premier lancement (flag `onboarding_completed` dans settings)
- Animations Lottie ou Reanimated
- Collecte les préférences initiales (prénom, tu/vous, services à connecter)

### Flow onboarding

```
1. Bienvenue          2. Permissions        3. Personnalisation     4. Connexion
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │    │              │
│  🌅 Elio     │    │  🎙️ Micro    │    │  Comment     │    │  📧 Gmail    │
│              │    │  🔔 Notifs   │    │  t'appeler ? │    │  📅 Calendar │
│  Ton         │    │              │    │              │    │  🎵 Spotify  │
│  assistant   │──▶ │  Autoriser ? │──▶ │  Tu ou Vous ?│──▶ │              │
│  intelligent │    │              │    │              │    │  Connecter   │
│              │    │              │    │  Ton préféré │    │  maintenant? │
│  [Suivant]   │    │  [Autoriser] │    │  [Continuer] │    │  [Terminer]  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

## Critères d'acceptation

- [ ] 4 écrans swipables avec pagination dots
- [ ] **Écran 1** : splash animé, tagline Elio, bouton "Commencer"
- [ ] **Écran 2** : demande permissions micro + notifications (explications claires)
- [ ] **Écran 3** : prénom (input), tu/vous (toggle), ton (sélecteur)
- [ ] **Écran 4** : liste services à connecter (Gmail, Calendar, Spotify) — optionnel "Plus tard"
- [ ] Bouton "Passer" sur chaque écran (sauf le dernier)
- [ ] À la fin : flag `onboarding_completed = true` → ne plus afficher
- [ ] Animations fluides (Reanimated ou Lottie)
- [ ] Design cohérent avec la charte Elio (couleurs Felix)
- [ ] Accessible (VoiceOver)

## Tâches de dev

1. **Pager component** (~1h)
   - Horizontal FlatList ou `react-native-pager-view`
   - Pagination dots animés
   - Boutons Suivant / Passer

2. **Écran 1 — Bienvenue** (~1h)
   - Logo Elio animé
   - Texte d'accroche
   - Fond avec gradient Elio

3. **Écran 2 — Permissions** (~1h)
   - Bouton "Autoriser le micro" → `Audio.requestPermissionsAsync()`
   - Bouton "Autoriser les notifications" → `Notifications.requestPermissionsAsync()`
   - Explication en dessous de chaque bouton

4. **Écran 3 — Personnalisation** (~1h)
   - Input prénom
   - Toggle tu/vous
   - Sélecteur ton (friendly/pro/casual)
   - Sauvegarde dans settings

5. **Écran 4 — Services** (~1h)
   - Cards services avec bouton "Connecter" / "Plus tard"
   - Déclenche OAuth si connecté
   - Bouton "Terminer" → marque onboarding done → navigate to main

## Tests requis

- **Unitaire :** Chaque écran render sans crash
- **Intégration :** Flow complet → settings sauvegardés → onboarding_completed = true
- **Manuel :** Premier lancement → onboarding affiché → 2ème lancement → main directement

## Definition of Done

- [ ] 4 écrans fonctionnels
- [ ] Permissions demandées
- [ ] Settings initiaux sauvegardés
- [ ] Ne s'affiche qu'une fois
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
