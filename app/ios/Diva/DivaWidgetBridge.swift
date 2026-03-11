/**
 * DivaWidgetBridge.swift
 *
 * React Native bridge to update the Diva iOS widget via App Group UserDefaults.
 * Called from useVoiceSession after each conversation exchange.
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

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
