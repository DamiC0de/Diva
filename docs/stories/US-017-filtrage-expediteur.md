# US-017 : Filtrage par expéditeur

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-017 |
| **Épique** | E3 — Notifications |
| **Sprint** | Sprint 3 |
| **Estimation** | 3 points |
| **Priorité** | 🟡 SHOULD |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** demander "Messages de Julie"
**Afin de** n'entendre que les messages d'une personne

---

## Critères d'acceptation

- [ ] **AC-001** : Extraction du nom depuis la requête
- [ ] **AC-002** : Matching fuzzy (Julie, julie, Jul)
- [ ] **AC-003** : "Aucun message de Julie" si vide
- [ ] **AC-004** : Support multi-noms ("de Julie ou Marc")

---

## Tâches de développement

### T1 : Extraction nom (1h)

```swift
// NameExtractor.swift
func extractSenderName(from input: String) -> [String]? {
    let lowered = input.lowercased()
    
    // Pattern: "messages de [Nom]" ou "de [Nom]"
    let patterns = [
        #"messages?\s+de\s+(\w+)"#,
        #"de\s+(\w+)\s+sur"#,
        #"from\s+(\w+)"#
    ]
    
    for pattern in patterns {
        if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
           let match = regex.firstMatch(in: input, range: NSRange(input.startIndex..., in: input)),
           let range = Range(match.range(at: 1), in: input) {
            let name = String(input[range])
            return [name]
        }
    }
    
    // Support "de Julie ou Marc"
    if let regex = try? NSRegularExpression(pattern: #"de\s+(\w+)\s+(?:ou|et|and|or)\s+(\w+)"#),
       let match = regex.firstMatch(in: input, range: NSRange(input.startIndex..., in: input)) {
        var names: [String] = []
        for i in 1..<match.numberOfRanges {
            if let range = Range(match.range(at: i), in: input) {
                names.append(String(input[range]))
            }
        }
        return names
    }
    
    return nil
}
```

### T2 : Filtrage fuzzy (1h)

```swift
// Dans MessageReaderService
func readMessagesFrom(senders: [String]) async -> String {
    let allNotifs = store.unreadNotifications()
    
    let filtered = allNotifs.filter { notif in
        senders.contains { senderQuery in
            notif.sender.localizedCaseInsensitiveContains(senderQuery)
        }
    }
    
    if filtered.isEmpty {
        let names = senders.joined(separator: " ou ")
        return "Tu n'as aucun message de \(names)."
    }
    
    var response = "Tu as \(filtered.count) \(filtered.count == 1 ? "message" : "messages") de "
    response += senders.joined(separator: " et ") + ". "
    
    for notif in filtered.sorted(by: { $0.timestamp < $1.timestamp }) {
        response += "\(notif.sender) dit : \(notif.content). "
        store.markAsRead(id: notif.id)
    }
    
    return response
}
```

### T3 : Intégration triage (1h)

```swift
// Dans TriageService
if let senders = extractSenderName(from: input) {
    return TriageResult(
        tier: 1,
        intent: "read_messages_from",
        confidence: 0.95,
        response: nil,
        parameters: ["senders": senders.joined(separator: ",")]
    )
}
```

---

## Tests manuels

| # | Input | Résultat |
|---|-------|----------|
| 1 | "Messages de Julie" | Messages de Julie uniquement |
| 2 | "Messages de julie" (minuscule) | Fonctionne (fuzzy) |
| 3 | "De Julie ou Marc" | Messages des deux |
| 4 | "Messages de Inconnu" | "Aucun message de Inconnu" |

---

## Dépendances

- **Prérequise** : US-016
- **Bloquante pour** : Aucune

---

*Story créée par Bob (SM BMAD) — 2026-03-04*
