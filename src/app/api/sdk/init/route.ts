import { NextRequest } from "next/server";

import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { enforceRateLimit } from "@/server/lib/security";
import { initializeSdkSessionWithPrisma } from "@/server/services/sdk-prisma";
import { sdkInitSchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, {
      bucket: "sdk-init",
      limit: 300,
      windowMs: 60_000,
    });

    const body = await request.json();
    const parsed = sdkInitSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid sdk init payload", 422);
    }

    enforceRateLimit(request, {
      bucket: "sdk-init-bundle",
      limit: 600,
      windowMs: 60_000,
      keyParts: [parsed.data.bundleId],
    });

    const payload = await initializeSdkSessionWithPrisma(parsed.data);
    return jsonOk(payload);
  } catch (error) {
    return jsonError(error);
  }
}
