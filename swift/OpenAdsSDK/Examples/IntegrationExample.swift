import SwiftUI
import OpenAdsSDK

@MainActor
final class RewardsViewModel: ObservableObject {
    @Published var isShowingAd = false
    @Published var rewardedCoins = 0
    @Published var adSession: OpenAdsRewardedSession?

    private let client = OpenAdsClient(
        config: OpenAdsConfig(
            apiBaseURL: URL(string: "https://your-openads-domain.com")!,
            bundleId: Bundle.main.bundleIdentifier ?? "com.example.app"
        )
    )

    func loadAd() async {
        let ad = await client.initialize(appVersion: "1.0.0")

        guard let ad else {
            return
        }

        adSession = OpenAdsRewardedSession(creative: ad, client: client)
        isShowingAd = true
    }

    func onReward() {
        rewardedCoins += 10
        isShowingAd = false
    }

    func onCancel() {
        isShowingAd = false
    }
}

struct RewardsScreen: View {
    @StateObject private var vm = RewardsViewModel()

    var body: some View {
        VStack(spacing: 16) {
            Text("Coins: \(vm.rewardedCoins)")
            Button("Watch Ad") {
                Task { await vm.loadAd() }
            }
            .buttonStyle(.borderedProminent)
        }
        .sheet(isPresented: $vm.isShowingAd) {
            if let session = vm.adSession {
                OpenAdsRewardedView(
                    session: session,
                    appVersion: "1.0.0",
                    onReward: vm.onReward,
                    onCancel: vm.onCancel
                )
            }
        }
    }
}
