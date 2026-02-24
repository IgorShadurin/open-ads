import AVKit
import SwiftUI

@MainActor
public struct OpenAdsRewardedView: View {
    @Environment(\.openURL) private var openURL
    @ObservedObject private var session: OpenAdsRewardedSession

    private let onReward: () -> Void
    private let onCancel: () -> Void
    private let appVersion: String?

    public init(
        session: OpenAdsRewardedSession,
        appVersion: String? = nil,
        onReward: @escaping () -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.session = session
        self.appVersion = appVersion
        self.onReward = onReward
        self.onCancel = onCancel
    }

    public var body: some View {
        ZStack(alignment: .topTrailing) {
            media
                .clipped()

            VStack(alignment: .trailing, spacing: 10) {
                Text("\(session.remainingSeconds)s")
                    .font(.headline)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.ultraThinMaterial, in: Capsule())

                Button("Skip") {
                    session.cancel(appVersion: appVersion, onCancel: onCancel)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)

                if let clickURL = session.creative.clickUrl {
                    Button("Open Offer") {
                        session.trackClick(appVersion: appVersion)
                        openURL(clickURL)
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding(16)
        }
        .onAppear {
            session.start(appVersion: appVersion, onReward: onReward)
        }
    }

    @ViewBuilder
    private var media: some View {
        switch session.creative.mediaType {
        case .image:
            AsyncImage(url: session.creative.mediaUrl) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Color.gray.opacity(0.25)
            }
        case .video:
            VideoPlayer(player: AVPlayer(url: session.creative.mediaUrl))
        }
    }
}
