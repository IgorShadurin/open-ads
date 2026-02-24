import Foundation

public enum OpenAdsMediaType: String, Codable, Sendable {
    case video = "VIDEO"
    case image = "IMAGE"
}

public enum OpenAdsEventType: String, Codable, Sendable {
    case shown = "SHOWN"
    case canceled = "CANCELED"
    case rewarded = "REWARDED"
    case clicked = "CLICKED"
}

public struct OpenAdsCreative: Codable, Sendable {
    public let id: String
    public let title: String
    public let mediaType: OpenAdsMediaType
    public let mediaUrl: URL
    public let clickUrl: URL?
    public let rewardSeconds: Int
    public let source: String

    public init(
        id: String,
        title: String,
        mediaType: OpenAdsMediaType,
        mediaUrl: URL,
        clickUrl: URL?,
        rewardSeconds: Int,
        source: String
    ) {
        self.id = id
        self.title = title
        self.mediaType = mediaType
        self.mediaUrl = mediaUrl
        self.clickUrl = clickUrl
        self.rewardSeconds = rewardSeconds
        self.source = source
    }
}

struct OpenAdsInitResponse: Codable {
    let appId: String
    let bundleId: String
    let ad: OpenAdsCreative?
}

public struct OpenAdsConfig: Sendable {
    public let apiBaseURL: URL
    public let bundleId: String
    public let defaultFallbackAd: OpenAdsCreative?

    public init(apiBaseURL: URL, bundleId: String, defaultFallbackAd: OpenAdsCreative? = nil) {
        self.apiBaseURL = apiBaseURL
        self.bundleId = bundleId
        self.defaultFallbackAd = defaultFallbackAd
    }
}
