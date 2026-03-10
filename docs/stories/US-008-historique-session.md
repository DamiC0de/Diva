# US-008 : Historique de session

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-008 |
| **Épique** | E1 — Core Voice |
| **Sprint** | Sprint 3 |
| **Estimation** | 2 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** voir mes dernières interactions dans l'app
**Afin de** revoir ce que j'ai demandé à Diva

---

## Critères d'acceptation

- [ ] **AC-001** : Liste des 20 dernières interactions
- [ ] **AC-002** : Affichage : ma question + réponse Diva
- [ ] **AC-003** : Horodatage relatif ("il y a 5 min")
- [ ] **AC-004** : Suppression possible (swipe)
- [ ] **AC-005** : Effacement auto après 24h

---

## Tâches de développement

### T1 : Store local (30min)

```typescript
// app/lib/historyStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryEntry {
  id: string;
  userText: string;
  assistantText: string;
  timestamp: number;
}

const HISTORY_KEY = 'conversation_history';
const MAX_ENTRIES = 20;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function getHistory(): Promise<HistoryEntry[]> {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  if (!data) return [];
  
  const entries: HistoryEntry[] = JSON.parse(data);
  const now = Date.now();
  
  // Filter expired entries
  return entries.filter(e => now - e.timestamp < TTL_MS);
}

export async function addToHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<void> {
  const current = await getHistory();
  
  const newEntry: HistoryEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2),
    timestamp: Date.now(),
  };
  
  const updated = [newEntry, ...current].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function deleteFromHistory(id: string): Promise<void> {
  const current = await getHistory();
  const updated = current.filter(e => e.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
```

### T2 : Hook useHistory (30min)

```typescript
// app/hooks/useHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { getHistory, addToHistory, deleteFromHistory, clearHistory, HistoryEntry } from '../lib/historyStore';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const refresh = useCallback(async () => {
    const data = await getHistory();
    setHistory(data);
    setLoading(false);
  }, []);
  
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  const add = useCallback(async (userText: string, assistantText: string) => {
    await addToHistory({ userText, assistantText });
    refresh();
  }, [refresh]);
  
  const remove = useCallback(async (id: string) => {
    await deleteFromHistory(id);
    refresh();
  }, [refresh]);
  
  const clear = useCallback(async () => {
    await clearHistory();
    setHistory([]);
  }, []);
  
  return { history, loading, add, remove, clear, refresh };
}
```

### T3 : Écran historique (1h)

```typescript
// app/app/(main)/history.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useHistory } from '../../hooks/useHistory';
import { useTheme } from '../../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function HistoryScreen() {
  const theme = useTheme();
  const { history, remove, clear, loading } = useHistory();
  
  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity 
          style={styles.deleteAction}
          onPress={() => remove(item.id)}
        >
          <Text style={styles.deleteText}>Supprimer</Text>
        </TouchableOpacity>
      )}
    >
      <View style={[styles.item, { backgroundColor: theme.card }]}>
        <Text style={[styles.time, { color: theme.textMuted }]}>
          {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: fr })}
        </Text>
        <Text style={[styles.user, { color: theme.text }]}>
          Toi : {item.userText}
        </Text>
        <Text style={[styles.assistant, { color: theme.textSecondary }]}>
          Diva : {item.assistantText.slice(0, 100)}...
        </Text>
      </View>
    </Swipeable>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            Aucun historique
          </Text>
        }
      />
    </View>
  );
}
```

### T4 : Intégration session vocale (30min)

```typescript
// Dans useVoiceSession.ts
import { useHistory } from './useHistory';

const { add: addToHistory } = useHistory();

// Quand on reçoit la réponse complète
case 'completed':
  if (lastUserText.current && lastAssistantText.current) {
    addToHistory(lastUserText.current, lastAssistantText.current);
  }
  break;
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Poser une question | Apparaît dans historique |
| 2 | Swipe sur une entrée | Option supprimer |
| 3 | Fermer/rouvrir app | Historique persistant |
| 4 | Attendre 24h | Entrées expirées |

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
