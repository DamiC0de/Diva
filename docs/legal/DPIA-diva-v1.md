# Data Protection Impact Assessment (DPIA)
## Application Diva — Assistant Vocal Privacy-First

**Version**: 1.1
**Date**: 2026-03-04
**Mise à jour**: Ajout screen recording, OCR cloud, app Mac compagnon
**Responsable**: [À compléter]
**DPO Contact**: [À compléter]

---

## 1. Description du traitement

### 1.1 Nature du traitement
Diva est une application mobile d'assistant vocal personnel qui :
- Capture et traite la voix de l'utilisateur pour exécuter des commandes
- Lit les notifications de l'appareil (messages, rappels)
- **Accède aux messages de différentes plateformes** (SMS, WhatsApp, Messenger, Telegram, etc.) via les notifications ou APIs
- Génère des réponses vocales via synthèse vocale (TTS)
- Peut envoyer des messages au nom de l'utilisateur
- **Peut résumer ou analyser des conversations** à la demande de l'utilisateur
- **(V1.1) Capture l'écran de l'appareil** (screen recording) pour lecture visuelle des apps
- **(V1.1) Effectue de l'OCR sur GPU cloud** pour extraire le texte des captures
- **(V1.1) Se synchronise avec une app Mac compagnon** pour automation complète

### 1.2 Portée du traitement
| Élément | Description |
|---------|-------------|
| Données concernées | Voix, transcriptions, notifications, contacts, calendrier, **messages (SMS, WhatsApp, Messenger, Telegram, etc.)** |
| Volume estimé | 50-5000 utilisateurs (phase MVP à production) |
| Fréquence | Continue (utilisation quotidienne) |
| Durée conservation | Voir section 3.4 |

### 1.2.1 Focus : Accès aux messages tiers
L'accès aux messages implique le traitement de données de **personnes non-utilisatrices** (expéditeurs des messages). Ce point nécessite une attention particulière :

| Plateforme | Méthode d'accès | Données accessibles |
|------------|-----------------|---------------------|
| SMS | Notifications iOS | Expéditeur, contenu, date |
| WhatsApp | Notifications iOS | Expéditeur, contenu, date |
| Messenger | Notifications iOS | Expéditeur, contenu, date |
| Telegram | API Bot (optionnel) | Messages d'un chat spécifique |
| iMessage | Notifications iOS | Expéditeur, contenu, date |

**Note importante** : Les expéditeurs de ces messages sont des "personnes concernées" au sens du RGPD, même s'ils n'utilisent pas Diva.

### 1.2.2 Focus : Screen Recording + OCR Cloud (V1.1)

Pour contourner les limitations iOS sur l'accès aux apps, Diva peut capturer l'écran de l'appareil et effectuer une reconnaissance optique de caractères (OCR) sur le cloud.

| Étape | Lieu | Données |
|-------|------|---------|
| Capture écran | Local (iPhone) | Image de l'écran |
| Transmission | Chiffrée E2E | Frames compressées |
| OCR | Cloud GPU (enclave) | Extraction texte |
| Analyse | Cloud GPU (enclave) | Compréhension contexte |
| Réponse | Chiffrée E2E | Texte uniquement |
| **Stockage** | **AUCUN** | Frames détruites immédiatement |

**Risques spécifiques :**
- Capture de données sensibles affichées à l'écran (mots de passe, données bancaires)
- Capture de données de tiers (conversations privées)
- Transmission d'images vers le cloud

**Mitigations :**
- Consentement explicite et granulaire pour cette fonctionnalité
- Indicateur visuel permanent pendant la capture
- Traitement dans une enclave sécurisée (TEE)
- Zéro persistence : frames détruites après traitement
- Option de désactivation permanente

### 1.2.3 Focus : App Mac Compagnon (V1.1)

Pour atteindre 100% des cas d'usage, une application Mac compagnon peut :
- Contrôler les applications macOS (Messages, WhatsApp Web, etc.)
- Accéder à l'historique complet des conversations
- Se synchroniser avec l'iPhone via réseau local WiFi

| Donnée | Source | Traitement |
|--------|--------|------------|
| Messages iMessage | Messages.app DB | Local Mac |
| WhatsApp | WhatsApp Web (automation) | Local Mac |
| Messenger | Messenger Web (automation) | Local Mac |
| Sync iPhone | WiFi local chiffré | Local network |

**Garanties :**
- Aucune donnée ne quitte le réseau local (Mac ↔ iPhone)
- Pas de cloud pour cette fonctionnalité
- Chiffrement du trafic local (TLS)
- Mac doit être déverrouillé et autorisé par l'utilisateur

