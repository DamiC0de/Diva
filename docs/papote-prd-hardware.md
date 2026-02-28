# 📋 PRD — Papote v1.0

> Product Requirements Document — Assistant vocal intelligent

**Version :** 1.0
**Date :** 20/02/2026
**Auteurs :** Georges, Nicolas, John (PM), Jarvis

---

## 1. Vision Produit

**Mission :** Rendre les modèles IA conversationnels accessibles à tout le monde.

**Proposition de valeur :** Un assistant vocal qui comprend vraiment ce qu'on lui dit, avec un cerveau Claude, tout en gardant les données vocales en local.

**Tagline :** *"L'assistant vocal intelligent pour tout le monde, pas que les geeks."*

---

## 2. Cible Utilisateur

### Persona principal
- **Non-geeks** qui veulent un assistant vocal qui fonctionne vraiment
- Frustrés par Alexa/Siri qui ne comprennent rien
- 30-60 ans, pas forcément tech-savvy
- Prêts à payer plus cher pour un produit qui marche

### Persona secondaire (v2)
- Personnes âgées / isolées
- Familles avec parents vieillissants (achat cadeau)
- Utilisation simplifiée, appels d'urgence, notifications famille

---

## 3. Fonctionnalités MVP

### 3.1 Must Have (v1)
| Feature | Description | Priorité |
|---------|-------------|----------|
| **Conversation naturelle** | Dialogue fluide avec Claude, contexte et mémoire | P0 |
| **TTS qualité** | Voix française naturelle (Piper + voix custom possible) | P0 |
| **STT précis** | Reconnaissance vocale Whisper, latence <1s | P0 |
| **Wake word** | Activation par mot-clé ("Hey Papote") | P0 |
| **Plug & Play** | Branchement simple, config minimale | P0 |
| **Mémoire persistante** | Stockage local des préférences et habitudes utilisateur | P0 |
| **RAG local** | Historique conversations + recherche sémantique pour contexte personnalisé | P0 |

### 3.2 Should Have (v1.1)
| Feature | Description | Priorité |
|---------|-------------|----------|
| **WiFi intégré** | Connexion sans fil (module M.2) | P1 |
| **App mobile config** | Configuration WiFi via app | P1 |
| **Rappels/Timers** | "Rappelle-moi dans 10 minutes" | P1 |
| **Météo/Infos** | Informations générales | P1 |

### 3.3 Should Have (v1.1 - v2)
| Feature | Description | Priorité |
|---------|-------------|----------|
| **Domotique Zigbee/WiFi** | Contrôle lumières, volets, thermostats | P1 |
| **Accès calendrier** | Lire/créer événements (Google Cal, iCal) | P2 |
| **Accès boîte mail** | Lire/résumer emails, dicter réponses | P2 |
| **Appels d'urgence** | Bouton SOS, notification famille | P2 |
| **Multi-utilisateurs** | Reconnaissance voix par personne | P2 |

### 3.4 Could Have (v3+)
| Feature | Description | Priorité |
|---------|-------------|----------|
| **Réservations internet** | Restos, médecins, etc. via API | P3 |
| **Bluetooth speaker** | Écouter de la musique | P3 |
| **Intégration apps tierces** | API ouverte pour développeurs | P3 |

### 3.5 Won't Have (hors scope)
- Écran tactile
- Caméra
- Streaming musical (Spotify, etc.) — problèmes de licences

---

## 4. Stack Technique

### 4.1 Hardware

#### Proto v1 (~306€) ✅ VALIDÉ
| Composant | Modèle | Prix |
|-----------|--------|------|
| SBC | Kit GeeekPi Orange Pi 5 Plus 16GB | 260€ |
| Audio | ReSpeaker Lite 2-Mic + speaker + case | ~34€ |
| Stockage | Carte microSD 64Go A2 | ~12€ |

#### Produit Final (estimé ~85€ en série)
| Composant | Spec |
|-----------|------|
| SBC | Orange Pi 5 (standard) 8-16GB |
| Audio | Module micro/speaker custom |
| Connectivité | WiFi 6 + BT 5.2 + Zigbee |
| Boîtier | Injection plastique |

