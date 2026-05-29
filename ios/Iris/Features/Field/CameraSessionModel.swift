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

/// AVFoundation session for rear-camera preview + still capture + live-coach snapshots.
@MainActor
final class CameraSessionModel: NSObject, ObservableObject {
    @Published private(set) var isConfigured = false
    @Published private(set) var isRunning = false
    @Published private(set) var permissionDenied = false
    @Published private(set) var zoomFactor: CGFloat = 1
    @Published private(set) var minZoomFactor: CGFloat = 1
    @Published private(set) var maxZoomFactor: CGFloat = 1
    @Published var errorMessage: String?

    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let sessionQueue = DispatchQueue(label: "iris.camera.session")
    private var captureDevice: AVCaptureDevice?
    private var captureContinuation: CheckedContinuation<Data, Error>?

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
            self?.session.startRunning()
            Task { @MainActor in
                self?.isRunning = true
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

    /// Tap-to-focus / exposure at a point in the preview layer's view coordinates.
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

    /// Still capture for shutter + live coach (photo output only — no video pipeline).
    func captureJPEG() async throws -> Data {
        try await capturePhoto(fast: false)
    }

    /// Lower-latency still for periodic coach sampling.
    func captureCoachSnapshot() async throws -> Data {
        try await capturePhoto(fast: true)
    }

    private func capturePhoto(fast: Bool) async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            sessionQueue.async { [weak self] in
                guard let self else {
                    continuation.resume(throwing: CameraSessionError.captureFailed)
                    return
                }
                Task { @MainActor in
                    if self.captureContinuation != nil {
                        continuation.resume(throwing: CameraSessionError.captureInProgress)
                        return
                    }
                    self.captureContinuation = continuation
                }
                let settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
                if fast {
                    settings.photoQualityPrioritization = .speed
                }
                self.photoOutput.capturePhoto(with: settings, delegate: self)
            }
        }
    }

    private func configureSession() async {
        await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
            sessionQueue.async { [weak self] in
                guard let self else {
                    done.resume()
                    return
                }
                self.session.beginConfiguration()
                self.session.sessionPreset = .photo

                defer {
                    self.session.commitConfiguration()
                    Task { @MainActor in
                        self.isConfigured = self.session.inputs.isEmpty == false
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
        Task { @MainActor in
            defer { captureContinuation = nil }
            guard let continuation = captureContinuation else { return }
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
