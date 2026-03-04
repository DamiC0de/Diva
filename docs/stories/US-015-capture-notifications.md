# US-015 : Capture des notifications entrantes

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-015 |
| **Épique** | E3 — Notifications |
| **Sprint** | Sprint 3 |
| **Estimation** | 5 points |
| **Priorité** | 🔴 MUST |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** que Diva capture mes notifications de messages
**Afin de** pouvoir les écouter plus tard

---

## Contexte technique

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                NotificationServiceExtension                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Push arrive        2. Extension intercepte                 │
│   ┌──────────┐          ┌──────────────────────────┐           │
│   │ WhatsApp │─────────►│ didReceive(request,      │           │
│   │ Push     │          │   withContentHandler)    │           │
│   └──────────┘          └───────────┬──────────────┘           │
│                                     │                           │
│   3. Extraction données             │                           │
│   ┌─────────────────────────────────▼─────────────────────────┐│
│   │ sender: "Julie"                                           ││
│   │ content: "Salut, ça va ?"                                 ││
│   │ app: "com.whatsapp.WhatsApp"                              ││
│   │ timestamp: 2026-03-04T12:30:00Z                           ││
│   └───────────────────────────────────────────────────────────┘│
│                                     │                           │
│   4. Stockage App Group             ▼                           │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ UserDefaults(suiteName: "group.ai.diva.shared")         │  │
│   │ Key: "captured_notifications"                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Stack

- **Extension** : NotificationServiceExtension
- **Storage** : UserDefaults (App Group)
- **Apps supportées** : WhatsApp, Messenger, iMessage, SMS

### Fichiers à créer

```
DivaNotificationExtension/
├── NotificationService.swift
├── Info.plist
└── DivaNotificationExtension.entitlements

Shared/
├── CapturedNotification.swift
├── NotificationStore.swift
└── AppGroupConstants.swift
```

---

## Critères d'acceptation

- [ ] **AC-001** : Extension intercepte les notifications WhatsApp
- [ ] **AC-002** : Extension intercepte les notifications Messenger
- [ ] **AC-003** : Extension intercepte les notifications iMessage/SMS
- [ ] **AC-004** : Extraction : sender, content, app, timestamp
- [ ] **AC-005** : Stockage dans App Group partagé
- [ ] **AC-006** : Main app peut lire les notifications capturées
- [ ] **AC-007** : Max 50 notifications stockées (FIFO)

---

## Tâches de développement

### T1 : Configuration Xcode (1h)

1. File → New → Target → Notification Service Extension
2. Nom : "DivaNotificationExtension"
3. Configurer App Group : `group.ai.diva.shared`
4. Ajouter capability aux deux targets

```xml
<!-- DivaNotificationExtension.entitlements -->
<key>com.apple.security.application-groups</key>
<array>
    <string>group.ai.diva.shared</string>
</array>
```

### T2 : Modèle partagé (30min)

```swift
// Shared/CapturedNotification.swift
import Foundation

struct CapturedNotification: Codable, Identifiable {
    let id: UUID
    let sender: String
    let content: String
    let appBundleId: String
    let timestamp: Date
    var isRead: Bool
    
    var appName: String {
        switch appBundleId {
        case "com.whatsapp.WhatsApp": return "WhatsApp"
        case "com.facebook.Messenger": return "Messenger"
        case "com.apple.MobileSMS": return "Messages"
        default: return "App"
        }
    }
}
```

### T3 : NotificationStore partagé (1h)

```swift
// Shared/NotificationStore.swift
import Foundation

class NotificationStore {
    static let shared = NotificationStore()
    
    private let defaults: UserDefaults
    private let key = "captured_notifications"
    private let maxNotifications = 50
    
    init() {
        defaults = UserDefaults(suiteName: "group.ai.diva.shared")!
    }
    
    var notifications: [CapturedNotification] {
        get {
            guard let data = defaults.data(forKey: key) else { return [] }
            return (try? JSONDecoder().decode([CapturedNotification].self, from: data)) ?? []
        }
        set {
            let trimmed = Array(newValue.suffix(maxNotifications))
            if let data = try? JSONEncoder().encode(trimmed) {
                defaults.set(data, forKey: key)
            }
        }
    }
    
    func add(_ notification: CapturedNotification) {
        var current = notifications
        current.append(notification)
        notifications = current
    }
    
    func markAsRead(id: UUID) {
        var current = notifications
        if let index = current.firstIndex(where: { $0.id == id }) {
            current[index].isRead = true
            notifications = current
        }
    }
    
    func unreadNotifications() -> [CapturedNotification] {
        notifications.filter { !$0.isRead }
    }
    
    func clear() {
        notifications = []
    }
}
```

### T4 : NotificationService Extension (2h)

