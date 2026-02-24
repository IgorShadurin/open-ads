import Foundation
import Combine

@MainActor
public final class OpenAdsRewardedSession: ObservableObject {
    @Published public private(set) var remainingSeconds: Int
    @Published public private(set) var isRunning = false

    public let creative: OpenAdsCreative

    private let client: OpenAdsClient
    private var timerTask: Task<Void, Never>?
    private var didFinish = false

    public init(creative: OpenAdsCreative, client: OpenAdsClient) {
        self.creative = creative
        self.client = client
        self.remainingSeconds = max(1, creative.rewardSeconds)
    }

    public func start(appVersion: String? = nil, onReward: @escaping @MainActor () -> Void) {
        guard !isRunning else {
            return
        }

        isRunning = true

        timerTask = Task {
            await client.record(eventType: .shown, adId: creative.id, appVersion: appVersion)

            while !Task.isCancelled && remainingSeconds > 0 {
                try? await Task.sleep(for: .seconds(1))
                remainingSeconds -= 1
            }

            guard !Task.isCancelled, !didFinish else {
                return
            }

            didFinish = true
            isRunning = false
            await client.record(eventType: .rewarded, adId: creative.id, appVersion: appVersion)
            onReward()
        }
    }

    public func cancel(appVersion: String? = nil, onCancel: @escaping @MainActor () -> Void) {
        guard !didFinish else {
            return
        }

        timerTask?.cancel()
        didFinish = true
        isRunning = false

        Task {
            await client.record(eventType: .canceled, adId: creative.id, appVersion: appVersion)
            onCancel()
        }
    }

    public func trackClick(appVersion: String? = nil) {
        Task {
            await client.record(eventType: .clicked, adId: creative.id, appVersion: appVersion)
        }
    }
}
