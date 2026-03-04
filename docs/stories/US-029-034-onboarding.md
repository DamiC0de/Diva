# US-029 → US-034 : Onboarding Complet

## Métadonnées

| Story | Description | Points |
|-------|-------------|--------|
| US-029 | Écran bienvenue | 2 |
| US-030 | Permission micro | 2 |
| US-031 | Permission notifications | 2 |
| US-032 | Création compte rapide | 3 |
| US-033 | Tutoriel interactif | 3 |
| US-034 | Écran principal post-onboarding | 2 |

**Total** : 14 points (Sprint 4)

---

## Flow global

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐       │
│   │ Welcome │──►│  Micro  │──►│ Notifs  │──►│ Signup  │       │
│   │ US-029  │   │ US-030  │   │ US-031  │   │ US-032  │       │
│   └─────────┘   └─────────┘   └─────────┘   └─────────┘       │
│                                                 │               │
│                                                 ▼               │
│                              ┌─────────┐   ┌─────────┐         │
│                              │  Home   │◄──│Tutorial │         │
│                              │ US-034  │   │ US-033  │         │
│                              └─────────┘   └─────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## US-029 : Écran bienvenue

### Critères d'acceptation

- [ ] Logo Diva animé
- [ ] Tagline "Ton assistant vocal privé"
- [ ] Bouton "Commencer" en bas
- [ ] Animation subtile de fade-in

### Code

```swift
struct WelcomeView: View {
    @State private var opacity: Double = 0
    let onContinue: () -> Void
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Logo
            Image("diva-logo")
                .resizable()
                .frame(width: 120, height: 120)
            
            // Tagline
            Text("Ton assistant vocal privé")
                .font(.title2)
                .foregroundColor(.gray)
            
            Spacer()
            
            // CTA
            Button("Commencer") {
                onContinue()
            }
            .buttonStyle(.borderedProminent)
            .padding(.bottom, 50)
        }
        .opacity(opacity)
        .onAppear {
            withAnimation(.easeIn(duration: 0.5)) {
                opacity = 1
            }
        }
    }
}
```

---

## US-030 : Permission micro

### Critères d'acceptation

- [ ] Écran explicatif AVANT popup iOS
- [ ] Icône micro + texte rassurant
- [ ] "Diva écoute uniquement quand tu parles"
- [ ] Mention vie privée

### Code

```swift
struct MicrophonePermissionView: View {
    let onGranted: () -> Void
    let onSkipped: () -> Void
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Image(systemName: "mic.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            Text("Diva a besoin d'écouter ta voix")
                .font(.title2)
                .bold()
            
            Text("L'audio est traité localement sur ton iPhone.\nRien n'est envoyé à des serveurs.")
                .multilineTextAlignment(.center)
                .foregroundColor(.gray)
            
            Spacer()
            
            Button("Autoriser le micro") {
                Task {
                    let granted = await AVAudioApplication.requestRecordPermission()
                    if granted {
                        onGranted()
                    }
                }
            }
            .buttonStyle(.borderedProminent)
            
            Button("Plus tard") {
                onSkipped()
            }
            .foregroundColor(.gray)
            .padding(.bottom, 50)
        }
        .padding()
    }
}
```

---

## US-031 : Permission notifications

### Critères d'acceptation

- [ ] Écran explicatif
- [ ] "Diva ne stocke pas tes messages"
- [ ] Optionnel (skip possible)
- [ ] Redirection settings si refusé

### Code

```swift
struct NotificationPermissionView: View {
    let onGranted: () -> Void
    let onSkipped: () -> Void
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Image(systemName: "bell.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.orange)
            
            Text("Écoute tes messages")
                .font(.title2)
                .bold()
            
            Text("Diva peut lire tes notifications WhatsApp, Messenger et SMS.\n\nTes messages restent 100% privés.")
                .multilineTextAlignment(.center)
                .foregroundColor(.gray)
            
            Spacer()
            
            Button("Autoriser les notifications") {
                Task {
                    let center = UNUserNotificationCenter.current()
                    let granted = try? await center.requestAuthorization(options: [.alert])
                    if granted == true {
                        onGranted()
                    }
                }
            }
            .buttonStyle(.borderedProminent)
            
            Button("Plus tard") {
                onSkipped()
            }
            .foregroundColor(.gray)
            .padding(.bottom, 50)
        }
        .padding()
    }
}
```

---

## US-032 : Création compte rapide

### Critères d'acceptation

- [ ] Email + mot de passe uniquement
- [ ] Sign in with Apple
- [ ] Skip possible (mode local only)
- [ ] Pas de vérification email bloquante

### Code

```swift
struct QuickSignupView: View {
    @StateObject var viewModel = AuthViewModel()
    let onComplete: () -> Void
    let onSkipped: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Créer un compte")
                .font(.title)
                .bold()
            
            Text("Pour les fonctionnalités avancées")
                .foregroundColor(.gray)
            
            // Sign in with Apple
            SignInWithAppleButton { request in
                request.requestedScopes = [.email]
            } onCompletion: { result in
                // Handle Apple sign in
                onComplete()
            }
            .frame(height: 50)
            .padding(.horizontal)
            
            Text("ou")
                .foregroundColor(.gray)
            
            // Email/Password
            TextField("Email", text: $viewModel.email)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal)
            
            SecureField("Mot de passe", text: $viewModel.password)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal)
            
            Button("S'inscrire") {
                Task {
                    await viewModel.register()
                    if viewModel.isAuthenticated {
                        onComplete()
                    }
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(!viewModel.canRegister)
            
            Spacer()
            
            Button("Continuer sans compte") {
                onSkipped()
            }
            .foregroundColor(.gray)
            .padding(.bottom, 30)
        }
        .padding()
    }
}
```

