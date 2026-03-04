# US-025 : États visuels de l'orbe

## Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | US-025 |
| **Épique** | E5 — Orb UI |
| **Sprint** | Sprint 4 |
| **Estimation** | 5 points |
| **Priorité** | 🔴 MUST |
| **Status** | Ready |

---

## Description

**En tant qu'** utilisateur
**Je veux** que l'orbe change d'apparence selon l'état de Diva
**Afin de** comprendre visuellement ce qui se passe

---

## Critères d'acceptation

- [ ] **AC-001** : Idle → violet pulsant lentement
- [ ] **AC-002** : Listening → bleu ondulant
- [ ] **AC-003** : Processing → cyan rotation rapide
- [ ] **AC-004** : Speaking → vert avec waveform
- [ ] **AC-005** : Error → rouge clignotant
- [ ] **AC-006** : Transitions fluides entre états

---

## Design des états

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORB STATES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   IDLE                 LISTENING            PROCESSING          │
│   ┌─────────┐          ┌─────────┐          ┌─────────┐        │
│   │ ●●●●●●● │          │ ≋≋≋≋≋≋≋ │          │ ◐◑◒◓◔◕● │        │
│   │  #8B5CF6 │          │ #3B82F6  │          │ #06B6D4  │        │
│   │  Pulse  │          │ Ripple   │          │ Spin     │        │
│   │  2s     │          │ Audio    │          │ 0.5s     │        │
│   └─────────┘          └─────────┘          └─────────┘        │
│                                                                  │
│   SPEAKING             ERROR                                     │
│   ┌─────────┐          ┌─────────┐                              │
│   │ ∿∿∿∿∿∿∿ │          │ ✕✕✕✕✕✕✕ │                              │
│   │ #10B981  │          │ #EF4444  │                              │
│   │ Wave    │          │ Flash   │                              │
│   │ Audio   │          │ Shake   │                              │
│   └─────────┘          └─────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tâches de développement

### T1 : Animations SwiftUI (2h)

```swift
// OrbAnimations.swift
import SwiftUI

struct OrbStateAnimations {
    
    // IDLE: Pulse lent
    static func idleAnimation() -> Animation {
        .easeInOut(duration: 2.0).repeatForever(autoreverses: true)
    }
    
    // LISTENING: Ondulation réactive
    static func listeningAnimation(intensity: CGFloat) -> Animation {
        .easeInOut(duration: 0.1 + Double(1 - intensity) * 0.2)
    }
    
    // PROCESSING: Rotation rapide
    static func processingAnimation() -> Animation {
        .linear(duration: 0.5).repeatForever(autoreverses: false)
    }
    
    // SPEAKING: Wave sync avec audio
    static func speakingAnimation(audioLevel: CGFloat) -> Animation {
        .easeInOut(duration: 0.1)
    }
    
    // ERROR: Flash + shake
    static func errorAnimation() -> Animation {
        .easeInOut(duration: 0.1).repeatCount(5, autoreverses: true)
    }
}
```

### T2 : OrbView avec états (2h)

```swift
// OrbView.swift
struct OrbView: View {
    @ObservedObject var viewModel: OrbViewModel
    @State private var rotation: Double = 0
    @State private var scale: CGFloat = 1.0
    @State private var offset: CGFloat = 0
    
    var body: some View {
        ZStack {
            // Glow externe
            Circle()
                .fill(viewModel.glowColor.opacity(0.3))
                .blur(radius: 40)
                .scaleEffect(scale * 1.2)
            
            // Orbe principal
            Circle()
                .fill(gradient)
                .frame(width: 150, height: 150)
                .scaleEffect(scale)
                .rotationEffect(.degrees(rotation))
                .offset(x: offset)
                .shadow(color: viewModel.primaryColor.opacity(0.5), radius: 20)
            
            // Waveform overlay (speaking only)
            if viewModel.state == .speaking {
                WaveformView(audioLevel: viewModel.audioLevel)
            }
        }
        .onChange(of: viewModel.state) { newState in
            animateToState(newState)
        }
        .onAppear {
            animateToState(viewModel.state)
        }
    }
    
    private var gradient: RadialGradient {
        RadialGradient(
            colors: [viewModel.primaryColor, viewModel.secondaryColor],
            center: .center,
            startRadius: 0,
            endRadius: 100
        )
    }
    
    private func animateToState(_ state: OrbState) {
        // Reset
        withAnimation(.easeOut(duration: 0.2)) {
            rotation = 0
            offset = 0
        }
        
        switch state {
        case .idle:
            withAnimation(OrbStateAnimations.idleAnimation()) {
                scale = 1.05
            }
            
        case .listening:
            // Géré par audioLevel binding
            break
            
        case .processing:
            withAnimation(OrbStateAnimations.processingAnimation()) {
                rotation = 360
            }
            
        case .speaking:
            // Géré par waveform view
            break
            
        case .error:
            withAnimation(OrbStateAnimations.errorAnimation()) {
                offset = 10
            }
        }
    }
}
```

### T3 : Waveform overlay (1h)

```swift
// WaveformView.swift
struct WaveformView: View {
    let audioLevel: CGFloat // 0.0 - 1.0
    
    var body: some View {
        Circle()
            .stroke(
                Color.green.opacity(0.6),
                style: StrokeStyle(lineWidth: 4 + audioLevel * 8)
            )
            .frame(width: 160 + audioLevel * 20, height: 160 + audioLevel * 20)
            .animation(.easeOut(duration: 0.1), value: audioLevel)
    }
}
```

---

## Tests manuels

| # | État | Animation attendue |
|---|------|-------------------|
| 1 | Idle | Orbe violet pulse lentement |
| 2 | Tap → Listening | Transition fluide vers bleu |
| 3 | Parler | Bleu réagit à la voix |
| 4 | Processing | Cyan + rotation |
| 5 | Speaking | Vert + waveform sync |
| 6 | Error | Rouge + shake |

---

## Dépendances

- **Prérequise** : US-024
- **Bloquante pour** : US-026 (Waveform détaillé)

---

*Story créée par Bob (SM BMAD) — 2026-03-04*
