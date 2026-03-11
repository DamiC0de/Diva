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
        AsyncFunction("startListening") { [weak self] in
            guard let self = self else { return }
            
            // Request permissions first
            let micGranted = await self.requestMicrophonePermission()
            guard micGranted else {
                self.emitError(message: "Microphone permission denied", code: "mic_denied")
                return
            }
            
            let speechGranted = await self.requestSpeechPermission()
            guard speechGranted else {
                self.emitError(message: "Speech recognition permission denied", code: "speech_denied")
                return
            }
            
            do {
                if self.audioManager == nil {
                    self.audioManager = BackgroundAudioManager()
                    self.audioManager?.delegate = self
                }
                try self.audioManager?.start()
                self.updateState(.listening)
            } catch {
                self.emitError(message: "Failed to start audio: \(error.localizedDescription)", code: "start_failed")
                self.updateState(.error)
            }
        }
        
        // Stop background listening
        AsyncFunction("stopListening") { [weak self] in
            self?.audioManager?.stop()
            self?.updateState(.idle)
        }
        
        // Check if currently listening
        AsyncFunction("isListening") { [weak self] -> Bool in
            return self?.audioManager?.isRunning ?? false
        }
        
        // Get current status
        AsyncFunction("getStatus") { [weak self] -> [String: Any] in
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
    
    // MARK: - Permissions
    
    private func requestMicrophonePermission() async -> Bool {
        return await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }
    
    private func requestSpeechPermission() async -> Bool {
        return await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
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
