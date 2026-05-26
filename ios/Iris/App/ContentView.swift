import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @EnvironmentObject private var appState: AppState

    var body: some View {
        TabView {
            FieldView()
                .tabItem {
                    Label("Field", systemImage: "camera.viewfinder")
                }

            PracticeView()
                .tabItem {
                    Label("Practice", systemImage: "target")
                }

            MentorPlaceholderView()
                .tabItem {
                    Label("Mentor", systemImage: "bubble.left.and.text.bubble.right")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
        .tint(Color.irisBrand)
        .overlay(alignment: .top) {
            if let banner = appState.bannerMessage {
                APIBanner(message: banner)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.25), value: appState.bannerMessage)
    }
}

private struct APIBanner: View {
    let message: String

    var body: some View {
        Text(message)
            .font(.caption)
            .foregroundStyle(Color.irisTextPrimary)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(message.contains("OK") ? Color.green.opacity(0.2) : Color.orange.opacity(0.25))
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthViewModel())
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
