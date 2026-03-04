# US-016 : Demande vocale de lecture

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-016 |
| **Épique** | E3 — Notifications |
| **Sprint** | Sprint 3 |
| **Estimation** | 3 points |
| **Priorité** | 🔴 MUST |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** demander "Lis mes messages"
**Afin d'** entendre mes notifications sans regarder mon téléphone

---

## Critères d'acceptation

- [ ] **AC-001** : Commandes : "lis mes messages", "j'ai des messages ?", "nouveaux messages"
- [ ] **AC-002** : Format : "Tu as X messages. [Sender] sur [App] dit : [content]"
- [ ] **AC-003** : Ordre chronologique (plus ancien d'abord)
- [ ] **AC-004** : "Aucun nouveau message" si vide
- [ ] **AC-005** : Marquage auto comme lu après lecture

---

## Tâches de développement

### T1 : Détection intent (30min)

```swift
// Dans TriageService
private func tryStaticRules(_ input: String) -> TriageResult? {
    let lowered = input.lowercased()
    
    // Lecture messages
    let readPatterns = [
        "lis mes messages",
        "lis-moi mes messages", 
        "j'ai des messages",
        "nouveaux messages",
        "read my messages",
        "any new messages"
    ]
    
    if readPatterns.contains(where: { lowered.contains($0) }) {
        return TriageResult(
            tier: 1,
            intent: "read_messages",
            confidence: 1.0,
            response: nil,
            parameters: [:]
        )
    }
    
    return nil
}
```

### T2 : MessageReader service (1.5h)

```swift
// MessageReaderService.swift
class MessageReaderService {
    private let store = NotificationStore.shared
    private let tts: TTSService
    
    init(tts: TTSService) {
        self.tts = tts
    }
    
    func readMessages() async -> String {
        let unread = store.unreadNotifications()
        
        if unread.isEmpty {
            return "Tu n'as aucun nouveau message."
        }
        
        var response = "Tu as \(unread.count) \(unread.count == 1 ? "message" : "messages"). "
        
        for notification in unread.sorted(by: { $0.timestamp < $1.timestamp }) {
            response += formatMessage(notification)
            store.markAsRead(id: notification.id)
        }
        
        return response
    }
    
    private func formatMessage(_ notif: CapturedNotification) -> String {
        "\(notif.sender) sur \(notif.appName) dit : \(notif.content). "
    }
}
```

### T3 : Intégration orchestrateur (1h)

```swift
// Dans VoiceOrchestrator
func executeLocalAction(_ result: TriageResult) async throws -> String {
    switch result.intent {
    case "read_messages":
        return await messageReader.readMessages()
    
    // ... autres cases
    }
}
```

---

## Tests manuels

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | "Lis mes messages" avec 2 notifs | "Tu as 2 messages. Julie sur WhatsApp dit..." |
| 2 | "J'ai des messages ?" sans notifs | "Tu n'as aucun nouveau message" |
| 3 | Relire après lecture | "Tu n'as aucun nouveau message" (marqués lus) |

---

## Dépendances

- **Prérequise** : US-015
- **Bloquante pour** : US-017, US-018

---

*Story créée par Bob (SM BMAD) — 2026-03-04*
