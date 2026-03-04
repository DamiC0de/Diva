# US-021 : Ouvrir conversation spécifique

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-021 |
| **Épique** | E4 — Deep Links |
| **Sprint** | Sprint 3 |
| **Estimation** | 3 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** dire "Ouvre la conversation avec Julie sur WhatsApp"
**Afin d'** aller directement à la bonne conversation

---

## Critères d'acceptation

- [ ] **AC-001** : Extraction du nom de contact
- [ ] **AC-002** : Extraction de l'app cible
- [ ] **AC-003** : Deep link vers conversation WhatsApp
- [ ] **AC-004** : Deep link vers conversation iMessage
- [ ] **AC-005** : Fallback : ouvrir l'app si impossible

---

## Contexte

Les deep links vers des conversations spécifiques nécessitent :
- **WhatsApp** : Numéro de téléphone (`whatsapp://send?phone=+33...`)
- **iMessage** : Numéro ou email (`sms://+33...`)
- **Messenger** : User ID Facebook (complexe)

---

## Tâches de développement

### T1 : Parser la commande (30min)

```typescript
// app/lib/conversationParser.ts
interface ConversationRequest {
  contactName: string;
  app: 'whatsapp' | 'imessage' | 'messenger' | null;
}

export function parseConversationRequest(text: string): ConversationRequest | null {
  const lowered = text.toLowerCase();
  
  // Patterns
  const patterns = [
    /(?:ouvre|va sur|montre).+conversation.+(?:avec|de)\s+(\w+)\s+(?:sur|dans)\s+(whatsapp|imessage|messenger|sms)/i,
    /(?:ouvre|va sur)\s+(whatsapp|imessage|messenger).+(?:avec|de)\s+(\w+)/i,
    /(?:écris|envoie).+à\s+(\w+)\s+(?:sur|via)\s+(whatsapp|imessage|messenger)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Déterminer l'ordre (nom puis app ou app puis nom)
      const [, first, second] = match;
      const apps = ['whatsapp', 'imessage', 'messenger', 'sms'];
      
      if (apps.includes(first.toLowerCase())) {
        return { contactName: second, app: normalizeApp(first) };
      } else {
        return { contactName: first, app: normalizeApp(second) };
      }
    }
  }
  
  return null;
}

function normalizeApp(app: string): 'whatsapp' | 'imessage' | 'messenger' {
  const lowered = app.toLowerCase();
  if (lowered === 'sms' || lowered === 'imessage' || lowered === 'messages') {
    return 'imessage';
  }
  return lowered as 'whatsapp' | 'imessage' | 'messenger';
}
```

### T2 : Résolution contact → numéro (1h)

```typescript
// app/lib/contactResolver.ts
import * as Contacts from 'expo-contacts';

export async function getPhoneNumber(contactName: string): Promise<string | null> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return null;
  
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });
  
  // Recherche fuzzy
  const contact = data.find(c => 
    c.name?.toLowerCase().includes(contactName.toLowerCase())
  );
  
  if (!contact?.phoneNumbers?.[0]?.number) return null;
  
  // Normaliser le numéro (format international)
  let phone = contact.phoneNumbers[0].number.replace(/\s/g, '');
  if (phone.startsWith('0')) {
    phone = '+33' + phone.slice(1); // France par défaut
  }
  
  return phone;
}
```

### T3 : Deep links par app (1h)

```typescript
// app/lib/conversationLinks.ts
import { Linking } from 'react-native';

export async function openConversation(
  app: 'whatsapp' | 'imessage' | 'messenger',
  phone: string
): Promise<boolean> {
  let url: string;
  
  switch (app) {
    case 'whatsapp':
      // Format: whatsapp://send?phone=+33612345678
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      url = `whatsapp://send?phone=${cleanPhone}`;
      break;
      
    case 'imessage':
      // Format: sms://+33612345678
      url = `sms:${phone}`;
      break;
      
    case 'messenger':
      // Messenger nécessite un user ID, pas un numéro
      // Fallback: ouvrir Messenger
      url = 'fb-messenger://';
      break;
  }
  
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  
  return false;
}
```

### T4 : Intégration serveur (30min)

```typescript
// server/src/services/orchestrator.ts
// Nouveau tool
{
  name: 'open_conversation',
  description: "Ouvrir une conversation avec un contact sur une app de messagerie",
  input_schema: {
    type: 'object',
    properties: {
      contact_name: { type: 'string', description: "Nom du contact" },
      app: { type: 'string', enum: ['whatsapp', 'imessage', 'messenger'] },
    },
    required: ['contact_name', 'app'],
  },
}

// Execution: envoyer action au client
case 'open_conversation':
  socket?.send(JSON.stringify({
    type: 'action_request',
    action: 'open_conversation',
    params: input,
  }));
  results.push({ name: tool.name, result: `Ouverture conversation avec ${input.contact_name}` });
  break;
```

### T5 : Handler client (30min)

```typescript
// Dans useVoiceSession.ts
case 'action_request':
  if (msg.action === 'open_conversation') {
    const { contact_name, app } = msg.params;
    const phone = await getPhoneNumber(contact_name);
    
    if (phone) {
      const success = await openConversation(app, phone);
      if (!success) {
        // Fallback: ouvrir l'app sans conversation spécifique
        await openApp(app);
      }
    } else {
      speak(`Je n'ai pas trouvé ${contact_name} dans tes contacts.`);
    }
  }
  break;
```

---

## Tests

| # | Commande | Résultat attendu |
|---|----------|------------------|
| 1 | "Ouvre WhatsApp avec Julie" | Conversation Julie ouverte |
| 2 | "Écris à Maman sur iMessage" | Conversation Maman ouverte |
| 3 | "Conversation avec Inconnu" | "Je n'ai pas trouvé Inconnu" |
| 4 | "Ouvre Messenger avec Pierre" | Messenger s'ouvre (pas de conv spécifique) |

---

## Limitations

- **Messenger** : Nécessite Facebook User ID, pas supporté
- **WhatsApp** : Le contact doit avoir WhatsApp
- **Permission contacts** : Requise

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
