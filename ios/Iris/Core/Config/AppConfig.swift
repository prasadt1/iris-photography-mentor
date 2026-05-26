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
}
