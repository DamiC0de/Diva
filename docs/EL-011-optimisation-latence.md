# EL-011 — Optimisation Latence Pipeline (<2s)

**Épique :** E2 — Pipeline vocal
**Sprint :** S3
**Points :** 5
**Priorité :** P1
**Dépendances :** EL-009 (Orchestrateur complet)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio me réponde en moins de 2 secondes, afin que la conversation soit naturelle et fluide comme un échange humain.

## Contexte technique

**Budget latence cible (<2s) :**
- STT : ~300ms
- Claude Haiku TTFT (avec cache) : ~500ms
- TTS TTFB : ~200ms
- Réseau aller-retour : ~200ms
- **Marge : ~800ms** pour actions + overhead

### Optimisations clés

```
AVANT (séquentiel) :
Audio ──▶ STT (300ms) ──▶ Claude (500ms) ──▶ TTS full (400ms) ──▶ Envoi
Total : ~1700ms + overhead

APRÈS (streaming) :
Audio ──▶ STT (300ms) ──▶ Claude stream ──┬──▶ TTS phrase 1 (100ms) ──▶ Play
                                           ├──▶ TTS phrase 2 (100ms) ──▶ Buffer
                                           └──▶ TTS phrase 3 ...
Total perçu : ~900ms jusqu'au premier audio
```

## Critères d'acceptation

- [ ] **Streaming TTS** : commence la synthèse dès la 1ère phrase complète de Claude (pas attendre la réponse entière)
- [ ] **STT streaming** (si possible) : envoie l'audio au fur et à mesure (pas attendre fin de parole)
- [ ] **Prompt caching** vérifié : cache hit rate >80% sur le system prompt
- [ ] **Connection pooling** : connexions HTTP persistantes vers Anthropic API
- [ ] **Pre-warm** : modèles STT/TTS chargés en mémoire (pas de cold start)
- [ ] Latence totale perçue (fin de parole → début audio réponse) : **<1.5s** pour requêtes simples (sans action externe)
- [ ] Latence mesurée et loggée pour chaque requête (P50, P95, P99)
- [ ] Dashboard ou log agrégé des métriques latence
- [ ] Benchmark automatisé : script qui envoie 20 requêtes et mesure les percentiles

## Tâches de dev

1. **Streaming TTS pipeline** (~3h)
   - Modifier orchestrateur : split réponse Claude par phrases (`.`, `!`, `?`, `:`)
   - Dès qu'une phrase est complète → envoyer au TTS
   - TTS génère → envoie chunk audio au client immédiatement
   - Client joue les chunks séquentiellement (buffer queue)

2. **STT streaming (optionnel)** (~2h)
   - Envoyer les chunks audio au STT dès réception (pas buffer complet)
   - faster-whisper supporte le mode streaming (segments progressifs)
   - Fallback : garder le mode batch si streaming instable

3. **Optimisations réseau** (~1h)
   - HTTP keep-alive vers Anthropic
   - Compression audio Opus (réduction bandwidth)
   - WebSocket ping/pong pour maintenir la connexion

4. **Benchmark & métriques** (~2h)
   - Script `benchmark.ts` : envoie N requêtes, mesure chaque étape
   - Log structuré : `{ stt_ms, llm_ttft_ms, llm_total_ms, tts_ttfb_ms, tts_total_ms, total_perceived_ms, cache_hit }`
   - Agrégation : P50, P95, P99 par heure

## Tests requis

- **Performance :** 20 requêtes simples → P95 <1.5s (sans action externe)
- **Performance :** Prompt cache hit rate >80% sur 50 requêtes consécutives
- **Intégration :** Streaming TTS : premier chunk audio reçu avant fin réponse Claude
- **Manuel :** Conversation vocale — perception subjective de fluidité

## Definition of Done

- [ ] Latence perçue <1.5s (P95) vérifiée
- [ ] Streaming TTS opérationnel
- [ ] Cache hit rate >80%
- [ ] Benchmark reproductible
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
