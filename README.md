# 🎤 D.I.V.A — Digital Intelligent Voice Assistant

> *Ton assistant vocal IA, local et autonome.*

**Marque : Papote** | **Wake word : "Hey Diva"**

---

## 🚀 Le projet

DIVA est un assistant vocal intelligent, 100% local, conçu pour fonctionner sans cloud. Privé, rapide, accessible à tous.

- 🧠 **IA** — Propulsé par Claude Haiku (Anthropic)
- 🎙️ **STT/TTS local** — Reconnaissance et synthèse vocale embarquées
- 📱 **App mobile** — React Native + Expo (iOS/Android)
- 🏠 **Hardware** — Compatible Orange Pi 5 / Rock 5B+ (self-hosted)
- 🔒 **Privé** — Aucune donnée ne quitte ton appareil

## 📁 Structure

```
diva/
├── app/          # Application mobile (React Native + Expo)
├── server/       # Backend API & workers (STT, TTS, orchestrateur)
├── docs/         # Documentation technique & stories
└── config.example.yaml  # Configuration hardware
```

## 🏗️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| App mobile | React Native + Expo |
| Backend | Node.js / Python |
| IA / LLM | Claude Haiku (Anthropic) |
| STT | Whisper (local) |
| TTS | Piper (local) |
| Wake word | OpenWakeWord / Porcupine |
| Hardware | Orange Pi 5 / Rock 5B+ |
| Base de données | Supabase (self-hosted) |

## 📖 Origine

DIVA est née de la fusion de deux projets :
- **Elio** — L'assistant vocal mobile
- **Papote** — Le hardware open-source pour assistant vocal B2C

## 📜 Licence

MIT — Fait avec ❤️ en France 🇫🇷
