import AVFoundation
import UIKit

enum CameraSessionError: LocalizedError {
    case unavailable
    case permissionDenied
    case captureFailed
    case captureInProgress

    var errorDescription: String? {
        switch self {
        case .unavailable: return "Camera not available on this device."
        case .permissionDenied: return "Camera permission denied. Use “Choose photo” instead."
        case .captureFailed: return "Could not capture photo."
        case .captureInProgress: return "Camera busy — try again in a moment."
        }
    }
}

private final class PhotoCaptureGate: @unchecked Sendable {
    var continuation: CheckedContinuation<Data, Error>?
}

/// AVFoundation session for rear-camera preview + still capture.
///
/// Live coach samples frames via fast still captures (photo output only). A separate
/// `AVCaptureVideoDataOutput` was removed — running photo + video outputs together
/// triggers FigCaptureSourceRemote -17281 on device, especially during screen recording,
/// and frame delivery silently stops.
@MainActor
final class CameraSessionModel: NSObject, ObservableObject {
    @Published private(set) var isConfigured = false
    @Published private(set) var isRunning = false
    @Published private(set) var wasInterrupted = false
    @Published private(set) var recoveryGeneration = 0
    @Published private(set) var permissionDenied = false
    @Published private(set) var zoomFactor: CGFloat = 1
    @Published private(set) var minZoomFactor: CGFloat = 1
    @Published private(set) var maxZoomFactor: CGFloat = 1
    @Published var errorMessage: String?

    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let sessionQueue = DispatchQueue(label: "iris.camera.session")
    private let photoGate = PhotoCaptureGate()
    private var captureDevice: AVCaptureDevice?
    private var observersRegistered = false
    private var isRecovering = false

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    static var isSimulator: Bool {
        #if targetEnvironment(simulator)
        true
        #else
        false
        #endif
    }

    var zoomLabel: String {
        String(format: "%.1f×", zoomFactor)
    }

    func prepare() async {
        guard !Self.isSimulator else { return }

        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            break
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            if !granted {
                permissionDenied = true
                return
            }
        default:
            permissionDenied = true
            return
        }

