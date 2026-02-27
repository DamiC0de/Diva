# EL-025 — Extraction de Mémoire (Faits + Embeddings)

**Épique :** E6 — Mémoire & Personnalité
**Sprint :** S3
**Points :** 8
**Priorité :** P1
**Dépendances :** EL-002 (Supabase + pgvector), EL-008 (Claude Haiku)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio se souvienne de ce que je lui dis (préférences, faits, personnes), afin de ne pas avoir à me répéter et d'avoir un assistant qui me connaît.

## Contexte technique

- **Extraction automatique** : après chaque conversation, Claude identifie les faits mémorisables
- **Catégories** : preference, fact, person, event, reminder
- **Embeddings** : chaque mémoire est vectorisée (embedding 1536 dims) pour recherche sémantique
- **Table `memories`** : content + embedding + category + relevance_score
- **Modèle d'embedding** : `voyage-3-lite` (Voyage AI) ou `text-embedding-3-small` (OpenAI)

### Pipeline mémoire

```
Conversation terminée
        │
        ▼
Claude (extraction) : "Quels faits nouveaux retenir de cette conversation ?"
        │
        ▼
Faits extraits : [
  { category: "preference", content: "L'user préfère le jazz" },
  { category: "person", content: "Sophie est sa femme" },
  { category: "fact", content: "Il habite à Lyon" }
]
        │
        ▼
Embedding API → VECTOR(1536) pour chaque fait
        │
        ▼
INSERT INTO memories (user_id, category, content, embedding, relevance_score)
```

## Critères d'acceptation

- [ ] Après chaque conversation (>3 messages), extraction automatique des faits
- [ ] Prompt d'extraction : Claude identifie les infos à retenir vs le bruit
- [ ] Chaque fait catégorisé (preference, fact, person, event)
- [ ] Dédoublication : si un fait existe déjà, mise à jour au lieu de doublon
- [ ] Embedding généré pour chaque fait (API embedding)
- [ ] Stocké dans `memories` avec `source_conversation_id`
- [ ] Relevance score : 0.0 à 1.0 (importance estimée par Claude)
- [ ] "Qu'est-ce que tu sais sur moi ?" → Claude liste les mémoires
- [ ] Max 500 mémoires par user (nettoyage des moins pertinentes)
- [ ] Extraction asynchrone (ne bloque pas la réponse)

## Tâches de dev

1. **Module MemoryExtractor** (~3h)
   - Prompt Claude : "Extrais les faits importants de cette conversation..."
   - Parsing réponse → structured facts
   - Dédoublication (recherche sémantique : si embedding similar >0.9 → update)

2. **Embedding pipeline** (~2h)
   - Appel API embedding (Voyage AI ou OpenAI)
   - Batch embedding (max 10 faits par requête)
   - Stockage dans `memories.embedding`

3. **Async extraction** (~1.5h)
   - Déclenché après conversation (>3 messages, délai 5s après dernier message)
   - Background job (BullMQ ou simple setTimeout)
   - Ne bloque pas la réponse courante

4. **CRUD mémoires** (~1.5h)
   - API : `GET /api/v1/memories`, `DELETE /api/v1/memories/:id`
   - Claude peut lister/supprimer via tools
   - Cleanup : cron hebdomadaire supprime mémoires score <0.3 et >3 mois

## Tests requis

- **Unitaire :** Extraction prompt retourne des faits structurés
- **Unitaire :** Dédoublication détecte un fait existant
- **Intégration :** Conversation → extraction → mémoire en BDD → embedding correct
- **Manuel :** "Je préfère le thé" → prochaine session → "Tu veux du thé ?" vérifié

## Definition of Done

- [ ] Extraction automatique fonctionnelle
- [ ] Embeddings stockés
- [ ] Dédoublication active
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
