import { prisma } from "@/server/prisma";
import { handleSdkEvent, initializeSdkSession, type SdkStore } from "@/server/services/sdk";

const incrementByEvent = async (
  appId: string,
  column: "initCount" | "shownCount" | "canceledCount" | "rewardedCount" | "clickedCount",
) => {
  await prisma.appStat.upsert({
    where: { appId },
    update: {
      [column]: {
        increment: 1,
      },
    },
    create: {
      appId,
      [column]: 1,
    },
  });
};

export const createSdkStore = (): SdkStore => ({
  async findAppByBundleId(bundleId) {
    return prisma.app.findUnique({
      where: { bundleId },
      select: {
        id: true,
        ownerId: true,
        bundleId: true,
        fallbackMediaType: true,
        fallbackMediaUrl: true,
        fallbackClickUrl: true,
        fallbackRewardSeconds: true,
        isActive: true,
      },
    });
  },
  async listAdsForApp(appId, ownerId) {
    return prisma.ad.findMany({
      where: {
        ownerId,
        OR: [{ appId }, { scope: "ALL_APPS" }],
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        ownerId: true,
        appId: true,
        scope: true,
        title: true,
        mediaType: true,
        mediaUrl: true,
        clickUrl: true,
        rewardSeconds: true,
        priority: true,
        startsAt: true,
        endsAt: true,
        isActive: true,
        updatedAt: true,
      },
    });
  },
  incrementInit: (appId) => incrementByEvent(appId, "initCount"),
  incrementShown: (appId) => incrementByEvent(appId, "shownCount"),
  incrementCanceled: (appId) => incrementByEvent(appId, "canceledCount"),
  incrementRewarded: (appId) => incrementByEvent(appId, "rewardedCount"),
  incrementClicked: (appId) => incrementByEvent(appId, "clickedCount"),
  appendEvent: async (input) => {
    let safeAdId: string | null = null;

    if (input.adId) {
      const ad = await prisma.ad.findUnique({
        where: { id: input.adId },
        select: {
          id: true,
          appId: true,
          ownerId: true,
          scope: true,
        },
      });

      if (ad && ad.ownerId === input.appOwnerId && (ad.appId === input.appId || ad.scope === "ALL_APPS")) {
        safeAdId = ad.id;
      }
    }

    await prisma.adEvent.create({
      data: {
        appId: input.appId,
        adId: safeAdId,
        eventType: input.eventType,
        platform: "IOS",
        appVersion: input.appVersion,
        bundleIdSnapshot: input.bundleIdSnapshot,
      },
    });
  },
});

export const initializeSdkSessionWithPrisma = async (input: {
  bundleId: string;
  platform: "ios";
  appVersion?: string;
}) => initializeSdkSession(createSdkStore(), input);

export const handleSdkEventWithPrisma = async (input: {
  bundleId: string;
  eventType: "SHOWN" | "CANCELED" | "REWARDED" | "CLICKED";
  adId?: string;
  appVersion?: string;
  platform?: "ios";
}) => handleSdkEvent(createSdkStore(), input);
