import { describe, expect, it } from "vitest";

import { AppError } from "@/server/errors";
import { jsonError } from "@/server/lib/http";

describe("http json helpers", () => {
  it("returns app errors as-is", async () => {
    const response = jsonError(new AppError("Forbidden", 403));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("hides unexpected error details", async () => {
    const response = jsonError(new Error("database exploded"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
  });
});
