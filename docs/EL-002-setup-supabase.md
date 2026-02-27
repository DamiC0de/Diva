# EL-002 — Setup Supabase (BDD + Auth + RLS)

**Épique :** E1 — Infrastructure & Backend
**Sprint :** S1
**Points :** 5
**Priorité :** P0
**Dépendances :** EL-001 (VPS disponible)

---

## Description

En tant que **développeur backend**, je veux configurer Supabase self-hosted avec PostgreSQL, pgvector, Auth et les politiques RLS, afin de disposer d'une base de données sécurisée et prête pour toutes les fonctionnalités d'Elio.

## Contexte technique

- **Supabase self-hosted** via Docker Compose sur Hetzner AX102 (ou CX32 en Phase 0)
- **PostgreSQL 15+** avec extension `pgvector` pour les embeddings mémoire
- **6 tables** : `users`, `connected_services`, `conversations`, `messages`, `memories`, `care_contacts`
- **RLS** : chaque user ne voit que ses données
- **Auth** : magic link email + Apple Sign In (préparé, activé dans EL-003)

### Schéma BDD (cf. Architecture Winston)

```sql
-- Tables principales
users (id UUID PK, email, display_name, subscription_tier, settings JSONB, created_at)
connected_services (id, user_id FK, service_type, credentials JSONB chiffré, status, created_at)
conversations (id, user_id FK, started_at, ended_at, message_count, mood_detected)
messages (id, conversation_id FK, role, content, audio_url, tokens_in, tokens_out, created_at)
memories (id, user_id FK, category, content, embedding VECTOR(1536), source_conversation_id FK, relevance_score, created_at)
care_contacts (id, patient_user_id FK, caregiver_user_id FK, relationship, alert_level, daily_report)
```

## Critères d'acceptation

- [ ] Docker Compose Supabase lancé et fonctionnel (PostgreSQL, GoTrue, PostgREST, Realtime)
- [ ] Extension `pgvector` installée et activée
- [ ] 6 tables créées via migration SQL versionnée
- [ ] ENUMs créés : `subscription_tier`, `service_type`, `message_role`, `memory_category`, `service_status`, `alert_level`
- [ ] RLS activé sur toutes les tables
- [ ] Politique RLS : `auth.uid() = user_id` sur chaque table
- [ ] Politique RLS Care : caregiver peut lire conversations/memories du patient si relation validée
- [ ] Index sur `memories.embedding` (ivfflat ou HNSW)
- [ ] Index sur `messages.conversation_id` et `messages.created_at`
- [ ] Colonne `credentials` dans `connected_services` : documentation du chiffrement AES-256
- [ ] Seed script avec un user de test
- [ ] Connexion depuis l'API Gateway (EL-001) vérifiée

## Tâches de dev

1. **Docker Compose Supabase** (~2h)
   - Cloner `supabase/supabase` docker, configurer `.env`
   - Ajouter pgvector à l'image Postgres
   - Exposer uniquement sur localhost (Caddy en front si besoin)

2. **Migrations SQL** (~3h)
   - `001_create_enums.sql`
   - `002_create_users.sql`
   - `003_create_connected_services.sql`
   - `004_create_conversations.sql`
   - `005_create_messages.sql`
   - `006_create_memories.sql`
   - `007_create_care_contacts.sql`
   - `008_create_indexes.sql`

3. **RLS Policies** (~2h)
   - Politique par table (SELECT, INSERT, UPDATE, DELETE)
   - Politique spéciale `care_contacts` → accès caregiver

4. **Seed & Validation** (~1h)
   - Script seed avec user test + conversation + memories
   - Vérifier RLS fonctionne (query en tant que user A ne voit pas user B)

## Tests requis

- **Unitaire :** Chaque migration s'exécute sans erreur
- **Intégration :** Insert + Select avec RLS enforced (user A ≠ user B)
- **Intégration :** Recherche vectorielle `memories` avec `<=>` operator
- **Intégration :** Care contact peut lire les données patient
- **Manuel :** Dashboard Supabase Studio accessible

## Definition of Done

- [ ] Migrations versionnées dans `supabase/migrations/`
- [ ] RLS testé et documenté
- [ ] pgvector fonctionnel (insert embedding + similarity search)
- [ ] README infra mis à jour
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
