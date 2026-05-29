import Foundation

enum AppConfig {
    /// Cloud Run Coach API base URL (no trailing slash). Set via `API_BASE_URL` in xcconfig → Info.plist.
    static var apiBaseURL: URL {
        if let raw = Bundle.main.object(forInfoDictionaryKey: "APIBaseURL") as? String,
           let url = URL(string: raw.trimmingCharacters(in: .whitespacesAndNewlines)),
           !raw.isEmpty {
            return url
        }
        return URL(string: "https://practice-companion-api-l6kusl5xcq-uc.a.run.app")!
    }

    static let demoUserIdKey = "iris.demoUserId"
    static let mentorSessionIdKey = "iris.mentorSessionId"
    static let mentorMessagesKey = "iris.mentorMessages"
    private static let onboardingCompleteKeyPrefix = "iris.onboardingComplete"

    static let webAppURL = URL(string: "https://practice-companion-hackathon.web.app")!
    static let webWorkURL = URL(string: "https://practice-companion-hackathon.web.app#work")!
    static let webPrintURL = URL(string: "https://practice-companion-hackathon.web.app#print")!
    static let webMentorURL = URL(string: "https://practice-companion-hackathon.web.app#mentor")!

    static func isOnboardingComplete(userId: String) -> Bool {
        UserDefaults.standard.bool(forKey: onboardingKey(userId: userId))
    }

    static func markOnboardingComplete(userId: String) {
        UserDefaults.standard.set(true, forKey: onboardingKey(userId: userId))
    }

    private static func onboardingKey(userId: String) -> String {
        let scope = userId.isEmpty ? "demo" : userId
        return "\(onboardingCompleteKeyPrefix).\(scope)"
    }
}
