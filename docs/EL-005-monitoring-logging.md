# EL-005 — Monitoring & Logging (Sentry + Pino)

**Épique :** E1 — Infrastructure & Backend
**Sprint :** S2
**Points :** 3
**Priorité :** P1
**Dépendances :** EL-001 (API Gateway), EL-012 (App Expo)

---

## Description

En tant que **développeur**, je veux une stack d'observabilité (logs structurés + error tracking + métriques), afin de diagnostiquer rapidement les problèmes en production.

## Contexte technique

- **Pino** : logger JSON structuré pour Fastify (intégré nativement)
- **Sentry** : error tracking + performance monitoring (app + backend)
- **Métriques custom** : latence pipeline (STT → LLM → TTS), tokens consommés, cache hit rate

## Critères d'acceptation

- [ ] Pino configuré sur l'API Gateway avec niveaux : debug/info/warn/error
- [ ] Logs JSON incluent : `requestId`, `userId`, `route`, `duration`, `statusCode`
- [ ] Sentry SDK backend (`@sentry/node`) : capture exceptions non-gérées + transactions
- [ ] Sentry SDK app (`@sentry/react-native`) : crashes, ANR, navigation breadcrumbs
- [ ] Dashboard Sentry : alertes email si error rate > seuil
- [ ] Métriques pipeline loggées : `stt_duration_ms`, `llm_ttft_ms`, `llm_tokens_in`, `llm_tokens_out`, `llm_cache_hit`, `tts_duration_ms`, `total_pipeline_ms`
- [ ] Log rotation : fichiers logs rotatés quotidiennement (logrotate ou pino-roll)
- [ ] Healthcheck enrichi : `/health` retourne aussi queue depth, connected workers

## Tâches de dev

1. **Pino setup** (~1h)
   - Plugin `@fastify/pino` avec serializers custom
   - Request ID auto-généré (`x-request-id` header)
   - Log levels par env (debug en dev, info en prod)

2. **Sentry backend** (~1h)
   - `@sentry/node` init dans Fastify
   - `Sentry.setupFastifyErrorHandler(app)`
   - Performance monitoring (sample rate 0.2 en prod)

3. **Sentry app** (~1h)
   - `@sentry/react-native` init
   - Navigation instrumentation (`expo-router`)
   - Release/dist tagging

4. **Métriques pipeline** (~1h)
   - Logger structuré à chaque étape du pipeline vocal
   - Format : `{ event: "pipeline_complete", stt_ms, llm_ms, tts_ms, total_ms, cache_hit }`

## Tests requis

- **Unitaire :** Logger produit du JSON valide avec les champs requis
- **Intégration :** Erreur 500 → apparaît dans Sentry (sandbox)
- **Manuel :** Vérifier logs structurés en production

## Definition of Done

- [ ] Logs structurés en place (backend)
- [ ] Sentry opérationnel (backend + app)
- [ ] Métriques pipeline loggées
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
