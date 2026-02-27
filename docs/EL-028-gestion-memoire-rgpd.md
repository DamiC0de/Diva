# EL-028 — Gestion Mémoire User (CRUD + Export RGPD)

**Épique :** E6 — Mémoire & Personnalité
**Sprint :** S4
**Points :** 5
**Priorité :** P1
**Dépendances :** EL-025 (Extraction mémoire)

---

## Description

En tant qu'**utilisateur**, je veux consulter, modifier et supprimer ce qu'Elio sait de moi, et exporter toutes mes données, afin de garder le contrôle sur ma vie privée (RGPD).

## Contexte technique

- **RGPD** : droit d'accès, rectification, effacement, portabilité
- **Écran "Ma mémoire"** dans l'app : liste des mémoires avec CRUD
- **Export** : ZIP contenant conversations + mémoires + settings en JSON
- **Suppression compte** : hard delete de toutes les données (EL-014 déclenche, ici on implémente la logique)

## Critères d'acceptation

- [ ] Écran "Ma mémoire" accessible depuis Settings
- [ ] Liste des mémoires groupées par catégorie (préférences, personnes, faits, événements)
- [ ] Chaque mémoire : texte + date + source conversation + boutons edit/delete
- [ ] Modifier une mémoire → met à jour le texte + recalcule l'embedding
- [ ] Supprimer une mémoire → hard delete (pas soft delete)
- [ ] Recherche dans les mémoires (barre de recherche textuelle)
- [ ] "Elio, oublie que..." → supprime la mémoire correspondante (tool `delete_memory`)
- [ ] **Export données** : bouton → génère ZIP → download
  - `conversations.json` : toutes les conversations + messages
  - `memories.json` : toutes les mémoires
  - `settings.json` : paramètres user
  - `connected_services.json` : liste des services (sans tokens)
- [ ] **Suppression compte** : endpoint `DELETE /api/v1/account` → supprime tout (cascade)
- [ ] Confirmation double avant suppression (saisir "SUPPRIMER")
- [ ] Export disponible dans les 48h (email avec lien de téléchargement)

## Tâches de dev

1. **Écran Ma Mémoire** (~2h)
   - FlatList avec sections par catégorie
   - Swipe-to-delete ou bouton
   - Modal édition
   - Barre de recherche

2. **API CRUD mémoires** (~1h)
   - `GET /api/v1/memories` (avec pagination + filtre catégorie)
   - `PATCH /api/v1/memories/:id` (update content + re-embed)
   - `DELETE /api/v1/memories/:id`
   - Tool Claude : `delete_memory { query }` → recherche sémantique → supprime

3. **Export RGPD** (~1.5h)
   - Endpoint `POST /api/v1/account/export`
   - Background job : collecte toutes les données → ZIP → upload Supabase Storage
   - Notification push quand prêt + email avec lien (expire 7 jours)

4. **Suppression compte** (~0.5h)
   - `DELETE /api/v1/account` avec confirmation body
   - CASCADE delete sur toutes les tables
   - Révoquer tokens OAuth des services connectés
   - Révoquer JWT

## Tests requis

- **Unitaire :** Export génère un ZIP valide avec les 4 fichiers
- **Unitaire :** Suppression cascade supprime tout (0 rows restantes)
- **Intégration :** Edit mémoire → embedding recalculé → RAG utilise la version à jour
- **Manuel :** Exporter → télécharger ZIP → vérifier contenu

## Definition of Done

- [ ] CRUD mémoires fonctionnel (UI + API + vocal)
- [ ] Export RGPD opérationnel
- [ ] Suppression compte cascade
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