### 1.3 Contexte du traitement
- **Secteur** : Application grand public (B2C)
- **Territoire** : International (EU, US, autres)
- **Technologie** : iOS native + Backend cloud

### 1.4 Finalités du traitement
1. **Exécution de commandes vocales** : rappels, minuteries, envoi de messages
2. **Assistance contextuelle** : réponses aux questions, résumés
3. **Personnalisation** : adaptation aux préférences utilisateur
4. **Amélioration du service** : correction de bugs (logs anonymisés uniquement)

---

## 2. Évaluation de la nécessité et proportionnalité

### 2.1 Base légale
| Traitement | Base légale (Art. 6) | Justification |
|------------|---------------------|---------------|
| Capture vocale | Consentement (6.1.a) | Opt-in explicite à l'installation |
| Lecture notifications | Consentement (6.1.a) | Permission iOS explicite |
| Envoi messages | Consentement (6.1.a) | Confirmation avant envoi |
| Traitement cloud | Consentement (6.1.a) | Opt-in séparé |
| **Screen recording** | Consentement explicite (6.1.a) | Permission iOS + opt-in app |
| **OCR cloud** | Consentement explicite (6.1.a) | Inclus dans consentement screen recording |
| **Mac compagnon** | Consentement (6.1.a) | Installation + autorisation explicite |

### 2.2 Données biométriques (Art. 9)
La voix constitue une donnée biométrique car elle permet l'identification unique.
- **Base légale** : Consentement explicite (Art. 9.2.a)
- **Mitigation** : Traitement local privilégié, pas de stockage d'empreintes vocales

### 2.3 Principe de minimisation
| Donnée | Nécessité | Justification |
|--------|-----------|---------------|
| Audio brut | Oui | Transcription STT |
| Transcription | Oui | Compréhension commande |
| Notifications | Optionnel | Lecture sur demande |
| Contacts | Optionnel | Envoi messages |
| **Captures écran** | Optionnel (V1.1) | Lecture visuelle apps |
| **Données Mac** | Optionnel (V1.1) | Historique conversations |
| Localisation | Non collectée | - |
| Historique navigation | Non collectée | - |

### 2.4 Limitation de la conservation
| Donnée | Durée | Justification |
|--------|-------|---------------|
| Audio brut (local) | Immédiat (non stocké) | Traité en streaming |
| Transcription (local) | Session uniquement | Effacé à la fermeture |
| Contexte conversation | 24 heures | Continuité conversation |
| Données envoyées cloud | 0 (éphémère) | Pas de persistence |
| **Captures écran (cloud)** | 0 (éphémère) | Détruites après OCR |
| **Données Mac (local)** | Non stockées par Diva | Lecture seule |
| Compte utilisateur | Jusqu'à suppression | Fonctionnement service |

---

## 3. Évaluation des risques

### 3.1 Identification des risques

| Risque | Probabilité | Impact | Niveau |
|--------|-------------|--------|--------|
| Interception données en transit | Faible | Élevé | 🟡 Moyen |
| Accès non autorisé serveur | Faible | Élevé | 🟡 Moyen |
| Capture voix tiers (bystanders) | Moyen | Moyen | 🟡 Moyen |
| Fuite données API tierce | Faible | Élevé | 🟡 Moyen |
| Inférence données sensibles | Moyen | Moyen | 🟡 Moyen |
| Perte de données | Très faible | Faible | 🟢 Faible |
| **Capture écran données sensibles** | Moyen | Élevé | 🔴 Élevé |
| **Fuite frames screen recording** | Faible | Très élevé | 🔴 Élevé |
| **Accès non autorisé Mac** | Faible | Élevé | 🟡 Moyen |

### 3.2 Risques spécifiques voix

#### Capture de tiers non consentants
- **Scénario** : L'utilisateur active Diva, une personne à proximité parle
- **Impact** : Traitement de données personnelles sans consentement
- **Mitigation** : 
  - Traitement 100% local par défaut
  - Indicateur visuel/sonore d'écoute active
  - Pas de stockage audio

#### Inférence de données sensibles
- **Scénario** : L'analyse vocale révèle état émotionnel, santé, origine
- **Impact** : Traitement de données Art. 9 non déclarées
- **Mitigation** :
  - Pas d'analyse vocale au-delà de la transcription
  - Pas de profilage émotionnel
  - Modèle STT ne conserve pas de métadonnées vocales

#### Traitement des messages de tiers (SMS, WhatsApp, Messenger, etc.)
- **Scénario** : L'utilisateur demande "Résume mes messages de Julie" — Julie n'a pas consenti
- **Impact** : Traitement de données personnelles de tiers sans base légale directe
- **Analyse juridique** :
  - L'utilisateur est destinataire légitime des messages
  - Le traitement est effectué à la demande de l'utilisateur (intérêt légitime)
  - Le contenu reste sous le contrôle de l'utilisateur
