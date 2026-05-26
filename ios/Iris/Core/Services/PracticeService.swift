import Foundation

final class PracticeService {
    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func fetchAssignments() async throws -> AssignmentsResponse {
        try await client.getJSON(AssignmentsResponse.self, path: "/api/v1/assignments")
    }

    func fetchActiveAssignment() async throws -> Assignment? {
        let res = try await client.getJSON(ActiveAssignmentResponse.self, path: "/api/v1/assignments/active")
        return res.active
    }

    func acceptAssignment(id: String) async throws -> Assignment {
        try await client.postJSON(Assignment.self, path: "/api/v1/assignments/\(id)/accept")
    }

    func completeAssignment(id: String) async throws {
        _ = try await client.postJSON(CompleteAssignmentResponse.self, path: "/api/v1/assignments/\(id)/complete")
    }

    func checkHealth() async throws -> HealthResponse {
        try await client.getJSON(HealthResponse.self, path: "/health")
    }
}
