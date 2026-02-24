import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

import { env } from "@/server/lib/env";

export const SESSION_COOKIE = "openads_session";
const SESSION_ISSUER = "openads";
const SESSION_AUDIENCE = "openads-web";

type SessionPayload = {
  sub: string;
  email: string;
  role: Role;
};

const getJwtSecret = (): Uint8Array => new TextEncoder().encode(env.jwtSecret);

export const createSessionToken = async (payload: SessionPayload): Promise<string> => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 60 * 60 * 24 * 7;

  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(getJwtSecret());
};

export const verifySessionToken = async (token: string): Promise<SessionPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
};

export const readSession = async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
};

export const getSessionCookieConfig = (token: string) => ({
  name: SESSION_COOKIE,
  value: token,
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
});

export const getExpiredSessionCookieConfig = () => ({
  name: SESSION_COOKIE,
  value: "",
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 0,
});
