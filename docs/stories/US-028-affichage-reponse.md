# US-028 : Affichage réponse Diva

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-028 |
| **Épique** | E5 — Orb UI |
| **Sprint** | Sprint 4 |
| **Estimation** | 2 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Existing (amélioration) |

---

## Description

**En tant qu'** utilisateur
**Je veux** voir la réponse de Diva en texte
**Afin de** pouvoir la relire ou la copier

---

## Contexte actuel

L'app affiche déjà la réponse dans `TranscriptOverlay`. Cette story ajoute des fonctionnalités.

---

## Critères d'acceptation

- [ ] **AC-001** : Texte synchronisé avec le TTS
- [ ] **AC-002** : Scrollable si long
- [ ] **AC-003** : Copiable (long press)
- [ ] **AC-004** : Animation de highlight sur le mot prononcé (optionnel)
- [ ] **AC-005** : Persiste après fin du TTS (2s)

---

## Tâches de développement

### T1 : Long press to copy (30min)

```typescript
// app/components/TranscriptOverlay.tsx
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

<Pressable
  onLongPress={async () => {
    if (text) {
      await Clipboard.setStringAsync(text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copié !', 'Le texte a été copié dans le presse-papier.');
    }
  }}
  delayLongPress={500}
>
  <Text style={styles.text}>{text}</Text>
</Pressable>
```

### T2 : Persistance après TTS (30min)

```typescript
// Dans useVoiceSession.ts
const [persistedTranscript, setPersistedTranscript] = useState<string | null>(null);

// Quand le TTS finit
case 'completed':
  // Garder le transcript visible 2s de plus
  const lastText = transcript;
  setTimeout(() => {
    if (transcript === lastText) {
      setTranscript(null);
    }
  }, 2000);
  break;
```

### T3 : Word highlighting (optionnel, 1h)

```typescript
// Synchronisation mot par mot avec le TTS
// Nécessite des timestamps du serveur TTS

interface WordTiming {
  word: string;
  start: number; // ms
  end: number;   // ms
}

function HighlightedText({ text, timings, currentTime }: Props) {
  const words = text.split(' ');
  
  return (
    <Text>
      {words.map((word, i) => {
        const timing = timings[i];
        const isActive = timing && currentTime >= timing.start && currentTime < timing.end;
        
        return (
          <Text 
            key={i}
            style={isActive ? styles.highlighted : undefined}
          >
            {word}{' '}
          </Text>
        );
      })}
    </Text>
  );
}
```

### T4 : Accessibilité (30min)

```typescript
<View 
  accessible
  accessibilityLabel={`Réponse de Diva: ${text}`}
  accessibilityHint="Appui long pour copier"
  accessibilityRole="text"
>
  <Text style={styles.text}>{text}</Text>
</View>
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Réponse longue | Texte scrollable |
| 2 | Long press | "Copié !" + haptic |
| 3 | Fin du TTS | Texte reste visible 2s |
| 4 | VoiceOver | Lecture correcte |

---

## Notes

Le word highlighting est **optionnel** car il nécessite des données de timing du TTS qui ne sont pas forcément disponibles avec Edge-TTS.

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
