import SwiftUI

/// Phase 0: assignment gate + brief. Phase 1 adds AVFoundation capture → analyze-photo.
struct FieldView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let assignment = appState.activeAssignment {
                        activeBrief(assignment)
                        cameraPlaceholder
                    } else {
                        noAssignment
                    }
                }
                .padding()
            }
            .background(Color.irisCanvas)
            .navigationTitle("Shoot Now")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                try? await appState.refreshActiveAssignment()
            }
        }
    }

    private func activeBrief(_ assignment: Assignment) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Active brief")
                .font(.caption.weight(.bold))
                .foregroundStyle(Color.irisBrandLight)
                .textCase(.uppercase)
            Text(assignment.brief)
                .font(.body)
                .foregroundStyle(Color.irisTextPrimary)
            Text("Focus: \(assignment.targetSkill.replacingOccurrences(of: "_", with: " "))")
                .font(.caption)
                .foregroundStyle(Color.irisTextMuted)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.irisSurface1)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var cameraPlaceholder: some View {
        VStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.irisPhotoBlack)
                .aspectRatio(4 / 3, contentMode: .fit)
                .overlay {
                    VStack(spacing: 12) {
                        Image(systemName: "camera.viewfinder")
                            .font(.system(size: 48))
                            .foregroundStyle(Color.irisBrandLight)
                        Text("Camera capture — Phase 1")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.irisTextPrimary)
                        Text("Live Field Coach — Phase 3")
                            .font(.caption)
                            .foregroundStyle(Color.irisTextMuted)
                    }
                }
                .overlay {
                    thirdsGrid
                }

            Text("Next: AVFoundation preview, shutter, and POST /api/v1/analyze-photo with assignment_id (same as web Field).")
                .font(.caption)
                .foregroundStyle(Color.irisTextMuted)
        }
    }

    private var thirdsGrid: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            Path { p in
                p.move(to: CGPoint(x: w / 3, y: 0))
                p.addLine(to: CGPoint(x: w / 3, y: h))
                p.move(to: CGPoint(x: 2 * w / 3, y: 0))
                p.addLine(to: CGPoint(x: 2 * w / 3, y: h))
                p.move(to: CGPoint(x: 0, y: h / 3))
                p.addLine(to: CGPoint(x: w, y: h / 3))
                p.move(to: CGPoint(x: 0, y: 2 * h / 3))
                p.addLine(to: CGPoint(x: w, y: 2 * h / 3))
            }
            .stroke(Color.white.opacity(0.25), lineWidth: 1)
        }
        .allowsHitTesting(false)
    }

    private var noAssignment: some View {
        VStack(spacing: 12) {
            Image(systemName: "target")
                .font(.largeTitle)
                .foregroundStyle(Color.irisTextMuted)
            Text("Accept a practice assignment first")
                .font(.headline)
                .foregroundStyle(Color.irisTextPrimary)
            Text("Open Practice, accept a challenge, then return here to shoot.")
                .font(.subheadline)
                .foregroundStyle(Color.irisTextMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }
}
