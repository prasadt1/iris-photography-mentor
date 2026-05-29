import Foundation

struct CaptureSessionResponse: Decodable {
    let sessionId: String
    let persona: String
}

struct FieldCaptureCueResponse: Decodable {
    let sessionId: String
    let spokenCue: String
    let onScreenHint: String
    let confidence: Double
    let persona: String?
}

struct CaptureSessionCreateBody: Encodable {
    let locationDescription: String
    let assignmentId: String?
    let persona: String
    let userId: String?

    enum CodingKeys: String, CodingKey {
        case locationDescription
        case assignmentId
        case persona
        case userId
    }
}
