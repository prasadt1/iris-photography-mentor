import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthViewModel

    var body: some View {
        NavigationStack {
            Form {
                Section("API") {
                    LabeledContent("Base URL", value: AppConfig.apiBaseURL.absoluteString)
                        .font(.caption)
                }

                Section("Identity (Phase 0)") {
                    Text("Paste your Firebase uid from web Settings after Google sign-in. Leave empty to use server demo user.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("X-User-Id (Firebase uid)", text: $auth.userId)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Button("Use demo scope (no header)") {
                        auth.applyDemoScope()
                    }
                }

                Section("Firebase") {
                    Text("Add GoogleService-Info.plist and FirebaseAuth SDK in Phase 0.5.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Section("About") {
                    LabeledContent("App", value: "Iris")
                    LabeledContent("Bundle", value: "com.prasadtilloo.practicecompanion")
                    LabeledContent("Phase", value: "0 — shell + API")
                }
            }
            .navigationTitle("Settings")
        }
    }
}
