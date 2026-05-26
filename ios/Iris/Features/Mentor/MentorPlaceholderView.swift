import SwiftUI

struct MentorPlaceholderView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Mentor",
                systemImage: "bubble.left.and.text.bubble.right",
                description: Text("Chat UI in Phase 1. Uses POST /api/v1/agent/chat — same as web.")
            )
            .background(Color.irisCanvas)
            .navigationTitle("Mentor")
        }
    }
}
