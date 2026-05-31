import CoreMotion
import SwiftUI

/// Device-tilt horizon guide for Field viewfinder (C5 MVP — complements server JSON coach hints).
struct HorizonLevelOverlay: View {
    @StateObject private var motion = HorizonMotionModel()

    var body: some View {
        GeometryReader { geo in
            let centerY = geo.size.height / 2 + CGFloat(motion.rollOffset * geo.size.height * 0.35)
            ZStack {
                Path { path in
                    path.move(to: CGPoint(x: 0, y: centerY))
                    path.addLine(to: CGPoint(x: geo.size.width, y: centerY))
                }
                .stroke(
                    motion.isLevel ? Color.green.opacity(0.85) : Color.irisBrandLight.opacity(0.75),
                    style: StrokeStyle(lineWidth: 1.5, dash: motion.isLevel ? [] : [6, 4])
                )

                if !motion.isLevel {
                    Text("Level horizon")
                        .font(IrisFont.sans(10, weight: .semibold))
                        .foregroundStyle(Color.irisBrandLight.opacity(0.9))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.black.opacity(0.45))
                        .clipShape(Capsule())
                        .position(x: geo.size.width / 2, y: max(24, centerY - 18))
                }
            }
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
            self.isLevel = abs(roll) < 0.035
        }
    }

    func stop() {
        manager.stopDeviceMotionUpdates()
    }
}
