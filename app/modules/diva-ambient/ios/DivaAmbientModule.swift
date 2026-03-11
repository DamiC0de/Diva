import ExpoModulesCore
import AVFoundation
import Speech

// MARK: - Ambient State

enum AmbientState: String {
    case idle = "idle"
    case listening = "listening"
    case voiceDetected = "voiceDetected"
    case processing = "processing"
    case paused = "paused"
    case error = "error"
}

// MARK: - Expo Module

public class DivaAmbientModule: Module {
    
    private var audioManager: BackgroundAudioManager?
    private var currentState: AmbientState = .idle
    
    public func definition() -> ModuleDefinition {
        Name("DivaAmbient")
        
        // Events emitted to JS
        Events("onWakeWordDetected", "onStatusChange", "onError")
        
        // Start background listening
        AsyncFunction("startListening") { (promise: Promise) in
            // Request microphone permission
            AVAudioApplication.requestRecordPermission { [weak self] micGranted in
                guard let self = self else {
                    promise.resolve(nil)
                    return
                }
                
                guard micGranted else {
                    self.emitError(message: "Microphone permission denied", code: "mic_denied")
                    promise.resolve(nil)
                    return
                }
                
                // Request speech recognition permission
                SFSpeechRecognizer.requestAuthorization { [weak self] status in
                    guard let self = self else {
                        promise.resolve(nil)
                        return
                    }
                    
                    guard status == .authorized else {
                        self.emitError(message: "Speech recognition permission denied", code: "speech_denied")
                        promise.resolve(nil)
                        return
                    }
                    
                    // Start on main thread
                    DispatchQueue.main.async { [weak self] in
                        guard let self = self else {
                            promise.resolve(nil)
                            return
                        }
                        
                        do {
                            if self.audioManager == nil {
                                self.audioManager = BackgroundAudioManager()
                                self.audioManager?.delegate = self
                            }
                            try self.audioManager?.start()
                            self.updateState(.listening)
                            promise.resolve(nil)
                        } catch {
                            self.emitError(message: "Failed to start audio: \(error.localizedDescription)", code: "start_failed")
                            self.updateState(.error)
                            promise.reject("START_FAILED", error.localizedDescription)
                        }
                    }
                }
            }
        }
        
        // Stop background listening
        Function("stopListening") { [weak self] in
            self?.audioManager?.stop()
            self?.updateState(.idle)
        }
        
        // Check if currently listening
        Function("isListening") { [weak self] -> Bool in
            return self?.audioManager?.isRunning ?? false
        }
        
        // Get current status
        Function("getStatus") { [weak self] -> [String: Any] in
            let manager = self?.audioManager
            return [
                "state": self?.currentState.rawValue ?? "idle",
                "isListening": manager?.isRunning ?? false,
                "isAvailable": true,
                "batteryThreshold": 30,
                "isSpeechRecognitionActive": manager?.isSpeechActive ?? false,
            ]
        }
    }
    
    // MARK: - State Management
    
    private func updateState(_ newState: AmbientState) {
        currentState = newState
        sendEvent("onStatusChange", [
            "state": newState.rawValue,
            "isListening": audioManager?.isRunning ?? false,
            "isAvailable": true,
            "batteryThreshold": 30,
            "isSpeechRecognitionActive": audioManager?.isSpeechActive ?? false,
        ])
    }
    
    private func emitError(message: String, code: String) {
        sendEvent("onError", [
            "message": message,
            "code": code,
        ])
    }
}

// MARK: - BackgroundAudioManagerDelegate

extension DivaAmbientModule: BackgroundAudioManagerDelegate {
    func audioManagerDidDetectVoice() {
        updateState(.voiceDetected)
    }
    
    func audioManagerDidDetectSilence() {
        if currentState == .voiceDetected {
            updateState(.listening)
        }
    }
    
    func audioManagerDidDetectWakeWord(transcript: String, confidence: Float) {
        updateState(.processing)
        sendEvent("onWakeWordDetected", [
            "transcript": transcript,
            "confidence": confidence,
            "timestamp": Date().timeIntervalSince1970 * 1000,
        ])
        
        // Return to listening after a short delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
            if self?.currentState == .processing {
                self?.updateState(.listening)
            }
        }
    }
    
    func audioManagerDidPause() {
        updateState(.paused)
    }
    
    func audioManagerDidResume() {
        updateState(.listening)
    }
    
    func audioManagerDidFail(error: Error) {
        emitError(message: error.localizedDescription, code: "audio_error")
        updateState(.error)
    }
}
