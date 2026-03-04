# Backlog MVP — Diva
## Assistant Vocal Privacy-First

**Version** : 1.0
**Date** : 2026-03-04
**Auteur** : John (PM BMAD)
**Status** : Ready for Development

---

## Vue d'ensemble

| Métrique | Valeur |
|----------|--------|
| **Total stories MVP** | 34 |
| **Stories MUST** | 19 |
| **Stories SHOULD** | 15 |
| **Estimation totale** | ~85 points |
| **Sprints estimés** | 4-5 sprints (2 semaines) |

---

## Épique E1 — Core Voice 🎙️

> Le cœur du produit : capture vocale, transcription, synthèse vocale

### US-001 : Capture audio micro

**En tant qu'** utilisateur
**Je veux** pouvoir parler à Diva via le micro de mon iPhone
**Afin de** interagir par la voix

**Critères d'acceptation :**
- [ ] Permission micro demandée au premier lancement
- [ ] Capture audio en 16kHz mono (format Whisper)
- [ ] Indicateur visuel pendant l'enregistrement
- [ ] Bouton push-to-talk fonctionnel
- [ ] Timeout automatique après 30s de silence

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : Aucune

---

### US-002 : Transcription locale (STT)

**En tant qu'** utilisateur
**Je veux** que ma voix soit transcrite en texte sur mon appareil
**Afin de** préserver ma vie privée

**Critères d'acceptation :**
- [ ] Whisper.cpp intégré (modèle tiny ~40MB)
- [ ] Transcription en < 500ms pour 5s d'audio
- [ ] Support français et anglais
- [ ] Texte affiché en temps réel (streaming)
- [ ] Fonctionne 100% offline

**Priorité** : 🔴 MUST
**Estimation** : 5 points
**Dépendances** : US-001

---

### US-003 : Synthèse vocale locale (TTS)

**En tant qu'** utilisateur
**Je veux** que Diva me réponde par la voix
**Afin d'** avoir une interaction naturelle

**Critères d'acceptation :**
- [ ] Piper TTS intégré (~20MB)
- [ ] Voix française naturelle
- [ ] Latence < 300ms pour commencer à parler
- [ ] Volume ajusté selon contexte (silencieux si écouteurs)
- [ ] Fonctionne 100% offline

**Priorité** : 🔴 MUST
**Estimation** : 5 points
**Dépendances** : Aucune

---

### US-004 : Détection fin de parole (VAD)

**En tant qu'** utilisateur
**Je veux** que Diva détecte automatiquement quand j'ai fini de parler
**Afin de** ne pas devoir appuyer sur un bouton

**Critères d'acceptation :**
- [ ] Silero VAD intégré
- [ ] Détection fin de parole < 500ms
- [ ] Pas de coupure pendant les pauses naturelles
- [ ] Seuil de détection configurable

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : US-001

---

### US-005 : Mode mains-libres continu

**En tant qu'** utilisateur
**Je veux** pouvoir garder l'app en écoute continue
**Afin de** parler sans toucher mon téléphone

**Critères d'acceptation :**
- [ ] Mode "always listening" activable
- [ ] Indicateur visuel permanent
- [ ] Optimisation batterie (pause quand silence prolongé)
- [ ] Reprise automatique après réponse

**Priorité** : 🟡 SHOULD
**Estimation** : 3 points
**Dépendances** : US-001, US-004

---

### US-006 : Gestion erreurs audio

**En tant qu'** utilisateur
**Je veux** être informé si quelque chose ne va pas avec l'audio
**Afin de** comprendre pourquoi Diva ne répond pas

**Critères d'acceptation :**
- [ ] Message si micro non autorisé
- [ ] Message si audio inaudible
- [ ] Message si transcription échoue
- [ ] Suggestion de réessayer

**Priorité** : 🟡 SHOULD
**Estimation** : 2 points
**Dépendances** : US-001, US-002

---

### US-007 : Annulation commande vocale

**En tant qu'** utilisateur
**Je veux** pouvoir dire "annule" ou "stop"
**Afin d'** interrompre une action en cours

