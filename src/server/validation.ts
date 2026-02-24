import { z } from "zod";

const secureUrlSchema = z.string().trim().url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "URL must start with http:// or https://");

export const emailSchema = z.string().trim().email().max(200);

export const passwordSchema = z
  .string()
  .min(8)
  .max(200)
  .regex(/[a-z]/i, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const appCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  bundleId: z.string().trim().min(3).max(150),
});

export const fallbackSchema = z.object({
  fallbackMediaType: z.enum(["VIDEO", "IMAGE"]).nullable(),
  fallbackMediaUrl: secureUrlSchema.nullable(),
  fallbackClickUrl: secureUrlSchema.nullable(),
  fallbackRewardSeconds: z.number().int().min(5).max(120),
  isActive: z.boolean().optional(),
});

export const adCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  mediaType: z.enum(["VIDEO", "IMAGE"]),
  mediaUrl: secureUrlSchema,
  clickUrl: secureUrlSchema.nullable().optional(),
  scope: z.enum(["APP_ONLY", "ALL_APPS"]).default("APP_ONLY"),
  rewardSeconds: z.number().int().min(5).max(120).default(15),
  priority: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export const adUpdateSchema = adCreateSchema.partial();

export const sdkInitSchema = z.object({
  bundleId: z.string().trim().min(3).max(150),
  platform: z.literal("ios"),
  appVersion: z.string().trim().max(50).optional(),
});

export const sdkEventSchema = z.object({
  bundleId: z.string().trim().min(3).max(150),
  eventType: z.enum(["SHOWN", "CANCELED", "REWARDED", "CLICKED"]),
  adId: z.string().trim().optional(),
  platform: z.literal("ios").default("ios"),
  appVersion: z.string().trim().max(50).optional(),
});
