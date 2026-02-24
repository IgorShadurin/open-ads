import { describe, expect, it } from "vitest";

import {
  hashPassword,
  normalizeEmail,
  validatePassword,
  verifyPassword,
} from "@/server/domain/auth";

describe("auth domain", () => {
  it("normalizes email by trimming and lowering case", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("accepts strong passwords", () => {
    const result = validatePassword("StrongPass123");
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects short passwords", () => {
    const result = validatePassword("Abc123");
    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toContain("at least 8");
  });

  it("rejects passwords without letters or numbers", () => {
    expect(validatePassword("12345678").ok).toBe(false);
    expect(validatePassword("password").ok).toBe(false);
  });

  it("hashes and verifies password values", async () => {
    const plain = "StrongPass123";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass999", hash)).resolves.toBe(false);
  });
});
