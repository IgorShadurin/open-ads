import { NextRequest } from "next/server";

import { getSessionCookieConfig, createSessionToken } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { jsonError, jsonOk } from "@/server/lib/http";
import { assertAllowedOrigin, enforceRateLimit } from "@/server/lib/security";
import { registerUser } from "@/server/services/auth";
import { registerSchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    assertAllowedOrigin(request);
    enforceRateLimit(request, {
      bucket: "auth-register",
      limit: 10,
      windowMs: 60_000,
    });

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid registration data", 422);
    }

    const user = await registerUser(parsed.data);
    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response = jsonOk({ user }, 201);
    response.cookies.set(getSessionCookieConfig(token));

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
