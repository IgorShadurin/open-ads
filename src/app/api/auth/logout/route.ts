import { getExpiredSessionCookieConfig } from "@/server/auth/session";
import { jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin } from "@/server/lib/security";

export async function POST(request: Request) {
  assertAllowedOrigin(request);
  const response = jsonOk({ ok: true });
  response.cookies.set(getExpiredSessionCookieConfig());
  return response;
}
