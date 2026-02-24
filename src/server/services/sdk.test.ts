import { describe, expect, it, vi } from "vitest";

import { handleSdkEvent, initializeSdkSession, type SdkStore } from "@/server/services/sdk";

const makeStore = (
  options: {
    inactive?: boolean;
    noLiveAds?: boolean;
  } = {},
): SdkStore => ({
  async findAppByBundleId(bundleId) {
    if (bundleId === "com.example.missing") {
      return null;
    }

    return {
      id: "app-1",
      bundleId,
      ownerId: "user-1",
      fallbackMediaType: "IMAGE",
      fallbackMediaUrl: "https://cdn.example.com/fallback.png",
      fallbackClickUrl: "https://example.com/fallback",
      fallbackRewardSeconds: 20,
      isActive: options.inactive ? false : true,
    };
  },
  async listAdsForApp() {
    if (options.noLiveAds) {
      return [];
    }

    return [
      {
        id: "ad-1",
        appId: "app-1",
        ownerId: "user-1",
        scope: "APP_ONLY",
        title: "Launch",
        mediaType: "VIDEO",
        mediaUrl: "https://cdn.example.com/ad.mp4",
        clickUrl: "https://example.com",
        rewardSeconds: 15,
        priority: 1,
        startsAt: null,
        endsAt: null,
        isActive: true,
        updatedAt: new Date("2026-02-24T11:59:00.000Z"),
      },
      {
        id: "ad-global",
        appId: null,
        ownerId: "user-1",
        scope: "ALL_APPS",
        title: "Global",
        mediaType: "IMAGE",
        mediaUrl: "https://cdn.example.com/global.png",
        clickUrl: "https://example.com/global",
        rewardSeconds: 20,
        priority: 100,
        startsAt: null,
        endsAt: null,
        isActive: true,
        updatedAt: new Date("2026-02-24T11:59:00.000Z"),
      },
    ];
  },
  incrementInit: vi.fn(async () => undefined),
  incrementShown: vi.fn(async () => undefined),
  incrementCanceled: vi.fn(async () => undefined),
  incrementRewarded: vi.fn(async () => undefined),
  incrementClicked: vi.fn(async () => undefined),
  appendEvent: vi.fn(async () => undefined),
});

describe("sdk service", () => {
  it("returns live ad payload and tracks init", async () => {
    const store = makeStore();
    const result = await initializeSdkSession(store, {
      bundleId: "com.example.demo",
      platform: "ios",
      appVersion: "1.0.0",
    }, { random: () => 0 });

    expect(result.ad?.source).toBe("live");
    expect(result.ad?.id).toBe("ad-1");
    expect(store.incrementInit).toHaveBeenCalledTimes(1);
  });

  it("can return a global ad variant in random selection", async () => {
    const store = makeStore();
    const result = await initializeSdkSession(
      store,
      {
        bundleId: "com.example.demo",
        platform: "ios",
      },
      { random: () => 0.99 },
    );

    expect(result.ad?.id).toBe("ad-global");
  });

  it("rejects unsupported apps", async () => {
    const store = makeStore();
    await expect(
      initializeSdkSession(store, {
        bundleId: "com.example.missing",
        platform: "ios",
      }),
    ).rejects.toThrow("Unsupported app");
  });

  it("rejects inactive app registrations", async () => {
    const store = makeStore({ inactive: true });

    await expect(
      initializeSdkSession(store, {
        bundleId: "com.example.demo",
        platform: "ios",
      }),
    ).rejects.toThrow("Unsupported app");
  });

  it("returns fallback payload when no live ads are available", async () => {
    const store = makeStore({ noLiveAds: true });
    const result = await initializeSdkSession(store, {
      bundleId: "com.example.demo",
      platform: "ios",
    });

    expect(result.ad?.source).toBe("fallback");
  });

  it("records rewarded event", async () => {
    const store = makeStore();

    await handleSdkEvent(store, {
      bundleId: "com.example.demo",
      eventType: "REWARDED",
      adId: "ad-1",
    });

    expect(store.incrementRewarded).toHaveBeenCalledTimes(1);
    expect(store.appendEvent).toHaveBeenCalledTimes(1);
  });

  it("records shown and canceled events", async () => {
    const store = makeStore();
    await handleSdkEvent(store, {
      bundleId: "com.example.demo",
      eventType: "SHOWN",
    });

    await handleSdkEvent(store, {
      bundleId: "com.example.demo",
      eventType: "CANCELED",
    });

    expect(store.incrementShown).toHaveBeenCalledTimes(1);
    expect(store.incrementCanceled).toHaveBeenCalledTimes(1);
  });

  it("records clicked events", async () => {
    const store = makeStore();
    await handleSdkEvent(store, {
      bundleId: "com.example.demo",
      eventType: "CLICKED",
      adId: "ad-global",
    });

    expect(store.incrementClicked).toHaveBeenCalledTimes(1);
  });
});
