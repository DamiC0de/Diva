# EL-020 — Météo & Recherche Web

**Épique :** E4 — Intégrations Services
**Sprint :** S3
**Points :** 3
**Priorité :** P1
**Dépendances :** EL-008 (Claude Haiku)

---

## Description

En tant qu'**utilisateur**, je veux demander la météo et poser des questions de culture générale à Elio, afin d'obtenir des infos à jour sans ouvrir mon navigateur.

## Contexte technique

- **Météo** : Open-Meteo API (gratuit, sans API key) ou wttr.in
- **Recherche web** : Brave Search API (gratuit jusqu'à 2000 req/mois) ou Tavily
- **Tool calling** : Claude appelle les outils quand il a besoin d'infos fraîches

## Critères d'acceptation

- [ ] "Quel temps fait-il ?" → météo actuelle (température, conditions, vent)
- [ ] "Météo demain à Paris" → prévisions J+1 avec ville spécifique
- [ ] Localisation par défaut depuis settings user (ville), ou GPS si autorisé
- [ ] "Cherche sur internet X" → résumé des résultats de recherche
- [ ] Claude décide seul quand chercher (questions factuelles récentes, actualité)
- [ ] Résultats formatés naturellement par Claude (pas de JSON brut)
- [ ] Rate limiting : max 50 recherches/user/jour

## Tâches de dev

1. **WeatherService** (~1h)
   - Open-Meteo API : current + forecast
   - Géocodage ville → lat/lon
   - Tool : `get_weather { city, days? }`

2. **WebSearchService** (~1h)
   - Brave Search API : `query` → top 5 résultats (title + snippet)
   - Tool : `web_search { query }`
   - Claude résume les résultats

3. **Tool registration** (~0.5h)
   - Ajouter les 2 tools au system prompt
   - ActionRunner handlers

## Tests requis

- **Unitaire :** WeatherService parse correctement la réponse Open-Meteo
- **Intégration :** "Météo Paris" → tool call → réponse formatée
- **Manuel :** "C'est quoi les news aujourd'hui ?" → recherche + résumé

## Definition of Done

- [ ] Météo fonctionnelle
- [ ] Recherche web fonctionnelle
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
