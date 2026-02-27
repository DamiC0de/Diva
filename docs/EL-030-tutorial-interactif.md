# EL-030 — Tutorial Interactif Premier Usage

**Épique :** E7 — Onboarding & UX
**Sprint :** S4
**Points :** 3
**Priorité :** P2
**Dépendances :** EL-029 (Onboarding), EL-013 (Écran conversation), EL-009 (Orchestrateur)

---

## Description

En tant que **nouvel utilisateur**, je veux un tutorial guidé sur l'écran de conversation, afin de comprendre comment parler à Elio et découvrir ses capacités.

## Contexte technique

- **Tooltips guidés** sur l'écran conversation (overlay semi-transparent)
- **Première vraie interaction** guidée par Elio lui-même
- Se déclenche après l'onboarding (EL-029), au premier accès à l'écran conversation

## Critères d'acceptation

- [ ] Séquence de 4-5 tooltips pointant vers les éléments clés :
  1. Bouton PTT : "Maintiens pour parler à Elio"
  2. Zone chat : "Tes conversations apparaissent ici"
  3. Input texte : "Tu peux aussi taper"
  4. Services : "Connecte tes services ici"
- [ ] Elio se présente vocalement : "Salut {prénom} ! Je suis Elio, ton assistant..."
- [ ] Suggestion de première commande : "Essaie de me demander la météo !"
- [ ] User essaie → Elio répond → "Bravo ! Tu peux aussi me demander..."
- [ ] Liste de 5 exemples de commandes affichée
- [ ] Flag `tutorial_completed` → ne plus afficher
- [ ] Bouton "Passer le tutorial" disponible

## Tâches de dev

1. **Tooltip overlay** (~1.5h)
   - Composant `TutorialOverlay` avec highlight zone + tooltip bulle
   - Séquence step by step (tap pour avancer)
   - Fond semi-transparent sauf la zone mise en avant

2. **Première interaction guidée** (~1h)
   - Elio parle automatiquement (TTS) pour se présenter
   - Suggestion d'essai affichée en chip
   - Détection réponse réussie → encouragement

3. **Exemples de commandes** (~0.5h)
   - Card avec 5 suggestions : météo, mails, agenda, rappel, musique
   - Tap sur une suggestion → l'envoie comme message

## Tests requis

- **Manuel :** Premier lancement → tutorial complet → 2ème lancement → pas de tutorial

## Definition of Done

- [ ] Tutorial affiché au premier usage
- [ ] Elio se présente vocalement
- [ ] Exemples de commandes
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
