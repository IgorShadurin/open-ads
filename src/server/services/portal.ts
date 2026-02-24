import { Role } from "@prisma/client";

import { assertBundleId } from "@/server/domain/apps";
import { AppError } from "@/server/errors";
import { prisma } from "@/server/prisma";
import { registerUserApp } from "@/server/services/apps";

const requireAppAccess = async (appId: string, userId: string, role: Role) => {
  const app = await prisma.app.findUnique({ where: { id: appId } });

  if (!app) {
    throw new AppError("App not found", 404);
  }

  if (role !== Role.SUPER_ADMIN && app.ownerId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  return app;
};

const mapAdsToApp = <T extends { id: string; ownerId: string }>(
  app: T,
  ads: Array<{ ownerId: string; appId: string | null; scope: "APP_ONLY" | "ALL_APPS" }>,
) => ads.filter((ad) => ad.ownerId === app.ownerId && (ad.appId === app.id || ad.scope === "ALL_APPS"));

export const listAppsForUser = async (userId: string, role: Role) => {
  const apps = await prisma.app.findMany({
    where: role === Role.SUPER_ADMIN ? {} : { ownerId: userId },
    include: {
      stats: true,
      owner: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  if (apps.length === 0) {
    return [];
  }

  const appIds = apps.map((app) => app.id);
  const ownerIds = Array.from(new Set(apps.map((app) => app.ownerId)));

  const ads = await prisma.ad.findMany({
    where: {
      ownerId: { in: ownerIds },
      OR: [{ appId: { in: appIds } }, { scope: "ALL_APPS" }],
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return apps.map((app) => ({
    ...app,
    ads: mapAdsToApp(app, ads),
  }));
};

export const getAppWithAds = async (userId: string, role: Role, appId: string) => {
  const app = await requireAppAccess(appId, userId, role);

  const [richApp, ads] = await Promise.all([
    prisma.app.findUnique({
      where: { id: appId },
      include: {
        stats: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
    prisma.ad.findMany({
      where: {
        ownerId: app.ownerId,
        OR: [{ appId }, { scope: "ALL_APPS" }],
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  if (!richApp) {
    return null;
  }

  return {
    ...richApp,
    ads,
  };
};

export const createAppForUser = async (userId: string, input: { name: string; bundleId: string }) => {
  const app = await registerUserApp(
    {
      findByBundleId: (bundleId) =>
        prisma.app.findUnique({
          where: { bundleId },
          select: { id: true, ownerId: true, name: true, bundleId: true, isActive: true },
        }),
      createApp: ({ ownerId, name, bundleId }) =>
        prisma.app.create({
          data: {
            ownerId,
            name,
            bundleId,
          },
          select: { id: true, ownerId: true, name: true, bundleId: true, isActive: true },
        }),
    },
    {
      ownerId: userId,
      name: input.name,
      bundleId: input.bundleId,
    },
  );

  await prisma.appStat.upsert({
    where: { appId: app.id },
    update: {},
    create: {
      appId: app.id,
    },
  });

  return app;
};

export const updateAppFallback = async (
  userId: string,
  role: Role,
  appId: string,
  input: {
    fallbackMediaType: "VIDEO" | "IMAGE" | null;
    fallbackMediaUrl: string | null;
    fallbackClickUrl: string | null;
    fallbackRewardSeconds: number;
    isActive?: boolean;
  },
) => {
  await requireAppAccess(appId, userId, role);

  return prisma.app.update({
    where: { id: appId },
    data: {
      fallbackMediaType: input.fallbackMediaType,
      fallbackMediaUrl: input.fallbackMediaUrl,
      fallbackClickUrl: input.fallbackClickUrl,
      fallbackRewardSeconds: input.fallbackRewardSeconds,
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
    },
  });
};

export const deleteApp = async (userId: string, role: Role, appId: string) => {
  await requireAppAccess(appId, userId, role);
  await prisma.app.delete({ where: { id: appId } });
};

export const createAdForApp = async (
  userId: string,
  role: Role,
  appId: string,
  input: {
    title: string;
    mediaType: "VIDEO" | "IMAGE";
    mediaUrl: string;
    clickUrl?: string | null;
    rewardSeconds?: number;
    priority?: number;
    isActive?: boolean;
    startsAt?: Date | null;
    endsAt?: Date | null;
    scope?: "APP_ONLY" | "ALL_APPS";
  },
) => {
  const app = await requireAppAccess(appId, userId, role);

  return prisma.ad.create({
    data: {
      ownerId: app.ownerId,
      appId: input.scope === "ALL_APPS" ? null : appId,
      scope: input.scope ?? "APP_ONLY",
      title: input.title.trim(),
      mediaType: input.mediaType,
      mediaUrl: input.mediaUrl,
      clickUrl: input.clickUrl ?? null,
      rewardSeconds: input.rewardSeconds ?? 15,
      priority: input.priority ?? 0,
      isActive: input.isActive ?? true,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
  });
};

export const updateAd = async (
  userId: string,
  role: Role,
  appId: string,
  adId: string,
  input: {
    title?: string;
    mediaType?: "VIDEO" | "IMAGE";
    mediaUrl?: string;
    clickUrl?: string | null;
    rewardSeconds?: number;
    priority?: number;
    isActive?: boolean;
    scope?: "APP_ONLY" | "ALL_APPS";
    startsAt?: Date | null;
    endsAt?: Date | null;
  },
) => {
  const app = await requireAppAccess(appId, userId, role);

  const ad = await prisma.ad.findUnique({ where: { id: adId } });

  if (!ad || ad.ownerId !== app.ownerId) {
    throw new AppError("Ad not found", 404);
  }

  return prisma.ad.update({
    where: { id: adId },
    data: {
      ...(input.title ? { title: input.title.trim() } : {}),
      ...(input.mediaType ? { mediaType: input.mediaType } : {}),
      ...(input.mediaUrl ? { mediaUrl: input.mediaUrl } : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "clickUrl") ? { clickUrl: input.clickUrl ?? null } : {}),
      ...(typeof input.rewardSeconds === "number" ? { rewardSeconds: input.rewardSeconds } : {}),
      ...(typeof input.priority === "number" ? { priority: input.priority } : {}),
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
      ...(input.scope ? { scope: input.scope, appId: input.scope === "ALL_APPS" ? null : appId } : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "startsAt") ? { startsAt: input.startsAt ?? null } : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "endsAt") ? { endsAt: input.endsAt ?? null } : {}),
    },
  });
};

export const getAppStats = async (userId: string, role: Role, appId: string) => {
  await requireAppAccess(appId, userId, role);

  const stats = await prisma.appStat.findUnique({
    where: { appId },
  });

  return (
    stats ?? {
      appId,
      initCount: 0,
      shownCount: 0,
      canceledCount: 0,
      rewardedCount: 0,
      clickedCount: 0,
    }
  );
};

export const findBundleOwner = async (bundleIdRaw: string) => {
  const bundleId = assertBundleId(bundleIdRaw);

  return prisma.app.findUnique({
    where: { bundleId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
};
