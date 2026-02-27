# EL-021 — Lancement d'Apps (URL Schemes)

**Épique :** E4 — Intégrations Services
**Sprint :** S3
**Points :** 3
**Priorité :** P1
**Dépendances :** EL-008 (Claude Haiku), EL-012 (App Expo)

---

## Description

En tant qu'**utilisateur**, je veux demander à Elio d'ouvrir des apps sur mon iPhone (YouTube, Instagram, Spotify, Maps...), afin de naviguer entre mes apps par la voix.

## Contexte technique

- **URL Schemes iOS** : chaque app a un scheme (`youtube://`, `instagram://`, `spotify://`, etc.)
- **Universal Links** : alternative plus fiable pour certaines apps
- **Exécuté côté app** (pas serveur) via `Linking.openURL()`
- **Deep links** : ouvrir une app sur un contenu spécifique (ex: Maps avec une adresse)

### Catalogue URL Schemes

```typescript
const APP_SCHEMES = {
  youtube: { scheme: 'youtube://', search: 'youtube://results?search_query={q}' },
  instagram: { scheme: 'instagram://' },
  spotify: { scheme: 'spotify://', search: 'spotify:search:{q}' },
  maps: { scheme: 'maps://', navigate: 'maps://?daddr={address}' },
  whatsapp: { scheme: 'whatsapp://send?text={text}' },
  uber: { scheme: 'uber://' },
  netflix: { scheme: 'netflix://' },
  twitter: { scheme: 'twitter://' },
  tiktok: { scheme: 'snssdk1233://' },
  waze: { scheme: 'waze://?ll={lat},{lon}&navigate=yes' },
};
```

## Critères d'acceptation

- [ ] "Ouvre YouTube" → lance YouTube
- [ ] "Cherche des recettes de pasta sur YouTube" → ouvre YouTube avec recherche
- [ ] "Emmène-moi au 15 rue de Rivoli" → ouvre Maps/Waze avec navigation
- [ ] "Mets du jazz sur Spotify" → ouvre Spotify avec recherche
- [ ] "Ouvre WhatsApp" → lance WhatsApp
- [ ] Vérification : l'app est installée (`Linking.canOpenURL`) → sinon message d'erreur
- [ ] Tool Claude : `open_app { app, query?, address? }`
- [ ] Exécution côté app (device-side tool, comme EL-019)
- [ ] Catalogue extensible (ajouter des apps facilement)

## Tâches de dev

1. **AppLauncherService** (~1.5h)
   - Catalogue URL schemes (config JSON)
   - Méthode `openApp(app, params?)` → `Linking.openURL()`
   - `canOpenURL` check avant ouverture

2. **Tool registration** (~0.5h)
   - Tool `open_app` pour Claude
   - Handler côté app (device-side execution)

3. **Deep linking intelligent** (~1h)
   - Maps : géocodage adresse → lat/lon → URL scheme
   - YouTube/Spotify : query → search URL
   - Claude formatte la requête appropriée

## Tests requis

- **Unitaire :** URL scheme builder génère les bonnes URLs
- **Manuel :** "Ouvre YouTube" → YouTube s'ouvre
- **Manuel :** "Navigation vers Tour Eiffel" → Maps s'ouvre avec itinéraire

## Definition of Done

- [ ] 10+ apps supportées
- [ ] Deep linking pour Maps, YouTube, Spotify
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