**Critères d'acceptation :**
- [ ] Mots-clés : "annule", "stop", "arrête", "cancel"
- [ ] Interruption immédiate du TTS
- [ ] Confirmation vocale "D'accord"
- [ ] Retour à l'état initial

**Priorité** : 🟡 SHOULD
**Estimation** : 2 points
**Dépendances** : US-002, US-003

---

### US-008 : Historique de session

**En tant qu'** utilisateur
**Je veux** voir mes dernières interactions dans l'app
**Afin de** revoir ce que j'ai demandé

**Critères d'acceptation :**
- [ ] Liste des 20 dernières interactions
- [ ] Affichage : ma question + réponse Diva
- [ ] Horodatage
- [ ] Suppression possible
- [ ] Effacement automatique après 24h

**Priorité** : 🟡 SHOULD
**Estimation** : 2 points
**Dépendances** : Aucune

---

## Épique E2 — Cloud Integration ☁️

> Authentification, API Claude, logique de triage

### US-009 : Inscription utilisateur

**En tant que** nouvel utilisateur
**Je veux** créer un compte avec mon email
**Afin d'** accéder aux fonctionnalités cloud

**Critères d'acceptation :**
- [ ] Formulaire email + mot de passe
- [ ] Validation email (format)
- [ ] Mot de passe >= 8 caractères
- [ ] Confirmation par email
- [ ] Stockage sécurisé (Keychain)

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : Aucune

---

### US-010 : Connexion utilisateur

**En tant qu'** utilisateur existant
**Je veux** me connecter avec mes identifiants
**Afin de** retrouver mon compte

**Critères d'acceptation :**
- [ ] Formulaire email + mot de passe
- [ ] Tokens JWT stockés en Keychain
- [ ] Refresh token automatique
- [ ] Option "Rester connecté"
- [ ] Connexion Face ID / Touch ID

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : US-009

---

### US-011 : Triage local des intentions

**En tant qu'** utilisateur
**Je veux** que les requêtes simples soient traitées localement
**Afin de** préserver ma vie privée et avoir une réponse rapide

**Critères d'acceptation :**
- [ ] LLM local Qwen-0.5B intégré
- [ ] Classification : local vs cloud
- [ ] Réponses locales pour : heure, rappels, timers, calculs simples
- [ ] Confiance > 0.8 pour exécution locale
- [ ] Latence triage < 200ms

**Priorité** : 🔴 MUST
**Estimation** : 5 points
**Dépendances** : US-002

---

### US-012 : Requêtes vers Claude API

**En tant qu'** utilisateur
**Je veux** que mes questions complexes soient envoyées à Claude
**Afin d'** obtenir des réponses intelligentes

**Critères d'acceptation :**
- [ ] Appel API Claude Haiku
- [ ] Contexte inclus (derniers échanges)
- [ ] Streaming de la réponse
- [ ] Timeout 30s
- [ ] Retry avec backoff (3 tentatives)

**Priorité** : 🔴 MUST
**Estimation** : 5 points
**Dépendances** : US-010, US-011

---

### US-013 : Gestion du contexte conversationnel

**En tant qu'** utilisateur
**Je veux** que Diva se souvienne de notre conversation
**Afin de** pouvoir faire référence à des éléments précédents

**Critères d'acceptation :**
- [ ] Stockage local des 10 derniers échanges
- [ ] Contexte envoyé au cloud (anonymisé)
- [ ] TTL 24h pour le contexte
- [ ] Reset possible ("oublie tout")

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : US-012

---

### US-014 : Mode offline gracieux

**En tant qu'** utilisateur sans connexion
**Je veux** que Diva fonctionne quand même
**Afin de** ne pas être bloqué

**Critères d'acceptation :**
- [ ] Détection état réseau
- [ ] Fonctionnalités locales toujours disponibles
- [ ] Message clair si fonction nécessite internet
- [ ] Queue des requêtes cloud pour retry

**Priorité** : 🟡 SHOULD
**Estimation** : 3 points
**Dépendances** : US-011, US-012

---

## Épique E3 — Notifications 🔔

> Lecture des notifications WhatsApp, Messenger, SMS, etc.

