import SwiftUI

@main
struct IrisApp: App {
    @StateObject private var auth = AuthViewModel()
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(auth)
                .environmentObject(appState)
                .task {
                    await appState.checkAPIHealth(auth: auth)
                }
        }
    }
}
