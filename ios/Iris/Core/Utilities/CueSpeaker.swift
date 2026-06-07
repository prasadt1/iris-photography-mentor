import AVFoundation
import UIKit

/// Short voice cues for live field coaching. Uses `FieldAudioSession` — no `setActive`.
@MainActor
final class CueSpeaker: NSObject, AVSpeechSynthesizerDelegate {
    private let synthesizer = AVSpeechSynthesizer()
    private var voiceSuspendedForSession = false

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    var isVoiceSuspended: Bool { voiceSuspendedForSession }

    func prepare() {
        FieldAudioSession.prepareForFieldCapture()
        voiceSuspendedForSession = false
    }

    func speak(_ text: String) {
        guard AppConfig.liveCoachVoiceEnabled, !voiceSuspendedForSession else { return }
        // Screen recording / AirPlay mirror grabs the audio server — speaking during capture
        // triggers IPCAUClient -66748 and kills the camera pipeline. Text hints still show.
        if UIScreen.main.isCaptured { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        FieldAudioSession.prepareForFieldCapture()

        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        let spoken = Self.compactForSpeech(trimmed)
        let utterance = AVSpeechUtterance(string: spoken)
        utterance.rate = AppConfig.liveCoachSpeechRate
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        synthesizer.speak(utterance)

        // If the synthesizer never starts (common when the audio server is wedged),
        // suspend voice for this session so we stop hammering IPCAUClient.
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 400_000_000)
            guard let self, AppConfig.liveCoachVoiceEnabled, !self.voiceSuspendedForSession else { return }
            if !self.synthesizer.isSpeaking, !self.synthesizer.isPaused {
                self.voiceSuspendedForSession = true
            }
        }
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
    }

    /// Keep voice cues short — full text stays on screen.
    private static func compactForSpeech(_ text: String) -> String {
        if let match = text.range(of: #"[.!?]"#, options: .regularExpression) {
            let end = text.index(after: match.lowerBound)
            let sentence = String(text[..<end]).trimmingCharacters(in: .whitespacesAndNewlines)
            if sentence.count >= 12 {
                return sentence
            }
        }
        if text.count > 72 {
            return String(text.prefix(72)).trimmingCharacters(in: .whitespacesAndNewlines) + "…"
        }
        return text
    }

    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didFinish utterance: AVSpeechUtterance
    ) {}

    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didCancel utterance: AVSpeechUtterance
    ) {}
}
