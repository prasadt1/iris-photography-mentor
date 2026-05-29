import AVFoundation
import UIKit

enum CameraSessionError: LocalizedError {
    case unavailable
    case permissionDenied
    case captureFailed

    var errorDescription: String? {
        switch self {
        case .unavailable: return "Camera not available on this device."
        case .permissionDenied: return "Camera permission denied. Use “Choose photo” instead."
        case .captureFailed: return "Could not capture photo."
        }
    }
}

private final class FrameGate: @unchecked Sendable {
    var handler: (@Sendable (Data) -> Void)?
    var interval: TimeInterval = 3.5
    var lastSampleTime: TimeInterval = 0
    var pendingOneShot: ((Data?) -> Void)?
}

/// AVFoundation session for rear-camera preview + still capture + live-coach frame sampling.
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
    private let videoOutput = AVCaptureVideoDataOutput()
    private let sessionQueue = DispatchQueue(label: "iris.camera.session")
    private let frameGate = FrameGate()
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
        disableFrameSampling()
        guard isRunning else { return }
        sessionQueue.async { [weak self] in
            self?.session.stopRunning()
            Task { @MainActor in
                self?.isRunning = false
            }
        }
    }

    func enableFrameSampling(interval: TimeInterval = 3.5, handler: @escaping @Sendable (Data) -> Void) {
        sessionQueue.async { [frameGate] in
            frameGate.handler = handler
            frameGate.interval = interval
            frameGate.lastSampleTime = 0
        }
    }

    func disableFrameSampling() {
        sessionQueue.async { [frameGate] in
            frameGate.handler = nil
            frameGate.pendingOneShot = nil
        }
    }

    func captureSampleFrameNow() async -> Data? {
        await withCheckedContinuation { continuation in
            sessionQueue.async { [frameGate] in
                frameGate.pendingOneShot = { data in
                    continuation.resume(returning: data)
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

    func resetZoom() {
        setZoomFactor(minZoomFactor, animated: true)
    }

    func captureJPEG() async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            sessionQueue.async { [weak self] in
                guard let self else {
                    continuation.resume(throwing: CameraSessionError.captureFailed)
                    return
                }
                Task { @MainActor in
                    self.captureContinuation = continuation
                }
                let settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
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

                guard self.session.canAddOutput(self.photoOutput) else { return }
                self.session.addOutput(self.photoOutput)

                self.videoOutput.alwaysDiscardsLateVideoFrames = true
                self.videoOutput.videoSettings = [
                    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
                ]
                self.videoOutput.setSampleBufferDelegate(self, queue: self.sessionQueue)
                if self.session.canAddOutput(self.videoOutput) {
                    self.session.addOutput(self.videoOutput)
                }
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

extension CameraSessionModel: AVCaptureVideoDataOutputSampleBufferDelegate {
    nonisolated func captureOutput(
        _ output: AVCaptureOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        guard let jpeg = CameraFrameEncoder.jpeg(from: sampleBuffer) else { return }
        sessionQueue.async { [weak self] in
            guard let self else { return }
            let gate = self.frameGate

            if let oneShot = gate.pendingOneShot {
                gate.pendingOneShot = nil
                oneShot(jpeg)
                return
            }

            guard let handler = gate.handler else { return }
            let now = CACurrentMediaTime()
            if now - gate.lastSampleTime < gate.interval { return }
            gate.lastSampleTime = now
            Task { @MainActor in
                handler(jpeg)
            }
        }
    }
}
