# EL-014 — Écran Settings

**Épique :** E3 — App React Native
**Sprint :** S3
**Points :** 5
**Priorité :** P1
**Dépendances :** EL-012 (Setup Expo), EL-003 (Auth), EL-027 (Personnalité)

---

## Description

En tant qu'**utilisateur**, je veux un écran de paramètres complet pour configurer mon compte, ma voix, mes préférences et mon abonnement.

## Contexte technique

- Settings stockés dans `users.settings` (JSONB) sur Supabase
- Sections : Compte, Personnalité (EL-027), Voix & Audio, Abonnement, Confidentialité, À propos

## Critères d'acceptation

- [ ] **Compte** : prénom, email (read-only), photo de profil (optionnel)
- [ ] **Personnalité** : intégration des settings EL-027 (ton, verbosité, tu/vous, humour)
- [ ] **Voix & Audio** : sélecteur voix Elio (si plusieurs), vitesse de parole, volume, mode wake word (always-on/smart/manual)
- [ ] **Abonnement** : plan actuel, date renouvellement, "Gérer l'abonnement" (ouvre App Store)
- [ ] **Confidentialité** : toggle historique audio, exporter mes données (RGPD), supprimer mon compte
- [ ] **À propos** : version app, mentions légales, politique de confidentialité, contact support
- [ ] Toutes les modifications sauvegardées en temps réel (debounce 500ms)
- [ ] Bouton "Se déconnecter" en bas
- [ ] Navigation par sections (ScrollView avec headers)

## Tâches de dev

1. **SettingsScreen layout** (~2h)
   - Sections avec headers
   - Composants réutilisables : `SettingRow`, `SettingToggle`, `SettingSelect`

2. **Sync settings** (~1h)
   - Hook `useSettings` : lecture + écriture JSONB
   - Debounce save (500ms)
   - Optimistic UI

3. **Actions compte** (~1.5h)
   - Logout : clear tokens + navigate to login
   - Export données : appel API → génère ZIP → téléchargement
   - Supprimer compte : double confirmation → hard delete

4. **Liens externes** (~0.5h)
   - Manage subscription → `Linking.openURL('itms-apps://...')`
   - CGU, politique confidentialité → WebView ou Safari

## Tests requis

- **Unitaire :** SettingRow renders correct pour chaque type
- **Intégration :** Modifier un setting → reload app → setting persisté
- **Manuel :** Parcourir toutes les sections, vérifier tous les toggles

## Definition of Done

- [ ] Toutes les sections fonctionnelles
- [ ] Settings persistés
- [ ] Logout / Delete account fonctionnels
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
