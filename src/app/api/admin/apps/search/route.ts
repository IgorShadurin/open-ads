import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

import { requireRole, requireSessionUser } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { findBundleOwner } from "@/server/services/portal";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    requireRole(user, [Role.SUPER_ADMIN]);

    const bundleId = request.nextUrl.searchParams.get("bundleId");

    if (!bundleId) {
      throw new AppError("bundleId is required", 422);
    }

    const app = await findBundleOwner(bundleId);
    return jsonOk({ app });
  } catch (error) {
    return jsonError(error);
  }
}
