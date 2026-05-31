import SwiftUI

struct SpatialBoundingBox: Codable {
    let x: Double
    let y: Double
    let w: Double
    let h: Double
}

struct SpatialAnnotationItem: Codable {
    let bbox: SpatialBoundingBox
    let severity: String?
    let note: String?
}

struct SpatialMetadata: Codable {
    let annotations: [SpatialAnnotationItem]?

    enum CodingKeys: String, CodingKey {
        case annotations
    }
}

/// Issue-region overlays on critique preview (C2 — matches web SpatialOverlay).
struct SpatialAnnotationOverlay: View {
    let annotations: [SpatialAnnotationItem]
    var showAll = true

    var body: some View {
        GeometryReader { geo in
            ForEach(Array(annotations.enumerated()), id: \.offset) { _, item in
                let box = item.bbox
                let rect = CGRect(
                    x: box.x * geo.size.width,
                    y: box.y * geo.size.height,
                    width: box.w * geo.size.width,
                    height: box.h * geo.size.height
                )
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .stroke(severityColor(item.severity), lineWidth: 2)
                    .background(severityColor(item.severity).opacity(0.12))
                    .frame(width: rect.width, height: rect.height)
                    .position(x: rect.midX, y: rect.midY)
            }
        }
    }

    private func severityColor(_ severity: String?) -> Color {
        switch severity?.lowercased() {
        case "critical": return Color.irisRose
        case "moderate": return Color.orange
        default: return Color.irisBrandLight
        }
    }
}