```swift
// DivaNotificationExtension/NotificationService.swift
import UserNotifications

class NotificationService: UNNotificationServiceExtension {
    
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    private let supportedApps = [
        "com.whatsapp.WhatsApp",
        "com.facebook.Messenger", 
        "com.apple.MobileSMS"
    ]
    
    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        // Identifier l'app source
        let bundleId = request.content.userInfo["source_app"] as? String 
            ?? identifyApp(from: request)
        
        guard supportedApps.contains(bundleId) else {
            contentHandler(request.content)
            return
        }
        
        // Extraire les données
        let sender = extractSender(from: request.content)
        let content = request.content.body
        
        // Créer et stocker la notification
        let captured = CapturedNotification(
            id: UUID(),
            sender: sender,
            content: content,
            appBundleId: bundleId,
            timestamp: Date(),
            isRead: false
        )
        
        NotificationStore.shared.add(captured)
        
        // Laisser passer la notification originale
        contentHandler(request.content)
    }
    
    private func extractSender(from content: UNNotificationContent) -> String {
        // WhatsApp: title = sender name
        // Messenger: title = sender name
        // iMessage: title = sender or phone number
        return content.title.isEmpty ? "Inconnu" : content.title
    }
    
    private func identifyApp(from request: UNNotificationRequest) -> String {
        // Heuristique basée sur le format de la notification
        let categoryId = request.content.categoryIdentifier
        
        if categoryId.contains("whatsapp") { return "com.whatsapp.WhatsApp" }
        if categoryId.contains("messenger") { return "com.facebook.Messenger" }
        
        // Default to iMessage for other
        return "com.apple.MobileSMS"
    }
    
    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler,
           let content = bestAttemptContent {
            contentHandler(content)
        }
    }
}
```

### T5 : API dans main app (30min)

```swift
// Dans l'app principale
class NotificationManager: ObservableObject {
    @Published var unreadCount: Int = 0
    
    private let store = NotificationStore.shared
    
    func refresh() {
        unreadCount = store.unreadNotifications().count
    }
    
    func getUnread() -> [CapturedNotification] {
        store.unreadNotifications()
    }
    
    func getByApp(_ bundleId: String) -> [CapturedNotification] {
        store.notifications.filter { $0.appBundleId == bundleId }
    }
    
    func getBySender(_ name: String) -> [CapturedNotification] {
        store.notifications.filter { 
            $0.sender.localizedCaseInsensitiveContains(name) 
        }
    }
    
    func markAsRead(_ notification: CapturedNotification) {
        store.markAsRead(id: notification.id)
        refresh()
    }
}
```

---

## Tests requis

### Tests unitaires

```swift
func testNotificationStore() {
    let store = NotificationStore.shared
    store.clear()
    
    let notif = CapturedNotification(
        id: UUID(),
        sender: "Julie",
        content: "Salut !",
        appBundleId: "com.whatsapp.WhatsApp",
        timestamp: Date(),
        isRead: false
    )
    
    store.add(notif)
    XCTAssertEqual(store.notifications.count, 1)
    XCTAssertEqual(store.unreadNotifications().count, 1)
    
    store.markAsRead(id: notif.id)
    XCTAssertEqual(store.unreadNotifications().count, 0)
}

func testMaxNotifications() {
    let store = NotificationStore.shared
    store.clear()
    
    for i in 0..<60 {
        store.add(CapturedNotification(
            id: UUID(),
            sender: "Test \(i)",
            content: "Message",
            appBundleId: "test",
            timestamp: Date(),
            isRead: false
        ))
    }
    
    XCTAssertEqual(store.notifications.count, 50) // Max 50
}
```

### Tests manuels

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Recevoir WhatsApp | Notification capturée |
| 2 | Recevoir Messenger | Notification capturée |
| 3 | Recevoir iMessage | Notification capturée |
| 4 | Ouvrir l'app | Notifications visibles |
| 5 | 60 notifications | Seules les 50 dernières |

---

## Dépendances

- **Prérequise** : Aucune
- **Bloquante pour** : US-016, US-017, US-018, US-019

---

## Definition of Done

- [ ] Extension créée et signée
- [ ] App Group configuré
- [ ] Capture fonctionne (WhatsApp, Messenger, SMS)
- [ ] Main app lit les notifications
- [ ] Tests passent
- [ ] Code review approuvée

---

## Notes

⚠️ **Limitation iOS** : L'extension ne peut capturer que les notifications qui passent par APNS. Les messages reçus quand l'app source est au premier plan ne déclenchent pas de notification.

⚠️ **Privacy** : Les données restent 100% locales. Ne jamais envoyer le contenu des messages au serveur.

---

*Story créée par Bob (SM BMAD) — 2026-03-04*
