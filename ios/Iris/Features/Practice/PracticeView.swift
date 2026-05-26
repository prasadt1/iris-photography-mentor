import SwiftUI

struct PracticeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthViewModel

    @State private var assignments: AssignmentsResponse?
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var acting = false

    private let practice = PracticeService()

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView("Loading assignments…")
                } else if let errorMessage {
                    ContentUnavailableView("Could not load", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                } else if let assignments {
                    list(assignments)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.irisCanvas)
            .navigationTitle("Practice")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    @ViewBuilder
    private func list(_ data: AssignmentsResponse) -> some View {
        List {
            if let active = data.active.first {
                Section("Active") {
                    assignmentRow(active)
                    Button {
                        Task { await complete(active.id) }
                    } label: {
                        Label("Mark complete", systemImage: "checkmark.circle")
                    }
                    .disabled(acting)
                }
            }

            if !data.proposed.isEmpty {
                Section("Proposed") {
                    ForEach(data.proposed) { item in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(item.brief)
                                .font(.subheadline)
                            Button("Accept") {
                                Task { await accept(item.id) }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(Color.irisBrand)
                            .disabled(acting)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }

            if data.proposed.isEmpty && data.active.isEmpty {
                Section {
                    Text("No active assignment. Propose one from the web app for now — iOS propose UI in Phase 1.")
                        .font(.caption)
                        .foregroundStyle(Color.irisTextMuted)
                }
            }
        }
        .scrollContentBackground(.hidden)
    }

    private func assignmentRow(_ a: Assignment) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(a.brief)
                .font(.body)
            Text(a.targetSkill.replacingOccurrences(of: "_", with: " "))
                .font(.caption)
                .foregroundStyle(Color.irisTextMuted)
        }
    }

    private func load() async {
        loading = true
        errorMessage = nil
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            assignments = try await practice.fetchAssignments()
            try await appState.refreshActiveAssignment()
        } catch {
            errorMessage = error.localizedDescription
        }
        loading = false
    }

    private func accept(_ id: String) async {
        acting = true
        defer { acting = false }
        do {
            _ = try await practice.acceptAssignment(id: id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func complete(_ id: String) async {
        acting = true
        defer { acting = false }
        do {
            try await practice.completeAssignment(id: id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
