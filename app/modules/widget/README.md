# EL-031 — Elio iOS Widget + Live Activities

## Architecture

Native **WidgetKit** extension (SwiftUI). Requires `expo prebuild`.

### Widgets

- **Small (2×2)**: Logo + "Tap to talk" → opens app in PTT mode
- **Medium (4×2)**: Next event + weather + unread emails + PTT button

### Live Activities

- Shows pipeline state during voice requests:
  - 🎙️ Listening → 📝 Transcribing → 🧠 Thinking → 🔊 Responding
- Dynamic Island support (iPhone 14 Pro+)

### Data Flow

```
Main App → App Groups (UserDefaults) → Widget reads on timeline refresh
         ↕
Server API → Calendar, Weather, Gmail data
```

### App Groups

Shared container: `group.com.elio.shared`

Keys written by main app:
- `widget.nextEvent` — JSON: `{ title, time, location }`
- `widget.weather` — JSON: `{ temp, description, icon }`
- `widget.unreadEmails` — Number
- `widget.lastUpdate` — ISO date

### Deep Links

- `elio://conversation` — Open conversation screen
- `elio://services` — Open services screen
- `elio://settings` — Open settings

### Setup

1. `expo prebuild`
2. Add Widget extension target in Xcode
3. Configure App Groups (shared with main app + keyboard)
4. Implement SwiftUI widget views
5. Add ActivityKit for Live Activities
