# EL-004 — Billing & Subscription (RevenueCat)

**Épique :** E1 — Infrastructure & Backend
**Sprint :** S2
**Points :** 8
**Priorité :** P1
**Dépendances :** EL-003 (Auth flow), EL-012 (App Expo)

---

## Description

En tant qu'**utilisateur**, je veux pouvoir m'abonner à Elio Pro/Annual/Care via l'App Store, afin de débloquer les fonctionnalités complètes de l'assistant.

## Contexte technique

- **RevenueCat** : SDK pour gérer les achats in-app iOS (abstraction App Store Connect)
- **Tiers** : Free (10 interactions/jour), Pro (14,99€/mois), Annual (119,99€/an), Care (24,99€/mois)
- **Webhooks RevenueCat → API Gateway** : sync statut abonnement en temps réel
- **Supabase** : champ `subscription_tier` dans `users`
- **Rate limiting** : tier Free = 10 requêtes LLM/jour

### Flux d'achat

```
User         App (RevenueCat SDK)     App Store      RevenueCat     API Gateway    Supabase
 │            │                        │              │              │              │
 │──tap Pro──▶│                        │              │              │              │
 │            │──purchase request────▶ │              │              │              │
 │            │◀──receipt─────────────│              │              │              │
 │            │──validate────────────────────────────▶│              │              │
 │            │                        │              │──webhook────▶│              │
 │            │                        │              │              │──UPDATE tier─▶│
 │◀──Pro ✅───│                        │              │              │              │
```

## Critères d'acceptation

- [ ] RevenueCat SDK intégré dans l'app Expo (`react-native-purchases`)
- [ ] 4 produits configurés dans App Store Connect + RevenueCat dashboard
- [ ] Paywall screen : affiche les 3 plans payants avec prix, features, CTA
- [ ] Achat : flow natif iOS (Face ID / Touch ID pour confirmer)
- [ ] Restore purchases fonctionnel
- [ ] Webhook RevenueCat → API Gateway : met à jour `users.subscription_tier`
- [ ] Middleware API Gateway : vérifie le tier avant chaque requête LLM
- [ ] Free tier : compteur 10 interactions/jour (reset à minuit UTC+1)
- [ ] Écran settings : affiche le plan actuel, date renouvellement, bouton "Gérer l'abonnement"
- [ ] Gestion expiration / annulation : downgrade automatique vers Free
- [ ] Sandbox testing fonctionnel (StoreKit Testing)

## Tâches de dev

1. **App Store Connect** (~1h)
   - Créer 3 produits auto-renewable subscription
   - Configurer les prix FR/EU
   - Créer un subscription group "Elio"

2. **RevenueCat setup** (~1h)
   - Créer projet RevenueCat, lier App Store Connect
   - Configurer offerings (packages)
   - Configurer webhook → `POST /api/v1/webhooks/revenuecat`

3. **SDK côté app** (~3h)
   - `react-native-purchases` init au lancement
   - Identifier le user (`Purchases.logIn(userId)`)
   - Paywall screen avec offerings dynamiques
   - Achat + restore + gestion erreurs
   - Listener `customerInfo` pour update UI en temps réel

4. **API Gateway webhook** (~2h)
   - Route `POST /api/v1/webhooks/revenuecat` (vérifier signature)
   - Events : `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`
   - Update `users.subscription_tier` dans Supabase
   - Logger chaque event

5. **Rate limiting Free tier** (~1h)
   - Compteur Redis : `rate:llm:{userId}:{date}` → max 10
   - Middleware qui vérifie avant chaque appel LLM
   - Réponse 429 avec message user-friendly : "Tu as atteint la limite gratuite..."

## Tests requis

- **Unitaire :** Webhook handler parse correctement chaque event type
- **Unitaire :** Rate limiter bloque à 11ème requête pour Free
- **Unitaire :** Rate limiter ne bloque pas les Pro
- **Intégration :** Webhook → Supabase tier update vérifié
- **E2E (sandbox) :** Achat en sandbox → tier mis à jour → features débloquées
- **Manuel :** Restore purchases après réinstall

## Definition of Done

- [ ] Paywall fonctionnel en sandbox
- [ ] Webhook sync le tier en BDD
- [ ] Free tier limité à 10/jour
- [ ] Restore purchases OK
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
