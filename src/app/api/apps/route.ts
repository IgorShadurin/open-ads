import { NextRequest } from "next/server";

import { requireSessionUser } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin } from "@/server/lib/security";
import { createAppForUser, listAppsForUser } from "@/server/services/portal";
import { appCreateSchema } from "@/server/validation";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const apps = await listAppsForUser(user.id, user.role);
    return jsonOk({ apps });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertAllowedOrigin(request);
    const user = await requireSessionUser();
    const body = await request.json();
    const parsed = appCreateSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid app data", 422);
    }

    const app = await createAppForUser(user.id, parsed.data);
    return jsonOk({ app }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
