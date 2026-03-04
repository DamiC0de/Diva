# US-038 : Mode Offline Gracieux

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-038 |
| **Épique** | E2 — Cloud Integration |
| **Sprint** | Sprint 5 (Quick Win) |
| **Estimation** | 3 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur sans connexion internet
**Je veux** que Diva me dise qu'elle ne peut pas m'aider
**Afin de** comprendre pourquoi elle ne répond pas

---

## Contexte

Actuellement, si l'utilisateur est offline :
- La connexion WebSocket échoue
- L'orbe reste en "Connexion..."
- Aucun feedback vocal

**Objectif** : UX dégradée mais claire.

---

## Critères d'acceptation

- [ ] **AC-001** : Détection de l'état réseau
- [ ] **AC-002** : Message clair "Tu es hors connexion"
- [ ] **AC-003** : Fonctionnalités locales disponibles (heure, date)
- [ ] **AC-004** : Auto-reconnexion quand réseau revient
- [ ] **AC-005** : Indicateur visuel (badge offline)

---

## Tâches de développement

### T1 : Hook réseau (30min)

```typescript
// app/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
    });
    
    return () => unsubscribe();
  }, []);
  
  return { isConnected, connectionType };
}
```

### T2 : Réponses locales (1h)

```typescript
// app/lib/offlineResponses.ts
export function getOfflineResponse(text: string): string | null {
  const lowered = text.toLowerCase();
  
  // Heure
  if (lowered.includes('quelle heure') || lowered.includes('l\'heure')) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `Il est ${hours} heures ${minutes > 0 ? `et ${minutes} minutes` : ''}.`;
  }
  
  // Date
  if (lowered.includes('quel jour') || lowered.includes('quelle date')) {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return `Nous sommes le ${new Date().toLocaleDateString('fr-FR', options)}.`;
  }
  
  // Batterie
  if (lowered.includes('batterie')) {
    // expo-battery
    return null; // Implémenter avec expo-battery si besoin
  }
  
  return null; // Pas de réponse locale disponible
}
```

### T3 : Intégration VoiceSession (1h)

```typescript
// Dans useVoiceSession.ts
import { useNetworkStatus } from './useNetworkStatus';
import { getOfflineResponse } from '../lib/offlineResponses';

// Dans le hook
const { isConnected } = useNetworkStatus();

const handleOfflineQuery = async (text: string) => {
  const localResponse = getOfflineResponse(text);
  
  if (localResponse) {
    // Synthèse vocale locale (si dispo) ou affichage texte
    setTranscript(localResponse);
    setTranscriptRole('assistant');
    // TTS locale pourrait être ajoutée ici
  } else {
    setTranscript("Je suis hors connexion. Vérifie ton réseau internet.");
    setTranscriptRole('assistant');
    setOrbState('error');
  }
};

// Dans toggleSession
if (!isConnected) {
  setOrbState('listening');
  // Capturer l'audio quand même
  // ...
  // À la fin de l'enregistrement :
  // transcription locale impossible sans Whisper local
  // donc juste afficher message offline
  handleOfflineQuery(""); 
  return;
}
```

### T4 : Indicateur visuel (30min)

```typescript
// Dans index.tsx (main screen)
{!isConnected && (
  <View style={styles.offlineBadge}>
    <Text style={styles.offlineBadgeText}>📡 Hors ligne</Text>
  </View>
)}
```

```typescript
const styles = StyleSheet.create({
  offlineBadge: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  offlineBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Mode avion activé | Badge "Hors ligne" visible |
| 2 | "Quelle heure ?" en offline | Réponse locale |
| 3 | Question complexe en offline | Message d'erreur clair |
| 4 | Réseau revient | Badge disparaît, reconnexion |

---

## V2 (Local-first)

Pour une vraie expérience offline, il faudrait :
- Whisper local (transcription)
- Piper local (TTS)
- Qwen local (LLM triage)

→ Voir architecture V1.1 documentée

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
