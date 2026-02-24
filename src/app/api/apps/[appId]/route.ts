import { NextRequest } from "next/server";

import { requireSessionUser } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin } from "@/server/lib/security";
import { deleteApp, updateAppFallback } from "@/server/services/portal";
import { fallbackSchema } from "@/server/validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ appId: string }> }) {
  try {
    assertAllowedOrigin(request);
    const user = await requireSessionUser();
    const { appId } = await context.params;

    const body = await request.json();
    const parsed = fallbackSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid app data", 422);
    }

    const app = await updateAppFallback(user.id, user.role, appId, parsed.data);
    return jsonOk({ app });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ appId: string }> }) {
  try {
    assertAllowedOrigin(request);
    const user = await requireSessionUser();
    const { appId } = await context.params;

    await deleteApp(user.id, user.role, appId);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
