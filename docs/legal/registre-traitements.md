# Registre des Activités de Traitement
## Application Diva — Article 30 RGPD

**Responsable de traitement** : [Nom de l'entreprise]
**Date de création** : 4 mars 2026
**Dernière mise à jour** : 4 mars 2026

---

## Traitement 1 : Commandes vocales (Local)

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Exécution des commandes vocales |
| **Finalité** | Permettre à l'utilisateur de contrôler son appareil par la voix |
| **Base légale** | Consentement (Art. 6.1.a) |
| **Catégories de personnes** | Utilisateurs de l'application |
| **Catégories de données** | Voix (audio), transcription textuelle |
| **Données sensibles** | Oui - données biométriques (voix) |
| **Source des données** | Collecte directe (microphone) |
| **Destinataires** | Aucun (traitement local uniquement) |
| **Transferts hors UE** | Non |
| **Durée de conservation** | Non conservé (traitement temps réel) |
| **Mesures de sécurité** | Chiffrement local, pas de stockage |

---

## Traitement 2 : Traitement Cloud (Optionnel)

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Traitement avancé des requêtes complexes |
| **Finalité** | Fournir des réponses intelligentes aux questions complexes |
| **Base légale** | Consentement explicite (Art. 6.1.a) |
| **Catégories de personnes** | Utilisateurs ayant activé l'option cloud |
| **Catégories de données** | Transcription textuelle anonymisée, contexte conversation |
| **Données sensibles** | Non (anonymisées avant envoi) |
| **Source des données** | Traitement local préalable |
| **Destinataires** | Anthropic (sous-traitant API) |
| **Transferts hors UE** | Oui - USA (Anthropic) |
| **Garanties transfert** | SCCs + DPA Anthropic |
| **Durée de conservation** | 0 (éphémère) côté Anthropic, 24h contexte serveur |
| **Mesures de sécurité** | TLS 1.3, anonymisation, pas de logs |

---

## Traitement 3 : Lecture des notifications

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Lecture des notifications à l'utilisateur |
| **Finalité** | Permettre la lecture vocale des messages reçus |
| **Base légale** | Consentement (Art. 6.1.a) - permission iOS |
| **Catégories de personnes** | Utilisateurs, expéditeurs des notifications |
| **Catégories de données** | Contenu des notifications (messages, alertes) |
| **Données sensibles** | Potentiellement (dépend du contenu) |
| **Source des données** | Système iOS (NotificationService) |
| **Destinataires** | Aucun (lecture locale) |
| **Transferts hors UE** | Non |
| **Durée de conservation** | Non conservé par Diva |
| **Mesures de sécurité** | Traitement local, pas de stockage |

---

## Traitement 3bis : Accès aux messages (SMS, WhatsApp, Messenger, etc.)

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Lecture et résumé des messages multi-plateformes |
| **Finalité** | Permettre la lecture vocale et le résumé des conversations |
| **Base légale** | Intérêt légitime de l'utilisateur (Art. 6.1.f) |
| **Catégories de personnes** | Utilisateurs, **expéditeurs des messages (tiers)** |
| **Catégories de données** | Contenu des messages, identité expéditeur, date/heure |
| **Données sensibles** | Potentiellement (contenu peut inclure données Art. 9) |
| **Source des données** | Notifications iOS, API Telegram (optionnel) |
| **Destinataires** | **Aucun - traitement 100% local obligatoire** |
| **Transferts hors UE** | **Non - interdit pour ce traitement** |
| **Durée de conservation** | Non conservé (lecture en temps réel) |
| **Mesures de sécurité** | Traitement local exclusif, pas de stockage, pas d'envoi cloud |

### Justification intérêt légitime (balance des intérêts)

| Critère | Analyse |
|---------|---------|
| **Intérêt de l'utilisateur** | Fort - accès facilité à ses propres messages |
| **Impact sur les tiers** | Limité - messages déjà envoyés à l'utilisateur |
| **Attentes raisonnables** | Les expéditeurs s'attendent à ce que le destinataire lise leurs messages |
| **Mesures compensatoires** | Traitement local uniquement, pas de stockage, pas de profilage |

### Garanties spécifiques

1. ⚠️ **Jamais envoyé au cloud** — Le contenu des messages tiers reste sur l'appareil
2. ⚠️ **Pas de stockage** — Lecture seule, pas de copie persistante
3. ⚠️ **Pas de profilage** — Aucune analyse des contacts ou patterns de communication
4. ⚠️ **Option de désactivation** — L'utilisateur peut désactiver cette fonctionnalité

---

## Traitement 4 : Gestion des contacts

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Accès au carnet d'adresses |
| **Finalité** | Permettre l'envoi de messages aux contacts |
| **Base légale** | Consentement (Art. 6.1.a) - permission iOS |
| **Catégories de personnes** | Utilisateurs, contacts du répertoire |
| **Catégories de données** | Noms, numéros de téléphone, emails |
| **Données sensibles** | Non |
| **Source des données** | Carnet d'adresses iOS |
| **Destinataires** | Aucun (accès local uniquement) |
| **Transferts hors UE** | Non |
| **Durée de conservation** | Non conservé (accès en lecture seule) |
| **Mesures de sécurité** | Accès via API iOS sécurisée |

---

## Traitement 5 : Gestion du calendrier

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Création et lecture d'événements |
| **Finalité** | Permettre la gestion vocale du calendrier |
| **Base légale** | Consentement (Art. 6.1.a) - permission iOS |
| **Catégories de personnes** | Utilisateurs |
| **Catégories de données** | Événements, rappels, dates |
| **Données sensibles** | Non |
| **Source des données** | Calendrier iOS |
| **Destinataires** | Aucun |
| **Transferts hors UE** | Non |
| **Durée de conservation** | Non conservé par Diva |
| **Mesures de sécurité** | Accès via API iOS sécurisée |

---

## Traitement 6 : Gestion des comptes utilisateurs

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Création et gestion des comptes |
| **Finalité** | Authentification, personnalisation |
| **Base légale** | Exécution du contrat (Art. 6.1.b) |
| **Catégories de personnes** | Utilisateurs inscrits |
| **Catégories de données** | Email, préférences, identifiant unique |
| **Données sensibles** | Non |
| **Source des données** | Saisie utilisateur |
| **Destinataires** | Hébergeur (sous-traitant) |
| **Transferts hors UE** | Non (hébergement EU) |
| **Durée de conservation** | Jusqu'à suppression du compte + 30 jours |
| **Mesures de sécurité** | Chiffrement, hachage mot de passe |

---

## Traitement 7 : Logs techniques

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Journalisation technique |
| **Finalité** | Débogage, sécurité, statistiques agrégées |
| **Base légale** | Intérêt légitime (Art. 6.1.f) |
| **Catégories de personnes** | Utilisateurs |
| **Catégories de données** | IP anonymisée, type appareil, version app, erreurs |
| **Données sensibles** | Non |
| **Source des données** | Collecte automatique |
| **Destinataires** | Aucun (usage interne) |
| **Transferts hors UE** | Non |
| **Durée de conservation** | 90 jours |
| **Mesures de sécurité** | Anonymisation IP, accès restreint |

---

## Sous-traitants

| Sous-traitant | Traitement | Localisation | Garanties | DPA signé |
|---------------|------------|--------------|-----------|-----------|
| Anthropic | API LLM | USA | SCCs | ✅ Oui |
| [Hébergeur] | Infrastructure | EU | RGPD natif | ✅ Oui |

---

---

## Traitement 8 : Screen Recording + OCR Cloud (V1.1)

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Capture écran et reconnaissance optique |
| **Finalité** | Lecture visuelle du contenu des applications iOS |
| **Base légale** | Consentement explicite (Art. 6.1.a) |
| **Catégories de personnes** | Utilisateurs, personnes affichées à l'écran |
| **Catégories de données** | Captures d'écran, texte extrait par OCR |
| **Données sensibles** | ⚠️ POTENTIELLEMENT TRÈS SENSIBLES (apps bancaires, santé, etc.) |
| **Source des données** | Capture écran iOS (avec permission) |
| **Destinataires** | Cloud GPU (enclave sécurisée) pour OCR |
| **Transferts hors UE** | Possible (selon provider GPU) — SCCs requis |
| **Durée de conservation** | **ZÉRO** — frames détruites immédiatement après OCR |
| **Mesures de sécurité** | Chiffrement E2E, enclave TEE, indicateur visuel permanent |

### ⚠️ Avertissement

Ce traitement présente des risques ÉLEVÉS car il peut capturer :
- Mots de passe visibles
- Données bancaires
- Informations médicales
- Conversations privées de tiers

Le consentement doit être :
- Explicite et séparé des autres permissions
- Accompagné d'un avertissement clair sur les risques
- Révocable à tout moment

---

## Traitement 9 : App Mac Compagnon (V1.1)

| Champ | Valeur |
|-------|--------|
| **Nom du traitement** | Synchronisation avec application Mac |
| **Finalité** | Accès complet aux messages via automation macOS |
| **Base légale** | Consentement (Art. 6.1.a) |
| **Catégories de personnes** | Utilisateurs, contacts/expéditeurs des messages |
| **Catégories de données** | Messages iMessage, WhatsApp Web, Messenger Web |
| **Données sensibles** | Potentiellement (contenu des conversations) |
| **Source des données** | Applications macOS (Messages.app, navigateur) |
| **Destinataires** | **Aucun — traitement 100% local** |
| **Transferts hors UE** | **Non** — réseau local uniquement |
| **Durée de conservation** | Non conservé (lecture seule, transit RAM) |
| **Mesures de sécurité** | Auth biométrique, pairing sécurisé, chiffrement local |

### Garanties spécifiques

1. ⚠️ **Aucune donnée ne quitte le réseau local** (Mac ↔ iPhone WiFi)
2. ⚠️ **Pas de stockage** — Données transitent en RAM uniquement
3. ⚠️ **Auth requise** — Touch ID ou mot de passe pour chaque session
4. ⚠️ **Pairing sécurisé** — QR code + validation bidirectionnelle

---

## Sous-traitants

| Sous-traitant | Traitement | Localisation | Garanties | DPA signé |
|---------------|------------|--------------|-----------|-----------|
| Anthropic | API LLM | USA | SCCs | ✅ Oui |
| [Hébergeur] | Infrastructure | EU | RGPD natif | ✅ Oui |
| **[GPU Provider]** | OCR Screen Recording | À définir | SCCs + TEE | ⏳ À signer |

---

## Historique des modifications

| Date | Version | Modification | Auteur |
|------|---------|--------------|--------|
| 2026-03-04 | 1.0 | Création initiale | Mary (Analyste BMAD) |
| 2026-03-04 | 1.1 | Ajout Screen Recording, OCR, Mac Compagnon | Mary (Analyste BMAD) |

---

*Document conforme à l'Article 30 du RGPD - Registre des activités de traitement*
