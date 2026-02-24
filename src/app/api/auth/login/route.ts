import { NextRequest } from "next/server";

import { createSessionToken, getSessionCookieConfig } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin, enforceRateLimit } from "@/server/lib/security";
import { loginUser } from "@/server/services/auth";
import { loginSchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    assertAllowedOrigin(request);
    enforceRateLimit(request, {
      bucket: "auth-login",
      limit: 20,
      windowMs: 60_000,
    });

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid login data", 422);
    }

    const user = await loginUser(parsed.data);
    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response = jsonOk({ user });
    response.cookies.set(getSessionCookieConfig(token));

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
