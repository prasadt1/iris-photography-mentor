import Foundation

@MainActor
final class LiveFieldCoachModel: ObservableObject {
    @Published var hint: String?
    @Published var isFetching = false
    @Published var isSessionActive = false
    @Published var statusMessage: String?
    @Published var isEnabled: Bool
    @Published var lastError: String?

    private let service = FieldCoachService()
    private let speaker = CueSpeaker()
    private var sessionId: String?
    private var assignmentBrief: String?
    private var persona = "hobbyist"
    private var inFlight = false
    private var isStarting = false
    private var lastCueText: String?
    private var lastCueAt: Date?
    private var lastSubmitAt: Date?
    private var submitGeneration = 0
    private var samplingTask: Task<Void, Never>?
    private weak var boundCamera: CameraSessionModel?

    /// Must exceed server MIN_FRAME_INTERVAL_SEC (3s) plus network latency.
    private let minSubmitInterval: TimeInterval = 4.5
    private let samplingInterval: TimeInterval = 8

    init() {
        isEnabled = AppConfig.liveCoachEnabled
    }

    func setEnabled(
        _ enabled: Bool,
        camera: CameraSessionModel,
        auth: AuthViewModel? = nil,
        appState: AppState? = nil
    ) {
        guard isEnabled != enabled else { return }
        isEnabled = enabled
        AppConfig.liveCoachEnabled = enabled
        submitGeneration += 1

        if enabled {
            statusMessage = "Live coach on"
            if isSessionActive {
                resume(camera: camera)
            } else if let auth, let appState {
                Task { await start(camera: camera, auth: auth, appState: appState) }
            }
        } else {
            speaker.stop()
            hint = nil
            isFetching = false
            inFlight = false
            pause()
            statusMessage = "Coach off — pinch and shoot still work."
        }
    }

    func start(
        camera: CameraSessionModel,
        auth: AuthViewModel,
        appState: AppState
    ) async {
        guard !isStarting else { return }
        if isSessionActive, sessionId != nil {
            resume(camera: camera)
            return
        }

        auth.ensureDemoUserId()
        boundCamera = camera
        persona = auth.persona == "working_pro" ? "working_pro" : "hobbyist"
        assignmentBrief = appState.activeAssignment?.brief
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId

        guard !CameraSessionModel.isSimulator else { return }

        if !NetworkMonitor.shared.isOnline {
            statusMessage = "Offline — rule-of-thirds grid only."
            lastError = statusMessage
            isSessionActive = false
            return
        }

        guard isEnabled else {
            statusMessage = "Coach off — toggle on below."
            isSessionActive = false
            return
        }

        isStarting = true
        defer { isStarting = false }

        do {
            let session = try await service.createSession(
                persona: persona,
                assignmentId: appState.effectiveAssignmentIdForShoot()
            )
            sessionId = session.sessionId
            isSessionActive = true
            lastSubmitAt = nil
            lastError = nil
            statusMessage = "Live coach on — first cue in ~10s."
            beginSampling(on: camera)
        } catch {
            let msg = error.localizedDescription
            statusMessage = "Coach unavailable — \(msg)"
            lastError = msg
            isSessionActive = false
        }
    }

    func stop(camera: CameraSessionModel) async {
        submitGeneration += 1
        inFlight = false
        isFetching = false
        samplingTask?.cancel()
        samplingTask = nil
        speaker.stop()
        if let sessionId {
            try? await service.endSession(sessionId: sessionId)
        }
        self.sessionId = nil
        isSessionActive = false
        isStarting = false
        boundCamera = nil
    }

    func pause() {
        submitGeneration += 1
        inFlight = false
        isFetching = false
        samplingTask?.cancel()
        samplingTask = nil
    }

    func resume(camera: CameraSessionModel) {
        guard isEnabled, isSessionActive, sessionId != nil else { return }
        beginSampling(on: camera)
    }

    func askIrisNow() async {
        guard isEnabled, isSessionActive, let camera = boundCamera else { return }
        guard !inFlight else {
            statusMessage = "Coach still thinking…"
            return
        }

        isFetching = true
        defer { if !inFlight { isFetching = false } }

        do {
            let data = try await camera.captureCoachSnapshot()
            await submitFrame(data, force: true)
        } catch {
            let msg = error.localizedDescription
            statusMessage = "Couldn’t capture frame — \(msg)"
            lastError = msg
        }
    }

    private func beginSampling(on camera: CameraSessionModel) {
        guard camera.isRunning else { return }
        boundCamera = camera
        samplingTask?.cancel()
        samplingTask = Task { [weak self] in
            // Initial delay so the viewfinder settles after open.
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            while !Task.isCancelled {
                guard let self else { return }
                if !self.isEnabled || !self.isSessionActive || self.inFlight {
                    try? await Task.sleep(nanoseconds: 1_000_000_000)
                    continue
                }
                if let lastSubmitAt = self.lastSubmitAt,
                   Date().timeIntervalSince(lastSubmitAt) < self.minSubmitInterval {
                    try? await Task.sleep(nanoseconds: 1_000_000_000)
                    continue
                }
                guard let camera = self.boundCamera else { return }
                do {
                    let data = try await camera.captureCoachSnapshot()
                    await self.handleSampledFrame(data)
                } catch {
                    await MainActor.run {
                        self.lastError = error.localizedDescription
                    }
                }
                try? await Task.sleep(nanoseconds: UInt64(self.samplingInterval * 1_000_000_000))
            }
        }
    }

    private func handleSampledFrame(_ data: Data) async {
        guard isEnabled, isSessionActive, !inFlight else { return }
        if let lastSubmitAt, Date().timeIntervalSince(lastSubmitAt) < minSubmitInterval {
            return
        }
        await submitFrame(data)
    }

    private func submitFrame(_ data: Data, force: Bool = false) async {
        guard let sessionId, isEnabled, isSessionActive else { return }
        guard !inFlight || force else { return }

        if !force, let lastSubmitAt, Date().timeIntervalSince(lastSubmitAt) < minSubmitInterval {
            return
        }

        inFlight = true
        isFetching = true
        let generation = submitGeneration

        defer {
            if generation == submitGeneration {
                inFlight = false
                isFetching = false
            }
        }

        do {
            let cue = try await service.submitFrame(
                sessionId: sessionId,
                imageData: data,
                persona: persona,
                assignmentBrief: assignmentBrief
            )
            guard generation == submitGeneration, isEnabled, isSessionActive else { return }
            lastSubmitAt = Date()
            lastError = nil
            applyCue(cue)
        } catch let error as APIClientError {
            guard generation == submitGeneration else { return }
            let msg = error.localizedDescription
            lastError = msg
            if case let .httpStatus(code, _) = error, code == 429 {
                statusMessage = "Coach pacing — hold steady."
                lastSubmitAt = Date()
            } else {
                statusMessage = msg
            }
        } catch {
            guard generation == submitGeneration else { return }
            let msg = error.localizedDescription
            statusMessage = msg
            lastError = msg
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
