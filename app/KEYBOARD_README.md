# EL-022 — Clavier Custom iOS

⚠️ **Requires native Swift code** — iOS Keyboard Extension cannot be built in Expo managed workflow.

## Implementation Plan

After `npx expo prebuild`:

### Native Extension

```
ios/
├── ElioKeyboard/
│   ├── KeyboardViewController.swift   # UIInputViewController
│   ├── KeyboardLayout.swift           # AZERTY FR layout
│   ├── ElioButton.swift               # 🎙️ Elio voice button
│   ├── SuggestionBar.swift            # 💡 AI suggestions
│   └── Info.plist                     # RequestsOpenAccess = YES
```

### Features

1. **AZERTY FR** keyboard with Elio branding
2. **🎙️ Elio button** — tap to dictate → STT → insert text
3. **💡 Suggest** — contextual AI suggestions
4. **✨ Reformulate** (EL-023) — rewrite selected text
5. **🌐 Translate** (EL-024) — translate in-place

### Communication

- **App Groups** (`group.com.elio.app`) for shared UserDefaults
- **Keychain sharing** for JWT auth token
- **API calls** via network (Full Access required)

### EL-023 — Rédaction Assistée

Actions toolbar above keyboard:
- Reformuler, Corriger, Plus court, Plus formel, Compléter
- Each sends text to Claude Haiku via API, shows preview, tap to replace

### EL-024 — Traduction

- 🌐 button → language picker → translate via Claude
- Auto-detect source language
- Mode conversation: auto-translate everything typed
