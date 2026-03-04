# US-018 : Filtrage par application

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-018 |
| **Épique** | E3 — Notifications |
| **Sprint** | Sprint 3 |
| **Estimation** | 2 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** demander "Messages WhatsApp"
**Afin de** n'entendre que les messages d'une app

---

## Critères d'acceptation

- [ ] **AC-001** : Commandes : "messages WhatsApp", "SMS", "Messenger"
- [ ] **AC-002** : Comptage par app
- [ ] **AC-003** : Liste des apps supportées si demandé

---

## Tâches de développement

### T1 : App name mapping (30min)

```swift
// AppNameMapper.swift
func extractAppName(from input: String) -> String? {
    let lowered = input.lowercased()
    
    let appMappings: [String: String] = [
        "whatsapp": "com.whatsapp.WhatsApp",
        "messenger": "com.facebook.Messenger",
        "sms": "com.apple.MobileSMS",
        "imessage": "com.apple.MobileSMS",
        "messages": "com.apple.MobileSMS"
    ]
    
    for (keyword, bundleId) in appMappings {
        if lowered.contains(keyword) {
            return bundleId
        }
    }
    
    return nil
}
```

### T2 : Filtrage et comptage (1h)

```swift
// Dans MessageReaderService
func readMessagesFromApp(_ bundleId: String) async -> String {
    let filtered = store.unreadNotifications().filter { $0.appBundleId == bundleId }
    let appName = CapturedNotification.appName(for: bundleId)
    
    if filtered.isEmpty {
        return "Tu n'as aucun message \(appName)."
    }
    
    var response = "Tu as \(filtered.count) \(filtered.count == 1 ? "message" : "messages") \(appName). "
    
    for notif in filtered.sorted(by: { $0.timestamp < $1.timestamp }) {
        response += "\(notif.sender) dit : \(notif.content). "
        store.markAsRead(id: notif.id)
    }
    
    return response
}

func getMessageCountByApp() -> String {
    let notifs = store.unreadNotifications()
    var counts: [String: Int] = [:]
    
    for notif in notifs {
        counts[notif.appName, default: 0] += 1
    }
    
    if counts.isEmpty {
        return "Tu n'as aucun nouveau message."
    }
    
    return counts.map { "\($0.value) \($0.key)" }.joined(separator: ", ")
}
```

---

## Tests manuels

| # | Input | Résultat |
|---|-------|----------|
| 1 | "Messages WhatsApp" | Messages WhatsApp uniquement |
| 2 | "SMS" | Messages iMessage/SMS |
| 3 | "Combien de messages ?" | "2 WhatsApp, 1 Messenger" |

---

## Dépendances

- **Prérequise** : US-016
- **Bloquante pour** : Aucune

---

*Story créée par Bob (SM BMAD) — 2026-03-04*
