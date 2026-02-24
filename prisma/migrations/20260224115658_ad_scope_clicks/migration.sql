/*
  Warnings:

  - Added the required column `ownerId` to the `Ad` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "appId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'APP_ONLY',
    "title" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "clickUrl" TEXT,
    "rewardSeconds" INTEGER NOT NULL DEFAULT 15,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ad_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ad_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ad" (
    "id",
    "ownerId",
    "appId",
    "scope",
    "title",
    "mediaType",
    "mediaUrl",
    "clickUrl",
    "rewardSeconds",
    "priority",
    "isActive",
    "startsAt",
    "endsAt",
    "createdAt",
    "updatedAt"
)
SELECT
    "Ad"."id",
    "App"."ownerId",
    "Ad"."appId",
    'APP_ONLY',
    "Ad"."title",
    "Ad"."mediaType",
    "Ad"."mediaUrl",
    "Ad"."clickUrl",
    "Ad"."rewardSeconds",
    "Ad"."priority",
    "Ad"."isActive",
    "Ad"."startsAt",
    "Ad"."endsAt",
    "Ad"."createdAt",
    "Ad"."updatedAt"
FROM "Ad"
INNER JOIN "App" ON "App"."id" = "Ad"."appId";
DROP TABLE "Ad";
ALTER TABLE "new_Ad" RENAME TO "Ad";
CREATE INDEX "Ad_appId_updatedAt_idx" ON "Ad"("appId", "updatedAt");
CREATE INDEX "Ad_ownerId_scope_updatedAt_idx" ON "Ad"("ownerId", "scope", "updatedAt");
CREATE TABLE "new_AppStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" TEXT NOT NULL,
    "initCount" INTEGER NOT NULL DEFAULT 0,
    "shownCount" INTEGER NOT NULL DEFAULT 0,
    "canceledCount" INTEGER NOT NULL DEFAULT 0,
    "rewardedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppStat_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AppStat" ("appId", "canceledCount", "createdAt", "id", "initCount", "rewardedCount", "shownCount", "updatedAt") SELECT "appId", "canceledCount", "createdAt", "id", "initCount", "rewardedCount", "shownCount", "updatedAt" FROM "AppStat";
DROP TABLE "AppStat";
ALTER TABLE "new_AppStat" RENAME TO "AppStat";
CREATE UNIQUE INDEX "AppStat_appId_key" ON "AppStat"("appId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
