import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

import { requireRole, requireSessionUser } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin } from "@/server/lib/security";
import { getRegistrationState, setRegistrationState } from "@/server/services/registration";

export async function GET() {
  try {
    const user = await requireSessionUser();
    requireRole(user, [Role.SUPER_ADMIN]);

    const isRegistrationOpen = await getRegistrationState();
    return jsonOk({ isRegistrationOpen });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    assertAllowedOrigin(request);
    const user = await requireSessionUser();
    requireRole(user, [Role.SUPER_ADMIN]);

    const body = (await request.json()) as { isRegistrationOpen?: boolean };

    if (typeof body.isRegistrationOpen !== "boolean") {
      throw new AppError("isRegistrationOpen must be boolean", 422);
    }

    const isRegistrationOpen = await setRegistrationState(body.isRegistrationOpen);
    return jsonOk({ isRegistrationOpen });
  } catch (error) {
    return jsonError(error);
  }
}
