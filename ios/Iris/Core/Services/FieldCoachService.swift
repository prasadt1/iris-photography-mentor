import Foundation

final class FieldCoachService {
    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func createSession(
        persona: String,
        assignmentId: String? = nil,
        locationDescription: String = ""
    ) async throws -> CaptureSessionResponse {
        try await client.postJSON(
            CaptureSessionResponse.self,
            path: "/api/v1/capture_sessions",
            body: CaptureSessionCreateBody(
                locationDescription: locationDescription,
                assignmentId: assignmentId,
                persona: persona
            ),
            timeout: 30
        )
    }

    func endSession(sessionId: String) async throws {
        let (data, _) = try await client.request(
            path: "/api/v1/capture_sessions/\(sessionId)/end",
            method: "POST"
        )
        _ = try JSONDecoder().decode(CaptureSessionEndResponse.self, from: data)
    }

    func submitFrame(
        sessionId: String,
        imageData: Data,
        persona: String,
        assignmentBrief: String? = nil
    ) async throws -> FieldCaptureCueResponse {
        var fields: [String: String] = [
            "sessionId": sessionId,
            "persona": persona,
        ]
        if let assignmentBrief, !assignmentBrief.isEmpty {
            fields["assignmentBrief"] = assignmentBrief
        }
        let jpeg = ImageUploadPrep.jpegForUpload(from: imageData, maxEdge: 640, quality: 0.55)
        return try await client.postMultipart(
            FieldCaptureCueResponse.self,
            path: "/api/v1/agent/field_capture",
            fileField: "image",
            fileData: jpeg,
            filename: "field-frame.jpg",
            mimeType: "image/jpeg",
            fields: fields,
            timeout: 45
        )
    }
}

private struct CaptureSessionEndResponse: Decodable {
    let sessionId: String
}
