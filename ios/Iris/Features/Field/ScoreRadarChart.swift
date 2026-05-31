import SwiftUI

/// Five-axis score radar — Studio parity with web overview (C2).
struct ScoreRadarChart: View {
    let scores: AnalysisScores

    private let labels = ["Comp", "Light", "Tech", "Creat", "Subject"]
    private var values: [Double] {
        [
            scores.composition,
            scores.lighting,
            scores.technique,
            scores.creativity,
            scores.subjectImpact,
        ]
    }

    var body: some View {
        GeometryReader { geo in
            let center = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2)
            let radius = min(geo.size.width, geo.size.height) * 0.38
            ZStack {
                ForEach(1...5, id: \.self) { ring in
                    radarPolygon(center: center, radius: radius * Double(ring) / 5, values: Array(repeating: 1, count: 5))
                        .stroke(Color.irisWarmBorder.opacity(0.5), lineWidth: 0.5)
                }
                radarPolygon(center: center, radius: radius, values: values.map { $0 / 10 })
                    .fill(Color.irisBrand.opacity(0.2))
                radarPolygon(center: center, radius: radius, values: values.map { $0 / 10 })
                    .stroke(Color.irisBrandLight, lineWidth: 1.5)

                ForEach(Array(labels.enumerated()), id: \.offset) { index, label in
                    let angle = angleFor(index: index)
                    let point = pointOnCircle(center: center, radius: radius + 16, angle: angle)
                    Text(label)
                        .font(IrisFont.sans(9, weight: .medium))
                        .foregroundStyle(Color.irisTextMuted)
                        .position(point)
                }
            }
        }
        .frame(height: 180)
    }

    private func angleFor(index: Int) -> Double {
        -.pi / 2 + (2 * .pi / 5) * Double(index)
    }

    private func pointOnCircle(center: CGPoint, radius: Double, angle: Double) -> CGPoint {
        CGPoint(
            x: center.x + CGFloat(cos(angle) * radius),
            y: center.y + CGFloat(sin(angle) * radius)
        )
    }

    private func radarPolygon(center: CGPoint, radius: Double, values: [Double]) -> Path {
        Path { path in
            for (index, value) in values.enumerated() {
                let angle = angleFor(index: index)
                let r = radius * max(0, min(1, value))
                let point = CGPoint(
                    x: center.x + CGFloat(cos(angle) * r),
                    y: center.y + CGFloat(sin(angle) * r)
                )
                if index == 0 { path.move(to: point) } else { path.addLine(to: point) }
            }
            path.closeSubpath()
        }
    }
}
