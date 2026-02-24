import Foundation

public final class OpenAdsClient: @unchecked Sendable {
    private let config: OpenAdsConfig
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private let cacheKey: String

    public init(config: OpenAdsConfig, session: URLSession = .shared) {
        self.config = config
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        self.cacheKey = "openads.cached.ad.\(config.bundleId)"
    }

    public func preload(appVersion: String? = nil) async {
        _ = await initialize(appVersion: appVersion)
    }

    public func initialize(appVersion: String? = nil) async -> OpenAdsCreative? {
        do {
            let response = try await performInit(appVersion: appVersion)

            if let ad = response.ad {
                cacheCreative(ad)
                return ad
            }

            return cachedCreative() ?? config.defaultFallbackAd
        } catch {
            return cachedCreative() ?? config.defaultFallbackAd
        }
    }

    public func record(eventType: OpenAdsEventType, adId: String?, appVersion: String? = nil) async {
        var request = URLRequest(url: config.apiBaseURL.appending(path: "/api/sdk/event"))
        request.httpMethod = "POST"
        request.timeoutInterval = 5
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var payload: [String: String] = [
            "bundleId": config.bundleId,
            "platform": "ios",
            "eventType": eventType.rawValue
        ]

        if let adId, !adId.isEmpty {
            payload["adId"] = adId
        }

        if let appVersion, !appVersion.isEmpty {
            payload["appVersion"] = appVersion
        }

        if let body = try? JSONSerialization.data(withJSONObject: payload, options: []) {
            request.httpBody = body
        }

        _ = try? await session.data(for: request)
    }

    private func performInit(appVersion: String?) async throws -> OpenAdsInitResponse {
        var request = URLRequest(url: config.apiBaseURL.appending(path: "/api/sdk/init"))
        request.httpMethod = "POST"
        request.timeoutInterval = 5
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var payload: [String: String] = [
            "bundleId": config.bundleId,
            "platform": "ios"
        ]

        if let appVersion, !appVersion.isEmpty {
            payload["appVersion"] = appVersion
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])

        let (data, response) = try await session.data(for: request)

        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }

        return try decoder.decode(OpenAdsInitResponse.self, from: data)
    }

    private func cacheCreative(_ ad: OpenAdsCreative) {
        guard let data = try? encoder.encode(ad) else {
            return
        }

        UserDefaults.standard.set(data, forKey: cacheKey)
    }

    public func cachedCreative() -> OpenAdsCreative? {
        guard let data = UserDefaults.standard.data(forKey: cacheKey) else {
            return nil
        }

        return try? decoder.decode(OpenAdsCreative.self, from: data)
    }
}
