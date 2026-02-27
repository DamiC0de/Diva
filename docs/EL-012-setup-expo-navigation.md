# EL-012 — Setup Projet Expo + Navigation

**Épique :** E3 — App React Native
**Sprint :** S1
**Points :** 3
**Priorité :** P0
**Dépendances :** Aucune (peut démarrer en parallèle du backend)

---

## Description

En tant que **développeur mobile**, je veux un projet React Native / Expo configuré avec la navigation et la structure de base, afin de pouvoir développer les écrans d'Elio rapidement.

## Contexte technique

- **Expo SDK 52+** (managed workflow → prebuild si besoin pour modules natifs)
- **expo-router** (file-based routing)
- **TypeScript** strict
- **UI :** composants custom (pas de lib UI lourde) — design system Elio (couleurs Felix)
- **Target :** iOS uniquement pour MVP (Android préparé mais non prioritaire)

### Structure projet

```
elio-app/
├── app/                    # expo-router pages
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (main)/
│   │   ├── _layout.tsx     # Tab navigator
│   │   ├── index.tsx       # Écran conversation (home)
│   │   ├── services.tsx    # Services connectés
│   │   └── settings.tsx    # Paramètres
│   ├── _layout.tsx         # Root layout (auth check)
│   └── +not-found.tsx
├── components/
│   ├── ui/                 # Design system (Button, Text, Card...)
│   └── ...
├── lib/
│   ├── supabase.ts         # Client Supabase
│   ├── api.ts              # Client API Gateway
│   └── auth.ts             # Auth helpers
├── hooks/
├── constants/
│   ├── colors.ts           # Palette Elio (Felix)
│   └── typography.ts
├── assets/
└── app.json
```

### Palette Elio (Felix)

```typescript
export const Colors = {
  primary: '#FF8C42',        // Orange solaire
  secondary: '#2A7B8B',      // Deep Teal
  background: '#F0EEE9',     // Cloud Dancer
  accent: '#7ECFB3',         // Synthesized Mint
  text: '#1A1A2E',           // Dark
  textLight: '#6B7280',      // Gray
  error: '#DC2626',
  success: '#16A34A',
};
```

## Critères d'acceptation

- [ ] Projet Expo créé avec `create-expo-app` + TypeScript
- [ ] `expo-router` configuré avec file-based routing
- [ ] Layout auth : écran login (placeholder)
- [ ] Layout main : tab navigator avec 3 onglets (Conversation, Services, Settings)
- [ ] Écrans placeholder pour chaque route
- [ ] Client Supabase initialisé (`@supabase/supabase-js`)
- [ ] Auth flow squelette : redirect login ↔ main selon état auth
- [ ] Constantes couleurs et typo (design system Felix)
- [ ] Composants UI de base : `Button`, `Text`, `Card`, `Screen` (wrapper safe area)
- [ ] ESLint + Prettier configurés
- [ ] Build iOS réussi (`npx expo run:ios` ou `eas build`)
- [ ] Fonctionne sur simulateur iOS

## Tâches de dev

1. **Init projet** (~1h)
   - `npx create-expo-app elio-app -t tabs`
   - Configurer TypeScript strict
   - ESLint + Prettier

2. **Navigation** (~1h)
   - Structure dossiers `app/` (auth + main groups)
   - Tab navigator : icons + labels
   - Auth guard dans root layout

3. **Design system base** (~2h)
   - `constants/colors.ts` + `constants/typography.ts`
   - Composants : `Button` (primary/secondary/ghost), `Text` (variants), `Card`, `Screen`
   - Font : Nunito (titres) + Inter (corps) via `expo-font`

4. **Supabase client** (~0.5h)
   - `lib/supabase.ts` : init avec `expo-secure-store` pour auth storage
   - Export client singleton

5. **Placeholder screens** (~0.5h)
   - Chaque écran affiche son nom + navigation fonctionne

## Tests requis

- **Unitaire :** Composants UI rendent sans crash (snapshot tests)
- **Intégration :** Navigation entre tous les écrans
- **Manuel :** Build et run sur simulateur iOS
- **Manuel :** Vérifier fonts chargées correctement

## Definition of Done

- [ ] App démarre sur simulateur iOS sans erreur
- [ ] Navigation entre tous les écrans
- [ ] Design system appliqué (couleurs, typo)
- [ ] Client Supabase initialisé
- [ ] ESLint clean
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
