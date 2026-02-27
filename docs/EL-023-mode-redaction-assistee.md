# EL-023 — Mode Rédaction Assistée

**Épique :** E5 — Clavier intelligent
**Sprint :** S4
**Points :** 5
**Priorité :** P1
**Dépendances :** EL-022 (Clavier custom)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio m'aide à rédiger mes messages (reformuler, corriger, compléter), afin d'écrire mieux et plus vite dans toutes mes apps.

## Contexte technique

- Extension du clavier Elio (EL-022)
- Barre d'outils au-dessus du clavier avec actions de rédaction
- Claude Haiku pour la reformulation/correction

### Actions disponibles

```
┌─────────────────────────────────────────┐
│ [✨ Reformuler] [📝 Corriger] [🔄 Plus │
│  court] [📖 Plus formel] [🎯 Compléter]│
├─────────────────────────────────────────┤
│             Clavier AZERTY              │
└─────────────────────────────────────────┘
```

## Critères d'acceptation

- [ ] Barre d'outils contextuelle au-dessus du clavier (apparaît si texte sélectionné ou en cours)
- [ ] **Reformuler** : réécrit le texte sélectionné de manière plus claire
- [ ] **Corriger** : corrige grammaire et orthographe
- [ ] **Plus court** : résume/raccourcit le texte
- [ ] **Plus formel** : passe le texte en registre formel
- [ ] **Compléter** : suggère la suite du texte en cours
- [ ] Résultat affiché en preview → tap pour remplacer le texte original
- [ ] Undo : revenir au texte original (1 niveau)
- [ ] Latence <1.5s pour chaque action
- [ ] Fonctionne dans toutes les apps (via textDocumentProxy)

## Tâches de dev

1. **Toolbar UI** (~1.5h)
   - Barre scrollable horizontale avec boutons d'action
   - Apparaît quand texte détecté dans le champ

2. **Text manipulation** (~2h)
   - Lire le texte sélectionné/avant curseur via `textDocumentProxy`
   - Envoyer à Claude via API Gateway avec instruction spécifique
   - Recevoir résultat → afficher en preview bubble
   - Tap preview → remplacer dans le champ

3. **Prompts spécialisés** (~1h)
   - Un prompt par action (reformuler, corriger, raccourcir, formaliser, compléter)
   - Optimisés pour Haiku (courts, précis)

4. **Undo** (~0.5h)
   - Stocker le texte original avant remplacement
   - Bouton undo dans la toolbar

## Tests requis

- **Unitaire :** Chaque prompt retourne un résultat cohérent
- **Intégration :** Sélectionner texte → reformuler → texte remplacé
- **Manuel :** Tester dans WhatsApp, Notes, Mail

## Definition of Done

- [ ] 5 actions de rédaction fonctionnelles
- [ ] Preview + remplacement
- [ ] Undo opérationnel
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