        await configureSession()
    }

    func start() {
        guard isConfigured, !isRunning else { return }
        sessionQueue.async { [weak self] in
            FieldAudioSession.prepareForFieldCapture()
            self?.session.startRunning()
            Task { @MainActor in
                self?.isRunning = self?.session.isRunning ?? false
            }
        }
    }

    func stop() {
        guard isRunning else { return }
        sessionQueue.async { [weak self] in
            self?.session.stopRunning()
            Task { @MainActor in
                self?.isRunning = false
            }
        }
    }

    /// Fast still for live coach (photo output only — reliable on device + screen recording).
    func captureCoachFrame() async throws -> Data {
        try await capturePhoto(fast: true)
    }

    /// Best-effort restart when coach ticks fail to get a frame.
    func ensureRunning() async {
        await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
            sessionQueue.async { [weak self] in
                guard let self else {
                    done.resume()
                    return
                }
                if !self.session.isRunning {
                    FieldAudioSession.prepareForFieldCapture()
                    self.session.startRunning()
                }
                let running = self.session.isRunning
                Task { @MainActor in
                    self.isRunning = running
                    if running {
                        self.recoveryGeneration += 1
                    }
                    done.resume()
                }
            }
        }
    }

    func setZoomFactor(_ factor: CGFloat, animated: Bool = false) {
        guard isConfigured, let device = captureDevice else { return }
        let clamped = min(max(factor, minZoomFactor), maxZoomFactor)
        sessionQueue.async { [weak self] in
            do {
                try device.lockForConfiguration()
                defer { device.unlockForConfiguration() }
                if animated {
                    device.ramp(toVideoZoomFactor: clamped, withRate: 8)
                } else {
                    device.videoZoomFactor = clamped
                }
                let applied = device.videoZoomFactor
                Task { @MainActor in
                    self?.zoomFactor = applied
                }
            } catch {
                Task { @MainActor in
                    self?.errorMessage = "Could not adjust zoom."
                }
            }
        }
    }

    func stepZoom(by delta: CGFloat) {
        setZoomFactor(zoomFactor + delta)
    }

    func resetZoom() {
        setZoomFactor(minZoomFactor, animated: true)
    }

    func focus(at viewPoint: CGPoint, previewLayer: AVCaptureVideoPreviewLayer) {
        guard isConfigured, let device = captureDevice else { return }
        let devicePoint = previewLayer.captureDevicePointConverted(fromLayerPoint: viewPoint)

        sessionQueue.async { [weak self] in
            do {
                try device.lockForConfiguration()
                defer { device.unlockForConfiguration() }

                if device.isFocusPointOfInterestSupported {
                    device.focusPointOfInterest = devicePoint
                    if device.isFocusModeSupported(.autoFocus) {
                        device.focusMode = .autoFocus
                    }
                }
                if device.isExposurePointOfInterestSupported {
                    device.exposurePointOfInterest = devicePoint
                    if device.isExposureModeSupported(.continuousAutoExposure) {
                        device.exposureMode = .continuousAutoExposure
                    } else if device.isExposureModeSupported(.autoExpose) {
                        device.exposureMode = .autoExpose
                    }
                }
            } catch {
                Task { @MainActor in
                    self?.errorMessage = "Could not adjust focus."
                }
            }
        }
    }

    func captureJPEG() async throws -> Data {
        try await capturePhoto(fast: false)
    }

    private func capturePhoto(fast: Bool) async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            sessionQueue.async { [weak self] in
                guard let self else {
                    continuation.resume(throwing: CameraSessionError.captureFailed)
                    return
                }
                if self.photoGate.continuation != nil {
                    continuation.resume(throwing: CameraSessionError.captureInProgress)
                    return
                }
                self.photoGate.continuation = continuation
                let settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
                if fast {
                    settings.photoQualityPrioritization = .speed
                }
                if !self.photoOutput.supportedFlashModes.isEmpty {
                    settings.flashMode = .off
                }
                self.photoOutput.capturePhoto(with: settings, delegate: self)
            }
        }
    }

    private func registerSessionObservers() {
        guard !observersRegistered else { return }
        observersRegistered = true
        let nc = NotificationCenter.default
        nc.addObserver(
            self,
            selector: #selector(sessionRuntimeError(_:)),
            name: .AVCaptureSessionRuntimeError,
            object: session
        )
        nc.addObserver(
            self,
            selector: #selector(sessionWasInterrupted(_:)),
            name: .AVCaptureSessionWasInterrupted,
            object: session
        )
        nc.addObserver(
            self,
            selector: #selector(sessionInterruptionEnded(_:)),
            name: .AVCaptureSessionInterruptionEnded,
            object: session
        )
        nc.addObserver(
            self,
            selector: #selector(mediaServicesWereReset(_:)),
            name: AVAudioSession.mediaServicesWereResetNotification,
            object: nil
        )
    }

    @objc nonisolated private func mediaServicesWereReset(_ note: Notification) {
        restartAfterGlitch(forceStop: true)
    }

    @objc nonisolated private func sessionRuntimeError(_ note: Notification) {
        restartAfterGlitch(forceStop: true)
    }

    @objc nonisolated private func sessionWasInterrupted(_ note: Notification) {
        Task { @MainActor in
            self.wasInterrupted = true
            self.isRunning = false
        }
    }

    @objc nonisolated private func sessionInterruptionEnded(_ note: Notification) {
        restartAfterGlitch(forceStop: true)
    }

    nonisolated private func restartAfterGlitch(forceStop: Bool) {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            if self.isRecovering { return }
            self.isRecovering = true
            defer { self.isRecovering = false }

            if forceStop, self.session.isRunning {
                self.session.stopRunning()
            }

            DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + 0.5) {
                self.sessionQueue.async {
                    FieldAudioSession.prepareForFieldCapture()
                    if !self.session.isRunning {
                        self.session.startRunning()
                    }
                    self.publishRecovery(running: self.session.isRunning)
                }
            }
        }
    }

    nonisolated private func publishRecovery(running: Bool) {
        Task { @MainActor in
            self.wasInterrupted = false
            self.isRunning = running
            self.recoveryGeneration += 1
        }
    }

    private func configureSession() async {
        await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
            sessionQueue.async { [weak self] in
                guard let self else {
                    done.resume()
                    return
                }
                FieldAudioSession.prepareForFieldCapture()
                self.session.beginConfiguration()
                // Lighter than .photo — preview + periodic coach stills, less pipeline stress.
                if self.session.canSetSessionPreset(.high) {
                    self.session.sessionPreset = .high
                } else {
                    self.session.sessionPreset = .photo
                }
                self.session.automaticallyConfiguresApplicationAudioSession = false

                defer {
                    self.session.commitConfiguration()
                    Task { @MainActor in
                        self.isConfigured = self.session.inputs.isEmpty == false
                        self.registerSessionObservers()
                        if let device = self.captureDevice {
                            let minZ = device.minAvailableVideoZoomFactor
                            let maxZ = device.maxAvailableVideoZoomFactor
                            self.minZoomFactor = minZ
                            self.maxZoomFactor = max(minZ, min(maxZ, 5))
                            self.zoomFactor = device.videoZoomFactor
                        }
                        done.resume()
                    }
                }

                for input in self.session.inputs {
                    self.session.removeInput(input)
                }
                for output in self.session.outputs {
                    self.session.removeOutput(output)
                }

                guard
                    let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
                    let input = try? AVCaptureDeviceInput(device: device),
                    self.session.canAddInput(input)
                else {
                    Task { @MainActor in
                        self.errorMessage = CameraSessionError.unavailable.localizedDescription
                    }
                    return
                }
                self.captureDevice = device
                self.session.addInput(input)

                do {
                    try device.lockForConfiguration()
                    if device.isFocusModeSupported(.continuousAutoFocus) {
                        device.focusMode = .continuousAutoFocus
                    }
                    if device.isExposureModeSupported(.continuousAutoExposure) {
                        device.exposureMode = .continuousAutoExposure
                    }
                    device.unlockForConfiguration()
                } catch {
                    // Non-fatal — tap-to-focus may still work per-shot.
                }

                guard self.session.canAddOutput(self.photoOutput) else { return }
                self.session.addOutput(self.photoOutput)
                self.photoOutput.isHighResolutionCaptureEnabled = false
                self.photoOutput.maxPhotoQualityPrioritization = .speed
            }
        }
    }
}

extension CameraSessionModel: AVCapturePhotoCaptureDelegate {
    nonisolated func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            guard let continuation = self.photoGate.continuation else { return }
            self.photoGate.continuation = nil
            if let error {
                continuation.resume(throwing: error)
                return
            }
            guard let data = photo.fileDataRepresentation() else {
                continuation.resume(throwing: CameraSessionError.captureFailed)
                return
            }
            continuation.resume(returning: data)
        }
    }
}
