# EL-031 — Widget iOS + Live Activities

⚠️ **Requires native Swift code** — cannot be implemented in Expo managed workflow.

## Implementation Plan

When running `npx expo prebuild`, add the following native extensions:

### 1. WidgetKit Extension

```
ios/
├── ElioWidget/
│   ├── ElioWidget.swift          # Timeline provider
│   ├── ElioWidgetBundle.swift    # Widget bundle
│   ├── SmallWidget.swift         # Small (2x2) — logo + tap to talk
│   └── MediumWidget.swift        # Medium (4x2) — next event + weather + emails
```

### 2. Live Activities

```
ios/
├── ElioLiveActivity/
│   ├── ElioLiveActivity.swift    # Live Activity layout
│   └── Attributes.swift          # ActivityAttributes (state, listening, etc.)
```

### 3. Shared Data (App Groups)

The main app writes data to UserDefaults (App Group: `group.com.elio.app`):
- Next calendar event
- Current weather
- Unread email count
- Pipeline state (for Live Activities)

### 4. Deep Links

Widget taps generate URLs:
- `elio://conversation` → open conversation
- `elio://services` → open services
- `elio://ptt` → open with PTT active

## Prerequisites

- Apple Developer account (paid)
- `expo-dev-client` (no Expo Go)
- App Groups entitlement configured
- WidgetKit framework linked
