# EL-016 — Notifications & Rappels (APNs)

**Épique :** E3 — App React Native
**Sprint :** S3
**Points :** 5
**Priorité :** P1
**Dépendances :** EL-002 (Supabase), EL-008 (Claude Haiku)

---

## Description

En tant qu'**utilisateur**, je veux recevoir des notifications push pour mes rappels et alertes, afin qu'Elio m'assiste même quand l'app n'est pas ouverte.

## Contexte technique

- **APNs** (Apple Push Notification service) via `expo-notifications`
- **Rappels** : créés par Claude quand l'user demande ("Rappelle-moi de...", "Dans 30 min dis-moi de...")
- **Table `reminders`** (nouvelle, ou stocké dans `memories` avec category `reminder`)
- **Scheduler** côté serveur : cron qui vérifie les rappels à envoyer

### Types de notifications

1. **Rappels** : "Rappelle-moi d'acheter du pain à 18h" → push à 18h
2. **Alertes Care** : activité anormale du patient → push au caregiver
3. **System** : token expiré, limite free atteinte, etc.

## Critères d'acceptation

- [ ] `expo-notifications` configuré avec APNs (certificat/key)
- [ ] Push token enregistré en BDD à la connexion
- [ ] "Rappelle-moi de X à Y" → Claude crée un reminder via tool call
- [ ] Tool `create_reminder` : `{ text, datetime, recurring? }`
- [ ] Scheduler serveur : check toutes les minutes, envoie push si reminder due
- [ ] Notification affiche : titre "Elio 🔔", body = texte du rappel
- [ ] Tap sur notification → ouvre l'app sur l'écran conversation
- [ ] "Quels sont mes rappels ?" → Claude liste les rappels actifs
- [ ] "Annule mon rappel de X" → supprime le reminder
- [ ] Badge count sur l'icône app (optionnel)
- [ ] Notifications silencieuses pour les alertes non urgentes

## Tâches de dev

1. **Setup APNs** (~1h)
   - Certificat APNs (Apple Developer Portal)
   - `expo-notifications` config dans `app.json`
   - Enregistrement push token → API → Supabase

2. **Tool reminder** (~1.5h)
   - Tool Claude : `create_reminder`, `list_reminders`, `delete_reminder`
   - Stockage dans `memories` (category: `reminder`) avec champ datetime
   - ActionRunner handler

3. **Scheduler serveur** (~2h)
   - Cron job (node-cron ou BullMQ delayed jobs)
   - Check `memories WHERE category='reminder' AND remind_at <= NOW() AND sent = false`
   - Envoie push via `apn` ou `expo-server-sdk`
   - Marque comme envoyé

4. **Deep linking** (~0.5h)
   - Tap notification → ouvre conversation
   - Payload : `{ type: "reminder", reminder_id }`

## Tests requis

- **Unitaire :** Scheduler sélectionne les bons rappels à envoyer
- **Intégration :** Créer reminder → attendre → push reçue (sandbox)
- **Manuel :** "Rappelle-moi dans 2 minutes de tester" → notification reçue

## Definition of Done

- [ ] Push notifications fonctionnelles (sandbox)
- [ ] Rappels créés/listés/supprimés par la voix
- [ ] Scheduler envoie à l'heure
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