### US-015 : Capture des notifications entrantes

**En tant qu'** utilisateur
**Je veux** que Diva capture mes notifications de messages
**Afin de** pouvoir les écouter

**Critères d'acceptation :**
- [ ] NotificationServiceExtension implémentée
- [ ] Capture : WhatsApp, Messenger, iMessage, SMS
- [ ] Extraction : expéditeur, contenu, app source, timestamp
- [ ] Stockage temporaire (App Group)
- [ ] Permission explicite demandée

**Priorité** : 🔴 MUST
**Estimation** : 5 points
**Dépendances** : Aucune

---

### US-016 : Demande vocale de lecture

**En tant qu'** utilisateur
**Je veux** demander "Lis mes messages"
**Afin d'** entendre mes notifications

**Critères d'acceptation :**
- [ ] Commandes : "lis mes messages", "j'ai des messages ?", "nouveaux messages"
- [ ] Lecture par app ou globale
- [ ] Format : "Tu as 3 messages. Julie sur WhatsApp dit : ..."
- [ ] Ordre chronologique

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : US-015, US-003

---

### US-017 : Filtrage par expéditeur

**En tant qu'** utilisateur
**Je veux** demander "Messages de Julie"
**Afin de** n'entendre que certains messages

**Critères d'acceptation :**
- [ ] Reconnaissance du nom dans la requête
- [ ] Matching fuzzy (Julie, julie, Jul)
- [ ] "Aucun message de Julie" si vide
- [ ] Support plusieurs expéditeurs ("de Julie ou Marc")

**Priorité** : 🟡 SHOULD
**Estimation** : 3 points
**Dépendances** : US-016

---

### US-018 : Filtrage par application

**En tant qu'** utilisateur
**Je veux** demander "Messages WhatsApp"
**Afin de** n'entendre qu'une source

**Critères d'acceptation :**
- [ ] Commandes : "messages WhatsApp", "SMS", "Messenger"
- [ ] Liste des apps supportées
- [ ] Comptage par app ("3 WhatsApp, 2 SMS")

**Priorité** : 🟡 SHOULD
**Estimation** : 2 points
**Dépendances** : US-016

---

### US-019 : Marquage comme lu

**En tant qu'** utilisateur
**Je veux** que Diva marque les messages comme lus
**Afin de** ne pas les réentendre

**Critères d'acceptation :**
- [ ] Marquage automatique après lecture
- [ ] Option "relire le dernier"
- [ ] Compteur mis à jour
- [ ] Persistence locale

**Priorité** : 🔴 MUST
**Estimation** : 2 points
**Dépendances** : US-016

---

## Épique E4 — Deep Links 🔗

> Ouvrir les applications depuis une commande vocale

### US-020 : Ouvrir une application

**En tant qu'** utilisateur
**Je veux** dire "Ouvre WhatsApp"
**Afin de** lancer l'app rapidement

**Critères d'acceptation :**
- [ ] Commandes : "ouvre X", "lance X", "va sur X"
- [ ] Apps supportées : WhatsApp, Messenger, Messages, Mail, Safari
- [ ] Utilisation des URL schemes
- [ ] Message si app non installée

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : US-002

---

### US-021 : Ouvrir une conversation spécifique

**En tant qu'** utilisateur
**Je veux** dire "Ouvre la conversation avec Julie sur WhatsApp"
**Afin d'** aller directement au bon endroit

**Critères d'acceptation :**
- [ ] Deep link vers conversation WhatsApp
- [ ] Matching contact (nom → numéro)
- [ ] Fallback : ouvrir l'app si impossible

**Priorité** : 🟡 SHOULD
**Estimation** : 3 points
**Dépendances** : US-020

---

### US-022 : Créer un rappel

**En tant qu'** utilisateur
**Je veux** dire "Rappelle-moi dans 10 minutes"
**Afin de** créer un rappel vocalement

**Critères d'acceptation :**
- [ ] Parsing : durée (minutes, heures) ou heure absolue
- [ ] Création via Reminders.app (EventKit)
- [ ] Confirmation vocale
- [ ] Support : "rappelle-moi de X dans Y"

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : US-002

