# US-020 : Ouvrir une application

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-020 |
| **Épique** | E4 — Deep Links |
| **Sprint** | Sprint 3 |
| **Estimation** | 3 points |
| **Priorité** | 🔴 MUST |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** dire "Ouvre WhatsApp"
**Afin de** lancer une app rapidement par la voix

---

## Critères d'acceptation

- [ ] **AC-001** : Commandes : "ouvre X", "lance X", "va sur X"
- [ ] **AC-002** : Apps supportées : WhatsApp, Messenger, Messages, Mail, Safari, Maps, Photos
- [ ] **AC-003** : Utilisation des URL schemes
- [ ] **AC-004** : Message d'erreur si app non installée

---

## Tâches de développement

### T1 : URL Schemes mapping (30min)

```swift
// DeepLinkService.swift
class DeepLinkService {
    
    private let appSchemes: [String: String] = [
        "whatsapp": "whatsapp://",
        "messenger": "fb-messenger://",
        "messages": "sms://",
        "imessage": "sms://",
        "mail": "mailto://",
        "email": "mailto://",
        "safari": "https://google.com",
        "maps": "maps://",
        "plans": "maps://",
        "photos": "photos-redirect://",
        "settings": "App-prefs://",
        "réglages": "App-prefs://",
        "spotify": "spotify://",
        "music": "music://",
        "musique": "music://"
    ]
    
    func getScheme(for appName: String) -> String? {
        let lowered = appName.lowercased()
        return appSchemes.first { lowered.contains($0.key) }?.value
    }
}
```

### T2 : Extraction app name (30min)

```swift
func extractAppToOpen(from input: String) -> String? {
    let lowered = input.lowercased()
    
    let patterns = [
        #"(?:ouvre|lance|va sur|open|launch)\s+(\w+)"#,
    ]
    
    for pattern in patterns {
        if let regex = try? NSRegularExpression(pattern: pattern),
           let match = regex.firstMatch(in: lowered, range: NSRange(lowered.startIndex..., in: lowered)),
           let range = Range(match.range(at: 1), in: lowered) {
            return String(lowered[range])
        }
    }
    
    return nil
}
```

### T3 : Ouverture app (1h)

```swift
import UIKit

func openApp(_ appName: String) async -> String {
    guard let scheme = getScheme(for: appName) else {
        return "Je ne connais pas l'app \(appName)."
    }
    
    guard let url = URL(string: scheme) else {
        return "Erreur lors de l'ouverture."
    }
    
    let canOpen = await UIApplication.shared.canOpenURL(url)
    
    if canOpen {
        await UIApplication.shared.open(url)
        return "J'ouvre \(appName)."
    } else {
        return "\(appName.capitalized) n'est pas installé sur ton iPhone."
    }
}
```

### T4 : Info.plist LSApplicationQueriesSchemes (30min)

```xml
<!-- Info.plist -->
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>whatsapp</string>
    <string>fb-messenger</string>
    <string>sms</string>
    <string>mailto</string>
    <string>maps</string>
    <string>spotify</string>
    <string>music</string>
    <string>photos-redirect</string>
</array>
```

### T5 : Intégration triage (30min)

```swift
// Dans TriageService
if let appName = extractAppToOpen(from: input) {
    return TriageResult(
        tier: 1,
        intent: "open_app",
        confidence: 0.95,
        response: nil,
        parameters: ["app": appName]
    )
}
```

---

## Tests manuels

| # | Input | Résultat |
|---|-------|----------|
| 1 | "Ouvre WhatsApp" | WhatsApp s'ouvre |
| 2 | "Lance Messenger" | Messenger s'ouvre |
| 3 | "Ouvre Spotify" (non installé) | "Spotify n'est pas installé" |
| 4 | "Va sur Maps" | Maps s'ouvre |

---

## Dépendances

- **Prérequise** : US-011 (Triage)
- **Bloquante pour** : US-021 (Conversation spécifique)

---

*Story créée par Bob (SM BMAD) — 2026-03-04*
