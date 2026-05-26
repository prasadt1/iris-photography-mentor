import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var bannerMessage: String?
    @Published var activeAssignment: Assignment?

    private let practice = PracticeService()

    func checkAPIHealth(auth: AuthViewModel) async {
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            let health = try await practice.checkHealth()
            let phase = health.phase ?? "?"
            bannerMessage = "API OK · phase \(phase)"
            try await refreshActiveAssignment()
        } catch {
            bannerMessage = "API unreachable: \(error.localizedDescription)"
        }
        Task {
            try? await Task.sleep(nanoseconds: 4_000_000_000)
            if bannerMessage?.hasPrefix("API OK") == true {
                bannerMessage = nil
            }
        }
    }

    func refreshActiveAssignment() async throws {
        activeAssignment = try await practice.fetchActiveAssignment()
    }
}