---

## US-033 : Tutoriel interactif

### Critères d'acceptation

- [ ] 3-4 écrans max
- [ ] Exemples de commandes
- [ ] Test vocal "Dis Bonjour Diva"
- [ ] Skippable

### Code

```swift
struct TutorialView: View {
    @State private var currentPage = 0
    let onComplete: () -> Void
    
    let pages = [
        TutorialPage(
            icon: "waveform",
            title: "Parle naturellement",
            description: "Appuie sur l'orbe et pose ta question.",
            example: "\"Quelle heure est-il ?\""
        ),
        TutorialPage(
            icon: "envelope",
            title: "Écoute tes messages",
            description: "Diva lit tes notifications.",
            example: "\"Lis mes messages WhatsApp\""
        ),
        TutorialPage(
            icon: "bell",
            title: "Crée des rappels",
            description: "Organise-toi par la voix.",
            example: "\"Rappelle-moi dans 10 minutes\""
        )
    ]
    
    var body: some View {
        VStack {
            TabView(selection: $currentPage) {
                ForEach(pages.indices, id: \.self) { index in
                    TutorialPageView(page: pages[index])
                        .tag(index)
                }
            }
            .tabViewStyle(.page)
            
            // Navigation
            HStack {
                Button("Passer") {
                    onComplete()
                }
                .foregroundColor(.gray)
                
                Spacer()
                
                Button(currentPage == pages.count - 1 ? "Terminer" : "Suivant") {
                    if currentPage < pages.count - 1 {
                        withAnimation {
                            currentPage += 1
                        }
                    } else {
                        onComplete()
                    }
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
        }
    }
}
```

---

## US-034 : Écran principal post-onboarding

### Critères d'acceptation

- [ ] Transition fluide depuis tutoriel
- [ ] Orbe visible et prêt
- [ ] Hint : "Appuie ou dis 'Hey Diva'"
- [ ] Onboarding ne se relance pas

### Code

```swift
struct PostOnboardingHomeView: View {
    @StateObject var orbViewModel = OrbViewModel()
    @AppStorage("hasCompletedOnboarding") var hasCompletedOnboarding = false
    @State private var showHint = true
    
    var body: some View {
        ZStack {
            Color(hex: "#0A0A0F")
                .ignoresSafeArea()
            
            VStack {
                Spacer()
                
                AnimatedOrbView(viewModel: orbViewModel)
                
                Spacer()
                
                if showHint {
                    Text("Appuie pour parler")
                        .foregroundColor(.gray)
                        .padding(.bottom, 50)
                        .transition(.opacity)
                }
            }
        }
        .onAppear {
            hasCompletedOnboarding = true
            
            // Hide hint after 5s
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                withAnimation {
                    showHint = false
                }
            }
        }
    }
}
```

---

## OnboardingCoordinator

```swift
// OnboardingCoordinator.swift
class OnboardingCoordinator: ObservableObject {
    enum Step: Int, CaseIterable {
        case welcome
        case microphone
        case notifications
        case signup
        case tutorial
        case home
    }
    
    @Published var currentStep: Step = .welcome
    
    func next() {
        if let nextIndex = Step.allCases.firstIndex(of: currentStep).map({ $0 + 1 }),
           nextIndex < Step.allCases.count {
            withAnimation {
                currentStep = Step.allCases[nextIndex]
            }
        }
    }
    
    func skip(to step: Step) {
        withAnimation {
            currentStep = step
        }
    }
}

struct OnboardingContainerView: View {
    @StateObject var coordinator = OnboardingCoordinator()
    
    var body: some View {
        Group {
            switch coordinator.currentStep {
            case .welcome:
                WelcomeView { coordinator.next() }
            case .microphone:
                MicrophonePermissionView(
                    onGranted: { coordinator.next() },
                    onSkipped: { coordinator.next() }
                )
            case .notifications:
                NotificationPermissionView(
                    onGranted: { coordinator.next() },
                    onSkipped: { coordinator.next() }
                )
            case .signup:
                QuickSignupView(
                    onComplete: { coordinator.next() },
                    onSkipped: { coordinator.next() }
                )
            case .tutorial:
                TutorialView { coordinator.next() }
            case .home:
                PostOnboardingHomeView()
            }
        }
    }
}
```

---

## Tests manuels

| # | Scénario | Résultat |
|---|----------|----------|
| 1 | Premier lancement | Welcome → flow complet |
| 2 | Skip toutes permissions | Arrive à Home |
| 3 | Fermer en plein onboarding | Reprend où laissé |
| 4 | Relancer après onboarding | Directement Home |

---

*Stories créées par Bob (SM BMAD) — 2026-03-04*
