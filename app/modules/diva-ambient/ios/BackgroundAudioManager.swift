import AVFoundation
import Speech

// MARK: - Delegate Protocol

protocol BackgroundAudioManagerDelegate: AnyObject {
    func audioManagerDidDetectVoice()
    func audioManagerDidDetectSilence()
    func audioManagerDidDetectWakeWord(transcript: String, confidence: Float)
    func audioManagerDidPause()
    func audioManagerDidResume()
    func audioManagerDidFail(error: Error)
}

// MARK: - BackgroundAudioManager

/// Manages AVAudioSession + AVAudioEngine for background wake word detection.
/// Architecture: 2-level detection
///   Level 1: VAD (Voice Activity Detection) — always active, low CPU
///   Level 2: SFSpeechRecognizer — activated only when voice detected
class BackgroundAudioManager {
    
    weak var delegate: BackgroundAudioManagerDelegate?
    
    // Audio engine
    private let audioEngine = AVAudioEngine()
    private var isAudioEngineRunning = false
    
    // VAD (Level 1)
    private let vadThresholdDB: Float = -45.0    // dB threshold for voice detection (lowered for sensitivity)
    private let vadMinDuration: TimeInterval = 0.15 // Minimum voice duration (seconds)
    private let vadSilenceTimeout: TimeInterval = 3.0 // Silence before stopping speech recognition
    private var vadVoiceStartTime: Date?
    private var vadSilenceTimer: Timer?
    private var isVoiceDetected = false
    
    // Speech Recognition (Level 2)
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "fr-FR"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    // Wake word variants — SFSpeechRecognizer (fr-FR) may transcribe "Diva" differently
    private let wakeKeywords = ["diva", "divas", "di va", "divah", "j'avais"]
    private let cooldownDuration: TimeInterval = 2.0
    private var lastWakeWordTime: Date = .distantPast
    private var speechRestartTimer: Timer?
    private let maxSpeechDuration: TimeInterval = 55.0 // Restart before Apple's 60s limit
    private var speechStartTime: Date?
    
    // Public state
    var isRunning: Bool { isAudioEngineRunning }
    var isSpeechActive: Bool { recognitionTask != nil }
    
    // MARK: - Audio Session Configuration
    
    private func configureAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        
        try session.setCategory(
            .playAndRecord,
            mode: .voiceChat,
            options: [.defaultToSpeaker, .mixWithOthers, .allowBluetooth, .allowBluetoothA2DP]
        )
        try session.setActive(true, options: .notifyOthersOnDeactivation)
        
