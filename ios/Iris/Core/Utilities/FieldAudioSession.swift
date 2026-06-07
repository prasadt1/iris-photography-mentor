import AVFoundation

/// Shared audio-session setup for Field (camera + optional voice cues + screen recording).
///
/// Uses `.ambient` + `.mixWithOthers` and never calls `setActive` — activating the session
/// steals it from AVCaptureSession / ReplayKit and triggers IPCAUClient -66748, empty
/// AVAudioBuffer, and FigCaptureSourceRemote -17281 during demo recordings.
enum FieldAudioSession {
    private static let lock = NSLock()
    private static var didConfigure = false

    /// Call once before `AVCaptureSession.startRunning()`.
    static func prepareForFieldCapture() {
        lock.lock()
        defer { lock.unlock() }
        guard !didConfigure else { return }
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.ambient, mode: .spokenAudio, options: [.mixWithOthers])
            didConfigure = true
        } catch {
            // Non-fatal — on-screen hints still work.
        }
    }
}
