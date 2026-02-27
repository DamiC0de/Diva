# EL-018 — Google Calendar (CRUD, OAuth2)

**Épique :** E4 — Intégrations Services
**Sprint :** S2
**Points :** 5
**Priorité :** P1
**Dépendances :** EL-008 (Claude Haiku), EL-015 (Services connectés), EL-017 (partage OAuth Google)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio gère mon agenda Google Calendar par la voix, afin de consulter, créer et modifier mes événements sans ouvrir l'app.

## Contexte technique

- **Google Calendar API v3** (REST) via OAuth2 (scope `calendar.events`)
- **OAuth2 partagé** avec Gmail (même token Google, scopes combinés)
- **Tool calling Claude** : CRUD événements

### Tools Claude

```json
[
  { "name": "calendar_today", "description": "Liste les événements d'aujourd'hui" },
  { "name": "calendar_upcoming", "description": "Liste les N prochains événements", "input_schema": { "properties": { "days": { "type": "integer", "default": 7 } } } },
  { "name": "calendar_create", "description": "Crée un événement", "input_schema": { "properties": { "title": { "type": "string" }, "start": { "type": "string" }, "end": { "type": "string" }, "description": { "type": "string" } }, "required": ["title", "start"] } },
  { "name": "calendar_delete", "description": "Supprime un événement", "input_schema": { "properties": { "event_id": { "type": "string" } }, "required": ["event_id"] } }
]
```

## Critères d'acceptation

- [ ] Module `CalendarService` côté API Gateway
- [ ] "C'est quoi mon programme aujourd'hui ?" → liste les événements du jour
- [ ] "Qu'est-ce que j'ai cette semaine ?" → événements des 7 prochains jours
- [ ] "Mets un rdv dentiste mardi à 14h" → crée l'événement (avec confirmation)
- [ ] "Annule mon rdv de demain matin" → supprime (avec confirmation)
- [ ] Parsing dates naturel géré par Claude (pas de parsing custom côté backend)
- [ ] Timezone : Europe/Paris (configurable dans user settings)
- [ ] Confirmation avant création/suppression
- [ ] Format réponse naturel : "Tu as 3 événements aujourd'hui : réunion à 9h, déjeuner à 12h..."

## Tâches de dev

1. **CalendarService** (~2h)
   - Méthodes : `getToday()`, `getUpcoming(days)`, `createEvent()`, `deleteEvent()`
   - Réutilise le token OAuth Google (même `connected_services` entry)

2. **Tool registration** (~1h)
   - Ajouter tools calendar au system prompt
   - Handler dans ActionRunner

3. **Date/timezone handling** (~1h)
   - Toutes les dates en ISO 8601
   - Claude convertit le langage naturel → dates structurées
   - Timezone user depuis settings

4. **Confirmation flow** (~0.5h)
   - Réutilise le pattern de confirmation de EL-017

## Tests requis

- **Unitaire :** CalendarService.getToday retourne les bons événements
- **Unitaire :** Création événement avec les bons paramètres
- **Intégration :** "Mets un rdv" → tool call → événement créé dans Google Calendar
- **Manuel :** Vérifier dans Google Calendar que l'événement apparaît

## Definition of Done

- [ ] Lecture agenda fonctionnelle
- [ ] Création/suppression avec confirmation
- [ ] Timezone correcte
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
