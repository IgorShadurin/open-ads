// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "OpenAdsSDK",
    platforms: [
        .iOS(.v18)
    ],
    products: [
        .library(
            name: "OpenAdsSDK",
            targets: ["OpenAdsSDK"]
        )
    ],
    targets: [
        .target(
            name: "OpenAdsSDK"
        )
    ]
)
