# EL-001 — Setup VPS Hetzner + API Gateway Fastify

**Épique :** E1 — Infrastructure & Backend
**Sprint :** S1
**Points :** 5
**Priorité :** P0
**Dépendances :** Aucune (story fondatrice)

---

## Description

En tant que **développeur backend**, je veux provisionner un serveur Hetzner et déployer une API Gateway Fastify, afin de disposer du point d'entrée central pour toutes les communications client-serveur d'Elio.

## Contexte technique

- **Serveur :** Hetzner CX32 (4 vCPU, 16 Go RAM) — Phase 0/Beta
- **Framework :** Node.js 20 LTS + Fastify 5.x + TypeScript
- **Protocoles :** REST (HTTPS) + WebSocket (bidirectionnel pour audio)
- **Reverse proxy :** Caddy (auto-TLS Let's Encrypt)
- **Monitoring :** Healthcheck endpoint `/health`
- **Sécurité :** Firewall UFW (22, 80, 443), fail2ban, SSH key-only

### Architecture de référence

```
Client (iPhone)
    │
    ▼ HTTPS / WSS
┌──────────────────┐
│   Caddy (TLS)    │
│   :443 → :3000   │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  Fastify API GW  │
│  :3000           │
│  - REST routes   │
│  - WS upgrade    │
│  - JWT verify    │
│  - Rate limiter  │
└──────────────────┘
```

## Critères d'acceptation

- [ ] Serveur Hetzner CX32 provisionné avec Ubuntu 24.04 LTS
- [ ] Node.js 20 LTS installé via nvm
- [ ] Projet TypeScript initialisé (`pnpm init`, `tsconfig.json`, ESLint, Prettier)
- [ ] Fastify écoute sur `:3000` avec routes :
  - `GET /health` → `{ status: "ok", version: "0.1.0", uptime: <seconds> }`
  - `GET /api/v1/ping` → `{ pong: true }`
  - WebSocket upgrade sur `/ws`
- [ ] Caddy configuré comme reverse proxy HTTPS sur le domaine `api.elio.ai` (ou sous-domaine temporaire)
- [ ] Certificat TLS automatique (Let's Encrypt) fonctionnel
- [ ] Firewall UFW : seuls ports 22, 80, 443 ouverts
- [ ] fail2ban actif sur SSH
- [ ] Connexion SSH par clé uniquement (password auth désactivé)
- [ ] PM2 gère le process Fastify (auto-restart, logs)
- [ ] `pnpm test` passe (au moins un test healthcheck)

## Tâches de dev

1. **Provisioning VPS** (~1h)
   - Commander Hetzner CX32, configurer SSH, hostname
   - UFW + fail2ban + unattended-upgrades

2. **Setup projet Node.js** (~2h)
   - `pnpm init`, TypeScript, ESLint flat config, Prettier
   - Structure dossiers : `src/`, `src/routes/`, `src/plugins/`, `src/config/`
   - Scripts npm : `dev`, `build`, `start`, `test`

3. **API Gateway Fastify** (~3h)
   - Plugin `@fastify/cors`, `@fastify/rate-limit`, `@fastify/websocket`
   - Route `/health`, `/api/v1/ping`
   - WebSocket handler basique (echo pour test)
   - Config par env vars (`.env` + `@fastify/env`)

4. **Reverse proxy Caddy** (~1h)
   - Installer Caddy, Caddyfile pour reverse proxy :3000
   - Vérifier TLS auto

5. **PM2 + déploiement** (~1h)
   - `ecosystem.config.js`, `pm2 startup`, `pm2 save`
   - Script de deploy basique (git pull + build + restart)

## Tests requis

- **Unitaire :** Route `/health` retourne 200 + JSON correct
- **Unitaire :** Route `/api/v1/ping` retourne 200
- **Intégration :** WebSocket connect + echo message
- **Intégration :** Rate limiter bloque après N requêtes
- **Manuel :** `curl https://api.elio.ai/health` retourne OK depuis l'extérieur

## Definition of Done

- [ ] Code mergé sur `main`
- [ ] Tests passent en CI (ou localement si pas de CI encore)
- [ ] Serveur accessible en HTTPS
- [ ] WebSocket fonctionnel
- [ ] Documentation README mise à jour
- [ ] Review par un pair (ou auto-review documentée)

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
