import { describe, expect, it } from "vitest";

import {
  assertBundleId,
  isValidBundleId,
  normalizeBundleId,
} from "@/server/domain/apps";

describe("apps domain", () => {
  it("normalizes bundle id", () => {
    expect(normalizeBundleId(" COM.Example.App ")).toBe("com.example.app");
  });

  it("accepts valid bundle identifiers", () => {
    expect(isValidBundleId("com.example.app")).toBe(true);
    expect(isValidBundleId("io.company.product-1")).toBe(true);
  });

  it("rejects malformed bundle identifiers", () => {
    expect(isValidBundleId("app")).toBe(false);
    expect(isValidBundleId("com..app")).toBe(false);
    expect(isValidBundleId("com.example.app$")) .toBe(false);
  });

  it("throws on invalid bundle id", () => {
    expect(() => assertBundleId("bad")).toThrow("Invalid bundle identifier");
  });
});
