import { getSessionUser } from "@/server/auth/guards";
import { jsonOk } from "@/server/lib/http";

export async function GET() {
  const user = await getSessionUser();
  return jsonOk({ user });
}
