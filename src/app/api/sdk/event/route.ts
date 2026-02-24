import { NextRequest } from "next/server";

import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { enforceRateLimit } from "@/server/lib/security";
import { handleSdkEventWithPrisma } from "@/server/services/sdk-prisma";
import { sdkEventSchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, {
      bucket: "sdk-event",
      limit: 1000,
      windowMs: 60_000,
    });

    const body = await request.json();
    const parsed = sdkEventSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid sdk event payload", 422);
    }

    enforceRateLimit(request, {
      bucket: "sdk-event-bundle",
      limit: 2000,
      windowMs: 60_000,
      keyParts: [parsed.data.bundleId],
    });

    await handleSdkEventWithPrisma(parsed.data);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