### 4.2 Software

| Couche | Technologie | Notes |
|--------|-------------|-------|
| **OS** | Armbian (Debian) | Headless |
| **STT** | Whisper.cpp | Modèle small, accéléré NPU RK3588 |
| **TTS** | Piper | Voix `fr_FR-siwis-medium` (~60Mo) |
| **LLM** | Claude API (Haiku) | Via OpenClaw |
| **Orchestration** | OpenClaw | Gestion dialogue, mémoire |
| **Wake Word** | OpenWakeWord | Apache 2.0, gratuit |
| **Mémoire/RAG** | SQLite + ChromaDB + all-MiniLM-L6-v2 | 100% local, ~80Mo |
| **Audio** | ALSA/PulseAudio | Driver ReSpeaker |

### 4.3 Performances cibles

| Métrique | Cible | Mesuré |
|----------|-------|--------|
| Latence STT | < 1s | TBD |
| Latence TTS | < 0.5s | TBD |
| Latence totale (question → réponse) | < 3s | TBD |
| RAM utilisée | < 4GB | TBD |
| Consommation | < 15W | TBD |

---

## 5. Business Model

### 5.1 Pricing

| Élément | Prix |
|---------|------|
| **Hardware** | 249-299€ |
| **Abonnement** | 9.99€/mois ou 99€/an |

### 5.2 Coûts API Claude Haiku (détaillé)

**Tarifs Haiku (2026) :**
| | Prix |
|---|---|
| Input | $1 / million tokens |
| Output | $5 / million tokens |

**Coût par requête :**
| Scénario | Tokens in | Tokens out | Coût |
|----------|-----------|------------|------|
| Sans RAG | ~500 | ~150 | ~$0.00125 (0.12¢) |
| Avec RAG | ~2000 | ~150 | ~$0.00275 (0.25¢) |

**Capacité mensuelle (budget API 4.50€ = marge 50% sur abo 9€) :**
| Scénario | Requêtes/mois | Requêtes/jour |
|----------|---------------|---------------|
| Sans RAG | ~3 880 | ~129 |
| Avec RAG | ~1 760 | ~58 |

**Estimation usage réel :**
- Utilisateur léger : 10-20 req/jour ✅
- Utilisateur normal : 20-40 req/jour ✅
- Utilisateur bavard : 50-100 req/jour ⚠️

> ⚠️ **À valider sur proto** : Usage réel et coûts associés. Paliers d'abonnement possibles si nécessaire.

### 5.3 Coûts production

| Élément | Coût unitaire (série 200) |
|---------|---------------------------|
| Hardware | ~85€ (à valider avec devis) |
| API Claude/mois/user | ~2-5€ selon usage |
| **Marge hardware** | ~164€ (66%) |
| **Marge abo** | ~4-7€/mois selon usage |

### 5.3 Licences

| Composant | Licence | Commercial |
|-----------|---------|------------|
| Whisper | MIT | ✅ Libre |
| Piper | MIT | ✅ Libre |
| OpenWakeWord | Apache 2.0 | ✅ Libre |
| Claude API | Commercial | ✅ Payé à l'usage |
| OpenClaw | TBD | À vérifier |

---

## 6. Roadmap

### Phase 1 — Proto v1 : Validation stack (~306€)
**Timeline :** 2-4 semaines après commande
**Owner :** Nicolas (hardware), Georges (software)

- [ ] Commander hardware (Amazon + Seeed)
- [ ] Assembler proto
- [ ] Installer OS Armbian
- [ ] Déployer Whisper.cpp + Piper + OpenClaw
- [ ] Tester latence et qualité
- [ ] Go/No-Go pour phase 2

**Critères de succès :**
- Latence totale < 3s
- Compréhension vocale > 95%
- TTS intelligible et naturel
- SQLite + ChromaDB fonctionnels sur ARM
- Embeddings (all-MiniLM) < 300ms/phrase
- Mesurer coûts API réels sur usage type

### Phase 2 — Proto v2 : Boîtier intégré
**Timeline :** +2-4 semaines
**Budget :** ~500€

