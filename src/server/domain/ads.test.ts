import { describe, expect, it } from "vitest";

import {
  pickRandomAdForDisplay,
  sanitizeRewardSeconds,
  toSdkAdPayload,
  type DomainAd,
} from "@/server/domain/ads";

const now = new Date("2026-02-24T12:00:00.000Z");

const makeAd = (partial: Partial<DomainAd>): DomainAd => ({
  id: "ad-1",
  appId: "app-1",
  ownerId: "user-1",
  scope: "APP_ONLY",
  title: "Default Ad",
  mediaType: "VIDEO",
  mediaUrl: "https://cdn.example.com/ad.mp4",
  clickUrl: "https://example.com",
  rewardSeconds: 15,
  priority: 1,
  startsAt: null,
  endsAt: null,
  isActive: true,
  updatedAt: new Date("2026-02-24T10:00:00.000Z"),
  ...partial,
});

describe("ads domain", () => {
  it("sanitizes reward seconds with defaults and limits", () => {
    expect(sanitizeRewardSeconds(undefined)).toBe(15);
    expect(sanitizeRewardSeconds(2)).toBe(5);
    expect(sanitizeRewardSeconds(130)).toBe(120);
    expect(sanitizeRewardSeconds(29.8)).toBe(29);
  });

  it("picks random eligible ad using provided random source", () => {
    const chosen = pickRandomAdForDisplay(
      [
        makeAd({ id: "ad-1", priority: 5, updatedAt: new Date("2026-02-24T08:00:00.000Z") }),
        makeAd({ id: "ad-2", priority: 10, updatedAt: new Date("2026-02-24T07:00:00.000Z") }),
        makeAd({ id: "ad-3", priority: 10, updatedAt: new Date("2026-02-24T11:00:00.000Z") }),
      ],
      now,
      () => 0.5,
    );

    expect(chosen?.id).toBe("ad-2");
  });

  it("filters out inactive or out-of-window ads", () => {
    const chosen = pickRandomAdForDisplay(
      [
        makeAd({ id: "inactive", isActive: false, priority: 50 }),
        makeAd({ id: "future", startsAt: new Date("2026-03-01T00:00:00.000Z"), priority: 100 }),
        makeAd({ id: "expired", endsAt: new Date("2026-02-01T00:00:00.000Z"), priority: 100 }),
        makeAd({ id: "good", priority: 1 }),
      ],
      now,
      () => 0,
    );

    expect(chosen?.id).toBe("good");
  });

  it("can select global ads for all apps", () => {
    const chosen = pickRandomAdForDisplay(
      [
        makeAd({ id: "app-only", appId: "app-1", scope: "APP_ONLY" }),
        makeAd({ id: "all-apps", appId: null, scope: "ALL_APPS" }),
      ],
      now,
      () => 0.99,
    );

    expect(chosen?.id).toBe("all-apps");
  });

  it("maps live and fallback SDK payloads", () => {
    const live = makeAd({ id: "live" });
    const fallback = makeAd({ id: "fallback", mediaType: "IMAGE" });

    expect(toSdkAdPayload(live, fallback)?.source).toBe("live");
    const noLive = toSdkAdPayload(null, fallback);
    expect(noLive?.source).toBe("fallback");
    expect(noLive?.mediaType).toBe("IMAGE");
    expect(toSdkAdPayload(null, null)).toBeNull();
  });
});
