# EL-019 — Contacts iOS

**Épique :** E4 — Intégrations Services
**Sprint :** S2
**Points :** 3
**Priorité :** P1
**Dépendances :** EL-012 (App Expo), EL-008 (Claude Haiku)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio accède à mes contacts iPhone pour trouver des numéros, emails, et lancer des appels, afin de ne pas avoir à chercher moi-même.

## Contexte technique

- **expo-contacts** : accès lecture seule aux contacts iOS
- **On-device** : les contacts restent sur l'appareil, pas envoyés au serveur
- **Tool calling** : Claude demande une recherche contact → exécutée côté app → résultat renvoyé
- **URL schemes** : `tel://` pour appels, `mailto:` pour emails

### Architecture spéciale

Les contacts sont sur l'iPhone, pas sur le serveur. Flow :

```
Claude ──tool_use: contact_search──▶ API GW ──ws: exec_on_device──▶ App
                                                                      │
App ──expo-contacts.getContactsAsync──▶ résultat                     │
                                                                      │
App ──ws: tool_result──▶ API GW ──tool_result──▶ Claude              │
```

## Critères d'acceptation

- [ ] Permission contacts demandée au premier usage (`expo-contacts`)
- [ ] "Appelle Sophie" → recherche contact "Sophie" → ouvre `tel://numéro`
- [ ] "C'est quoi le mail de Marc ?" → recherche → retourne l'email
- [ ] "Envoie un mail à Sophie" → résout contact → utilise Gmail (EL-017)
- [ ] Recherche fuzzy : "Appelle ma mère" → nécessite mémoire (EL-025/026) pour résoudre "mère" → contact
- [ ] Si plusieurs résultats : Elio demande "Sophie Martin ou Sophie Dubois ?"
- [ ] Contacts jamais envoyés au serveur en bulk (privacy)
- [ ] Gestion permission refusée : message explicatif

## Tâches de dev

1. **Module ContactsService (app-side)** (~1.5h)
   - `searchContacts(query)` → filtre par nom, prénom
   - Retourne : `{ name, phone, email }` (max 5 résultats)
   - Exécuté localement sur l'appareil

2. **Device-side tool execution** (~1.5h)
   - WS message type `exec_on_device` : serveur demande à l'app d'exécuter une action locale
   - App exécute → renvoie le résultat via WS
   - Pattern réutilisable pour d'autres actions on-device

3. **Tool registration Claude** (~0.5h)
   - Tool `contact_search` avec param `query`
   - Tool `call_contact` → ouvre `tel://`
   - Intégration dans ActionRunner

4. **URL scheme actions** (~0.5h)
   - `Linking.openURL('tel://...')` pour appeler
   - `Linking.openURL('mailto://...')` pour email natif

## Tests requis

- **Unitaire :** searchContacts filtre correctement
- **Intégration :** Tool call → device exec → résultat remonté → Claude répond
- **Manuel :** "Appelle Sophie" → téléphone lance l'appel

## Definition of Done

- [ ] Recherche contacts fonctionnelle
- [ ] Appel via tel:// fonctionne
- [ ] Contacts restent on-device
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
