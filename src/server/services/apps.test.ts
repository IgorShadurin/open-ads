import { describe, expect, it } from "vitest";

import { registerUserApp, type AppStore } from "@/server/services/apps";

const createStore = (): AppStore => {
  const apps: Array<{ id: string; ownerId: string; name: string; bundleId: string; isActive: boolean }> = [];

  return {
    async findByBundleId(bundleId) {
      return apps.find((app) => app.bundleId === bundleId) ?? null;
    },
    async createApp(input) {
      const app = { id: `app-${apps.length + 1}`, ...input, isActive: true };
      apps.push(app);
      return app;
    },
  };
};

describe("apps service", () => {
  it("registers app for owner", async () => {
    const store = createStore();
    const app = await registerUserApp(store, {
      ownerId: "user-1",
      name: "Demo App",
      bundleId: " COM.Example.Demo ",
    });

    expect(app.bundleId).toBe("com.example.demo");
    expect(app.ownerId).toBe("user-1");
  });

  it("blocks duplicate bundle for another user", async () => {
    const store = createStore();
    await registerUserApp(store, {
      ownerId: "user-1",
      name: "App A",
      bundleId: "com.example.demo",
    });

    await expect(
      registerUserApp(store, {
        ownerId: "user-2",
        name: "App B",
        bundleId: "com.example.demo",
      }),
    ).rejects.toThrow("already registered");
  });

  it("rejects invalid bundle identifiers", async () => {
    const store = createStore();

    await expect(
      registerUserApp(store, {
        ownerId: "user-1",
        name: "App C",
        bundleId: "invalid",
      }),
    ).rejects.toThrow("Invalid bundle identifier");
  });

  it("maps storage unique conflicts to domain duplicate errors", async () => {
    const store: AppStore = {
      async findByBundleId() {
        return null;
      },
      async createApp() {
        throw Object.assign(new Error("unique constraint"), { code: "P2002" });
      },
    };

    await expect(
      registerUserApp(store, {
        ownerId: "user-1",
        name: "Race App",
        bundleId: "com.example.race",
      }),
    ).rejects.toThrow("already registered");
  });
});