- **Mitigation** :
  - **Traitement 100% local** pour les messages — jamais envoyés au cloud
  - Pas de stockage des messages par Diva (lecture seule)
  - Pas d'indexation ni de profilage des contacts
  - L'utilisateur peut exclure des contacts du traitement
  - Information claire dans la Privacy Policy sur ce traitement

#### Contenu sensible dans les messages
- **Scénario** : Un message contient des données de santé, orientation sexuelle, opinions politiques
- **Impact** : Traitement de données Art. 9 sans consentement explicite du tiers
- **Mitigation** :
  - Traitement local uniquement (pas de transmission)
  - Pas d'analyse sémantique profonde ni de catégorisation
  - Pas de stockage du contenu des messages
  - Option pour l'utilisateur de désactiver la lecture des messages

### 3.3 Risques spécifiques Screen Recording (V1.1)

#### Capture de données sensibles à l'écran
- **Scénario** : L'utilisateur active le screen recording alors que son app bancaire/médicale est ouverte
- **Impact** : Capture et transmission de données hautement sensibles (mots de passe, soldes, diagnostics)
- **Niveau de risque** : 🔴 ÉLEVÉ
- **Mitigation** :
  - Indicateur visuel PERMANENT et visible pendant la capture
  - Consentement explicite avec avertissement sur les risques
  - Option de pause instantanée (gesture ou commande vocale)
  - Détection automatique d'apps sensibles (banques, santé) avec avertissement
  - Traitement dans enclave sécurisée (TEE) — opérateur n'a pas accès aux frames
  - **Zéro stockage** : frames détruites immédiatement après OCR

#### Fuite des frames pendant transmission
- **Scénario** : Interception des frames entre iPhone et cloud GPU
- **Impact** : Exposition de tout le contenu visible à l'écran
- **Niveau de risque** : 🔴 ÉLEVÉ
- **Mitigation** :
  - Chiffrement E2E (clé dérivée du device, jamais sur le serveur)
  - Certificate pinning pour éviter MITM
  - Frames compressées et fragmentées
  - Pas de cache intermédiaire

#### Capture de données de tiers (personnes à l'écran)
- **Scénario** : Une conversation affichée contient des messages de personnes n'ayant pas consenti
- **Impact** : Traitement de données personnelles de tiers
- **Mitigation** :
  - Même analyse que section 3.2 (messages tiers)
  - L'utilisateur est responsable de ce qu'il affiche pendant le recording
  - Information claire dans les conditions d'utilisation

### 3.4 Risques spécifiques App Mac (V1.1)

#### Accès non autorisé au Mac
- **Scénario** : Un tiers accède au Mac et peut lire les messages via l'app compagnon
- **Impact** : Accès à l'historique complet des conversations
- **Mitigation** :
  - L'app Mac nécessite authentification (Touch ID / mot de passe)
  - Liaison avec iPhone par QR code (pairing sécurisé)
  - Pas de données stockées par l'app Mac (lecture seule)
  - Déconnexion automatique après inactivité