---

### US-023 : Créer un timer

**En tant qu'** utilisateur
**Je veux** dire "Timer 5 minutes"
**Afin de** démarrer un compte à rebours

**Critères d'acceptation :**
- [ ] Commandes : "timer X", "minuteur X", "chrono X"
- [ ] Timer natif iOS (background)
- [ ] Notification à la fin
- [ ] "Annule le timer" fonctionnel

**Priorité** : 🟡 SHOULD
**Estimation** : 2 points
**Dépendances** : US-002

---

## Épique E5 — Orb UI 🔮

> Interface visuelle avec l'orbe animé

### US-024 : Affichage de l'orbe

**En tant qu'** utilisateur
**Je veux** voir un orbe animé au centre de l'écran
**Afin de** savoir que Diva est active

**Critères d'acceptation :**
- [ ] Orbe central responsive
- [ ] Animation fluide 60fps
- [ ] Couleurs selon état
- [ ] Fond sombre par défaut

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : Aucune

---

### US-025 : États visuels de l'orbe

**En tant qu'** utilisateur
**Je veux** que l'orbe change selon ce que fait Diva
**Afin de** comprendre son état

**Critères d'acceptation :**
- [ ] Idle : violet pulsant lentement
- [ ] Listening : bleu ondulant
- [ ] Processing : cyan animé
- [ ] Speaking : vert avec waveform
- [ ] Error : rouge clignotant
- [ ] Transitions fluides entre états

**Priorité** : 🔴 MUST
**Estimation** : 5 points
**Dépendances** : US-024

---

### US-026 : Visualisation audio (waveform)

**En tant qu'** utilisateur
**Je veux** voir une représentation visuelle de ma voix
**Afin de** savoir que Diva m'entend

**Critères d'acceptation :**
- [ ] Waveform réactif au volume
- [ ] Intégré à l'orbe (anneau externe)
- [ ] Lissage pour éviter saccades
- [ ] Synchronisé avec l'audio

**Priorité** : 🟡 SHOULD
**Estimation** : 3 points
**Dépendances** : US-025, US-001

---

### US-027 : Affichage texte transcrit

**En tant qu'** utilisateur
**Je veux** voir ce que Diva a compris
**Afin de** vérifier la transcription

**Critères d'acceptation :**
- [ ] Texte affiché sous l'orbe
- [ ] Apparition progressive (streaming)
- [ ] Police lisible, contraste suffisant
- [ ] Disparition après réponse

**Priorité** : 🟡 SHOULD
**Estimation** : 2 points
**Dépendances** : US-002, US-024

---

### US-028 : Affichage réponse Diva

**En tant qu'** utilisateur
**Je veux** voir la réponse de Diva en texte
**Afin de** pouvoir la relire

**Critères d'acceptation :**
- [ ] Texte affiché sous l'orbe
- [ ] Synchronisé avec le TTS
- [ ] Scrollable si long
- [ ] Copiable (long press)

**Priorité** : 🟡 SHOULD
**Estimation** : 2 points
**Dépendances** : US-027

---

## Épique E6 — Onboarding 👋

> Première utilisation, permissions, tutoriel

### US-029 : Écran de bienvenue

**En tant que** nouvel utilisateur
**Je veux** voir un écran de bienvenue
**Afin de** comprendre ce qu'est Diva

**Critères d'acceptation :**
- [ ] Logo et nom "Diva"
- [ ] Tagline : "Ton assistant vocal privé"
- [ ] Bouton "Commencer"
- [ ] Animation subtile

**Priorité** : 🟡 SHOULD
**Estimation** : 2 points
**Dépendances** : Aucune

---

### US-030 : Demande permission micro

**En tant que** nouvel utilisateur
**Je veux** qu'on m'explique pourquoi Diva a besoin du micro
**Afin de** donner mon consentement éclairé

**Critères d'acceptation :**
- [ ] Écran explicatif AVANT la popup iOS
- [ ] Icône micro + texte clair
- [ ] "Diva écoute uniquement quand tu parles"
- [ ] Bouton pour déclencher la permission

