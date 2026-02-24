import { assertBundleId } from "@/server/domain/apps";
import { AppError } from "@/server/errors";

export type AppRecord = {
  id: string;
  ownerId: string;
  name: string;
  bundleId: string;
  isActive: boolean;
};

export type AppStore = {
  findByBundleId: (bundleId: string) => Promise<AppRecord | null>;
  createApp: (input: { ownerId: string; name: string; bundleId: string }) => Promise<AppRecord>;
};

export const registerUserApp = async (
  store: AppStore,
  input: { ownerId: string; name: string; bundleId: string },
): Promise<AppRecord> => {
  const normalizedBundleId = assertBundleId(input.bundleId);
  const existing = await store.findByBundleId(normalizedBundleId);

  if (existing) {
    throw new AppError("This bundle identifier is already registered", 409);
  }

  try {
    return await store.createApp({
      ownerId: input.ownerId,
      name: input.name.trim(),
      bundleId: normalizedBundleId,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new AppError("This bundle identifier is already registered", 409);
    }

    throw error;
  }
};
