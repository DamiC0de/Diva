# EL-003 — Auth Flow (Magic Link + Apple Sign In)

**Épique :** E1 — Infrastructure & Backend
**Sprint :** S1
**Points :** 5
**Priorité :** P0
**Dépendances :** EL-001 (API Gateway), EL-002 (Supabase Auth)

---

## Description

En tant qu'**utilisateur**, je veux me connecter avec mon email (magic link) ou Apple Sign In, afin d'accéder à mon compte Elio de manière simple et sécurisée.

## Contexte technique

- **Supabase Auth (GoTrue)** pour la gestion des sessions
- **Magic Link** : email envoyé via Supabase, redirect vers l'app (deep link)
- **Apple Sign In** : obligatoire sur iOS si on propose du social login (App Store guideline)
- **JWT** : tokens signés par Supabase, vérifiés côté API Gateway
- **Refresh tokens** : rotation automatique, stocké en Secure Storage (expo-secure-store)

### Flux auth

```
User                  App              API GW           Supabase Auth
 │                     │                │                    │
 │── email ──────────▶ │                │                    │
 │                     │── magic link ──│──────────────────▶ │
 │                     │                │                    │── send email
 │◀── email reçu ──────│                │                    │
 │── click link ──────▶│                │                    │
 │                     │── verify ──────│──────────────────▶ │
 │                     │◀── JWT + refresh token ────────────│
 │                     │── store secure │                    │
 │◀── logged in ───────│                │                    │
```

## Critères d'acceptation

- [ ] Magic link : user entre son email → reçoit un email → click → connecté dans l'app
- [ ] Apple Sign In : bouton "Sign in with Apple" → flow natif iOS → connecté
- [ ] JWT stocké dans `expo-secure-store` (pas AsyncStorage)
- [ ] Refresh token rotation active
- [ ] API Gateway vérifie le JWT Supabase sur chaque requête authentifiée
- [ ] Middleware Fastify `authenticate` : rejette 401 si token invalide/expiré
- [ ] Deep link configuré pour le magic link redirect (`elio://auth/callback`)
- [ ] Écran de login minimaliste (email input + bouton Apple)
- [ ] Gestion d'erreur : email invalide, lien expiré, network error
- [ ] Logout : supprime tokens + redirige vers login
- [ ] Auto-login au lancement si token valide

## Tâches de dev

1. **Config Supabase Auth** (~1h)
   - Activer magic link provider
   - Configurer Apple Sign In (Apple Developer Portal + Supabase)
   - Email template personnalisé (branding Elio)
   - Redirect URL : `elio://auth/callback`

2. **App — Écran Login** (~3h)
   - Composant `LoginScreen` : champ email + bouton "Recevoir le lien magique"
   - Bouton Apple Sign In (`expo-apple-authentication`)
   - Loading state, error handling
   - Deep link handler (`expo-linking`) pour callback magic link

3. **App — Auth State Management** (~2h)
   - Context/Provider React pour l'état auth
   - `supabase.auth.onAuthStateChange()` listener
   - Stockage JWT dans `expo-secure-store`
   - Auto-refresh token en background
   - Navigation conditionnelle (login vs main)

4. **API Gateway — JWT Middleware** (~2h)
   - Plugin Fastify `authenticate` : vérifie JWT Supabase (JWKS ou secret)
   - Extraction `user_id` du token pour injection dans les handlers
   - Routes publiques vs protégées

## Tests requis

- **Unitaire :** JWT middleware rejette token expiré
- **Unitaire :** JWT middleware accepte token valide et extrait user_id
- **Intégration :** Flow complet magic link (peut être simulé en test)
- **Intégration :** Apple Sign In mock
- **E2E (manuel) :** Login magic link sur device réel → navigation vers main
- **E2E (manuel) :** Apple Sign In sur device réel

## Definition of Done

- [ ] Login magic link fonctionnel end-to-end
- [ ] Apple Sign In fonctionnel
- [ ] JWT vérifié côté API Gateway
- [ ] Secure storage pour tokens
- [ ] Logout fonctionne
- [ ] Auto-login au relaunch
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