**Priorité** : 🔴 MUST
**Estimation** : 2 points
**Dépendances** : US-029

---

### US-031 : Demande permission notifications

**En tant que** nouvel utilisateur
**Je veux** autoriser Diva à lire mes notifications
**Afin de** pouvoir écouter mes messages

**Critères d'acceptation :**
- [ ] Écran explicatif
- [ ] "Diva ne stocke pas tes messages"
- [ ] Lien vers paramètres si refusé
- [ ] Optionnel (skip possible)

**Priorité** : 🔴 MUST
**Estimation** : 2 points
**Dépendances** : US-030

---

### US-032 : Création compte rapide

**En tant que** nouvel utilisateur
**Je veux** créer mon compte rapidement
**Afin de** commencer à utiliser Diva

**Critères d'acceptation :**
- [ ] Email + mot de passe uniquement
- [ ] Option "Sign in with Apple"
- [ ] Pas de vérification email bloquante
- [ ] Skip possible (mode local only)

**Priorité** : 🔴 MUST
**Estimation** : 3 points
**Dépendances** : US-031

---

### US-033 : Tutoriel interactif

**En tant que** nouvel utilisateur
**Je veux** un tutoriel rapide
**Afin de** savoir comment parler à Diva

**Critères d'acceptation :**
- [ ] 3-4 écrans max
- [ ] Exemples de commandes
- [ ] "Dis 'Bonjour Diva'" pour tester
- [ ] Skippable

**Priorité** : 🟡 SHOULD
**Estimation** : 3 points
**Dépendances** : US-032

---

### US-034 : Écran principal post-onboarding

**En tant qu'** utilisateur ayant terminé l'onboarding
**Je veux** arriver sur l'écran principal
**Afin de** commencer à utiliser Diva

**Critères d'acceptation :**
- [ ] Transition fluide depuis tutoriel
- [ ] Orbe visible et prêt
- [ ] Hint : "Appuie ou dis 'Hey Diva'"
- [ ] Onboarding ne se relance pas

**Priorité** : 🔴 MUST
**Estimation** : 2 points
**Dépendances** : US-033, US-024

---

## Récapitulatif

### Par priorité

| Priorité | Stories | Points | % du total |
|----------|---------|--------|------------|
| 🔴 MUST | 19 | 57 | 67% |
| 🟡 SHOULD | 15 | 28 | 33% |
| **Total MVP** | **34** | **85** | 100% |

### Par épique

| Épique | Stories | Points | Priorité dominante |
|--------|---------|--------|-------------------|
| E1 — Core Voice | 8 | 25 | 🔴 MUST |
| E2 — Cloud Integration | 6 | 22 | 🔴 MUST |
| E3 — Notifications | 5 | 15 | 🔴 MUST |
| E4 — Deep Links | 4 | 11 | Mixed |
| E5 — Orb UI | 5 | 15 | Mixed |
| E6 — Onboarding | 6 | 14 | 🔴 MUST |

### Dépendances critiques

```
US-001 (Audio) ──► US-002 (STT) ──► US-011 (Triage) ──► US-012 (Cloud)
                        │
                        ▼
                   US-016 (Lecture notifs)
                        │
                        ▼
                   US-003 (TTS)
```

---

## Ordre de développement suggéré

### Sprint 1 (Foundation)
- US-001, US-002, US-003, US-004 (Core audio)
- US-024, US-025 (Orbe basique)
- US-009, US-010 (Auth)

### Sprint 2 (Intelligence)
- US-011 (Triage local)
- US-012, US-013 (Cloud + contexte)
- US-022 (Rappels)

### Sprint 3 (Notifications)
- US-015, US-016, US-019 (Lecture notifs)
- US-020 (Deep links)
- US-030, US-031 (Permissions)

### Sprint 4 (Polish)
- US-029, US-032, US-033, US-034 (Onboarding complet)
- US-026, US-027, US-028 (UI polish)
- US-005, US-006, US-007, US-008 (UX améliorations)

### Sprint 5 (Buffer + QA)
- Bug fixes
- Performance tuning
- Remaining SHOULD stories

---

*Document généré par John (PM BMAD) — 2026-03-04*
