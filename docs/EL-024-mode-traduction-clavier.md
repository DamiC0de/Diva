# EL-024 — Mode Traduction Clavier

**Épique :** E5 — Clavier intelligent
**Sprint :** S4
**Points :** 3
**Priorité :** P2
**Dépendances :** EL-022 (Clavier custom)

---

## Description

En tant qu'**utilisateur**, je veux traduire mes messages directement depuis le clavier Elio, afin de communiquer dans d'autres langues sans quitter mon app.

## Contexte technique

- Extension du clavier Elio
- Claude Haiku pour la traduction (supporte toutes les langues)
- Détection automatique de la langue source

## Critères d'acceptation

- [ ] Bouton 🌐 dans la toolbar du clavier
- [ ] Tap 🌐 → sélecteur langue cible (EN, ES, DE, IT, PT, AR, ZH, JA + "Autre")
- [ ] Traduit le texte sélectionné ou le dernier message tapé
- [ ] Détection automatique de la langue source
- [ ] Résultat en preview → tap pour insérer
- [ ] Langues favorites mémorisées (top 3 utilisées)
- [ ] Mode conversation : toggle pour traduire automatiquement tout ce qui est tapé
- [ ] Latence <1s pour phrases courtes (<50 mots)

## Tâches de dev

1. **UI sélecteur langue** (~1h)
   - Bottom sheet ou popup avec drapeaux + noms
   - Langues favorites en haut
   - Recherche pour "Autre"

2. **Traduction via Claude** (~1h)
   - Prompt : "Traduis en {langue} : {texte}"
   - Détection auto de la source
   - Résultat en preview

3. **Mode conversation** (~1h)
   - Toggle dans toolbar
   - Quand activé : chaque phrase validée est auto-traduite
   - Indicateur visuel (drapeau langue cible affiché)

## Tests requis

- **Unitaire :** Traduction FR→EN correcte
- **Manuel :** Traduire un message dans WhatsApp → envoyer

## Definition of Done

- [ ] Traduction fonctionnelle (8+ langues)
- [ ] Mode conversation auto
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
