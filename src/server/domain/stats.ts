export type StatsCounters = {
  initCount: number;
  shownCount: number;
  canceledCount: number;
  rewardedCount: number;
  clickedCount: number;
};

export type StatsEventType = "INIT" | "SHOWN" | "CANCELED" | "REWARDED" | "CLICKED";

export const incrementCounters = (counters: StatsCounters, eventType: StatsEventType): StatsCounters => {
  const next: StatsCounters = { ...counters };

  switch (eventType) {
    case "INIT":
      next.initCount += 1;
      return next;
    case "SHOWN":
      next.shownCount += 1;
      return next;
    case "CANCELED":
      next.canceledCount += 1;
      return next;
    case "REWARDED":
      next.rewardedCount += 1;
      return next;
    case "CLICKED":
      next.clickedCount += 1;
      return next;
    default: {
      const exhaustive: never = eventType;
      return exhaustive;
    }
  }
};
