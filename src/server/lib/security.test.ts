import { describe, expect, it } from "vitest";

import { AppError } from "@/server/errors";
import {
  assertAllowedOrigin,
  enforceRateLimit,
  getClientIp,
  resetRateLimiterForTests,
} from "@/server/lib/security";

describe("security helpers", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const request = new Request("http://localhost:3001/api/test", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      },
    });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("allows matching origin", () => {
    const request = new Request("http://localhost:3001/api/test", {
      method: "POST",
      headers: {
        origin: "http://localhost:3001",
      },
    });

    expect(() => assertAllowedOrigin(request)).not.toThrow();
  });

  it("rejects invalid origin", () => {
    const request = new Request("http://localhost:3001/api/test", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
      },
    });

    expect(() => assertAllowedOrigin(request)).toThrow(AppError);
  });

  it("enforces a fixed-window rate limit", () => {
    resetRateLimiterForTests();

    const request = new Request("http://localhost:3001/api/test", {
      headers: {
        "x-forwarded-for": "9.8.7.6",
      },
    });

    enforceRateLimit(request, {
      bucket: "test",
      limit: 2,
      windowMs: 1000,
      now: 0,
    });

    enforceRateLimit(request, {
      bucket: "test",
      limit: 2,
      windowMs: 1000,
      now: 10,
    });

    expect(() =>
      enforceRateLimit(request, {
        bucket: "test",
        limit: 2,
        windowMs: 1000,
        now: 20,
      }),
    ).toThrow("Too many requests");

    expect(() =>
      enforceRateLimit(request, {
        bucket: "test",
        limit: 2,
        windowMs: 1000,
        now: 1001,
      }),
    ).not.toThrow();
  });
});
