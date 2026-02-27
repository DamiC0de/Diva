# EL-007 — TTS Worker (Piper ONNX FR)

**Épique :** E2 — Pipeline vocal
**Sprint :** S1
**Points :** 5
**Priorité :** P0
**Dépendances :** EL-001 (API Gateway)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio me réponde avec une voix naturelle en français, afin d'avoir une expérience conversationnelle fluide et agréable.

## Contexte technique

- **Piper TTS** (ONNX runtime) — modèle FR haute qualité
- **CPU only** — Hetzner AX52, ~5-10x realtime
- **Streaming** : génération par chunks pour réduire le TTFB (Time To First Byte audio)
- **Format sortie :** WAV 22050Hz → encodé Opus pour transmission WebSocket
- **Voix :** modèle FR sélectionné (ex: `fr_FR-siwis-medium` ou voix custom)

### Position dans le pipeline

```
Claude ──text──▶ API Gateway ──job──▶ TTS Worker ──audio──▶ API Gateway ──ws──▶ iPhone
                                      (Piper ONNX)
```

## Critères d'acceptation

- [ ] Worker Python/C++ déployé avec Piper ONNX
- [ ] Modèle FR chargé au démarrage (pas de cold start par requête)
- [ ] Accepte du texte via Redis queue ou HTTP interne
- [ ] Génère de l'audio WAV 22050Hz mono
- [ ] Streaming par phrases : découpe le texte en phrases, génère et envoie chunk par chunk
- [ ] Latence TTFB <200ms (première phrase)
- [ ] Encode en Opus avant envoi (réduction bande passante)
- [ ] Retourne : stream de chunks audio ou fichier complet
- [ ] Healthcheck endpoint `/health`
- [ ] Gère les erreurs : texte vide, texte trop long (>5000 chars → split)
- [ ] SSML basique supporté (pauses, emphase) — nice to have

## Tâches de dev

1. **Setup Worker** (~2h)
   - Installer `piper-tts` (pip ou binaire)
   - Télécharger modèle FR ONNX + config JSON
   - Structure : `tts_worker/`, `main.py`, `config.py`
   - Preload modèle au démarrage

2. **Pipeline de synthèse** (~3h)
   - Input : texte brut français
   - Split en phrases (regex ou NLP léger)
   - Synthèse phrase par phrase → chunks WAV
   - Conversion WAV → Opus (`opusenc` ou `pyogg`)
   - Mesure latence par chunk

3. **Queue & intégration** (~2h)
   - Redis queue : `{ job_id, text, voice_id }`
   - Résultat : stream de chunks `{ job_id, chunk_index, audio_base64, is_last: bool }`
   - Côté API Gateway : forward chunks en WebSocket au client

4. **Déploiement** (~1h)
   - Systemd service
   - Script deploy

## Tests requis

- **Unitaire :** Synthèse d'une phrase connue → audio WAV valide
- **Unitaire :** Texte vide → erreur propre
- **Performance :** Phrase de 20 mots → TTFB <200ms
- **Performance :** Paragraphe 200 mots → génération complète <2s
- **Intégration :** API Gateway → Redis → TTS → audio retourné via WS
- **Manuel :** Écouter l'audio généré, vérifier qualité/naturalité

## Definition of Done

- [ ] Worker déployé et fonctionnel
- [ ] Voix FR naturelle et intelligible
- [ ] Streaming par phrases opérationnel
- [ ] TTFB <200ms vérifié
- [ ] Intégration API Gateway testée
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
