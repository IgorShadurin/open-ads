import { NextRequest } from "next/server";

import { AppError } from "@/server/errors";
import { requireSessionUser } from "@/server/auth/guards";
import { jsonError, jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin } from "@/server/lib/security";
import { updateAd } from "@/server/services/portal";
import { adUpdateSchema } from "@/server/validation";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ appId: string; adId: string }> },
) {
  try {
    assertAllowedOrigin(request);
    const user = await requireSessionUser();
    const { appId, adId } = await context.params;

    const body = await request.json();
    const parsed = adUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid ad data", 422);
    }

    const ad = await updateAd(user.id, user.role, appId, adId, {
      ...parsed.data,
      startsAt:
        typeof parsed.data.startsAt === "string"
          ? new Date(parsed.data.startsAt)
          : (parsed.data.startsAt ?? undefined),
      endsAt:
        typeof parsed.data.endsAt === "string"
          ? new Date(parsed.data.endsAt)
          : (parsed.data.endsAt ?? undefined),
    });

    return jsonOk({ ad });
  } catch (error) {
    return jsonError(error);
  }
}
