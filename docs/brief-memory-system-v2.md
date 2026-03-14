# Brief Produit — Diva Memory System v2

**Date :** 14 mars 2026  
**Auteur :** Mary (Analyste BMAD)  
**Validé par :** Georges  

## Vision

Faire de Diva l'assistant qui te connaît le mieux au monde. Chaque conversation enrichit sa compréhension de toi. Plus tu lui parles, plus elle devient pertinente.

## Persona principal

Alex, 30 ans, utilisateur quotidien. Il parle à Diva pour organiser sa vie, discuter de ses projets, raconter sa journée. Après 2 semaines, Diva sait que Sophie est sa copine, qu'il déteste les épinards, qu'il a un entretien mardi, et que son chien s'appelle Oscar.

## Cas d'usage secondaire — Alzheimer / Accessibilité cognitive

Diva comme compagnon de mémoire pour les personnes atteintes de troubles cognitifs. Les mémoires deviennent un filet de sécurité : noms des proches, routines, événements importants.

## Architecture cible — 4 piliers

### 1. Extraction enrichie (amélioration de l'existant)
- Extraction **pendant** la conversation (pas juste à la déconnexion)
- Catégories élargies : `preference`, `fact`, `person`, `event`, `health`, `routine`, `location`, `relationship`, `opinion`, `goal`
- Score de confiance + date d'expiration ("a mal à la tête" expire en 48h, "est diabétique" = permanent)
- Extraction des relations entre entités ("Sophie" → "copine" → "travaille chez L'Oréal")

### 2. Graphe relationnel (nouveau)
- Les mémoires ne sont plus des lignes isolées mais un réseau
- Nœuds : personnes, lieux, événements, préférences
- Arêtes : liens typés ("est la copine de", "travaille à", "aime")
- Permet des requêtes du type "Qu'est-ce que je sais sur la famille de l'utilisateur ?"

### 3. Mémoire proactive (nouveau)
- Rappels contextuels : "Tu m'avais dit que tu avais un rdv dentiste demain"
- Suggestions basées sur les patterns : "D'habitude le vendredi tu commandes des sushis"
- Alertes douces, pas intrusives — intégrées naturellement dans la conversation

### 4. Interface utilisateur (nouveau)
- Écran "Mes souvenirs" avec recherche et filtres par catégorie
- Possibilité d'éditer, supprimer, ajouter manuellement
- Vue graphe simplifiée (les personnes et leurs liens)
- Export des données (RGPD droit à la portabilité)

## RGPD — Approche hybride

- Données sensibles (santé, opinions) → chiffrement applicatif côté client avant stockage
- Données classiques (préférences, faits) → cloud chiffré (Supabase + RLS)
- Droit à l'oubli → suppression totale déjà implémentée
- Consentement explicite → opt-in au premier lancement

## Priorisation MoSCoW

### 🔴 Must Have (Sprint 1)
- Extraction continue (pendant la conversation)
- Catégories élargies (10 au lieu de 4)
- Écran basique "Mes souvenirs" (liste + recherche)
- Mémoires sans limite

### 🟡 Should Have (Sprint 2)
- Mémoire temporelle (expiration)
- Rappels proactifs simples
- Édition/suppression dans l'app

### 🟢 Could Have (Sprint 3)
- Graphe relationnel
- Vue graphe dans l'app
- Suggestions basées sur les patterns

### ⚪ Won't Have (v1)
- Mode aidant (accès par un proche)
- Fonctionnement 100% offline
- Export/import de mémoires

## Base technique existante

- Table `memories` dans Supabase (Diva) avec embeddings 1536 dims
- Extraction via LLM (Claude Haiku) à la déconnexion WS
- Dédoublonnage par cosine similarity > 0.9
- Rappel contextuel via `match_memories` RPC (pgvector)
- 4 catégories actuelles : preference, fact, person, event
