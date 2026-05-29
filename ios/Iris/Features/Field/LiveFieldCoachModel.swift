import Foundation

@MainActor
final class LiveFieldCoachModel: ObservableObject {
    @Published var hint: String?
    @Published var isFetching = false
    @Published var isSessionActive = false
    @Published var statusMessage: String?

    @Published var isEnabled: Bool {
        didSet { AppConfig.liveCoachEnabled = isEnabled }
    }

    private let service = FieldCoachService()
    private let speaker = CueSpeaker()
    private var sessionId: String?
    private var assignmentBrief: String?
    private var persona = "hobbyist"
    private var inFlight = false
    private var lastCueText: String?
    private var lastCueAt: Date?
    private weak var boundCamera: CameraSessionModel?

    init() {
        isEnabled = AppConfig.liveCoachEnabled
    }

    func start(
        camera: CameraSessionModel,
        auth: AuthViewModel,
        appState: AppState
    ) async {
        guard isEnabled else { return }
        guard !CameraSessionModel.isSimulator else { return }
        guard NetworkMonitor.shared.isOnline else {
            statusMessage = "Offline — rule-of-thirds grid only."
            return
        }

        boundCamera = camera
        persona = auth.persona == "working_pro" ? "working_pro" : "hobbyist"
        assignmentBrief = appState.activeAssignment?.brief
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId

        do {
            let session = try await service.createSession(
                persona: persona,
                assignmentId: appState.effectiveAssignmentIdForShoot()
            )
            sessionId = session.sessionId
            isSessionActive = true
            statusMessage = "Live coach on — pinch to zoom, listen for cues."
            camera.enableFrameSampling(interval: 3.5) { [weak self] data in
                Task { @MainActor in
                    await self?.submitFrame(data)
                }
            }
        } catch {
            statusMessage = "Coach unavailable — grid only."
            isSessionActive = false
        }
    }

    func stop(camera: CameraSessionModel) async {
        camera.disableFrameSampling()
        speaker.stop()
        if let sessionId {
            try? await service.endSession(sessionId: sessionId)
        }
        self.sessionId = nil
        isSessionActive = false
        isFetching = false
        inFlight = false
        boundCamera = nil
    }

    func pause() {
        boundCamera?.disableFrameSampling()
    }

    func resume(camera: CameraSessionModel) {
        guard isEnabled, isSessionActive, let sessionId else { return }
        camera.enableFrameSampling(interval: 3.5) { [weak self] data in
            Task { @MainActor in
                await self?.submitFrame(data)
            }
        }
        _ = sessionId
    }

    func askIrisNow() async {
        guard let camera = boundCamera, isSessionActive else { return }
        guard let data = await camera.captureSampleFrameNow() else { return }
        await submitFrame(data, force: true)
    }

    private func submitFrame(_ data: Data, force: Bool = false) async {
        guard let sessionId, isEnabled, isSessionActive else { return }
        guard !inFlight || force else { return }
        inFlight = true
        isFetching = true
        defer {
            inFlight = false
            isFetching = false
        }

        APIClient.shared.userId = APIClient.shared.userId
        do {
            let cue = try await service.submitFrame(
                sessionId: sessionId,
                imageData: data,
                persona: persona,
                assignmentBrief: assignmentBrief
            )
            applyCue(cue)
        } catch let error as APIClientError {
            if case let .httpStatus(code, body) = error, code == 429 {
                statusMessage = body.isEmpty ? "Coach pacing — hold steady." : nil
            }
        } catch {
            statusMessage = "Coach paused — grid still on."
        }
    }

    private func applyCue(_ cue: FieldCaptureCueResponse) {
        let text = cue.onScreenHint.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        if let lastCueText, lastCueText == text,
           let lastCueAt, Date().timeIntervalSince(lastCueAt) < 30 {
            return
        }

        lastCueText = text
        lastCueAt = Date()
        hint = text
        statusMessage = nil
        speaker.speak(cue.spokenCue)
    }
}
