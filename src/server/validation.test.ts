import { describe, expect, it } from "vitest";

import { adCreateSchema, appCreateSchema, sdkEventSchema, sdkInitSchema } from "@/server/validation";

describe("validation", () => {
  it("validates app create payload", () => {
    expect(appCreateSchema.safeParse({ name: "My App", bundleId: "com.example.demo" }).success).toBe(true);
    expect(appCreateSchema.safeParse({ name: "x", bundleId: "bad" }).success).toBe(false);
  });

  it("enforces ad reward range", () => {
    expect(
      adCreateSchema.safeParse({
        title: "Ad",
        mediaType: "VIDEO",
        mediaUrl: "https://example.com/ad.mp4",
        rewardSeconds: 3,
        priority: 0,
      }).success,
    ).toBe(false);

    expect(
      adCreateSchema.safeParse({
        title: "Ad",
        mediaType: "VIDEO",
        mediaUrl: "https://example.com/ad.mp4",
        rewardSeconds: 15,
        priority: 0,
        scope: "ALL_APPS",
      }).success,
    ).toBe(true);

    expect(
      adCreateSchema.safeParse({
        title: "Ad",
        mediaType: "VIDEO",
        mediaUrl: "javascript:alert(1)",
        rewardSeconds: 15,
        priority: 0,
      }).success,
    ).toBe(false);
  });

  it("accepts only ios platform for sdk init", () => {
    expect(
      sdkInitSchema.safeParse({
        bundleId: "com.example.demo",
        platform: "ios",
      }).success,
    ).toBe(true);

    expect(
      sdkInitSchema.safeParse({
        bundleId: "com.example.demo",
        platform: "android",
      }).success,
    ).toBe(false);
  });

  it("accepts supported sdk event types", () => {
    expect(
      sdkEventSchema.safeParse({
        bundleId: "com.example.demo",
        eventType: "REWARDED",
        platform: "ios",
      }).success,
    ).toBe(true);

    expect(
      sdkEventSchema.safeParse({
        bundleId: "com.example.demo",
        eventType: "CLICKED",
        platform: "ios",
      }).success,
    ).toBe(true);

    expect(
      sdkEventSchema.safeParse({
        bundleId: "com.example.demo",
        eventType: "INIT",
        platform: "ios",
      }).success,
    ).toBe(false);
  });
});
