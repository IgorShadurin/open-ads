import { NextRequest } from "next/server";

import { requireSessionUser } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin } from "@/server/lib/security";
import { createAdForApp, getAppWithAds } from "@/server/services/portal";
import { adCreateSchema } from "@/server/validation";

export async function GET(_: NextRequest, context: { params: Promise<{ appId: string }> }) {
  try {
    const user = await requireSessionUser();
    const { appId } = await context.params;

    const app = await getAppWithAds(user.id, user.role, appId);

    if (!app) {
      throw new AppError("App not found", 404);
    }

    return jsonOk({ ads: app.ads });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ appId: string }> }) {
  try {
    assertAllowedOrigin(request);
    const user = await requireSessionUser();
    const { appId } = await context.params;

    const body = await request.json();
    const parsed = adCreateSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid ad data", 422);
    }

    const ad = await createAdForApp(user.id, user.role, appId, {
      ...parsed.data,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    });

    return jsonOk({ ad }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
