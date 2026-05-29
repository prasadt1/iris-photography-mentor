import SwiftUI

/// Working-pro studio tools — full portfolio, triage, and print sales live on web (matches web sidebar).
struct StudioView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Studio")
                            .font(IrisFont.serif(28))
                            .foregroundStyle(Color.irisTextPrimary)
                        Text("Portfolio review, batch labeling, and print sales — same tools as Iris on desktop.")
                            .font(IrisFont.sans(14))
                            .foregroundStyle(Color.irisTextMuted)
                            .lineSpacing(2)
                    }
                    .padding(.top, 8)

                    studioLink(
                        title: "My Work",
                        subtitle: "Full gallery, Glass Box critiques, and upload",
                        icon: "photo.on.rectangle.angled",
                        url: AppConfig.webWorkURL
                    )

                    studioLink(
                        title: "Print Sales",
                        subtitle: "Scan portfolio for listings and approve prices",
                        icon: "storefront",
                        url: AppConfig.webPrintURL
                    )

                    studioLink(
                        title: "Label & triage",
                        subtitle: "Organize photos in Mentor → Label on web",
                        icon: "square.stack.3d.up",
                        url: AppConfig.webMentorURL
                    )

                    Text("Shoot and quick critique stay on this app — open the links above in Safari for pro workflows.")
                        .font(IrisFont.sans(12))
                        .foregroundStyle(Color.irisTextMuted)
                        .padding(.top, 4)
                }
                .padding(.horizontal)
                .padding(.bottom, 88)
            }
            .irisScreen()
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.irisCanvas, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }

    private func studioLink(title: String, subtitle: String, icon: String, url: URL) -> some View {
        Link(destination: url) {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundStyle(Color.irisBrandLight)
                    .frame(width: 32)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(IrisFont.sans(16, weight: .semibold))
                        .foregroundStyle(Color.irisTextPrimary)
                    Text(subtitle)
                        .font(IrisFont.sans(13))
                        .foregroundStyle(Color.irisTextMuted)
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 8)
                Image(systemName: "arrow.up.right")
                    .font(IrisFont.sans(13, weight: .semibold))
                    .foregroundStyle(Color.irisBrandLight)
            }
            .padding(16)
            .background(Color.irisSurface2)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color.irisWarmBorder, lineWidth: 1)
            )
        }
    }
}
