import { pickRandomAdForDisplay, toSdkAdPayload, type DomainAd, type DomainMediaType } from "@/server/domain/ads";
import { AppError } from "@/server/errors";

type SdkApp = {
  id: string;
  ownerId: string;
  bundleId: string;
  isActive: boolean;
  fallbackMediaType: DomainMediaType | null;
  fallbackMediaUrl: string | null;
  fallbackClickUrl: string | null;
  fallbackRewardSeconds: number;
};

export type SdkStore = {
  findAppByBundleId: (bundleId: string) => Promise<SdkApp | null>;
  listAdsForApp: (appId: string, ownerId: string) => Promise<DomainAd[]>;
  incrementInit: (appId: string) => Promise<void>;
  incrementShown: (appId: string) => Promise<void>;
  incrementCanceled: (appId: string) => Promise<void>;
  incrementRewarded: (appId: string) => Promise<void>;
  incrementClicked: (appId: string) => Promise<void>;
  appendEvent: (input: {
    appId: string;
    appOwnerId: string;
    bundleIdSnapshot: string;
    eventType: "INIT" | "SHOWN" | "CANCELED" | "REWARDED" | "CLICKED";
    adId?: string;
    platform: "ios";
    appVersion?: string;
  }) => Promise<void>;
};

const buildFallbackAd = (app: SdkApp): DomainAd | null => {
  if (!app.fallbackMediaType || !app.fallbackMediaUrl) {
    return null;
  }

  return {
    id: `fallback:${app.id}`,
    ownerId: app.ownerId,
    appId: app.id,
    scope: "APP_ONLY",
    title: "Fallback Ad",
    mediaType: app.fallbackMediaType,
    mediaUrl: app.fallbackMediaUrl,
    clickUrl: app.fallbackClickUrl,
    rewardSeconds: app.fallbackRewardSeconds,
    priority: -1,
    startsAt: null,
    endsAt: null,
    isActive: true,
    updatedAt: new Date(0),
  };
};

export const initializeSdkSession = async (
  store: SdkStore,
  input: { bundleId: string; platform: "ios"; appVersion?: string },
  options?: { now?: Date; random?: () => number },
) => {
  const app = await store.findAppByBundleId(input.bundleId);

  if (!app || !app.isActive) {
    throw new AppError("Unsupported app", 403);
  }

  const ads = await store.listAdsForApp(app.id, app.ownerId);
  const liveAd = pickRandomAdForDisplay(ads, options?.now ?? new Date(), options?.random ?? Math.random);
  const fallbackAd = buildFallbackAd(app);

  await store.incrementInit(app.id);
  await store.appendEvent({
    appId: app.id,
    appOwnerId: app.ownerId,
    bundleIdSnapshot: app.bundleId,
    eventType: "INIT",
    platform: input.platform,
    appVersion: input.appVersion,
  });

  return {
    appId: app.id,
    bundleId: app.bundleId,
    ad: toSdkAdPayload(liveAd, fallbackAd),
  };
};

export const handleSdkEvent = async (
  store: SdkStore,
  input: {
    bundleId: string;
    eventType: "SHOWN" | "CANCELED" | "REWARDED" | "CLICKED";
    adId?: string;
    appVersion?: string;
    platform?: "ios";
  },
): Promise<void> => {
  const app = await store.findAppByBundleId(input.bundleId);

  if (!app || !app.isActive) {
    throw new AppError("Unsupported app", 403);
  }

  if (input.eventType === "SHOWN") {
    await store.incrementShown(app.id);
  } else if (input.eventType === "CANCELED") {
    await store.incrementCanceled(app.id);
  } else if (input.eventType === "REWARDED") {
    await store.incrementRewarded(app.id);
  } else {
    await store.incrementClicked(app.id);
  }

  await store.appendEvent({
    appId: app.id,
    appOwnerId: app.ownerId,
    bundleIdSnapshot: app.bundleId,
    eventType: input.eventType,
    adId: input.adId,
    platform: input.platform ?? "ios",
    appVersion: input.appVersion,
  });
};
