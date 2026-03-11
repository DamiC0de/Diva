/**
 * DivaWidgetBridge.swift
 *
 * React Native bridge to:
 * 1. Update the Diva iOS widget via App Group UserDefaults.
 * 2. Check if the user tapped "Parler" in the widget (widgetListenTrigger).
 */

import Foundation
import WidgetKit
import React

@objc(DivaWidgetBridge)
class DivaWidgetBridge: NSObject {

    private let appGroupId = "group.fr.papote.diva"

    /// Write last conversation exchange to App Group so the widget can display it.
    @objc func setWidgetData(_ json: String) {
        guard
            let data = json.data(using: .utf8),
            let dict = try? JSONSerialization.jsonObject(with: data) as? [String: String],
            let defaults = UserDefaults(suiteName: appGroupId)
        else { return }

        if let userMsg = dict["lastUserMessage"] {
            defaults.set(userMsg, forKey: "lastUserMessage")
        }
        if let aiResp = dict["lastAIResponse"] {
            defaults.set(aiResp, forKey: "lastAIResponse")
        }
        defaults.synchronize()
    }

    /// Reload the widget timeline so the new data is displayed.
    @objc func reloadAllTimelines() {
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Check if the widget "Parler" button was tapped recently (within 5s).
    /// Clears the flag after reading.
    /// Callback: (triggered: Bool) — true if the user tapped Parler from the widget.
    @objc func checkAndClearWidgetTrigger(_ callback: @escaping RCTResponseSenderBlock) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            callback([false])
            return
        }
        let timestamp = defaults.double(forKey: "widgetListenTrigger")
        let wasTriggered = timestamp > 0 && (Date().timeIntervalSince1970 - timestamp) < 5.0
        // Clear so it doesn't fire again
        defaults.removeObject(forKey: "widgetListenTrigger")
        defaults.synchronize()
        callback([wasTriggered])
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
