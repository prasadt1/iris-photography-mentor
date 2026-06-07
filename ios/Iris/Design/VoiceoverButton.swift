import SwiftUI

struct VoiceoverButton: View {
    @EnvironmentObject private var speech: SpeechReader

    let speechId: String
    let text: String
    let label: String

    var body: some View {
        Button {
            speech.toggle(id: speechId, text: text)
        } label: {
            HStack(spacing: 4) {
                Image(systemName: speech.isSpeaking(speechId) ? "stop.fill" : "speaker.wave.2.fill")
                    .font(.system(size: 11, weight: .semibold))
                Text(speech.isSpeaking(speechId) ? "Stop" : "Listen")
                    .font(IrisFont.sans(10, weight: .semibold))
            }
            .foregroundStyle(Color.irisTextMuted)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(Color.irisSurface3.opacity(0.65))
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(
            speech.isSpeaking(speechId)
                ? "Stop reading \(label)"
                : "Read aloud \(label)"
        )
    }
}
