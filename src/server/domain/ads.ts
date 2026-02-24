export type DomainMediaType = "VIDEO" | "IMAGE";
export type DomainAdScope = "APP_ONLY" | "ALL_APPS";

export type DomainAd = {
  id: string;
  ownerId: string;
  appId: string | null;
  scope: DomainAdScope;
  title: string;
  mediaType: DomainMediaType;
  mediaUrl: string;
  clickUrl: string | null;
  rewardSeconds: number;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  updatedAt: Date;
};

export type SdkAdPayload = {
  id: string;
  title: string;
  mediaType: DomainMediaType;
  mediaUrl: string;
  clickUrl: string | null;
  rewardSeconds: number;
  source: "live" | "fallback";
};

export const sanitizeRewardSeconds = (value: unknown, fallback = 15): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  const base = Number.isFinite(parsed) ? parsed : fallback;
  const normalized = Math.floor(base);

  return Math.min(120, Math.max(5, normalized));
};

const isWithinWindow = (ad: DomainAd, now: Date): boolean => {
  if (!ad.isActive) {
    return false;
  }

  if (ad.startsAt && ad.startsAt > now) {
    return false;
  }

  if (ad.endsAt && ad.endsAt < now) {
    return false;
  }

  return true;
};

export const pickRandomAdForDisplay = (
  ads: DomainAd[],
  now = new Date(),
  random: () => number = Math.random,
): DomainAd | null => {
  const eligible = ads.filter((ad) => isWithinWindow(ad, now));

  if (eligible.length === 0) {
    return null;
  }

  const index = Math.min(eligible.length - 1, Math.max(0, Math.floor(random() * eligible.length)));
  return eligible[index] ?? null;
};

export const toSdkAdPayload = (liveAd: DomainAd | null, fallbackAd: DomainAd | null): SdkAdPayload | null => {
  const selected = liveAd ?? fallbackAd;

  if (!selected) {
    return null;
  }

  return {
    id: selected.id,
    title: selected.title,
    mediaType: selected.mediaType,
    mediaUrl: selected.mediaUrl,
    clickUrl: selected.clickUrl,
    rewardSeconds: sanitizeRewardSeconds(selected.rewardSeconds),
    source: liveAd ? "live" : "fallback",
  };
};
