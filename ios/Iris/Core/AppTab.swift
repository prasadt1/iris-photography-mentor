import Foundation

enum AppTab: Int, Hashable, CaseIterable {
    case home = 0
    case practice = 1
    case mentor = 2
    /// Working pro only — deep links to web My Work, triage, and print sales (matches web sidebar).
    case studio = 3
    case settings = 4
}
