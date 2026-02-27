# EL-008 — Intégration Claude Haiku + Prompt Caching

**Épique :** E2 — Pipeline vocal
**Sprint :** S1
**Points :** 5
**Priorité :** P0
**Dépendances :** EL-001 (API Gateway), EL-002 (Supabase pour historique)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio comprenne mes demandes et y réponde intelligemment, afin de bénéficier d'un assistant conversationnel utile et pertinent.

## Contexte technique

- **Claude 3.5 Haiku** via API Anthropic (`/v1/messages`)
- **Prompt caching** : system prompt + contexte mémoire en cache → ~90% réduction coût input
- **Streaming** : réponse token par token pour réduire latence perçue
- **System prompt** : personnalité Elio + instructions + mémoire user
- **Coût estimé** : ~2,37€/user/mois (200 interactions/jour, avec cache)

### Architecture prompt

```
┌─────────────────────────────────────────┐
│ System Prompt (CACHED — cache_control)  │
│ - Personnalité Elio                     │
│ - Instructions générales                │
│ - Capacités disponibles (tools)         │
│ - Mémoire long-terme user (pgvector)    │
│ - Préférences user (settings)           │
├─────────────────────────────────────────┤
│ Historique conversation (derniers N)    │
├─────────────────────────────────────────┤
│ Message user actuel                     │
└─────────────────────────────────────────┘
```

## Critères d'acceptation

- [ ] Module `LLMService` appelant l'API Anthropic Messages
- [ ] System prompt structuré avec `cache_control: { type: "ephemeral" }` sur les blocs stables
- [ ] Streaming activé (`stream: true`) → tokens envoyés progressivement
- [ ] Historique conversation : derniers 20 messages chargés depuis Supabase
- [ ] Réponse sauvegardée dans `messages` (role: assistant, tokens_in, tokens_out)
- [ ] Gestion des erreurs API : rate limit (429), overloaded (529), timeout
- [ ] Retry avec backoff exponentiel (max 3 retries)
- [ ] Fallback : message d'erreur user-friendly si API down
- [ ] Latence TTFT (Time To First Token) <500ms avec cache hit
- [ ] Logs : tokens consommés, cache hit/miss, latence
- [ ] Config : model, max_tokens, temperature via env vars

## Tâches de dev

1. **Module LLMService** (~3h)
   - Classe `LLMService` TypeScript
   - Méthode `chat(userId, message, context)` → stream de tokens
   - SDK Anthropic officiel (`@anthropic-ai/sdk`)
   - System prompt builder : charge personnalité + mémoire + settings

2. **Prompt Caching** (~2h)
   - Marquer system prompt avec `cache_control`
   - Structure : blocs stables (personnalité, instructions) vs dynamiques (mémoire)
   - Vérifier cache hit dans les headers de réponse (`anthropic-cache-hit`)
   - Logger le ratio cache hit/miss

3. **Historique & Contexte** (~2h)
   - Charger derniers 20 messages depuis `messages` table
   - Formatter en `[{ role, content }]` pour l'API
   - Tronquer si total tokens > 8000 (garder les plus récents)

4. **Streaming vers client** (~1h)
   - Les tokens streamés sont accumulés côté API Gateway
   - Une fois la réponse complète → envoyée au TTS
   - (Optionnel S2 : streaming progressif texte → TTS par phrase)

5. **Persistance & Métriques** (~1h)
   - Sauvegarder message assistant dans `messages`
   - Compter tokens_in, tokens_out depuis la réponse API
   - Logger dans monitoring

## Tests requis

- **Unitaire :** System prompt builder génère le format correct
- **Unitaire :** Historique tronqué à 20 messages max
- **Unitaire :** Retry logic sur erreur 429
- **Intégration :** Appel API réel → réponse cohérente en FR
- **Intégration :** Cache hit vérifié sur 2ème appel (même system prompt)
- **Performance :** TTFT <500ms avec cache
- **Manuel :** Conversation multi-tours cohérente

## Definition of Done

- [ ] LLMService fonctionnel avec streaming
- [ ] Prompt caching activé et vérifié
- [ ] Historique conversation chargé
- [ ] Messages persistés en BDD
- [ ] Gestion d'erreurs robuste
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
