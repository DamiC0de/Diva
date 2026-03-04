# US-035 : iOS Notification Service Extension

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-035 |
| **Épique** | E3 — Notifications |
| **Sprint** | Post-MVP (Mac requis) |
| **Estimation** | 8 points |
| **Priorité** | 🔴 MUST (pour iOS) |
| **Status** | Blocked (needs native build) |

---

## Description

**En tant qu'** utilisateur iOS
**Je veux** que Diva capture mes notifications de messages
**Afin de** pouvoir les écouter comme sur Android

---

## Contexte

Actuellement, la lecture des notifications fonctionne **uniquement sur Android** via `NotificationListenerService`. iOS nécessite une approche différente avec `NotificationServiceExtension`.

### Différence Android vs iOS

| Aspect | Android | iOS |
|--------|---------|-----|
| Service | NotificationListenerService | NotificationServiceExtension |
| Accès | Tous les messages | Push notifications seulement |
| Permission | Settings → Notification access | Automatique avec extension |
| Persistance | Peut lire l'historique | Uniquement nouvelles notifs |

---

## Prérequis

- [ ] Mac avec Xcode
- [ ] `npx expo prebuild --platform ios`
- [ ] Apple Developer account
- [ ] App Group configuré

---

## Critères d'acceptation

- [ ] **AC-001** : Extension intercepte les notifications WhatsApp
- [ ] **AC-002** : Extension intercepte les notifications Messenger
- [ ] **AC-003** : Extension intercepte les notifications iMessage
- [ ] **AC-004** : Données partagées avec l'app principale via App Group
- [ ] **AC-005** : Commande "Lis mes messages" fonctionne sur iOS

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    iOS Native Module                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   React Native App          Native Extension                    │
│   ┌──────────────┐         ┌──────────────────────────┐        │
│   │              │         │ NotificationService       │        │
│   │  JavaScript  │◄───────►│ Extension                 │        │
│   │              │  Bridge  │                          │        │
│   └──────────────┘         │ - didReceive()           │        │
│         │                  │ - Store to App Group     │        │
│         │                  └──────────────────────────┘        │
│         │                           │                           │
│         │                           ▼                           │
│         │                  ┌──────────────────────────┐        │
│         └─────────────────►│ App Group                │        │
│                            │ (UserDefaults shared)    │        │
│                            └──────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tâches de développement

### T1 : Expo prebuild (30min)

```bash
# Générer le projet natif iOS
npx expo prebuild --platform ios

# Structure créée
ios/
├── Diva/
│   ├── AppDelegate.mm
│   └── Info.plist
└── Diva.xcworkspace
```

### T2 : Créer l'extension Xcode (1h)

1. Ouvrir `ios/Diva.xcworkspace` dans Xcode
2. File → New → Target → Notification Service Extension
3. Nom : "DivaNotificationExtension"
4. Configurer le même Team et Bundle ID prefix

### T3 : Configurer App Group (30min)

```xml
<!-- Dans les deux targets (app + extension) -->
<key>com.apple.security.application-groups</key>
<array>
    <string>group.ai.diva.shared</string>
</array>
```

### T4 : Implémenter l'extension (2h)

```swift
// DivaNotificationExtension/NotificationService.swift
import UserNotifications

class NotificationService: UNNotificationServiceExtension {
    
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        // Extraire les données
        let sender = request.content.title
        let body = request.content.body
        let bundleId = request.content.userInfo["source"] as? String ?? "unknown"
        
        // Stocker dans App Group
        let defaults = UserDefaults(suiteName: "group.ai.diva.shared")
        var notifications = defaults?.array(forKey: "captured_notifications") as? [[String: Any]] ?? []
        
        notifications.append([
            "id": UUID().uuidString,
            "sender": sender,
            "content": body,
            "app": bundleId,
            "timestamp": Date().timeIntervalSince1970,
            "read": false
        ])
        
        // Garder les 50 dernières
        if notifications.count > 50 {
            notifications = Array(notifications.suffix(50))
        }
        
        defaults?.set(notifications, forKey: "captured_notifications")
        
        // Laisser passer la notification
        contentHandler(request.content)
    }
    
    override func serviceExtensionTimeWillExpire() {
        if let handler = contentHandler, let content = bestAttemptContent {
            handler(content)
        }
    }
}
```

### T5 : Native Module React Native (2h)

```swift
// ios/Diva/NotificationReaderModule.swift
import Foundation

@objc(NotificationReaderModule)
class NotificationReaderModule: NSObject {
    
    @objc
    func getNotifications(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
        let defaults = UserDefaults(suiteName: "group.ai.diva.shared")
        let notifications = defaults?.array(forKey: "captured_notifications") ?? []
        resolve(notifications)
    }
    
    @objc
    func markAsRead(_ id: String,
                    resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
        let defaults = UserDefaults(suiteName: "group.ai.diva.shared")
        var notifications = defaults?.array(forKey: "captured_notifications") as? [[String: Any]] ?? []
        
        if let index = notifications.firstIndex(where: { $0["id"] as? String == id }) {
            notifications[index]["read"] = true
            defaults?.set(notifications, forKey: "captured_notifications")
        }
        
        resolve(true)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool { false }
}
```

### T6 : Bridge JavaScript (1h)

```typescript
// app/modules/notification-reader/ios.ts
import { NativeModules, Platform } from 'react-native';

const { NotificationReaderModule } = NativeModules;

export async function getNotifications(): Promise<Notification[]> {
  if (Platform.OS !== 'ios') {
    throw new Error('iOS only');
  }
  return NotificationReaderModule.getNotifications();
}

export async function markAsRead(id: string): Promise<void> {
  await NotificationReaderModule.markAsRead(id);
}
```

---

## Tests

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Recevoir WhatsApp | Notification capturée |
| 2 | Recevoir iMessage | Notification capturée |
| 3 | "Lis mes messages" | Messages lus vocalement |
| 4 | App fermée | Capture fonctionne toujours |

---

## Blockers

- ⚠️ **Nécessite un Mac** pour le build natif
- ⚠️ **Nécessite un Apple Developer account** ($99/an)
- ⚠️ **Ne fonctionne pas avec Expo Go** — TestFlight ou device direct

---

## Notes

Cette story est **bloquée** jusqu'à ce que Jojo ait son Mac (vendredi 06/03/2026).

Une fois le Mac disponible :
1. `npx expo prebuild --platform ios`
2. Ouvrir dans Xcode
3. Suivre les étapes ci-dessus

---

*Story créée par Amelia (BMAD Dev) — 2026-03-04*
