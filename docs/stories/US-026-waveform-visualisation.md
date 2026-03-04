# US-026 : Visualisation waveform

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-026 |
| **Épique** | E5 — Orb UI |
| **Sprint** | Sprint 4 |
| **Estimation** | 3 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** voir une représentation visuelle de ma voix
**Afin de** savoir que Diva m'entend bien

---

## Contexte actuel

L'orbe a déjà un `audioLevel` prop qui est utilisé pour modifier la taille. Cette story améliore la visualisation avec un vrai waveform.

---

## Critères d'acceptation

- [ ] **AC-001** : Anneau autour de l'orbe réactif au volume
- [ ] **AC-002** : Animation fluide (60fps)
- [ ] **AC-003** : Visible en mode listening ET speaking
- [ ] **AC-004** : Couleur adaptée à l'état (bleu listening, vert speaking)

---

## Tâches de développement

### T1 : Composant WaveformRing (1.5h)

```typescript
// app/components/Orb/WaveformRing.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface WaveformRingProps {
  audioLevel: number; // 0-1
  color: string;
  size: number;
}

export function WaveformRing({ audioLevel, color, size }: WaveformRingProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    // Mapper audioLevel (0-1) vers scale (1-1.3)
    const targetScale = 1 + audioLevel * 0.3;
    const targetOpacity = 0.3 + audioLevel * 0.5;
    
    Animated.parallel([
      Animated.timing(scale, {
        toValue: targetScale,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: targetOpacity,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [audioLevel]);
  
  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
});
```

### T2 : Multi-ring effect (1h)

```typescript
// app/components/Orb/WaveformRings.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WaveformRing } from './WaveformRing';

interface WaveformRingsProps {
  audioLevel: number;
  color: string;
  baseSize: number;
}

export function WaveformRings({ audioLevel, color, baseSize }: WaveformRingsProps) {
  // 3 anneaux avec délai
  const rings = [
    { size: baseSize + 20, delay: 0 },
    { size: baseSize + 40, delay: 0.1 },
    { size: baseSize + 60, delay: 0.2 },
  ];
  
  return (
    <View style={styles.container}>
      {rings.map((ring, index) => (
        <WaveformRing
          key={index}
          audioLevel={Math.max(0, audioLevel - ring.delay)}
          color={color}
          size={ring.size}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### T3 : Intégration OrbView (30min)

```typescript
// Dans OrbView.tsx
import { WaveformRings } from './WaveformRings';

// Dans le render
{(state === 'listening' || state === 'speaking') && (
  <WaveformRings
    audioLevel={audioLevel}
    color={COLORS[state]}
    baseSize={BASE_SIZE}
  />
)}
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Parler doucement | Petites ondulations |
| 2 | Parler fort | Grandes ondulations |
| 3 | Silence | Anneaux discrets |
| 4 | TTS en cours | Waveform vert sync avec audio |

---

## Optimisations

- `useNativeDriver: true` pour perf
- Throttle audioLevel updates à 60fps max
- Éviter re-renders inutiles avec `React.memo`

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
