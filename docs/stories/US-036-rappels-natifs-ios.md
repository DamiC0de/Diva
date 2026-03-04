# US-036 : Rappels Natifs iOS (EventKit)

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-036 |
| **Épique** | E4 — Deep Links |
| **Sprint** | Sprint 5 (Post-MVP) |
| **Estimation** | 5 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** dire "Rappelle-moi de X dans Y"
**Afin de** créer un rappel qui apparaît sur mon iPhone même si l'app est fermée

---

## Contexte

Actuellement, les rappels utilisent `add_calendar` côté serveur, ce qui nécessite :
1. Que le serveur connaisse le calendrier de l'utilisateur
2. Sync complexe

**Solution** : Créer les rappels **côté client** avec EventKit (iOS natif).

---

## Critères d'acceptation

- [ ] **AC-001** : "Rappelle-moi dans 10 minutes" crée un rappel iOS
- [ ] **AC-002** : "Rappelle-moi de faire les courses dans 1 heure" crée un rappel avec titre
- [ ] **AC-003** : Permission Reminders demandée au premier usage
- [ ] **AC-004** : Le rappel apparaît dans l'app Rappels native
- [ ] **AC-005** : Notification push à l'heure prévue

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Reminder Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   "Rappelle-moi dans 10 min"                                    │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────┐                                             │
│   │   Server LLM  │ ─── Détecte intent: create_reminder         │
│   └───────┬───────┘                                             │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────┐     ┌───────────────┐                      │
│   │  WebSocket    │────►│    Client     │                      │
│   │  action_request     │ (React Native)│                      │
│   └───────────────┘     └───────┬───────┘                      │
│                                 │                               │
│                                 ▼                               │
│                         ┌───────────────┐                      │
│                         │   EventKit    │                      │
│                         │  (iOS Native) │                      │
│                         └───────┬───────┘                      │
│                                 │                               │
│                                 ▼                               │
│                         ┌───────────────┐                      │
│                         │  Reminders    │                      │
│                         │    .app       │                      │
│                         └───────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tâches de développement

### T1 : Expo Calendar/Reminders config (30min)

```bash
npx expo install expo-calendar
```

```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSRemindersUsageDescription": "Diva crée des rappels pour toi",
        "NSCalendarsUsageDescription": "Diva accède à ton calendrier"
      }
    }
  }
}
```

### T2 : Service Reminders (1.5h)

```typescript
// app/lib/reminders.ts
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export async function requestRemindersPermission(): Promise<boolean> {
  const { status } = await Calendar.requestRemindersPermissionsAsync();
  return status === 'granted';
}

export async function createReminder(
  title: string,
  dueDate: Date,
  notes?: string
): Promise<string> {
  // Demander permission si pas déjà fait
  const granted = await requestRemindersPermission();
  if (!granted) {
    throw new Error('Permission rappels refusée');
  }
  
  // Trouver ou créer la liste de rappels Diva
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
  let divaList = calendars.find(c => c.title === 'Diva');
  
  if (!divaList) {
    const defaultSource = calendars.find(c => c.source?.type === 'local')?.source
      ?? calendars[0]?.source;
    
    if (!defaultSource) {
      throw new Error('Aucune source de rappels disponible');
    }
    
    const listId = await Calendar.createCalendarAsync({
      title: 'Diva',
      color: '#8B5CF6',
      entityType: Calendar.EntityTypes.REMINDER,
      sourceId: defaultSource.id,
      source: defaultSource,
      name: 'Diva',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    
    divaList = { id: listId } as Calendar.Calendar;
  }
  
  // Créer le rappel
  const reminderId = await Calendar.createReminderAsync(divaList.id, {
    title,
    notes,
    dueDate,
    startDate: dueDate,
    alarms: [{ relativeOffset: 0 }], // Alarme à l'heure exacte
  });
  
  return reminderId;
}
```

### T3 : Parser durée côté client (1h)

```typescript
// app/lib/durationParser.ts
export interface ParsedReminder {
  title: string;
  dueDate: Date;
}

export function parseReminderRequest(text: string): ParsedReminder | null {
  const now = new Date();
  const lowered = text.toLowerCase();
  
  // Pattern: "dans X minutes/heures"
  const durationMatch = lowered.match(
    /dans\s+(\d+)\s+(minute|heure|seconde|min|h|s)s?/i
  );
  
  if (durationMatch) {
    const amount = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    
    let ms = 0;
    if (unit.startsWith('min') || unit === 'm') ms = amount * 60 * 1000;
    else if (unit.startsWith('heure') || unit === 'h') ms = amount * 60 * 60 * 1000;
    else if (unit.startsWith('sec') || unit === 's') ms = amount * 1000;
    
    const dueDate = new Date(now.getTime() + ms);
    
    // Extraire le titre ("de X")
    const titleMatch = lowered.match(/de\s+(.+?)\s+dans/);
    const title = titleMatch?.[1] ?? 'Rappel Diva';
    
    return { title, dueDate };
  }
  
  // Pattern: "à Xh" ou "à X:Y"
  const timeMatch = lowered.match(/à\s+(\d{1,2})[h:](\d{2})?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2] ?? '0', 10);
    
    const dueDate = new Date(now);
    dueDate.setHours(hours, minutes, 0, 0);
    
    // Si l'heure est passée, c'est pour demain
    if (dueDate <= now) {
      dueDate.setDate(dueDate.getDate() + 1);
    }
    
    const titleMatch = lowered.match(/de\s+(.+?)\s+à/);
    const title = titleMatch?.[1] ?? 'Rappel Diva';
    
    return { title, dueDate };
  }
  
  return null;
}
```

### T4 : Intégration WebSocket handler (1h)

```typescript
// Dans useVoiceSession.ts
async function handleServerAction(action: ServerAction) {
  switch (action.type) {
    case 'create_reminder':
      const parsed = parseReminderRequest(action.text);
      if (parsed) {
        await createReminder(parsed.title, parsed.dueDate);
        // Feedback vocal géré par le serveur
      }
      break;
    // ... autres actions
  }
}
```

### T5 : Nouveau tool serveur (1h)

```typescript
// server/src/services/orchestrator.ts
// Ajouter un tool qui renvoie une action au client
{
  name: 'create_reminder',
  description: 'Créer un rappel sur l\'appareil de l\'utilisateur. Le rappel apparaîtra dans l\'app Rappels iOS.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Titre du rappel' },
      delay_minutes: { type: 'number', description: 'Dans combien de minutes' },
    },
    required: ['title', 'delay_minutes'],
  },
}

// Execution: envoyer action au client via WS
case 'create_reminder':
  socket?.send(JSON.stringify({
    type: 'action_request',
    action: 'create_reminder',
    params: input,
  }));
  results.push({ name: tool.name, result: 'Rappel créé.' });
  break;
```

---

## Tests

| # | Commande | Résultat attendu |
|---|----------|------------------|
| 1 | "Rappelle-moi dans 1 minute" | Notification dans 1 min |
| 2 | "Rappelle-moi de faire les courses dans 2 heures" | Rappel "faire les courses" |
| 3 | "Rappelle-moi à 15h" | Rappel à 15h |
| 4 | Vérifier app Rappels | Liste "Diva" visible |

---

## Notes

- Fonctionne avec **Expo Go** (expo-calendar inclus)
- Les rappels persistent même si l'app est désinstallée
- Le serveur confirme vocalement mais c'est le client qui crée

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
