import { requireSessionUser } from "@/server/auth/guards";
import { jsonError, jsonOk } from "@/server/lib/http";
import { getAppStats } from "@/server/services/portal";

export async function GET(_: Request, context: { params: Promise<{ appId: string }> }) {
  try {
    const user = await requireSessionUser();
    const { appId } = await context.params;

    const stats = await getAppStats(user.id, user.role, appId);
    return jsonOk({ stats });
  } catch (error) {
    return jsonError(error);
  }
}
