import { Role } from "@prisma/client";

import { hashPassword, normalizeEmail, validatePassword } from "../src/server/domain/auth";
import { env } from "../src/server/lib/env";
import { prisma } from "../src/server/prisma";

async function main() {
  const adminEmail = normalizeEmail(env.superAdminEmail);
  const passwordCheck = validatePassword(env.superAdminPassword);

  if (
    process.env.NODE_ENV === "production" &&
    (env.superAdminPassword === "ChangeMe123" || env.superAdminEmail === "admin@openads.local")
  ) {
    throw new Error("Refusing to seed with default super admin credentials in production");
  }

  if (!passwordCheck.ok) {
    throw new Error(`SUPER_ADMIN_PASSWORD invalid: ${passwordCheck.issues.join(", ")}`);
  }

  const passwordHash = await hashPassword(env.superAdminPassword);

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      isRegistrationOpen: false,
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.SUPER_ADMIN,
      isActive: true,
      passwordHash,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
