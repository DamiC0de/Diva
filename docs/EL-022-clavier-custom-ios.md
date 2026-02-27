# EL-022 — Clavier Custom iOS (Base + Vocal)

**Épique :** E5 — Clavier intelligent
**Sprint :** S3
**Points :** 13
**Priorité :** P1
**Dépendances :** EL-009 (Orchestrateur), EL-012 (App Expo)

---

## Description

En tant qu'**utilisateur**, je veux un clavier iOS personnalisé Elio disponible dans toutes mes apps, afin de bénéficier de l'assistance d'Elio directement dans WhatsApp, iMessage, ou n'importe quelle app.

## Contexte technique

- **iOS Keyboard Extension** : app extension qui remplace le clavier système
- **Killer feature** : contourne les limitations iOS (pas d'accès WhatsApp/iMessage) en étant présent DANS ces apps
- **Fonctionnalités** : clavier AZERTY classique + bouton Elio (micro + suggestion)
- ⚠️ **Custom Keyboard = module natif** → nécessite `expo-dev-client` (pas Expo Go)
- **Communication** : le clavier communique avec l'app principale via App Groups (shared container)

### Architecture

```
┌──────────────────────────────────┐
│        WhatsApp / iMessage       │
│                                  │
│  ┌────────────────────────────┐  │
│  │   Clavier Elio (Extension) │  │
│  │                            │  │
│  │  [AZERTY classique]       │  │
│  │                            │  │
│  │  [🎙️ Elio] [💡 Suggest]   │  │
│  │                            │  │
│  │  Tap 🎙️ → dicte + Elio    │  │
│  │  reformule → insère texte │  │
│  └──────────┬─────────────────┘  │
│             │ App Groups         │
│             ▼                    │
│  ┌──────────────────────────┐    │
│  │    Elio App (Main)        │    │
│  │    → API Gateway → Claude │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

## Critères d'acceptation

- [ ] Keyboard Extension iOS fonctionnelle (AZERTY FR)
- [ ] Sélectionnable dans Settings → General → Keyboards → Elio
- [ ] Bouton 🎙️ Elio : tap → enregistrement vocal → transcription → texte inséré
- [ ] Bouton 💡 : suggestion contextuelle basée sur le texte en cours
- [ ] Communication avec l'app principale via App Groups (UserDefaults partagés + fichiers)
- [ ] Auth partagée : le clavier utilise le même JWT que l'app (via Keychain shared)
- [ ] Fonctionne dans WhatsApp, iMessage, Notes, Safari, toutes les apps
- [ ] Apparence : thème Elio (couleurs Felix), support dark mode
- [ ] **Full Access** demandé (nécessaire pour réseau) avec explication claire à l'user
- [ ] Latence acceptable : <2s pour dictée + reformulation
- [ ] Autocomplete basique en FR (dictionnaire local)
- [ ] Haptic feedback sur les touches

## Tâches de dev

1. **Keyboard Extension setup** (~3h)
   - Créer l'extension iOS dans le projet Expo (prebuild + native module)
   - `KeyboardViewController` : UIInputViewController
   - Layout AZERTY FR avec auto-layout
   - App Groups configuration (entitlements)

2. **UI Clavier** (~3h)
   - Touches AZERTY avec styles Elio
   - Bouton Elio 🎙️ (zone custom en haut du clavier)
   - Bouton suggestion 💡
   - Dark mode support
   - Animations et haptic feedback

3. **Dictée vocale Elio** (~3h)
   - Tap 🎙️ → enregistrement audio (AVAudioRecorder dans l'extension)
   - Envoi via API Gateway → STT → texte
   - Option : Claude reformule/améliore le texte avant insertion
   - Insertion dans le champ texte actif (`textDocumentProxy.insertText()`)

4. **Communication App ↔ Extension** (~2h)
   - App Groups : UserDefaults partagé pour settings, JWT
   - Keychain shared pour les tokens auth
   - Optionnel : URL scheme callback pour actions complexes

5. **Suggestion contextuelle** (~2h)
   - Lire le contexte du champ texte (`textDocumentProxy.documentContextBeforeInput`)
   - Envoyer à Claude : "Suggère une suite pour ce texte : ..."
   - Afficher la suggestion, tap pour insérer

## Tests requis

- **Unitaire :** Layout clavier correct (toutes les touches présentes)
- **Intégration :** Dictée vocale → texte inséré dans champ
- **Intégration :** Suggestion → texte proposé cohérent
- **E2E (manuel) :** Installer clavier → utiliser dans WhatsApp → dicter → texte inséré
- **Manuel :** Vérifier dans iMessage, Notes, Safari
- **Performance :** Latence dictée <2s

## Definition of Done

- [ ] Clavier installable et sélectionnable
- [ ] AZERTY FR fonctionnel
- [ ] Dictée vocale + insertion
- [ ] Suggestion contextuelle
- [ ] Fonctionne dans au moins 3 apps tierces
- [ ] Code mergé sur `main`

---

*Story créée le 27 février 2026 — Bob, Scrum Master BMAD*
