# US-023 : Créer un timer

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-023 |
| **Épique** | E4 — Deep Links |
| **Sprint** | Sprint 3 |
| **Estimation** | 2 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** dire "Timer 5 minutes"
**Afin de** démarrer un compte à rebours

---

## Critères d'acceptation

- [ ] **AC-001** : Commandes : "timer X", "minuteur X", "chrono X"
- [ ] **AC-002** : Parsing : minutes, secondes, heures
- [ ] **AC-003** : Notification à la fin
- [ ] **AC-004** : "Annule le timer" fonctionne
- [ ] **AC-005** : Multiple timers simultanés

---

## Tâches de développement

### T1 : Parser durée (30min)

```typescript
// app/lib/timerParser.ts
export interface TimerRequest {
  durationSeconds: number;
  label?: string;
}

export function parseTimerRequest(text: string): TimerRequest | null {
  const lowered = text.toLowerCase();
  
  // Patterns: "timer 5 minutes", "minuteur de 30 secondes"
  const patterns = [
    /(?:timer|minuteur|chrono)(?:\s+de)?\s+(\d+)\s*(min|minute|sec|seconde|h|heure)s?/i,
    /(\d+)\s*(min|minute|sec|seconde|h|heure)s?\s+(?:timer|minuteur|chrono)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      
      let seconds = 0;
      if (unit.startsWith('h')) {
        seconds = amount * 3600;
      } else if (unit.startsWith('min') || unit === 'm') {
        seconds = amount * 60;
      } else {
        seconds = amount;
      }
      
      // Extraire label optionnel
      const labelMatch = text.match(/pour\s+(.+?)(?:\s+de|\s+dans|$)/i);
      
      return {
        durationSeconds: seconds,
        label: labelMatch?.[1],
      };
    }
  }
  
  return null;
}
```

### T2 : Timer service avec notifications (1h)

```typescript
// app/lib/timerService.ts
import * as Notifications from 'expo-notifications';
import { useState, useEffect, useCallback, useRef } from 'react';

export interface Timer {
  id: string;
  endTime: number;
  label?: string;
  notificationId?: string;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([]);
  
  const createTimer = useCallback(async (durationSeconds: number, label?: string) => {
    const id = Math.random().toString(36).slice(2);
    const endTime = Date.now() + durationSeconds * 1000;
    
    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Timer terminé !',
        body: label ?? 'Ton timer est terminé',
        sound: 'default',
      },
      trigger: {
        seconds: durationSeconds,
      },
    });
    
    const timer: Timer = { id, endTime, label, notificationId };
    setTimers(prev => [...prev, timer]);
    
    return timer;
  }, []);
  
  const cancelTimer = useCallback(async (id: string) => {
    const timer = timers.find(t => t.id === id);
    if (timer?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
    }
    setTimers(prev => prev.filter(t => t.id !== id));
  }, [timers]);
  
  const cancelAllTimers = useCallback(async () => {
    for (const timer of timers) {
      if (timer.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
      }
    }
    setTimers([]);
  }, [timers]);
  
  // Clean up expired timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTimers(prev => prev.filter(t => t.endTime > now));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return { timers, createTimer, cancelTimer, cancelAllTimers };
}
```

### T3 : Intégration vocale (30min)

```typescript
// server/src/services/orchestrator.ts
{
  name: 'create_timer',
  description: "Créer un timer/minuteur qui notifie l'utilisateur à la fin",
  input_schema: {
    type: 'object',
    properties: {
      duration_seconds: { type: 'number', description: "Durée en secondes" },
      label: { type: 'string', description: "Label optionnel (ex: 'pour les pâtes')" },
    },
    required: ['duration_seconds'],
  },
}

// Client handler
case 'action_request':
  if (msg.action === 'create_timer') {
    const { duration_seconds, label } = msg.params;
    await createTimer(duration_seconds, label);
  }
  break;
```

### T4 : Annulation vocale (30min)

```typescript
// Détecter "annule le timer"
if (lowered.includes('annule') && lowered.includes('timer')) {
  // Si un seul timer, l'annuler
  if (timers.length === 1) {
    await cancelTimer(timers[0].id);
    return "Timer annulé.";
  } else if (timers.length > 1) {
    return `Tu as ${timers.length} timers en cours. Lequel veux-tu annuler ?`;
  } else {
    return "Tu n'as pas de timer en cours.";
  }
}
```

---

## Tests

| # | Commande | Résultat attendu |
|---|----------|------------------|
| 1 | "Timer 5 minutes" | Timer créé, confirmation |
| 2 | "Minuteur de 30 secondes" | Timer 30s |
| 3 | "Timer 1 heure pour le gâteau" | Timer avec label |
| 4 | "Annule le timer" | Timer annulé |
| 5 | Attendre la fin | Notification reçue |

---

## Notes

- Les notifications nécessitent permission iOS
- Les timers persistent même si l'app est fermée (via notifications scheduled)
- Expo Go supporte les notifications locales

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
