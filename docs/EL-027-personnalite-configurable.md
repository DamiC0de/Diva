# EL-027 — Personnalité Configurable (System Prompt)

**Épique :** E6 — Mémoire & Personnalité
**Sprint :** S2
**Points :** 3
**Priorité :** P1
**Dépendances :** EL-008 (Claude Haiku)

---

## Description

En tant qu'**utilisateur**, je veux personnaliser la personnalité d'Elio (ton, verbosité, tutoiement, humour), afin qu'il s'adapte à ma façon de communiquer.

## Contexte technique

- **Settings JSONB** dans `users.settings` :
  ```json
  {
    "personality": {
      "tone": "friendly",        // friendly | professional | casual
      "verbosity": "normal",     // concise | normal | detailed
      "formality": "tu",         // tu | vous
      "humor": true,
      "name_preference": "Georges"
    }
  }
  ```
- **System prompt dynamique** : les settings sont injectés dans le prompt Claude
- **Prompt caching** : le bloc personnalité change rarement → cacheable

## Critères d'acceptation

- [ ] Section "Personnalité" dans l'écran Settings
- [ ] Sélecteurs pour : ton (3 options), verbosité (3 options), tutoiement (tu/vous), humour (on/off)
- [ ] Champ texte : "Comment Elio doit t'appeler ?" (prénom)
- [ ] Changements sauvegardés dans `users.settings` (Supabase)
- [ ] System prompt adapté dynamiquement selon les settings
- [ ] Elio respecte les settings dès la prochaine interaction
- [ ] Valeurs par défaut : friendly, normal, tu, humour on
- [ ] Preview : phrase d'exemple qui change selon les settings choisis

## Tâches de dev

1. **UI Settings personnalité** (~1.5h)
   - Composants : SegmentedControl (ton, verbosité), Switch (tu/vous, humour), TextInput (prénom)
   - Preview dynamique en bas

2. **API CRUD settings** (~0.5h)
   - `PATCH /api/v1/users/settings` → merge JSONB
   - Validation schema (zod)

3. **System prompt builder** (~1h)
   - Template avec variables : `{tone_instructions}`, `{verbosity_instructions}`, `{formality}`, `{user_name}`
   - Mapping ton → instructions texte (ex: friendly = "Sois chaleureux et encourageant")
   - Injecté dans le system prompt avant chaque appel Claude

## Tests requis

- **Unitaire :** System prompt builder génère le bon prompt selon les settings
- **Intégration :** Changer ton → prochaine réponse Elio reflète le changement
- **Manuel :** Basculer tu/vous → vérifier qu'Elio adapte

## Definition of Done

- [ ] Settings personnalité fonctionnels
- [ ] System prompt adapté dynamiquement
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