        // Listen for interruptions (phone calls, Siri, etc.)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: session
        )
        
        // Listen for route changes (headphones plugged/unplugged)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: session
        )
    }
    
    // MARK: - Start / Stop
    
    func start() throws {
        guard !isAudioEngineRunning else { return }
        
        try configureAudioSession()
        
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        // Install tap for audio buffer processing
        inputNode.installTap(onBus: 0, bufferSize: 4096, format: recordingFormat) { [weak self] buffer, _ in
            self?.processAudioBuffer(buffer)
        }
        
        audioEngine.prepare()
        try audioEngine.start()
        isAudioEngineRunning = true
        
        // Start speech recognition immediately — don't wait for VAD
        // This ensures "Diva" is captured even when said quickly/softly
        DispatchQueue.main.async { [weak self] in
            self?.startSpeechRecognition()
        }
        
        print("[DivaAmbient] Audio engine started — wake word listening active (always-on mode)")
    }
    
    func stop() {
        stopSpeechRecognition()
        
        audioEngine.inputNode.removeTap(onBus: 0)
        audioEngine.stop()
        isAudioEngineRunning = false
        
        vadSilenceTimer?.invalidate()
        vadSilenceTimer = nil
        speechRestartTimer?.invalidate()
        speechRestartTimer = nil
        isVoiceDetected = false
        
        NotificationCenter.default.removeObserver(self)
        
        // Deactivate audio session
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        
        print("[DivaAmbient] Audio engine stopped")
    }
    
    // MARK: - Level 1: VAD (Voice Activity Detection)
    
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData?[0] else { return }
        let frameLength = Int(buffer.frameLength)
        
        // Calculate RMS (Root Mean Square)
        var sum: Float = 0
        for i in 0..<frameLength {
            sum += channelData[i] * channelData[i]
        }
        let rms = sqrtf(sum / Float(frameLength))
        
        // Convert to dB
        let db = 20 * log10f(max(rms, 1e-10))
        
        // Always feed buffer to speech recognition (always-on wake word detection)
        if recognitionRequest != nil {
            recognitionRequest?.append(buffer)
        }
        
        if db > vadThresholdDB {
            // Voice detected (VAD used for visual feedback only now)
            if !isVoiceDetected {
                if vadVoiceStartTime == nil {
                    vadVoiceStartTime = Date()
                } else if Date().timeIntervalSince(vadVoiceStartTime!) >= vadMinDuration {
                    isVoiceDetected = true
                    vadVoiceStartTime = nil
                    DispatchQueue.main.async { [weak self] in
                        self?.delegate?.audioManagerDidDetectVoice()
                    }
                }
            }
            DispatchQueue.main.async { [weak self] in
                self?.resetSilenceTimer()
            }
        } else {
            vadVoiceStartTime = nil
        }
    }
    
    private func resetSilenceTimer() {
        vadSilenceTimer?.invalidate()
        vadSilenceTimer = Timer.scheduledTimer(withTimeInterval: vadSilenceTimeout, repeats: false) { [weak self] _ in
            guard let self = self, self.isVoiceDetected else { return }
            // Reset visual state only — do NOT stop speech recognition in always-on mode
            self.isVoiceDetected = false
            self.delegate?.audioManagerDidDetectSilence()
        }
    }
    
    // MARK: - Level 2: Speech Recognition (Wake Word)
    
    private func startSpeechRecognition() {
        guard recognitionTask == nil else { return }
        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            print("[DivaAmbient] Speech recognizer not available")
            return
        }
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let request = recognitionRequest else { return }
        
        request.shouldReportPartialResults = true
        request.requiresOnDeviceRecognition = false // Allow network for better accuracy
        
        // If on-device is available, prefer it for lower latency
        if #available(iOS 13, *), recognizer.supportsOnDeviceRecognition {
            request.requiresOnDeviceRecognition = true
        }
        
        speechStartTime = Date()
        print("[DivaAmbient] 🎙️ Recognizer started — locale=\(recognizer.locale.identifier) onDevice=\(request.requiresOnDeviceRecognition) keywords=\(self.wakeKeywords)")
        
        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            
            if let result = result {
                let transcript = result.bestTranscription.formattedString.lowercased()
                
                // Debug: log every non-empty partial transcript
                if !transcript.isEmpty {
                    print("[DivaAmbient] 👂 Heard: \"\(transcript)\"")
                }
                
                // Check for wake word variants
                let matchedKeyword = self.wakeKeywords.first { transcript.contains($0) }
                if let matched = matchedKeyword {
                    let timeSinceLastWake = Date().timeIntervalSince(self.lastWakeWordTime)
                    if timeSinceLastWake >= self.cooldownDuration {
                        self.lastWakeWordTime = Date()
                        
                        // Get confidence from segments
                        let confidence = result.bestTranscription.segments
                            .filter { $0.substring.lowercased().contains(matched) }
                            .first?.confidence ?? 0.8
                        
                        print("[DivaAmbient] 🎯 Wake word detected! matched='\(matched)' transcript=\"\(transcript)\" confidence=\(confidence)")
                        
                                        self.stopSpeechRecognition()
                        self.delegate?.audioManagerDidDetectWakeWord(
                            transcript: transcript,
                            confidence: Float(confidence)
                        )
                        // Restart speech recognition after a brief pause (ready for next trigger)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { [weak self] in
                            guard let self = self, self.isRunning else { return }
                            self.startSpeechRecognition()
                        }
                    }
                }
            }
            
            if let error = error {
                let nsError = error as NSError
                let isCancelled = nsError.code == 216 || nsError.code == 301
                if !isCancelled {
                    print("[DivaAmbient] Speech recognition error (\(nsError.code)): \(error.localizedDescription)")
                }
                self.stopSpeechRecognition()
                // Auto-restart on unexpected errors (not cancellations from our own stop())
                if !isCancelled && self.isRunning {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                        guard let self = self, self.isRunning else { return }
                        print("[DivaAmbient] Restarting after error")
                        self.startSpeechRecognition()
                    }
                }
                return
            }
            
            if result?.isFinal == true {
                self.stopSpeechRecognition()
                // Final result = recognizer closed — restart immediately
                if self.isRunning {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
                        guard let self = self, self.isRunning else { return }
                        self.startSpeechRecognition()
                    }
                }
            }
        }
        
        // Auto-restart before Apple's 60s limit — always, regardless of voice activity
        speechRestartTimer?.invalidate()
        speechRestartTimer = Timer.scheduledTimer(withTimeInterval: maxSpeechDuration, repeats: false) { [weak self] _ in
            guard let self = self, self.isRunning else { return }
            print("[DivaAmbient] Speech recognition 55s timeout — restarting")
            self.stopSpeechRecognition()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
                guard let self = self, self.isRunning else { return }
                self.startSpeechRecognition()
            }
        }
        
        print("[DivaAmbient] Speech recognition started")
    }
    
    private func stopSpeechRecognition() {
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        speechRestartTimer?.invalidate()
        speechRestartTimer = nil
        speechStartTime = nil
    }
    
    // MARK: - Interruption Handling
    
    @objc private func handleInterruption(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        
        switch type {
        case .began:
            // Phone call, Siri, etc. — pause everything
            print("[DivaAmbient] Audio interrupted — pausing")
            stopSpeechRecognition()
            isVoiceDetected = false
            delegate?.audioManagerDidPause()
            
        case .ended:
            // Interruption ended — try to resume
            guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            
            if options.contains(.shouldResume) {
                print("[DivaAmbient] Interruption ended — resuming")
                do {
                    try AVAudioSession.sharedInstance().setActive(true)
                    if !audioEngine.isRunning {
                        try audioEngine.start()
                    }
                    delegate?.audioManagerDidResume()
                } catch {
                    print("[DivaAmbient] Failed to resume after interruption: \(error)")
                    delegate?.audioManagerDidFail(error: error)
                }
            }
            
        @unknown default:
            break
        }
    }
    
    @objc private func handleRouteChange(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else { return }
        
        switch reason {
        case .oldDeviceUnavailable:
            // Headphones unplugged — audio engine may have stopped
            print("[DivaAmbient] Audio route changed — device unavailable, restarting")
            if isAudioEngineRunning && !audioEngine.isRunning {
                try? audioEngine.start()
            }
        default:
            break
        }
    }
    
    deinit {
        stop()
    }
}
