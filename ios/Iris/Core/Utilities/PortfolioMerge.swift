import Foundation

enum PortfolioMerge {
    /// Newest first; pending optimistic item wins when ids match.
    static func recentEntries(
        fetched: [PortfolioListItem],
        pending: PortfolioListItem?
    ) -> [PortfolioListItem] {
        guard let pending else { return fetched }
        var merged = [pending]
        for entry in fetched where entry.id != pending.id {
            merged.append(entry)
        }
        return Array(merged.prefix(5))
    }
}
