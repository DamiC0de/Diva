# EL-015 — Écran Services Connectés

**Épique :** E3 — App React Native
**Sprint :** S2
**Points :** 5
**Priorité :** P1
**Dépendances :** EL-012 (Setup Expo), EL-003 (Auth)

---

## Description

En tant qu'**utilisateur**, je veux voir et gérer mes services connectés (Gmail, Calendar, Telegram, Spotify...), afin de contrôler ce à quoi Elio a accès.

## Contexte technique

- **Table `connected_services`** : stocke les tokens OAuth par service
- **OAuth2** : flow géré via `expo-auth-session` (redirect URI)
- **Services MVP** : Gmail, Google Calendar, Contacts iOS, Spotify (les intégrations réelles dans E4)
- Cet écran prépare l'UI ; les intégrations effectives sont dans EL-017/018/019

## Critères d'acceptation

- [ ] Écran liste tous les services disponibles avec icône + nom + état (Connecté/Non connecté)
- [ ] Bouton "Connecter" lance le flow OAuth2 pour le service
- [ ] Bouton "Déconnecter" révoque le token et supprime l'entrée
- [ ] État synchronisé avec `connected_services` table (Supabase)
- [ ] Indicateur si un token est expiré → bouton "Reconnecter"
- [ ] UI : cards avec switch toggle ou bouton connect/disconnect
- [ ] Catégories visuelles : Communication, Productivité, Divertissement, Domotique
- [ ] Loading states pendant la connexion OAuth
- [ ] Confirmation avant déconnexion

## Tâches de dev

1. **Écran ServicesScreen** (~2h)
   - Liste de services groupés par catégorie
   - Card par service : icon, nom, description, état, action button
   - Pull-to-refresh pour sync état

2. **Service config** (~1h)
   - Config JSON des services disponibles : `{ id, name, icon, category, oauthConfig }`
   - MVP : Gmail, Google Calendar, Contacts, Spotify (greyed out : Telegram, HomeKit, etc.)

3. **OAuth flow** (~2h)
   - `expo-auth-session` pour Google OAuth2 (Gmail + Calendar scope)
   - Callback → envoyer token à l'API Gateway
   - API Gateway stocke dans `connected_services` (chiffré AES-256)

4. **CRUD connected_services** (~1h)
   - API routes : `GET /api/v1/services`, `POST /api/v1/services/connect`, `DELETE /api/v1/services/:id`
   - Validation token + refresh si expiré

## Tests requis

- **Unitaire :** ServiceCard render correctement chaque état
- **Intégration :** Connect → token stocké → état "Connecté" affiché
- **Intégration :** Disconnect → token supprimé → état "Non connecté"
- **Manuel :** Flow OAuth Google complet sur device

## Definition of Done

- [ ] Écran services fonctionnel
- [ ] OAuth Google fonctionne (sandbox)
- [ ] Connect/disconnect persisté en BDD
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
