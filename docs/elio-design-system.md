# Elio — Design System & Identité Visuelle

**Designer :** Felix (BMAD)
**Version :** 1.0 — Draft
**Date :** 27 février 2026

---

## 1. 🎨 Palette de couleurs (tendances 2026)

Basée sur les tendances couleurs 2026 : Pantone Cloud Dancer, Burnished Amber, Deep Teal, Synthesized Mint, Bioluminescent hues.

### Couleurs principales

| Rôle | Nom | Hex | RGB | Usage |
|------|-----|-----|-----|-------|
| **Primaire** | Burnished Amber | `#E8985A` | 232, 152, 90 | Boutons principaux, accents, éléments actifs |
| **Secondaire** | Deep Teal | `#2A7B8B` | 42, 123, 139 | Éléments secondaires, liens, backgrounds |
| **Accent** | Synthesized Mint | `#7ECFB3` | 126, 207, 179 | Highlights, badges, indicateurs succès |
| **Background Light** | Cloud Dancer | `#F0EEE9` | 240, 238, 233 | Fond clair (Pantone Color of the Year 2026) |
| **Background Dark** | Midnight Teal | `#0F2027` | 15, 32, 39 | Mode sombre |
| **Erreur** | Soft Coral | `#E07A5F` | 224, 122, 95 | Alertes, erreurs, suppressions |
| **Succès** | Sage Green | `#81B29A` | 129, 178, 154 | Confirmations, validations |

### Gradients

| Nom | Définition | Usage |
|-----|-----------|-------|
| **Sunrise** | `#E8985A` → `#D4A574` | Bouton principal, CTA |
| **Warm Glow** | `#E8985A` → `#E07A5F` | Éléments actifs, wake word |
| **Ocean** | `#2A7B8B` → `#7ECFB3` | Backgrounds secondaires |
| **Dark Mode** | `#0F2027` → `#203A43` → `#2C5364` | Background dark mode |

### Pourquoi ces couleurs ?

- **Burnished Amber** : Couleur du soleil (Elio = soleil en grec), chaleur humaine, énergie positive. Tendance forte 2026.
- **Deep Teal** : Sérénité, confiance, technologie humaine. Complément parfait de l'ambre.
- **Synthesized Mint** : Fraîcheur, modernité, accent vivant. Tendance "bioluminescent" 2026.
- **Cloud Dancer** : Pantone 2026 — blanc aéré, calme, espace de respiration.
- **Midnight Teal** : Profond mais pas noir. Plus chaleureux que le noir pur pour le dark mode.

---

## 2. 🔤 Typographie

### Fonts

| Usage | Font | Poids | Taille | Ligne |
|-------|------|-------|--------|-------|
| **Logo / Marque** | Nunito | Bold (700) | 32-48px | 1.1 |
| **Titres H1** | Nunito | SemiBold (600) | 28px | 1.2 |
| **Titres H2** | Nunito | SemiBold (600) | 22px | 1.3 |
| **Titres H3** | Nunito | Medium (500) | 18px | 1.3 |
| **Corps de texte** | Inter | Regular (400) | 16px | 1.5 |
| **Sous-texte** | Inter | Regular (400) | 14px | 1.4 |
| **Caption** | Inter | Medium (500) | 12px | 1.3 |
| **Boutons** | Inter | SemiBold (600) | 16px | 1.0 |

### Pourquoi Nunito + Inter ?

- **Nunito** : Lettres arrondies → chaleureux, accessible, friendly. Parfait pour un compagnon. Bonne lisibilité en gros.
- **Inter** : Conçu pour les écrans, ultra-lisible en petit. Standard de l'industrie tech (GitHub, Figma, Linear l'utilisent). Gratuit (Google Fonts).

---

## 3. 🌟 Iconographie

### Style

- **Line icons** avec arrondi (border-radius sur les traits)
- Épaisseur : 1.5px
- Taille : 24×24 (standard), 20×20 (compact), 32×32 (nav)
- Librairie recommandée : **Phosphor Icons** (rounded style) ou **Lucide**

### Pourquoi Phosphor/Lucide ?

- Cohérent avec le style arrondi de Nunito
- Disponible en React Native
- Grande variété d'icônes
- Gratuit et open source

---

## 4. 📱 Composants UI

### Boutons

| Type | Background | Texte | Border Radius |
|------|-----------|-------|---------------|
| **Primaire** | Gradient Sunrise | Blanc | 12px |
| **Secondaire** | Transparent | Deep Teal | 12px, border 1.5px |
| **Danger** | Soft Coral | Blanc | 12px |
| **Ghost** | Transparent | Burnished Amber | 0 |

### Cards

- Border radius : 16px
- Shadow (light) : `0 2px 8px rgba(15, 32, 39, 0.08)`
- Shadow (dark) : `0 2px 8px rgba(0, 0, 0, 0.2)`
- Padding : 16px

### Espacements

| Token | Valeur |
|-------|--------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

---

## 5. 🎭 Direction artistique

### Mood Board

- **Chaleur** : Tons ambrés, dorés, coucher de soleil
- **Modernité** : Lignes épurées, espaces aérés, flat 3D
- **Accessibilité** : Pas trop "tech", pas froid, pas corporate
- **Confiance** : Couleurs stables, contrastes suffisants, lisibilité
- **Compagnon** : Formes arrondies, animations douces, voix chaleureuse

### Ne PAS faire

- ❌ Coins anguleux / sharp
- ❌ Couleurs néon agressives
- ❌ Esthétique "robot" ou "sci-fi"
- ❌ Trop de texte, interfaces chargées
- ❌ Animations rapides ou brusques

### À privilégier

- ✅ Formes arrondies, organiques
- ✅ Animations fluides, ease-in-out
- ✅ Espaces blancs généreux
- ✅ Feedbacks visuels doux (glow, pulse)
- ✅ Microinteractions (bouton qui pulse pendant l'écoute)

---

## 6. 🔊 Animation du wake word

### État : En attente

- Petit point ambre discret dans la status bar
- Pulse lent et régulier (1 cycle / 3s)

### État : Écoute active ("Hey Elio" détecté)

- Le point s'agrandit en cercle
- Waveform animé (barres qui bougent avec l'audio)
- Couleur : gradient Warm Glow
- Pulse rapide synchronisé avec la voix

### État : Traitement

- Animation de "pensée" : 3 points qui rebondissent
- Ou : cercle qui se remplit progressivement
- Couleur : Deep Teal

### État : Réponse (TTS)

- Waveform animé (barres qui bougent avec l'audio de réponse)
- Couleur : gradient Sunrise
- Avatar Elio qui "parle"

---

## 7. 📋 Logo

**Statut :** En cours de conception

### Directions explorées

1. **E en ruban** — Lettre e stylisée en ruban fluide, gradient ambre
2. **Sphère orbitale** — Sphère lumineuse avec anneaux orbitaux
3. **Flamme bicolore** — Forme organique ambre + mint sur fond sombre
4. **Bulle-soleil** — Bulle de chat fusionnée avec un soleil

### Décision

Le logo final sera réalisé avec un graphiste sur Figma/Illustrator pour un rendu pixel-perfect. Les explorations IA servent de mood board et de direction.

### Contraintes logo

- Doit fonctionner en 29×29px (petite icône iOS) et 1024×1024px (App Store)
- Lisible en noir et blanc
- Reconnaissable instantanément
- Format : iOS rounded square

---

*Document généré le 27 février 2026 — Felix, Graphiste BMAD*
