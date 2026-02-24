import { describe, expect, it } from "vitest";

import { incrementCounters, type StatsCounters } from "@/server/domain/stats";

const baseline: StatsCounters = {
  initCount: 1,
  shownCount: 2,
  canceledCount: 3,
  rewardedCount: 4,
  clickedCount: 5,
};

describe("stats domain", () => {
  it("increments init", () => {
    expect(incrementCounters(baseline, "INIT")).toEqual({
      ...baseline,
      initCount: 2,
    });
  });

  it("increments shown", () => {
    expect(incrementCounters(baseline, "SHOWN")).toEqual({
      ...baseline,
      shownCount: 3,
    });
  });

  it("increments canceled", () => {
    expect(incrementCounters(baseline, "CANCELED")).toEqual({
      ...baseline,
      canceledCount: 4,
    });
  });

  it("increments rewarded", () => {
    expect(incrementCounters(baseline, "REWARDED")).toEqual({
      ...baseline,
      rewardedCount: 5,
    });
  });

  it("increments clicked", () => {
    expect(incrementCounters(baseline, "CLICKED")).toEqual({
      ...baseline,
      clickedCount: 6,
    });
  });

  it("does not mutate original", () => {
    const next = incrementCounters(baseline, "INIT");
    expect(next).not.toBe(baseline);
    expect(baseline.initCount).toBe(1);
  });
});
