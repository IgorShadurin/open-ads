import { AppError } from "@/server/errors";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const isSafeMethod = (method: string): boolean => {
  const normalized = method.toUpperCase();
  return normalized === "GET" || normalized === "HEAD" || normalized === "OPTIONS";
};

export const getClientIp = (request: Request): string => {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  return "unknown";
};

export const assertAllowedOrigin = (request: Request): void => {
  if (isSafeMethod(request.method)) {
    return;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return;
  }

  const allowedOrigins = new Set<string>();

  try {
    allowedOrigins.add(new URL(request.url).origin);
  } catch {
    // ignore malformed request url; checks below may still provide allowed origins
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    allowedOrigins.add(`${forwardedProto}://${forwardedHost}`);
  }

  const host = request.headers.get("host");
  if (host) {
    const protoFromRequestUrl = (() => {
      try {
        return new URL(request.url).protocol.replace(":", "");
      } catch {
        return "http";
      }
    })();

    allowedOrigins.add(`${protoFromRequestUrl}://${host}`);
  }

  if (!allowedOrigins.has(origin)) {
    throw new AppError("Invalid request origin", 403);
  }
};

const maybeSweepRateBuckets = (now: number) => {
  if (rateBuckets.size < 5000) {
    return;
  }

  for (const [key, entry] of rateBuckets.entries()) {
    if (entry.resetAt <= now) {
      rateBuckets.delete(key);
    }
  }
};

export const enforceRateLimit = (
  request: Request,
  input: {
    bucket: string;
    limit: number;
    windowMs: number;
    keyParts?: string[];
    now?: number;
  },
): void => {
  const now = input.now ?? Date.now();
  const clientIp = getClientIp(request);
  const suffix = input.keyParts?.join(":") ?? "";
  const key = `${input.bucket}:${clientIp}:${suffix}`;

  maybeSweepRateBuckets(now);

  const existing = rateBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return;
  }

  if (existing.count >= input.limit) {
    throw new AppError("Too many requests", 429);
  }

  existing.count += 1;
  rateBuckets.set(key, existing);
};

export const resetRateLimiterForTests = (): void => {
  rateBuckets.clear();
};
