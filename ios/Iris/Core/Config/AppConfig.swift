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

    static let webAppURL = URL(string: "https://iris-photo-mentor.web.app")!
    static let webWorkURL = URL(string: "https://iris-photo-mentor.web.app#work")!
    static let webPrintURL = URL(string: "https://iris-photo-mentor.web.app#print")!
    static let webMentorURL = URL(string: "https://iris-photo-mentor.web.app#mentor")!

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

    private static let liveCoachEnabledKey = "iris.liveCoachEnabled"
    private static let liveCoachVoiceKey = "iris.liveCoachVoice"
    private static let horizonLevelKey = "iris.horizonLevelEnabled"

    static var liveCoachEnabled: Bool {
        get {
            if UserDefaults.standard.object(forKey: liveCoachEnabledKey) == nil { return true }
            return UserDefaults.standard.bool(forKey: liveCoachEnabledKey)
        }
        set { UserDefaults.standard.set(newValue, forKey: liveCoachEnabledKey) }
    }

    static var liveCoachVoiceEnabled: Bool {
        get {
            // Off by default — voice + screen recording + live camera fight over the audio
            // server on device. On-screen hints are reliable; enable voice in Settings.
            if UserDefaults.standard.object(forKey: liveCoachVoiceKey) == nil { return false }
            return UserDefaults.standard.bool(forKey: liveCoachVoiceKey)
        }
        set { UserDefaults.standard.set(newValue, forKey: liveCoachVoiceKey) }
    }

    /// Viewfinder horizon-level guide. Off by default keeps demo recordings clean.
    static var horizonLevelEnabled: Bool {
        get {
            if UserDefaults.standard.object(forKey: horizonLevelKey) == nil { return false }
            return UserDefaults.standard.bool(forKey: horizonLevelKey)
        }
        set { UserDefaults.standard.set(newValue, forKey: horizonLevelKey) }
    }

    /// AVSpeechUtterance rate (0.0–1.0). Slightly faster for field coaching.
    static let liveCoachSpeechRate: Float = 0.54
}
