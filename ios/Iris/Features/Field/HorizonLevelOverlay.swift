import CoreMotion
import SwiftUI

/// Device-tilt horizon guide for Field viewfinder (C5 MVP — complements server JSON coach hints).
///
/// Deliberately subtle: a short centered segment with reduced travel, thin low-opacity
/// stroke, and no text pill — so it reads as a quiet reference, not a distraction during
/// demo recordings. When the frame is level it shows a faint green tick; off-level it shows
/// a faint dashed line that tilts slightly.
struct HorizonLevelOverlay: View {
    @StateObject private var motion = HorizonMotionModel()

    /// Fraction of width the guide spans (centered).
    private let segmentFraction: CGFloat = 0.42
    /// Damped travel so the line nudges rather than swings across the frame.
    private let travelFactor: CGFloat = 0.14
    private let maxTravelFraction: CGFloat = 0.32

    var body: some View {
        GeometryReader { geo in
            let segWidth = geo.size.width * segmentFraction
            let x0 = (geo.size.width - segWidth) / 2
            let rawOffset = CGFloat(motion.rollOffset) * travelFactor
            let clamped = max(-maxTravelFraction, min(maxTravelFraction, rawOffset))
            let centerY = geo.size.height / 2 + (motion.isLevel ? 0 : clamped * geo.size.height)

            Path { path in
                path.move(to: CGPoint(x: x0, y: centerY))
                path.addLine(to: CGPoint(x: x0 + segWidth, y: centerY))
            }
            .stroke(
                motion.isLevel ? Color.green.opacity(0.5) : Color.white.opacity(0.4),
                style: StrokeStyle(
                    lineWidth: 1,
                    lineCap: .round,
                    dash: motion.isLevel ? [] : [4, 5]
                )
            )
            .animation(.easeOut(duration: 0.12), value: motion.isLevel)
        }
        .allowsHitTesting(false)
        .onAppear { motion.start() }
        .onDisappear { motion.stop() }
    }
}

@MainActor
final class HorizonMotionModel: ObservableObject {
    @Published var rollOffset: Double = 0
    @Published var isLevel = true

    private let manager = CMMotionManager()

    func start() {
        guard manager.isDeviceMotionAvailable else { return }
        manager.deviceMotionUpdateInterval = 1 / 30
        manager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let self, let motion else { return }
            let roll = motion.attitude.roll
            self.rollOffset = roll
            // ~3° tolerance (was ~2°) so the guide settles to "level" instead of
            // flickering and nagging while the user steadies the frame.
            self.isLevel = abs(roll) < 0.052
        }
    }

    func stop() {
        manager.stopDeviceMotionUpdates()
    }
}
