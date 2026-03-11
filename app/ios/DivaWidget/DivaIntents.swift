/**
 * DivaIntents.swift
 *
 * iOS 17+ App Intents for interactive widget.
 * Writes a trigger flag to App Group UserDefaults so the app
 * auto-starts voice session when it comes to the foreground.
 */

import AppIntents
import Foundation
import WidgetKit

// MARK: - Start Listening Intent

/// Triggered by the widget "🎤 Parler" button.
/// Writes a timestamp to shared UserDefaults, then opens the app.
/// The app reads this flag on foreground and auto-starts the mic.
@available(iOS 17.0, *)
struct StartListeningIntent: AppIntent {
    static var title: LocalizedStringResource = "Parler à Diva"
    static var description = IntentDescription("Lance une conversation vocale avec Diva")

    /// Opens the app after perform() completes.
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        // Write trigger flag to shared App Group UserDefaults.
        // The main app reads this on AppState.change → 'active'.
        if let defaults = UserDefaults(suiteName: "group.fr.papote.diva") {
            defaults.set(Date().timeIntervalSince1970, forKey: "widgetListenTrigger")
            defaults.synchronize()
        }
        return .result()
    }
}

// MARK: - Widget Configuration Intent

/// Provides widget configuration binding to our AppIntent.
@available(iOS 17.0, *)
struct DivaWidgetIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Diva Widget"
    static var description = IntentDescription("Configure le widget Diva")
}
