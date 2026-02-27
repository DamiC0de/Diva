# EL-017 — Gmail (Lire + Envoyer, OAuth2)

**Épique :** E4 — Intégrations Services
**Sprint :** S2
**Points :** 8
**Priorité :** P1
**Dépendances :** EL-008 (Claude Haiku), EL-015 (Services connectés)

---

## Description

En tant qu'**utilisateur**, je veux qu'Elio lise mes emails Gmail et en envoie pour moi, afin de gérer ma messagerie par la voix.

## Contexte technique

- **Gmail API** (REST) via OAuth2 (scopes : `gmail.readonly`, `gmail.send`, `gmail.modify`)
- **Tool calling** : Claude Haiku appelle des fonctions Gmail quand l'intent est détecté
- **Actions** : lister inbox, lire un email, résumer les non-lus, envoyer un email, répondre, archiver

### Tool definitions pour Claude

```json
[
  { "name": "gmail_list_unread", "description": "Liste les emails non lus", "input_schema": { "type": "object", "properties": { "max_results": { "type": "integer", "default": 5 } } } },
  { "name": "gmail_read", "description": "Lit le contenu d'un email", "input_schema": { "type": "object", "properties": { "message_id": { "type": "string" } }, "required": ["message_id"] } },
  { "name": "gmail_send", "description": "Envoie un email", "input_schema": { "type": "object", "properties": { "to": { "type": "string" }, "subject": { "type": "string" }, "body": { "type": "string" } }, "required": ["to", "subject", "body"] } },
  { "name": "gmail_reply", "description": "Répond à un email", "input_schema": { "type": "object", "properties": { "message_id": { "type": "string" }, "body": { "type": "string" } }, "required": ["message_id", "body"] } }
]
```

## Critères d'acceptation

- [ ] Module `GmailService` côté API Gateway
- [ ] OAuth2 tokens récupérés depuis `connected_services` + auto-refresh si expiré
- [ ] Tools enregistrés dans le system prompt Claude
- [ ] "Lis-moi mes mails" → liste les 5 derniers non-lus avec expéditeur + objet
- [ ] "Lis le mail de Sophie" → affiche le contenu résumé par Claude
- [ ] "Envoie un mail à X pour dire Y" → compose + envoie (avec confirmation vocale avant envoi)
- [ ] "Réponds à ce mail en disant Z" → reply sur le thread
- [ ] **Confirmation obligatoire** avant envoi : Elio lit le brouillon → user confirme vocalement "oui"/"envoie"
- [ ] Gestion erreurs : token expiré → "Tu dois reconnecter Gmail dans les paramètres"
- [ ] Truncation : emails longs résumés par Claude (pas le texte brut complet)

## Tâches de dev

1. **GmailService** (~3h)
   - Classe avec méthodes : `listUnread()`, `readMessage()`, `sendMessage()`, `replyMessage()`
   - Gestion OAuth2 token refresh (`google-auth-library`)
   - Parsing MIME (sujet, from, body text)

2. **Tool registration** (~1h)
   - Ajouter les tools Gmail au system prompt Claude
   - Handler dans l'orchestrateur : quand Claude retourne `tool_use` → appeler GmailService

3. **Action Runner** (~2h)
   - Module générique `ActionRunner` qui exécute les tool calls
   - Pattern : `tool_name` → `service.method(params)` → résultat → retour à Claude
   - Confirmation flow pour les actions destructives (send, reply)

4. **Confirmation vocale** (~1h)
   - Quand action = send/reply : Elio lit le brouillon
   - Attend confirmation user ("oui", "envoie", "ok" → exécute ; "non", "annule" → cancel)
   - State machine dans l'orchestrateur

## Tests requis

- **Unitaire :** GmailService.listUnread retourne les bons champs
- **Unitaire :** Tool handler route correctement vers GmailService
- **Intégration :** Conversation "lis mes mails" → tool call → résumé retourné
- **Intégration :** Flow confirmation envoi (oui → envoyé, non → annulé)
- **Manuel :** Conversation vocale complète : lire + répondre à un vrai email

## Definition of Done

- [ ] Lecture emails fonctionnelle
- [ ] Envoi avec confirmation vocale
- [ ] Token refresh automatique
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
