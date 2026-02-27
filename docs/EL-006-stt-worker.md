# EL-006 — STT Worker (faster-whisper-small)

**Épique :** E2 — Pipeline vocal
**Sprint :** S1
**Points :** 8
**Priorité :** P0
**Dépendances :** EL-001 (API Gateway pour recevoir l'audio)

---

## Description

En tant qu'**utilisateur**, je veux que ma voix soit transcrite en texte rapidement et précisément en français, afin qu'Elio comprenne mes demandes vocales.

## Contexte technique

- **faster-whisper** (CTranslate2) avec modèle `small` quantifié int8
- **CPU only** — pas de GPU nécessaire (Hetzner AX52 : Ryzen 7, 8c/16t)
- **Latence cible :** <300ms pour 5s d'audio
- **Format audio entrant :** Opus via WebSocket (encodé côté app)
- **Worker Python** communiquant avec l'API Gateway via Redis (job queue) ou appel HTTP interne
- **Langue :** FR uniquement pour MVP (paramètre `language="fr"`)

### Position dans le pipeline

```
iPhone ──audio(opus)──▶ API Gateway ──job──▶ STT Worker ──text──▶ API Gateway
                        (WebSocket)         (faster-whisper)       (→ Claude)
```

## Critères d'acceptation

- [ ] Worker Python déployé avec faster-whisper-small int8
- [ ] Accepte de l'audio Opus/WAV via file de messages (Redis/BullMQ) ou HTTP interne
- [ ] Transcrit en français avec `language="fr"`, `beam_size=1` (speed-optimized)
- [ ] Latence <300ms pour un segment de 5 secondes d'audio
- [ ] Retourne : `{ text: string, language: "fr", duration_ms: number, confidence: number }`
- [ ] Gestion de la VAD (Voice Activity Detection) intégrée (Silero VAD via faster-whisper)
- [ ] Healthcheck endpoint `/health` pour monitoring
- [ ] Gère les erreurs : audio corrompu, timeout, format invalide
- [ ] Logs structurés (JSON) avec durée de traitement
- [ ] Peut traiter 10 requêtes concurrentes (threads CPU)

## Tâches de dev

1. **Setup Worker Python** (~2h)
   - Virtualenv Python 3.11+
   - `pip install faster-whisper redis`
   - Télécharger modèle `small` int8 : `WhisperModel("small", compute_type="int8", cpu_threads=4)`
   - Structure : `stt_worker/`, `main.py`, `config.py`, `requirements.txt`

2. **Queue de messages** (~2h)
   - Redis + BullMQ (côté Node) ou simple Redis pub/sub
   - Format job : `{ job_id, audio_base64, format: "opus"|"wav", language: "fr" }`
   - Format résultat : `{ job_id, text, duration_ms, confidence }`
   - Timeout par job : 10s

3. **Transcription pipeline** (~3h)
   - Décodage Opus → PCM 16kHz mono (via `pydub` ou `ffmpeg`)
   - Appel `model.transcribe()` avec VAD filter activé
   - Agrégation segments → texte final
   - Mesure latence (time.perf_counter)

4. **Déploiement** (~1h)
   - Systemd service ou Docker container
   - PM2 alternative (avec `pm2 start python`)
   - Script de déploiement

5. **Intégration API Gateway** (~2h)
   - Route côté Fastify qui pousse le job dans Redis
   - Attend le résultat (polling Redis ou Redis subscribe)
   - Timeout global 10s → erreur 504

## Tests requis

- **Unitaire :** Transcription d'un fichier WAV FR connu → texte attendu
- **Unitaire :** Gestion audio corrompu → erreur propre
- **Performance :** 5s d'audio transcrit en <300ms
- **Performance :** 10 requêtes concurrentes sans crash
- **Intégration :** API Gateway → Redis → Worker → résultat retourné
- **Manuel :** Enregistrer sa voix, envoyer, vérifier transcription

## Definition of Done

- [ ] Worker déployé et fonctionnel
- [ ] Latence <300ms vérifiée
- [ ] Intégration API Gateway testée
- [ ] Logs structurés en place
- [ ] Healthcheck accessible
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
