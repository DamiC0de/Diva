# US-019 : Marquage comme lu

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-019 |
| **Épique** | E3 — Notifications |
| **Sprint** | Sprint 3 |
| **Estimation** | 2 points |
| **Priorité** | 🔴 MUST |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** que Diva marque les messages comme lus après lecture
**Afin de** ne pas les réentendre

---

## Critères d'acceptation

- [ ] **AC-001** : Marquage automatique après lecture TTS
- [ ] **AC-002** : Commande "relire le dernier message"
- [ ] **AC-003** : Compteur unread mis à jour en temps réel
- [ ] **AC-004** : Persistence entre sessions

---

## Tâches de développement

### T1 : Auto-marquage (déjà fait dans US-016)

```swift
// Dans readMessages()
for notif in filtered {
    response += formatMessage(notif)
    store.markAsRead(id: notif.id) // Marquage auto
}
```

### T2 : Relire le dernier (1h)

```swift
// Dans TriageService
if lowered.contains("relire") || lowered.contains("répète") || lowered.contains("relis") {
    return TriageResult(
        tier: 1,
        intent: "replay_last",
        confidence: 0.95,
        response: nil,
        parameters: [:]
    )
}

// Dans MessageReaderService
private var lastReadMessages: [CapturedNotification] = []

func replayLast() -> String {
    guard let last = lastReadMessages.last else {
        return "Je n'ai pas de message à relire."
    }
    return "\(last.sender) a dit : \(last.content)"
}
```

### T3 : Compteur temps réel (1h)

```swift
// NotificationManager.swift
class NotificationManager: ObservableObject {
    @Published var unreadCount: Int = 0
    
    private var observer: NSObjectProtocol?
    
    init() {
        refresh()
        
        // Observer les changements UserDefaults
        observer = NotificationCenter.default.addObserver(
            forName: UserDefaults.didChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.refresh()
        }
    }
    
    func refresh() {
        unreadCount = NotificationStore.shared.unreadNotifications().count
    }
}
```

---

## Tests manuels

| # | Scénario | Résultat |
|---|----------|----------|
| 1 | Lire messages | Compteur → 0 |
| 2 | "Relire le dernier" | Dernier message relu |
| 3 | Fermer/rouvrir app | Compteur correct |

---

## Dépendances

- **Prérequise** : US-016
- **Bloquante pour** : Aucune

---

*Story créée par Bob (SM BMAD) — 2026-03-04*
