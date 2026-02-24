import { describe, expect, it } from "vitest";

import { filterAppsByQuery, normalizeSearchQuery } from "./dashboard-ui";

const apps = [
  { id: "1", name: "Alpha Arcade", bundleId: "com.acme.alpha", owner: { email: "owner1@acme.com" } },
  { id: "2", name: "Beta Racing", bundleId: "com.acme.beta", owner: { email: "owner2@acme.com" } },
  { id: "3", name: "Gamma Quest", bundleId: "io.games.gamma", owner: { email: "team@gamma.io" } },
];

describe("normalizeSearchQuery", () => {
  it("trims and lowercases query", () => {
    expect(normalizeSearchQuery("  COM.Acme  ")).toBe("com.acme");
  });

  it("handles empty input", () => {
    expect(normalizeSearchQuery("")).toBe("");
  });
});

describe("filterAppsByQuery", () => {
  it("returns all apps for empty query", () => {
    expect(filterAppsByQuery(apps, "")).toHaveLength(3);
  });

  it("matches by name case-insensitively", () => {
    const result = filterAppsByQuery(apps, "alpha");
    expect(result.map((app) => app.id)).toEqual(["1"]);
  });

  it("matches by bundle id", () => {
    const result = filterAppsByQuery(apps, "io.games");
    expect(result.map((app) => app.id)).toEqual(["3"]);
  });

  it("matches by owner email", () => {
    const result = filterAppsByQuery(apps, "owner2");
    expect(result.map((app) => app.id)).toEqual(["2"]);
  });

  it("returns no apps for unknown token", () => {
    expect(filterAppsByQuery(apps, "non-existent")).toEqual([]);
  });
});
