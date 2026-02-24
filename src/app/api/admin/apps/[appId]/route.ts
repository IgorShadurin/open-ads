import { Role } from "@prisma/client";

import { requireRole, requireSessionUser } from "@/server/auth/guards";
import { jsonError, jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin } from "@/server/lib/security";
import { deleteApp } from "@/server/services/portal";

export async function DELETE(request: Request, context: { params: Promise<{ appId: string }> }) {
  try {
    assertAllowedOrigin(request);
    const user = await requireSessionUser();
    requireRole(user, [Role.SUPER_ADMIN]);

    const { appId } = await context.params;
    await deleteApp(user.id, user.role, appId);

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
