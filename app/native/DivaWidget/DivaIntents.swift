/**
 * DivaIntents.swift
 *
 * iOS 17+ App Intents for interactive widget.
 * Allows the widget "Parler" button to open Diva in listen mode.
 */

import AppIntents
import Foundation
import WidgetKit

// MARK: - Start Listening Intent

/// Triggered by the widget "🎤 Parler" button.
/// Opens Diva and immediately starts voice session.
@available(iOS 17.0, *)
struct StartListeningIntent: AppIntent {
    static var title: LocalizedStringResource = "Parler à Diva"
    static var description = IntentDescription("Lance une conversation vocale avec Diva")

    /// Tells the system to open the app when this intent runs.
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        // App opens via URL scheme handled in app router
        // The `openAppWhenRun = true` flag ensures the app launches
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
