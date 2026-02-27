# EL-026 — Rappel Contextuel RAG (Recherche Sémantique)

**Épique :** E6 — Mémoire & Personnalité
**Sprint :** S3
**Points :** 8
**Priorité :** P1
**Dépendances :** EL-025 (Extraction mémoire + embeddings)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio utilise ce qu'il sait de moi pour contextualiser ses réponses, afin d'avoir un assistant véritablement personnalisé.

## Contexte technique

- **RAG** (Retrieval-Augmented Generation) : avant chaque appel Claude, rechercher les mémoires pertinentes
- **pgvector** : `SELECT * FROM memories WHERE user_id = $1 ORDER BY embedding <=> $2 LIMIT 10`
- **Embedding de la requête** : le message user est vectorisé → recherche cosine similarity
- **Injection dans le system prompt** : les mémoires pertinentes sont ajoutées au contexte Claude

### Pipeline RAG

```
Message user : "Qu'est-ce que je pourrais offrir à Sophie ?"
        │
        ▼
Embedding du message → VECTOR(1536)
        │
        ▼
pgvector : SELECT content, category FROM memories
           WHERE user_id = $1
           ORDER BY embedding <=> $query_embedding
           LIMIT 10
        │
        ▼
Résultats pertinents :
  - "Sophie est sa femme" (similarity: 0.92)
  - "Sophie aime la lecture" (similarity: 0.87)
  - "Sophie a 32 ans" (similarity: 0.81)
        │
        ▼
Injection dans system prompt (bloc CACHED si stable) :
  "Tu sais les choses suivantes sur l'utilisateur : ..."
        │
        ▼
Claude répond avec contexte : "Sophie aime la lecture, tu pourrais lui offrir..."
```

## Critères d'acceptation

- [ ] Avant chaque appel Claude : recherche sémantique des mémoires pertinentes
- [ ] Top 10 mémoires (similarity >0.5) injectées dans le system prompt
- [ ] Format injection : section "Ce que tu sais sur {user_name}" dans le prompt
- [ ] Mémoires injectées dans le bloc `cache_control` (changent rarement pour un même user)
- [ ] Latence recherche pgvector <50ms (index HNSW)
- [ ] Claude utilise naturellement les mémoires (pas de répétition mécanique)
- [ ] Si aucune mémoire pertinente : pas de section ajoutée (prompt plus court)
- [ ] "Tu te souviens de X ?" → Claude consulte ses mémoires
- [ ] Mémoires récentes pondérées plus fortement (recency boost)

## Tâches de dev

1. **MemoryRetriever** (~2h)
   - Méthode `retrieve(userId, query, limit=10, minSimilarity=0.5)`
   - Embedding de la requête (même API que EL-025)
   - Query pgvector avec cosine distance
   - Recency boost : `score = similarity * 0.8 + recency_factor * 0.2`

2. **Prompt injection** (~2h)
   - Modifier le system prompt builder (EL-008)
   - Section conditionnelle "Mémoire long-terme" avec les faits récupérés
   - Grouper par catégorie (préférences, personnes, faits)
   - Placement dans le bloc cached (si mémoires stables)

3. **Index optimization** (~1h)
   - Créer index HNSW sur `memories.embedding`
   - `CREATE INDEX ON memories USING hnsw (embedding vector_cosine_ops)`
   - Benchmark : vérifier <50ms pour 1000 mémoires

4. **Cache invalidation** (~1h)
   - Si nouvelles mémoires ajoutées → invalider le cache prompt
   - Strategy : hash des top mémoires → si changé, nouveau cache block

## Tests requis

- **Unitaire :** MemoryRetriever retourne les bonnes mémoires triées
- **Unitaire :** Prompt builder inclut/exclut la section mémoire correctement
- **Performance :** Recherche pgvector <50ms sur 1000 entrées
- **Intégration :** "Sophie" mentionné → mémoires Sophie récupérées → Claude contextualisé
- **Manuel :** Conversation naturelle utilisant des mémoires passées

## Definition of Done

- [ ] RAG fonctionnel end-to-end
- [ ] Mémoires utilisées naturellement par Claude
- [ ] Latence <50ms pour la recherche
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