#### Données restant sur le Mac
- **Scénario** : Des données transitent par le Mac et pourraient être récupérées
- **Impact** : Fuite de données via le Mac
- **Mitigation** :
  - Aucune persistence : données transitent en RAM uniquement
  - Pas de logs, pas de cache
  - Communication locale uniquement (pas d'internet)

### 3.6 Matrice de risque finale

```
Impact
   ^
 5 |  [R7,R8]
 4 |     [R3]      [R1,R2,R4]
 3 |  [R5]    [R9]
 2 |        [R6]
 1 |
   +-------------------> Probabilité
     1    2    3    4

R1: Interception transit
R2: Accès non autorisé serveur
R3: Fuite API tierce
R4: Capture tiers (voix)
R5: Inférence sensible
R6: Perte données
R7: Capture écran données sensibles (V1.1) ⚠️
R8: Fuite frames screen recording (V1.1) ⚠️
R9: Accès non autorisé Mac (V1.1)
```

**⚠️ Note importante** : Les risques R7 et R8 (screen recording) ont un impact TRÈS ÉLEVÉ et nécessitent les mitigations les plus strictes. Le consentement utilisateur doit être particulièrement explicite pour cette fonctionnalité.

---

## 4. Mesures d'atténuation

### 4.1 Mesures techniques

| Mesure | Risque adressé | Implementation |
|--------|----------------|----------------|
| Chiffrement TLS 1.3 | R1 | Toutes communications |
| Chiffrement AES-256 | R2 | Données au repos |
| Architecture local-first | R3, R4 | 80% traitement sur device |
| Authentification JWT | R2 | Tokens signés, expiration courte |
| Pas de logs voix | R1, R4, R5 | Audio jamais persisté |
| HTTPS pinning | R1 | Certificats épinglés |
| **Enclave sécurisée (TEE)** | R7, R8 | OCR dans environnement isolé |
| **Chiffrement E2E frames** | R8 | Clé device-only, jamais sur serveur |
| **Zéro persistence frames** | R7, R8 | Destruction immédiate après OCR |
| **Indicateur visuel recording** | R7 | Badge permanent à l'écran |
| **Auth Mac biométrique** | R9 | Touch ID / mot de passe requis |
| **Pairing sécurisé** | R9 | QR code + validation locale |

### 4.2 Mesures organisationnelles

| Mesure | Description |
|--------|-------------|
| DPA sous-traitants | Contrat Anthropic avec SCCs |
| Formation équipe | Sensibilisation RGPD |
| Procédure breach | Notification < 72h |
| Audit annuel | Revue des pratiques |

### 4.3 Privacy by Design

1. **Local-first** : Le traitement reste sur l'appareil sauf nécessité
2. **Minimisation** : Seules les données nécessaires sont collectées
3. **Éphémère** : Pas de stockage permanent des données sensibles
4. **Transparence** : L'utilisateur sait ce qui est traité où
5. **Contrôle** : Opt-out cloud, suppression compte facile

---

## 5. Droits des personnes concernées

### 5.1 Implémentation des droits

| Droit | Article | Implémentation | Délai |
|-------|---------|----------------|-------|
| Information | 13, 14 | Privacy Policy in-app | Immédiat |
| Accès | 15 | Export données (JSON) | 30 jours |
| Rectification | 16 | Édition profil | Immédiat |
| Effacement | 17 | Suppression compte | 30 jours |
| Limitation | 18 | Pause du service | Immédiat |
| Portabilité | 20 | Export standard | 30 jours |
| Opposition | 21 | Opt-out cloud | Immédiat |

### 5.2 Procédure de demande
1. L'utilisateur contacte : privacy@[domain].com
2. Vérification d'identité sous 7 jours
3. Traitement de la demande sous 30 jours
4. Confirmation par email

---

## 6. Transferts internationaux

### 6.1 Flux de données

```
[iPhone EU] --TLS--> [Serveur Relay EU] --TLS--> [API Anthropic US]
                           |
                      Pas de stockage
```

### 6.2 Garanties pour transferts US

| Mécanisme | Status |
|-----------|--------|
| SCCs (Standard Contractual Clauses) | ✅ Inclus DPA Anthropic |
| TIA (Transfer Impact Assessment) | ✅ Ce document |
| Mesures supplémentaires | ✅ Chiffrement E2E |

### 6.3 Évaluation du transfert vers US (Anthropic)

**Risques identifiés** :
- Accès potentiel par autorités US (FISA 702, EO 12333)

**Mesures compensatoires** :
- Données anonymisées avant envoi (pas d'identifiant utilisateur)
- Pas de stockage côté Anthropic (traitement éphémère)
- Chiffrement E2E jusqu'au point de traitement
- Option opt-out cloud pour utilisateurs sensibles

---

## 7. Consultation préalable

### 7.1 Nécessité de consultation CNIL
Selon l'Art. 36 RGPD, une consultation préalable est requise si les risques résiduels restent élevés après mitigation.

**Conclusion** : Les mesures d'atténuation ramènent tous les risques à un niveau acceptable (🟢 ou 🟡). Pas de consultation préalable requise.

### 7.2 Personnes consultées

| Rôle | Date | Avis |
|------|------|------|
| DPO | [À compléter] | [À compléter] |
| Équipe technique | 2026-03-04 | Favorable |
| Équipe produit | 2026-03-04 | Favorable |

---

## 8. Conclusion

### 8.1 Décision
Le traitement peut être mis en œuvre moyennant l'application des mesures décrites.

### 8.2 Actions requises avant lancement

| Action | Responsable | Deadline |
|--------|-------------|----------|
| Implémenter chiffrement E2E | Dev | MVP |
| Créer écrans consentement | Dev | MVP |
| Publier Privacy Policy | Legal | MVP |
| Configurer export données | Dev | MVP+30j |
| Nommer DPO ou référent | Direction | MVP |

### 8.3 Revue périodique
Ce DPIA sera revu :
- À chaque modification significative du traitement
- Au minimum une fois par an
- En cas d'incident de sécurité

---

**Signatures**

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Responsable traitement | | | |
| DPO | | | |
| Directeur technique | | | |

---

*Document généré conformément aux lignes directrices CNIL et EDPB sur les DPIA*
