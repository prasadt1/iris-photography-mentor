import Foundation

/// Phase 0: manual / stored user id for `X-User-Id`. Firebase Google Sign-In lands in Phase 0.5.
@MainActor
final class AuthViewModel: ObservableObject {
    @Published var userId: String {
        didSet {
            APIClient.shared.userId = userId.isEmpty ? nil : userId
            UserDefaults.standard.set(userId, forKey: AppConfig.demoUserIdKey)
        }
    }

    @Published var isDemoMode: Bool = true

    init() {
        let stored = UserDefaults.standard.string(forKey: AppConfig.demoUserIdKey) ?? ""
        userId = stored
        APIClient.shared.userId = stored.isEmpty ? nil : stored
    }

    func applyDemoScope() {
        isDemoMode = true
        // Empty header → API uses DEMO_USER_ID on server when configured
        userId = ""
    }

    func applyFirebaseUserId(_ uid: String) {
        isDemoMode = false
        userId = uid
    }
}