- [ ] Design boîtier custom (CAO)
- [ ] Impression 3D
- [ ] Intégration WiFi/BT (module M.2)
- [ ] Tests utilisateurs (5-10 personnes)

### Phase 3 — Design produit
**Timeline :** +4-8 semaines
**Budget :** ~2000€

- [ ] Designer industriel (Malt)
- [ ] Proto résine finition pro
- [ ] Itérations UX
- [ ] App mobile config

### Phase 4 — Petite série (200 unités)
**Timeline :** +8-12 semaines
**Budget :** ~15k€

- [ ] Moule injection
- [ ] Sourcing volume
- [ ] Certification CE
- [ ] Assemblage + QC
- [ ] Lancement beta

### Phase 5 — Scale
- Production 2000+ unités
- Sourcing Chine
- Distribution

---

## 7. Sécurité & Conformité

### RGPD & Vie privée
- Données stockées **localement** sur le boîtier (pas de cloud)
- Chiffrement des données sensibles (SQLite chiffré)
- Option d'export/suppression des données utilisateur
- Mentions légales claires dans l'app

### Certifications
- **CE** : Obligatoire pour vente en France/UE
- Tests EMC et sécurité électrique

### Garantie
- Garantie légale 2 ans (obligatoire France)
- SAV : reset usine, remplacement si défaut

---

## 8. Onboarding & UX

### Premier démarrage
1. QR code sur le boîtier → ouvre l'app mobile
2. App détecte Papote en WiFi (découverte réseau)
3. Configuration WiFi via l'app
4. Tuto vocal au premier démarrage

### Mises à jour (OTA)
- Over-The-Air automatique via WiFi
- Téléchargement la nuit, installation silencieuse
- Notification vocale : "Je me suis mis à jour"

### Reset usine
- Bouton physique (appui long 10s)
- Efface données utilisateur, remet config usine

---

## 9. Risques & Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Latence trop élevée | Bloquant | Moyen | Test PC d'abord, optimisation NPU |
| Qualité audio insuffisante | Élevé | Moyen | Upgrade composants audio |
| Pénurie composants | Moyen | Faible | Stock tampon, alternatives identifiées |
| Coût série > estimé | Moyen | Moyen | Devis réels avant engagement |
| Concurrence (nouveau produit) | Faible | Faible | Time to market rapide |

---

## 8. Équipe

| Rôle | Personne | Responsabilités |
|------|----------|-----------------|
| **Porteur projet** | Georges | Vision, stack logiciel, TTS |
| **Hardware Lead** | Nicolas | Sourcing, assemblage, proto |
| **PM / Coordination** | John (Jarvis) | PRD, suivi, documentation |
| **Support** | Jarvis | Recherche, specs, automation |

---

## 9. Décisions clés

| Date | Décision | Rationale |
|------|----------|-----------|
| 20/02/2026 | Orange Pi 5 Plus 16GB | NPU 6 TOPS pour Whisper, 8 cœurs |
| 20/02/2026 | Piper TTS (pas Kokoro) | Latence <1s sur ARM vs 25-30s |
| 20/02/2026 | Cible non-geeks | Marché plus large, différenciation |
| 20/02/2026 | Proto Ethernet d'abord | Simplifier validation stack |
| 20/02/2026 | Business model abo | Revenu récurrent, marge API |

---

## 10. Annexes

### Liens commande Proto v1
- Kit GeeekPi : https://www.amazon.fr/GeeekPi-Orange-Plus-16GB-alimentation/dp/B0C9WCN2TM
- ReSpeaker Lite : https://www.seeedstudio.com/ReSpeaker-Lite-Voice-Assistant-Kit-p-5929.html

### Ressources TTS
- Guide Piper vs Kokoro : https://claude.ai/public/artifacts/08b3d6bf-fbfe-42fe-ab3e-f6ed2dc7b027
- Voix française recommandée : `fr_FR-siwis-medium`

### Fichiers 3D
- Boîtier OPi5 : https://www.printables.com/model/1235968-orange-pi-5-case
- Boîtier ReSpeaker : https://www.printables.com/model/1111459-respeaker-lite-case-voice-assistant

---

*Document vivant — Mis à jour le 20/02/2026*
