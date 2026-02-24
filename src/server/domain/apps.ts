import { AppError } from "@/server/errors";

const BUNDLE_ID_REGEX = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;

export const normalizeBundleId = (bundleId: string): string => bundleId.trim().toLowerCase();

export const isValidBundleId = (bundleId: string): boolean => {
  const normalized = normalizeBundleId(bundleId);
  return BUNDLE_ID_REGEX.test(normalized);
};

export const assertBundleId = (bundleId: string): string => {
  const normalized = normalizeBundleId(bundleId);

  if (!isValidBundleId(normalized)) {
    throw new AppError("Invalid bundle identifier", 422);
  }

  return normalized;
};
