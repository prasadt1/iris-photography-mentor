import AVFoundation
import Combine

enum SpeechPlainText {
    /// Strip common markdown for AVSpeechUtterance.
    static func plain(from markdown: String) -> String {
        var text = markdown
        text = text.replacingOccurrences(
            of: #"```[\s\S]*?```"#,
            with: " ",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: #"`([^`]+)`"#,
            with: "$1",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: #"\*\*([^*]+)\*\*"#,
            with: "$1",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: #"\*([^*]+)\*"#,
            with: "$1",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: #"\[([^\]]+)\]\([^)]+\)"#,
            with: "$1",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: #"(?m)^#{1,6}\s+"#,
            with: "",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: #"(?m)^[-*+]\s+"#,
            with: "",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: #"\n+"#,
            with: ". ",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: #"\s+"#,
            with: " ",
            options: .regularExpression
        )
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Spoken practice assignment: skill focus + brief only (rationale stays on-screen).
    static func practiceSpeech(focus: String, brief: String) -> String {
        [
            "Focus on \(focus.replacingOccurrences(of: "_", with: " ")).",
            plain(from: brief),
        ].joined(separator: " ")
    }
}

/// Full-text read-aloud for Mentor + Practice (distinct from field-coach `CueSpeaker` short cues).
@MainActor
final class SpeechReader: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    @Published private(set) var speakingId: String?

    private let synthesizer = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func isSpeaking(_ id: String) -> Bool {
        speakingId == id
    }

    func toggle(id: String, text: String) {
        if speakingId == id {
            stop()
        } else {
            speak(id: id, text: text)
        }
    }

    func speak(id: String, text: String) {
        let plain = SpeechPlainText.plain(from: text)
        guard !plain.isEmpty else { return }

        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }

        let utterance = AVSpeechUtterance(string: plain)
        utterance.rate = 0.48
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        speakingId = id
        synthesizer.speak(utterance)
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        speakingId = nil
    }

    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didFinish utterance: AVSpeechUtterance
    ) {
        Task { @MainActor in
            speakingId = nil
        }
    }

    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didCancel utterance: AVSpeechUtterance
    ) {
        Task { @MainActor in
            speakingId = nil
        }
    }
}
